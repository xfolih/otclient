#!/usr/bin/env node
/**
 * Generate manifest.json for WASM external data loading.
 * Run from repo root: node browser/generate-manifest.js > manifest.json
 * Or: node browser/generate-manifest.js data mods modules init.lua otclientrc.lua config.ini > manifest.json
 *
 * Deploy manifest.json + data/, mods/, modules/, init.lua, etc. to the same path as otclient.html.
 */
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const defaultDirs = ['data', 'mods', 'modules'];
const defaultFiles = ['init.lua', 'otclientrc.lua', 'config.ini'];

function walkDir(dir, baseDir, out) {
  baseDir = baseDir || dir;
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(baseDir, full).replace(/\\/g, '/');
    if (e.isDirectory()) {
      walkDir(full, baseDir, out);
    } else {
      out.push(rel);
    }
  }
}

const files = [];
const args = process.argv.slice(2);
const dirs = args.length ? args.filter(a => !a.includes('.')) : defaultDirs;
const singleFiles = args.length ? args.filter(a => a.includes('.')) : defaultFiles;

for (const d of dirs) {
  const full = path.join(repoRoot, d);
  if (fs.existsSync(full) && fs.statSync(full).isDirectory()) {
    walkDir(full, full, files);
  }
}
for (const f of singleFiles) {
  const full = path.join(repoRoot, f);
  if (fs.existsSync(full) && fs.statSync(full).isFile()) {
    files.push(f);
  }
}

files.sort();
console.log(JSON.stringify({ files }, null, 2));
