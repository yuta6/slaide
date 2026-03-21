import { defineConfig } from 'astro/config';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { inlineCss } from './scripts/lib/astro-inline-css.mjs';

export default defineConfig({
	integrations: [inlineCss()],
	output: 'static',
	build: {
		format: 'file',
		assetsInlineLimit: 100 * 1024 * 1024, // inline all assets (images, fonts)
	},
	vite: {
		plugins: [viteSingleFile({ useRecommendedBuildConfig: false, removeViteModuleLoader: true })],
		assetsInclude: ['**/*.md'],
	},
});
