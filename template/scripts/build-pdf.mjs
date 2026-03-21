/**
 * build-pdf.mjs
 * Export slides as a vector PDF from the Astro-built HTML.
 * Uses Chromium's native print-to-PDF via Playwright.
 * Text remains selectable and links stay clickable.
 *
 * Usage:
 *   node scripts/build-pdf.mjs            (all decks)
 *   node scripts/build-pdf.mjs --deck sample
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
	await buildPdf(deckName);
}

await browser.close();
await server.close();

async function buildPdf(deckName) {
	const page = await browser.newPage();
	await page.goto(`${baseUrl}/${deckName}.html`);
	await page.waitForLoadState('networkidle');
	await page.evaluate(() => document.fonts.ready);

	const size = await page.evaluate(() => {
		const slide = document.querySelector('[data-slide]');
		if (!slide) return { width: 1920, height: 1080 };
		return {
			width: parseInt(slide.style.getPropertyValue('--slide-width'), 10) || 1920,
			height: parseInt(slide.style.getPropertyValue('--slide-height'), 10) || 1080,
		};
	});

	// Override presenter layout for print: show all slides, one per page
	await page.addStyleTag({
		content: `
      @page { size: ${size.width}px ${size.height}px; margin: 0; }
      html, body { width: ${size.width}px; overflow: visible !important; height: auto !important; }
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
        break-after: page;
      }
      [data-presenter-ui] { display: none !important; }
    `,
	});

	const slideCount = await page.locator('[data-slide]').count();
	const pdfBytes = await page.pdf({
		printBackground: true,
		width: `${size.width}px`,
		height: `${size.height}px`,
		margin: { top: 0, right: 0, bottom: 0, left: 0 },
	});

	const outPath = path.join('dist', `${deckName}.pdf`);
	fs.writeFileSync(outPath, pdfBytes);
	await page.close();
	console.log(`Done: ${outPath} (${slideCount} slides)`);
}
