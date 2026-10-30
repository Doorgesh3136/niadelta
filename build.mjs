// NiaDelta v2 build: inlines src/* into one self-contained dist/niadelta.html
// Usage: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
// optional: node build.mjs --out <file>  (default dist/niadelta.html)
const oi = process.argv.indexOf('--out');
const OUT = oi > 0 && process.argv[oi + 1] ? path.resolve(process.argv[oi + 1]) : path.join(ROOT, 'dist', 'niadelta.html');

const read = (f) => {
  const p = path.join(SRC, f);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
};
const must = (f) => {
  const s = read(f);
  if (s == null) throw new Error('Missing required source file: src/' + f);
  return s;
};

// Guards: nothing injected may terminate its host element early.
const safeJS = (s) => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const safeCSS = (s) => s.replace(/<\/style/gi, '<\\/style');

let html = must('shell.html');
const css = must('styles.css') + '\n' + (read('scenes.css') || '');

const raw = JSON.parse(must('assets.json'));
const img = {};
for (const [k, v] of Object.entries(raw)) img[k] = { src: v.src, w: v.w, h: v.h }; // drop 'note'
const assetsJS = 'window.NIA_IMG=' + JSON.stringify(img) + ';';

const scenes = read('scenes.js');
const scenesJS = scenes && scenes.trim() ? scenes : 'window.NIA_SCENES=window.NIA_SCENES||{};';

const parts = {
  '/*@CSS*/': safeCSS(css),
  '/*@ASSETS*/': safeJS(assetsJS),
  '/*@SCENES*/': safeJS(scenesJS),
  '/*@CONTENT*/': safeJS(must('content.js')),
  '/*@CORE*/': safeJS(must('core.js')),
};

for (const [marker, value] of Object.entries(parts)) {
  const n = html.split(marker).length - 1;
  if (n !== 1) throw new Error(`Marker ${marker} found ${n} times in shell.html (expected 1)`);
  // split/join: no special "$" replacement patterns, safe for arbitrary content
  html = html.split(marker).join(value);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`Built ${path.relative(ROOT, OUT)}  ${kb} KB  (scenes.js ${scenes ? 'included' : 'missing, stubbed'}, scenes.css ${read('scenes.css') ? 'included' : 'missing'})`);
