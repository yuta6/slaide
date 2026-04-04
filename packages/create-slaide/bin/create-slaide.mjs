#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const targetName = args[0];

if (!targetName) {
	console.error("Usage: npm create slaide <project-name>");
	process.exit(1);
}

const targetDir = resolve(process.cwd(), targetName);

if (existsSync(targetDir)) {
	console.error(`Error: Directory "${targetName}" already exists.`);
	process.exit(1);
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const templateDir = join(__dirname, "..", "template");

// Copy template
mkdirSync(targetDir, { recursive: true });
cpSync(templateDir, targetDir, { recursive: true });

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

  Then use Claude Code or Codex:

    "Create a pitch deck about ..."

  Build commands:

    npm run build       → Standalone HTML presentation
    npm run build:pdf   → Vector PDF
    npm run build:png   → PNG per slide (for LLM quality check)
`);
