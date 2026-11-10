#!/usr/bin/env node
// Consistency checks for the buildless sources. Run with `npm test`.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const failures = [];
const fail = (message) => failures.push(message);

function block(css, selector) {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}
function declarations(body) {
  const map = new Map();
  for (const match of body.matchAll(/(--mds-[\w-]+)\s*:\s*([^;]+);/g)) map.set(match[1], match[2].trim());
  return map;
}

const tokens = read('css/tokens.css');
const light = declarations(block(tokens, '[data-theme="light"]') ?? '');
const dark = declarations(block(tokens, '[data-theme="dark"]') ?? '');
const system = declarations(block(tokens, ':root:not([data-theme="light"])') ?? '');

if (light.size === 0 || dark.size === 0 || system.size === 0) fail('tokens.css: could not find the light, dark and system-dark blocks');
for (const [name, value] of dark) {
  if (system.get(name) !== value) fail(`tokens.css: ${name} differs between [data-theme="dark"] (${value}) and the prefers-color-scheme block (${system.get(name)})`);
}
for (const name of system.keys()) if (!dark.has(name)) fail(`tokens.css: ${name} is only in the prefers-color-scheme dark block`);
for (const name of light.keys()) if (!dark.has(name)) fail(`tokens.css: ${name} has no dark value`);
for (const name of dark.keys()) if (!light.has(name)) fail(`tokens.css: ${name} has no light value`);
for (const [name, value] of [...light, ...dark]) {
  if (value.includes('var(')) fail(`tokens.css: theme token ${name} must be a literal, not ${value}`);
}

// Every var(--mds-*) used must be declared somewhere.
const cssFiles = readdirSync(join(root, 'css')).filter((file) => file.endsWith('.css')).map((file) => `css/${file}`);
const sources = [...cssFiles, 'demo/demo.css', 'demo/index.html', 'demo/demo.js'];
const declared = new Set();
for (const file of cssFiles) for (const match of read(file).matchAll(/(--mds-[\w-]+)\s*:/g)) declared.add(match[1]);
for (const file of sources) {
  for (const match of read(file).matchAll(/var\((--mds-[\w-]+)/g)) {
    if (!declared.has(match[1])) fail(`${file}: ${match[1]} is used but never declared`);
  }
}
// The demo's swatch list builds names at runtime.
const swatches = read('demo/demo.js').match(/const swatchSets = \{([\s\S]*?)\n\};/);
if (!swatches) fail('demo/demo.js: swatchSets not found');
else for (const match of swatches[1].matchAll(/'([a-z-]+)'/g)) {
  if (!declared.has(`--mds-${match[1]}`)) fail(`demo/demo.js: swatch --mds-${match[1]} is not a token`);
}

// Every icon referenced by the demo exists in the sprite.
const sprite = new Set([...read('icons/icons.svg').matchAll(/<symbol id="([^"]+)"/g)].map((match) => match[1]));
for (const match of read('demo/index.html').matchAll(/icons\.svg#([\w-]+)/g)) {
  if (!sprite.has(match[1])) fail(`demo/index.html: icon #${match[1]} is not in icons/icons.svg`);
}

// Classes used in the demo markup exist in the library (mds-*) or demo.css (demo-*).
const library = cssFiles.map(read).join('\n');
const demoCss = read('demo/demo.css');
for (const match of read('demo/index.html').matchAll(/class="([^"]+)"/g)) {
  for (const name of match[1].split(/\s+/)) {
    if (name.startsWith('mds-') && !library.includes(`.${name}`)) fail(`demo/index.html: .${name} is not defined in css/`);
    if (name.startsWith('demo-') && !demoCss.includes(`.${name}`)) fail(`demo/index.html: .${name} is not defined in demo/demo.css`);
  }
}

// The module exports what the README documents.
const exported = new Set([...read('js/magpie.js').matchAll(/export function (\w+)/g)].map((match) => match[1]));
for (const match of read('README.md').matchAll(/^\| `(\w+)\(/gm)) {
  if (!exported.has(match[1])) fail(`README.md documents ${match[1]}() but js/magpie.js does not export it`);
}

// The package version matches the README's pinned examples.
const { version } = JSON.parse(read('package.json'));
for (const match of read('README.md').matchAll(/magpie-design-system@v(\d+\.\d+\.\d+)/g)) {
  if (match[1] !== version) fail(`README.md pins v${match[1]} but package.json is ${version}`);
}

if (failures.length) {
  console.error(failures.map((message) => `✗ ${message}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${light.size} theme tokens in light and dark, ${declared.size} tokens declared, ${sprite.size} icons, ${exported.size} JS exports`);
