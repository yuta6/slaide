/**
 * build-png.mjs
 * Export each slide as a PNG from the Astro-built HTML.
 * Used by LLMs for quality checks.
 *
 * Usage:
 *   node scripts/build-png.mjs            (all decks)
 *   node scripts/build-png.mjs --deck sample
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { resolveDecks, startPreviewServer } from './lib/deck-utils.mjs';

const { values } = parseArgs({
	options: {
		deck: { type: 'string' },
	},
});

const decks = resolveDecks(values);
const { server, baseUrl } = await startPreviewServer();
const browser = await chromium.launch();

for (const deckName of decks) {
	await buildPng(deckName);
}

await browser.close();
await server.close();

async function buildPng(deckName) {
	const outDir = path.join('dist', deckName, 'png');
	fs.mkdirSync(outDir, { recursive: true });

	const page = await browser.newPage();
	await page.goto(`${baseUrl}/${deckName}.html`);
	await page.waitForLoadState('networkidle');
	await page.evaluate(() => document.fonts.ready);

	// Override presenter layout: show all slides in their natural dimensions
	await page.addStyleTag({
		content: `
      html, body { overflow: visible !important; height: auto !important; background: transparent !important; }
      .presenter-viewport, .slide-scaler {
        position: static !important;
        width: auto !important;
        height: auto !important;
        transform: none !important;
        overflow: visible !important;
      }
      [data-slide] {
        position: relative !important;
        inset: auto !important;
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      [data-presenter-ui] { display: none !important; }
    `,
	});

	const slides = await page.locator('[data-slide]').all();

	for (const [index, slide] of slides.entries()) {
		const pngPath = path.join(outDir, `${String(index + 1).padStart(2, '0')}.png`);
		await slide.screenshot({ path: pngPath, type: 'png' });
		console.log(`  ${pngPath}`);
	}

	await page.close();
	console.log(`Done: ${slides.length} slides -> ${outDir}/`);
}
