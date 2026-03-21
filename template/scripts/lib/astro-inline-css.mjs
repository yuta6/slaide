/**
 * Astro integration: inline <link rel="stylesheet"> into <style> after build.
 *
 * Astro outputs CSS as external files (_astro/*.css) and references them
 * with <link> tags. This integration reads those files and inlines them
 * so the output HTML is self-contained.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function inlineCss() {
	return {
		name: 'astro-inline-css',
		hooks: {
			'astro:build:done': ({ dir }) => {
				const distDir = fileURLToPath(dir);
				inlineDir(distDir, distDir);
			},
		},
	};
}

function inlineDir(dir, distRoot) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			inlineDir(fullPath, distRoot);
		} else if (entry.name.endsWith('.html')) {
			inlineHtmlCss(fullPath, distRoot);
		}
	}
}

function inlineHtmlCss(htmlPath, distRoot) {
	const linkRe = /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi;
	const html = fs.readFileSync(htmlPath, 'utf-8');
	const inlined = html.replace(linkRe, (match, href) => {
		const cssPath = path.join(distRoot, href);
		if (!fs.existsSync(cssPath)) return match;
		return `<style>${fs.readFileSync(cssPath, 'utf-8')}</style>`;
	});
	if (inlined !== html) fs.writeFileSync(htmlPath, inlined);
}
