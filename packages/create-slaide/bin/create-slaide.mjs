#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const targetName = args[0] || "my-slides";

const targetDir = resolve(process.cwd(), targetName);

if (existsSync(targetDir)) {
	console.error(`Error: Directory "${targetName}" already exists.`);
	process.exit(1);
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const templateDir = join(__dirname, "..", "template");

// Copy template (exclude node_modules, dist, and other generated files)
const exclude = new Set(["node_modules", "dist", ".astro"]);
mkdirSync(targetDir, { recursive: true });
cpSync(templateDir, targetDir, {
	recursive: true,
	filter: (src) => {
		const name = src.split("/").pop();
		return !exclude.has(name);
	},
});

// Update package.json name
const pkgPath = join(targetDir, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
pkg.name = basename(targetName);
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);

console.log(`
  Created ${targetName}/

  Next steps:

    cd ${targetName}
    npm install
    npx playwright install chromium
    git init && git add -A && git commit -m "init"  # recommended

  Then use Claude Code or Codex:

    "Create a pitch deck about ..."

  Build commands:

    npm run build       → Standalone HTML presentation
    npm run build:pdf   → Vector PDF
    npm run build:png   → PNG per slide (for LLM quality check)
`);
