/**
 * Utility that resolves deck names and provides a Vite preview server
 * for Playwright-based builds.
 */

import fs from 'node:fs';
import path from 'node:path';

export function resolveDecks(values) {
	if (values.deck) {
		return [values.deck];
	}

	// Default: build all decks
	const pagesDir = path.resolve('dist');
	if (!fs.existsSync(pagesDir)) {
		console.error('Error: dist/ not found. Run "astro build" first.');
		process.exit(1);
	}
	const decks = fs
		.readdirSync(pagesDir)
		.filter((f) => f.endsWith('.html') && f !== 'index.html')
		.map((f) => f.replace(/\.html$/, ''));
	if (decks.length === 0) {
		console.error('Error: No decks found in dist/.');
		process.exit(1);
	}
	return decks;
}

/**
 * Start a Vite preview server serving dist/ over HTTP.
 * Returns { server, baseUrl } — call server.close() when done.
 *
 * Using HTTP instead of file:// means all assets (/_astro/*.css etc.)
 * resolve correctly without any injection hacks.
 */
export async function startPreviewServer() {
	const { preview } = await import('vite');
	const server = await preview({
		configFile: false,
		build: { outDir: path.resolve('dist') },
		preview: { port: 4173, strictPort: false, host: 'localhost' },
	});
	const { port } = server.httpServer.address();
	return { server, baseUrl: `http://localhost:${port}` };
}
