// NiaDelta QA harness (Playwright, chromium, headless, file:// URL)
// Run:
//   cd C:\Users\Darsh\AppData\Local\Temp\claude\C--Users-Darsh-Desktop-EduWebsite\4422bc4f-215a-4b0e-a5e1-9ab78026887d\scratchpad\tools
//   node C:\Users\Darsh\Desktop\EduWebsite\niadelta\test\harness.mjs --file <html> --out <dir> [--quick] [--only shots,checks,cdn,interactions,perf]
// Writes <out>/report.json, <out>/report.md and PNG screenshots.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

/* ======================= CONFIG (edit selectors here) ======================= */
const SEL = {
  app: '#app, main',
  loader: '#ld, [data-loader]',
  skip: '#sk, [data-skip]',
  menuBtn: '#mb, [data-menu-btn]',
  sheet: '#sheet, [data-sheet]',
  scrim: '#scr, #scrim, .scrim, [data-scrim]',
  desktopNav: '#dn, header nav, #hd nav, .dn',
  form: '#fm, form[data-contact]',
  success: '#ok, .ok, [data-success], .success',
  story: '.story',
  transition: '#tr, [data-transition]',
  bioBtn: '[data-bio]',
  bioPanel: '#bio, [data-bio-panel], .bio-panel, #bp',
  headings: 'main h1, main h2, #app h1, #app h2',
  ignoreTextOverflow: '[data-marquee], .marquee, .mq, [aria-hidden="true"]',
};
const ROUTES = ['home', 'about', 'work', 'contact'];
const QUICK_ANCHORS = ['team', 'kit', 'values'];          // anchor routes always tested in --quick
const RAPID_SEQ = ['home', 'about', 'work', 'contact', 'about', 'kit'];
const VIEWPORTS = [
  { w: 320, h: 640, touch: true },
  { w: 390, h: 844, touch: true },
  { w: 768, h: 1024, touch: true },
  { w: 1024, h: 768, touch: false },
  { w: 1440, h: 900, touch: false },
  { w: 1920, h: 1080, touch: false },
  { w: 568, h: 320, touch: true },
  { w: 844, h: 390, touch: true },
  { w: 932, h: 430, touch: true },
];
const VPD = Object.fromEntries(VIEWPORTS.map(v => [v.w + 'x' + v.h, v]));
const QUICK_VP = ['390x844', '1440x900'];
const INTERACT_VP = ['390x844', '1440x900'];
const SETTLE_MS = 1600;       // intro settle after loader
const SCRUB_MS = 900;         // scrub settle after scroll
const TAP_MIN = 44;
const MIN_FONT = 12;
const CLS_WARN = 0.05;
const FPS_WARN = 50;
const CDN_BLOCK = /cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/;
const FONT_HOSTS = /fonts\.googleapis\.com|fonts\.gstatic\.com/;
const MAX_PER_CHECK = 12;     // max findings per check per page (rest summarised)
const CONCURRENCY = 3;        // parallel browser contexts for screenshots / interaction+cdn phases
/* =========================================================================== */

// ---------- args ----------
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : d; };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const defFile = fs.existsSync(path.join(ROOT, 'dist', 'niadelta.html')) ? path.join(ROOT, 'dist', 'niadelta.html') : path.join(ROOT, 'ref', 'original.html');
const FILE = path.resolve(String(arg('file', defFile)));
const OUT = path.resolve(String(arg('out', path.join(ROOT, 'test', 'out'))));
const QUICK = !!arg('quick', false);
const ONLY = arg('only', '') ? String(arg('only')).split(',') : null;
const phaseOn = p => !ONLY || ONLY.includes(p);
if (!fs.existsSync(FILE)) { console.error('File not found: ' + FILE); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const URL0 = pathToFileURL(FILE).href;

// ---------- load playwright (ESM ignores NODE_PATH, so resolve via cwd / NODE_PATH / known tools dir) ----------
function loadPlaywright() {
  const bases = [process.cwd(), ...(process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean).map(p => path.dirname(p)),
    'C:\\Users\\Darsh\\AppData\\Local\\Temp\\claude\\C--Users-Darsh-Desktop-EduWebsite\\4422bc4f-215a-4b0e-a5e1-9ab78026887d\\scratchpad\\tools', HERE];
  for (const b of bases) { try { return createRequire(path.join(b, 'noop.js'))('playwright'); } catch { } }
  throw new Error('playwright not found; run from the tools dir or set NODE_PATH');
}
const { chromium } = loadPlaywright();

// ---------- report ----------
const report = { file: FILE, startedAt: new Date().toISOString(), quick: QUICK, offline: false, viewports: {}, checks: [], interactions: [], perf: [], cdn: [], notes: [], summary: {} };
const add = (severity, viewport, route, mode, check, detail, sel) => report.checks.push({ severity, viewport, route, mode, check, detail, ...(sel ? { sel } : {}) });
const vpKey = v => v.w + 'x' + v.h;
const log = (...a) => console.log('[qa]', ...a);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const T0 = Date.now();

async function detectOffline() {
  try { const r = await fetch('https://fonts.googleapis.com/css2?family=Instrument+Sans', { signal: AbortSignal.timeout(4000) }); return !r.ok; } catch { return true; }
}

// ---------- page helpers ----------
const INIT = () => {
  window.__qa = { cls: 0, shifts: [], lt: [], fr: [] };
  try {
    new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__qa.cls += e.value; if (e.value > 0.001) window.__qa.shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).slice(0, 3).map(s => { const n = s.node; return n && n.nodeType === 1 ? (n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) : (n ? n.nodeName : '?'); }) }); } } }).observe({ type: 'layout-shift', buffered: true });
  } catch { }
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) window.__qa.lt.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); }).observe({ type: 'longtask', buffered: true }); } catch { }
};

function attachCollector(page, opts = {}) {
  const c = { console: [], pageerror: [], failed: [] };
  page.on('console', m => { if (m.type() === 'error') { const u = (m.location() || {}).url || ''; c.console.push({ text: m.text().slice(0, 300), url: u }); } });
  page.on('pageerror', e => c.pageerror.push(String(e && e.message || e).slice(0, 300)));
  page.on('requestfailed', r => c.failed.push({ url: r.url().slice(0, 200), err: (r.failure() || {}).errorText || '' }));
  c.reset = () => { c.console.length = 0; c.pageerror.length = 0; c.failed.length = 0; };
  return c;
}

function reportErrors(c, vp, route, mode, { blocked } = {}) {
  const ignoreUrl = u => (blocked && blocked.test(u)) || (report.offline && FONT_HOSTS.test(u));
  for (const e of c.pageerror) add('error', vp, route, mode, 'pageerror', e);
  for (const e of c.console) {
    if (ignoreUrl(e.url) || ignoreUrl(e.text)) continue;
    if (/Failed to load resource/.test(e.text) && c.failed.some(f => ignoreUrl(f.url))) {
      // console line for a blocked resource: only ignore if every failure is ignorable
      if (c.failed.every(f => ignoreUrl(f.url))) continue;
    }
    add('error', vp, route, mode, 'console-error', e.text + (e.url ? ' @ ' + e.url.slice(0, 120) : ''));
  }
  for (const f of c.failed) { if (ignoreUrl(f.url)) continue; add('error', vp, route, mode, 'request-failed', f.url + ' ' + f.err); }
}

async function gotoRoute(page, route, waitUntil = 'load') {
  await page.goto('about:blank');
  const t = Date.now();
  await page.goto(URL0 + '#' + route, { waitUntil, timeout: 30000 });
  return Date.now() - t;
}

async function visibleSel(page, sel) {
  return page.evaluate(sel => {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.01) return true;
    }
    return false;
  }, sel).catch(() => false);
}

async function skipLoader(page, { maxWait = 3000 } = {}) {
  const res = { found: false, clicked: null, goneMs: null };
  const t0 = Date.now();
  res.found = await page.$(SEL.loader).then(Boolean).catch(() => false);
  if (!res.found) return res;
  for (const s of [SEL.skip, SEL.loader]) {
    try { await page.click(s, { timeout: 400, force: s === SEL.loader }); res.clicked = s; break; } catch { }
  }
  const gone = await page.waitForFunction(sel => { const l = document.querySelector(sel); if (!l) return true; const cs = getComputedStyle(l), r = l.getBoundingClientRect(); return cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.02 || r.bottom <= 0 || r.top >= innerHeight; }, SEL.loader, { timeout: maxWait, polling: 50 }).then(() => true).catch(() => false);
  res.goneMs = gone ? Date.now() - t0 : null;
  return res;
}

// waits for router idle: NIA.state().busy false (if exposed), transition layer hidden, scroll stable
async function waitIdle(page, { min = 300, max = 6000 } = {}) {
  const t0 = Date.now(); let lastY = -1, stableSince = 0;
  await sleep(min);
  while (Date.now() - t0 < max) {
    const s = await page.evaluate(({ tr }) => {
      let busy = false;
      try { const st = window.NIA && typeof NIA.state === 'function' ? NIA.state() : null; if (st && st.busy) busy = true; } catch { }
      for (const el of document.querySelectorAll(tr)) { const cs = getComputedStyle(el); if (cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.02) { const r = el.getBoundingClientRect(); if (r.width && r.height) busy = true; } }
      return { busy, y: Math.round(scrollY) };
    }, { tr: SEL.transition }).catch(() => ({ busy: false, y: 0 }));
    if (!s.busy && s.y === lastY) { if (!stableSince) stableSince = Date.now(); if (Date.now() - stableSince >= 300) return Date.now() - t0; }
    else stableSince = 0;
    lastY = s.y; await sleep(100);
  }
  return -1;
}

// scroll using window.scrollTo AND lenis if exposed, then ScrollTrigger.update
async function scrollToY(page, y) {
  await page.evaluate(y => {
    const cands = [window.NIA && NIA.lenis, window.lenis, window.__lenis, window.NIA && typeof NIA.state === 'function' && (() => { try { return NIA.state().lenisInstance; } catch { } })()];
    const l = cands.find(x => x && typeof x.scrollTo === 'function');
    if (l) { try { l.scrollTo(y, { immediate: true, force: true }); } catch { } }
    window.scrollTo(0, y);
    try { window.ScrollTrigger && ScrollTrigger.update(); } catch { }
  }, y);
}

async function storyRanges(page) {
  return page.evaluate(sel => {
    return [...document.querySelectorAll(sel)].map((sec, i) => {
      const key = sec.dataset.scene || sec.dataset.k || String(i);
      let st = null, src = 'fallback';
      try {
        if (window.ScrollTrigger) {
          const all = ScrollTrigger.getAll().filter(t => t.trigger && (t.trigger === sec || sec.contains(t.trigger)) && t.end > t.start);
          all.sort((a, b) => (!!b.pin - !!a.pin) || ((b.end - b.start) - (a.end - a.start)));
          if (all[0]) { st = { start: all[0].start, end: all[0].end }; src = 'scrolltrigger'; }
        }
      } catch { }
      if (!st) { const top = sec.getBoundingClientRect().top + scrollY; st = { start: top, end: top + innerHeight * 2.2 }; }
      return { key, i, start: Math.round(st.start), end: Math.round(st.end), src, isStatic: sec.classList.contains('static') };
    });
  }, SEL.story);
}

// ---------- in-page layout checks ----------
function pageChecks(cfg) {
  const out = { overflow: null, outside: [], textOverflow: [], tap: [], font: [], imgDims: [], lazy: [], hidden: [], cls: 0, shifts: [] };
  const W = cfg.vw || innerWidth, H = cfg.vh || innerHeight, sY = scrollY; // emulated viewport (mobile layout viewport can grow when content overflows)
  const se = document.scrollingElement || document.documentElement;
  out.overflow = { scrollWidth: Math.max(se.scrollWidth, innerWidth, document.documentElement.clientWidth), innerWidth: W, layoutWidth: innerWidth, bodyScroll: document.body.scrollWidth };
  const path = el => { const p = []; let n = el; for (let d = 0; n && n.nodeType === 1 && d < 5 && n !== document.body; d++, n = n.parentElement) { let s = n.tagName.toLowerCase(); if (n.id) { s += '#' + n.id; p.unshift(s); break; } const cl = typeof n.className === 'string' ? n.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : (n.className && n.className.baseVal ? n.className.baseVal.trim().split(/\s+/).slice(0, 2) : []); if (cl.length) s += '.' + cl.join('.'); p.unshift(s); } return p.join('>'); };
  const rr = r => [Math.round(r.left), Math.round(r.top + sY), Math.round(r.width), Math.round(r.height)].join(',');
  const opCache = new Map();
  const effOp = el => { if (!el || el.nodeType !== 1) return 1; if (opCache.has(el)) return opCache.get(el); const v = (+getComputedStyle(el).opacity) * effOp(el.parentElement); opCache.set(el, v); return v; };
  const directText = el => { let t = ''; for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue; return t.replace(/\s+/g, ' ').trim(); };
  const isFixedish = el => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === 'fixed' || p === 'sticky') return true; } return false; };
  const all = [...document.body.querySelectorAll('*')].filter(el => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'BR', 'OPTION'].includes(el.tagName));

  // outside viewport (horizontal) not clipped
  const reported = [];
  for (const el of all) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || cs.display === 'contents') continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (r.right <= W + 1 && r.left >= -1) continue;
    if (effOp(el) < 0.02) continue;
    if (r.right <= 0) continue; // fully off left: skip-link / sr-only pattern
    if ((r.left >= W) && isFixedish(el)) continue; // off-canvas fixed panel
    if (r.width <= 1 || (r.width <= 2 && r.height <= 2)) continue;
    if (reported.some(p => p.contains(el))) continue;
    let clip = null;
    for (let a = el.parentElement; a; a = a.parentElement) {
      const acs = getComputedStyle(a);
      if (acs.overflowX !== 'visible' || /paint|strict|content/.test(acs.contain || '')) {
        if (a === document.body || a === document.documentElement) { clip = 'root'; break; }
        const ar = a.getBoundingClientRect(); if (ar.right <= W + 1 && ar.left >= -1) { clip = 'ancestor'; break; }
      }
      if (acs.position === 'fixed') break;
    }
    if (clip === 'ancestor') continue;
    const hasText = (el.innerText || '').trim().length > 0;
    if (clip === 'root' && !hasText) continue; // decorative bleed clipped by body
    reported.push(el);
    out.outside.push({ sel: path(el), rect: rr(r), clip: clip || 'none', text: (el.innerText || '').trim().slice(0, 50) });
  }

  // text: overflow, font-size, hidden content
  for (const el of all) {
    const tag = el.tagName.toLowerCase();
    const isSvgText = el instanceof SVGElement && (tag === 'text' || tag === 'tspan' || tag === 'textpath');
    if (el instanceof SVGElement && !isSvgText) continue;
    const t = directText(el); if (!t || !/[\p{L}\p{N}]/u.test(t)) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (r.width <= 1 && r.height <= 1) continue;
    const srOnly = cs.position === 'absolute' && (r.width <= 2 || r.height <= 2 || /rect\(0|inset\(50%/.test(cs.clip + ' ' + cs.clipPath));
    if (srOnly) continue;
    const op = effOp(el);
    // font size
    let fs = parseFloat(cs.fontSize);
    if (isSvgText) { try { const m = el.getScreenCTM(); if (m) fs = fs * Math.sqrt(m.a * m.a + m.b * m.b); } catch { } }
    if (fs < cfg.MIN_FONT - 0.05 && op > 0.02) out.font.push({ sel: path(el), size: +fs.toFixed(1), text: t.slice(0, 40) });
    // hidden content
    if (op < 0.05 && !el.closest('[aria-hidden="true"],[inert]')) out.hidden.push({ sel: path(el), opacity: +op.toFixed(2), text: t.slice(0, 50) });
    // text overflow
    if (!isSvgText && cs.display !== 'inline' && el.clientWidth > 0 && !/^(input|textarea|select|button)$/.test(tag) && !el.closest(cfg.ignoreTextOverflow)) {
      if (el.scrollWidth > el.clientWidth + 1) {
        const ox = cs.overflowX, ell = cs.textOverflow === 'ellipsis';
        out.textOverflow.push({ sel: path(el), sw: el.scrollWidth, cw: el.clientWidth, overflow: ox, ellipsis: ell, text: t.slice(0, 50) });
      }
    }
  }

  // tap targets
  const tapSel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button]';
  for (const el of document.querySelectorAll(tapSel)) {
    if (el.closest('[aria-hidden="true"],[inert]') || el.disabled) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    let r = el.getBoundingClientRect();
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) { const lb = el.closest('label') || (el.id && document.querySelector('label[for="' + CSS.escape(el.id) + '"]')); if (lb) { const lr = lb.getBoundingClientRect(); if (lr.width * lr.height > r.width * r.height) r = lr; } }
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= 0 || r.bottom + sY <= 0) continue; // off-screen skip link
    if (r.width <= 2 && r.height <= 2) continue;
    if (el.tagName === 'A' && cs.display === 'inline') {
      const blk = el.closest('p,li,dd,blockquote,figcaption,td');
      if (blk) { const own = (el.textContent || '').trim().length, tot = (blk.textContent || '').trim().length; if (tot > own + 3) continue; }
    }
    if (r.width < cfg.TAP_MIN - 0.5 || r.height < cfg.TAP_MIN - 0.5) out.tap.push({ sel: path(el), w: Math.round(r.width), h: Math.round(r.height), text: ((el.innerText || el.getAttribute('aria-label') || el.value || '') + '').trim().slice(0, 40) });
  }

  // images
  for (const im of document.querySelectorAll('img')) {
    const p = path(im) + (im.alt ? ' [alt="' + im.alt.slice(0, 30) + '"]' : '');
    if (!im.hasAttribute('width') || !im.hasAttribute('height')) out.imgDims.push({ sel: p });
    const r = im.getBoundingClientRect(), cs = getComputedStyle(im);
    if (cs.display === 'none') continue;
    const top = r.top + sY;
    if (top > H && (im.getAttribute('loading') !== 'lazy' || im.getAttribute('decoding') !== 'async')) out.lazy.push({ sel: p, top: Math.round(top), loading: im.getAttribute('loading'), decoding: im.getAttribute('decoding') });
  }
  if (window.__qa) { out.cls = +window.__qa.cls.toFixed(4); out.shifts = window.__qa.shifts.slice(0, 6); }
  return out;
}

function recordChecks(res, vp, route, mode) {
  const cap = (arr, sev, check, fmt) => { arr.slice(0, MAX_PER_CHECK).forEach(x => add(sev, vp, route, mode, check, fmt(x), x.sel)); if (arr.length > MAX_PER_CHECK) add(sev, vp, route, mode, check, '+' + (arr.length - MAX_PER_CHECK) + ' more'); };
  const o = res.overflow;
  if (o.scrollWidth > o.innerWidth) add('error', vp, route, mode, 'h-overflow', 'scrollWidth ' + o.scrollWidth + ' > viewport ' + o.innerWidth + (o.layoutWidth > o.innerWidth ? ' (mobile layout viewport grew to ' + o.layoutWidth + ')' : ''));
  cap(res.outside.filter(x => x.clip === 'none'), 'error', 'outside-viewport', x => x.sel + ' rect(x,y,w,h)=' + x.rect + (x.text ? ' "' + x.text + '"' : ''));
  cap(res.outside.filter(x => x.clip === 'root'), 'warn', 'outside-viewport-clipped-by-root', x => x.sel + ' rect=' + x.rect + ' "' + x.text + '" (text cut by body/html overflow clip)');
  cap(res.textOverflow.filter(x => !x.ellipsis), 'error', 'text-overflow', x => x.sel + ' scrollW ' + x.sw + ' > clientW ' + x.cw + ' overflow:' + x.overflow + ' "' + x.text + '"');
  cap(res.textOverflow.filter(x => x.ellipsis), 'warn', 'text-truncated', x => x.sel + ' ellipsis "' + x.text + '"');
  cap(res.tap, 'error', 'tap-target', x => x.sel + ' ' + x.w + 'x' + x.h + (x.text ? ' "' + x.text + '"' : ''));
  cap(res.font, 'error', 'font-size<12', x => x.sel + ' ' + x.size + 'px "' + x.text + '"');
  cap(res.imgDims, 'error', 'img-no-dimensions', x => x.sel);
  cap(res.lazy, 'warn', 'img-not-lazy', x => x.sel + ' top=' + x.top + ' loading=' + x.loading + ' decoding=' + x.decoding);
  if (mode === 'rm' || mode === 'cdn') cap(res.hidden, 'error', 'content-hidden', x => x.sel + ' opacity=' + x.opacity + ' "' + x.text + '"');
  if (res.cls > CLS_WARN) add('warn', vp, route, mode, 'cls', 'CLS ' + res.cls + ' ' + JSON.stringify(res.shifts));
}

async function runChecks(page, vp, route, mode) {
  try {
    const res = await page.evaluate(pageChecks, { MIN_FONT, TAP_MIN, ignoreTextOverflow: SEL.ignoreTextOverflow, vw: VPD[vp].w, vh: VPD[vp].h });
    recordChecks(res, vp, route, mode);
    return { cls: res.cls, counts: { outside: res.outside.length, textOverflow: res.textOverflow.length, tap: res.tap.length, font: res.font.length, imgDims: res.imgDims.length, lazy: res.lazy.length, hidden: res.hidden.length }, scrollWidth: res.overflow.scrollWidth };
  } catch (e) { add('error', vp, route, mode, 'harness', 'checks failed: ' + e.message.slice(0, 200)); return null; }
}

// ---------- contexts ----------
async function newCtx(browser, vp, { reduced = false, block = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, isMobile: !!vp.touch, hasTouch: !!vp.touch, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(INIT);
  if (block) await ctx.route(block, r => r.abort('failed'));
  return ctx;
}

// ---------- A + B: screenshots and checks ----------
async function shotsAndChecks(browser, vp) {
  const k = vpKey(vp); const rec = report.viewports[k] = { w: vp.w, h: vp.h, touch: !!vp.touch, routes: {} };
  // reduced motion
  {
    const ctx = await newCtx(browser, vp, { reduced: true }); const page = await ctx.newPage(); const col = attachCollector(page);
    for (const route of ROUTES) {
      const r = rec.routes[route] = rec.routes[route] || {};
      col.reset();
      try {
        const ms = await gotoRoute(page, route);
        await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => { });
        await skipLoader(page, { maxWait: 1500 });
        await sleep(500);
        const ld = await visibleSel(page, SEL.loader); if (ld) add('error', k, route, 'rm', 'loader-in-rm', 'loader still visible in reduced-motion mode');
        r.rm = await runChecks(page, k, route, 'rm') || {}; r.rm.loadMs = ms;
        const f = k + '_' + route + '_rm_full.png';
        await page.screenshot({ path: path.join(OUT, f), fullPage: true, timeout: 30000 }); r.rm.shot = f;
      } catch (e) { add('error', k, route, 'rm', 'harness', e.message.slice(0, 200)); }
      reportErrors(col, k, route, 'rm');
    }
    await ctx.close();
  }
  // motion
  {
    const ctx = await newCtx(browser, vp); const page = await ctx.newPage(); const col = attachCollector(page);
    for (const route of ROUTES) {
      const r = rec.routes[route] = rec.routes[route] || {};
      col.reset();
      try {
        await gotoRoute(page, route, 'domcontentloaded');
        const ld = await skipLoader(page);
        if (ld.found && ld.goneMs == null) add('error', k, route, 'motion', 'loader-stuck', 'loader not dismissed within 3s after skip');
        await page.waitForLoadState('load').catch(() => { });
        await sleep(SETTLE_MS);
        r.motion = await runChecks(page, k, route, 'motion') || {};
        r.motion.loader = ld;
        const top = k + '_' + route + '_top.png';
        await page.screenshot({ path: path.join(OUT, top) }); r.motion.shots = [top];
        const ranges = await storyRanges(page); r.motion.stories = ranges;
        for (const s of ranges) {
          for (const pct of [0, 50, 100]) {
            const y = Math.round(s.start + (s.end - s.start) * pct / 100);
            await scrollToY(page, y); await sleep(SCRUB_MS);
            const f = k + '_' + route + '_' + s.key + '_' + pct + '.png';
            await page.screenshot({ path: path.join(OUT, f) }); r.motion.shots.push(f);
          }
        }
        if (ranges.length) { const ov = await page.evaluate(w => Math.max(document.scrollingElement.scrollWidth, innerWidth) - w, vp.w); if (ov > 0) add('error', k, route, 'motion', 'h-overflow', 'after story scroll: scrollWidth exceeds innerWidth by ' + ov + 'px'); }
      } catch (e) { add('error', k, route, 'motion', 'harness', e.message.slice(0, 200)); }
      reportErrors(col, k, route, 'motion');
    }
    await ctx.close();
  }
}

// ---------- C: CDN failure ----------
async function routeOf(page) { return page.evaluate(() => location.hash.slice(1)); }
async function appSig(page) { return page.evaluate(sel => { const a = document.querySelector(sel); return a ? a.innerHTML.length + ':' + (a.querySelector('h1') || {}).textContent : ''; }, SEL.app).catch(() => ''); }

async function openSheet(page) {
  const btn = await page.$(SEL.menuBtn); if (!btn || !(await btn.isVisible())) return false;
  const exp = await btn.getAttribute('aria-expanded'); if (exp !== 'true') await btn.click({ timeout: 2000 });
  await sleep(700); return true;
}

// click a visible link to #target (header/desktop nav, or sheet on mobile). returns how it was done
async function clickRouteLink(page, target, mobile) {
  if (mobile && await openSheet(page)) {
    const a = page.locator(SEL.sheet.split(',').map(s => s.trim() + ' a[href="#' + target + '"]').join(',')).first();
    if (await a.count() && await a.isVisible().catch(() => false)) { await a.click({ timeout: 2000 }); return 'sheet'; }
  }
  const navA = page.locator(SEL.desktopNav.split(',').map(s => s.trim() + ' a[href="#' + target + '"]').join(','));
  for (let i = 0; i < await navA.count(); i++) {
    const a = navA.nth(i);
    if (await a.isVisible().catch(() => false)) { try { await a.click({ timeout: 1500 }); return 'nav'; } catch { } }
    // submenu: hover parent li first
    try { await a.evaluate(el => el.closest('ul') && el.closest('ul').closest('li')); const li = a.locator('xpath=ancestor::li[last()]'); await li.hover({ timeout: 1000 }); await sleep(450); if (await a.isVisible()) { await a.click({ timeout: 1500 }); return 'nav-sub'; } } catch { }
  }
  const any = page.locator('a[href="#' + target + '"]');
  for (let i = 0; i < await any.count(); i++) { const a = any.nth(i); if (await a.isVisible().catch(() => false)) { try { await a.click({ timeout: 1500 }); return 'link'; } catch { } } }
  await page.evaluate(t => { location.hash = t; }, target); return 'hash-fallback';
}

async function cdnRun(browser, vp) {
  const k = vpKey(vp); const ctx = await newCtx(browser, vp, { block: CDN_BLOCK }); const page = await ctx.newPage(); const col = attachCollector(page);
  for (let i = 0; i < ROUTES.length; i++) {
    const route = ROUTES[i], next = ROUTES[(i + 1) % ROUTES.length];
    const rec = { viewport: k, route, pass: true, detail: [] };
    col.reset();
    try {
      await gotoRoute(page, route);
      await skipLoader(page);
      await sleep(1200);
      const libs = await page.evaluate(() => ({ gsap: !!window.gsap, st: !!window.ScrollTrigger, lenis: !!window.Lenis, jsAnim: document.documentElement.classList.contains('js-anim') }));
      rec.libs = libs; if (libs.gsap || libs.lenis) rec.detail.push('libs not blocked?');
      const hd = await page.evaluate(sel => [...document.querySelectorAll(sel)].map(h => { let op = 1; for (let n = h; n && n.nodeType === 1; n = n.parentElement) op *= +getComputedStyle(n).opacity; const cs = getComputedStyle(h); return { t: h.textContent.trim().slice(0, 40), op: +op.toFixed(2), vis: cs.visibility !== 'hidden' && cs.display !== 'none' }; }), SEL.headings);
      const bad = hd.filter(h => h.op <= 0.9 || !h.vis);
      rec.headings = hd.length; if (!hd.length) { rec.pass = false; rec.detail.push('no headings found'); }
      if (bad.length) { rec.pass = false; rec.detail.push(bad.length + ' headings hidden: ' + bad.slice(0, 4).map(b => '"' + b.t + '" op=' + b.op).join('; ')); bad.slice(0, 6).forEach(b => add('error', k, route, 'cdn', 'heading-hidden', '"' + b.t + '" opacity ' + b.op)); }
      if (await visibleSel(page, SEL.loader)) { rec.pass = false; rec.detail.push('loader still visible'); add('error', k, route, 'cdn', 'loader-stuck', 'loader visible without CDN'); }
      await runChecks(page, k, route, 'cdn');
      await page.screenshot({ path: path.join(OUT, k + '_' + route + '_cdnfail.png') });
      // nav by click, instant transition
      const sig0 = await appSig(page);
      const how = await clickRouteLink(page, next, !!vp.touch && vp.w <= 900);
      const t0 = Date.now(); let changed = false;
      while (Date.now() - t0 < 2500) { if ((await routeOf(page)) === next && (await appSig(page)) !== sig0) { changed = true; break; } await sleep(25); }
      const dt = Date.now() - t0;
      rec.nav = { to: next, how, changed, ms: dt };
      if (!changed) { rec.pass = false; rec.detail.push('click nav to #' + next + ' did not render new page'); add('error', k, route, 'cdn', 'nav-failed', 'click to #' + next + ' (' + how + ') did not change page'); }
      else if (dt > 400) { rec.detail.push('transition not instant: ' + dt + 'ms'); add('warn', k, route, 'cdn', 'transition-not-instant', dt + 'ms to swap to #' + next); }
      if (how === 'hash-fallback') add('error', k, route, 'cdn', 'nav-link-missing', 'no visible link to #' + next);
      await sleep(300);
      const trVis = await visibleSel(page, SEL.transition); if (trVis) { rec.pass = false; rec.detail.push('transition layer visible'); }
    } catch (e) { rec.pass = false; rec.detail.push('harness: ' + e.message.slice(0, 160)); }
    if (col.pageerror.length) { rec.pass = false; rec.detail.push('pageerrors: ' + col.pageerror.join(' | ').slice(0, 300)); }
    reportErrors(col, k, route, 'cdn', { blocked: CDN_BLOCK });
    if (!rec.pass) add('error', k, route, 'cdn', 'cdn-run', rec.detail.join('; '));
    report.cdn.push(rec);
  }
  await ctx.close();
}

// ---------- D: interactions ----------
function inter(viewport, name, pass, detail, severity = 'error') {
  report.interactions.push({ viewport, name, pass, detail });
  if (!pass) add(severity, viewport, '-', 'motion', 'interaction:' + name, detail);
  log((pass ? 'PASS ' : 'FAIL ') + viewport + ' ' + name + ' ' + (detail || ''));
}

async function freshMotionPage(ctx, route) {
  const page = await ctx.newPage(); attachCollector(page);
  await page.goto(URL0 + '#' + route, { waitUntil: 'domcontentloaded' });
  await skipLoader(page); await page.waitForLoadState('load').catch(() => { }); await sleep(SETTLE_MS);
  return page;
}

async function niaState(page) {
  return page.evaluate(() => {
    const o = { exposed: false, busy: null, lenisStopped: document.documentElement.classList.contains('lenis-stopped'), route: null };
    try { if (window.NIA && typeof NIA.state === 'function') { const s = NIA.state() || {}; o.exposed = true; o.busy = !!s.busy; o.route = s.route || s.page || s.cur || null; if (s.lenisStopped != null) o.lenisStopped = o.lenisStopped || !!s.lenisStopped; if (s.lenis && typeof s.lenis === 'object' && 'isStopped' in s.lenis) o.lenisStopped = o.lenisStopped || !!s.lenis.isStopped; if (typeof s.lenis === 'string') o.lenisStopped = o.lenisStopped || s.lenis === 'stopped'; o.raw = JSON.stringify(s, (k, v) => (v && typeof v === 'object' && k) ? undefined : v).slice(0, 200); } } catch (e) { o.err = e.message; }
    return o;
  });
}

async function anchorTop(page, anchor) {
  return page.evaluate(a => { const e = document.getElementById('s-' + a) || document.getElementById(a); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top), h: innerHeight }; }, anchor);
}

async function interactions(browser, vp) {
  const k = vpKey(vp); const mobile = vp.w <= 900;
  const ctx = await newCtx(browser, vp);
  // 1. loader skip
  try {
    const page = await ctx.newPage(); attachCollector(page);
    await page.goto(URL0 + '#home', { waitUntil: 'domcontentloaded' });
    const t0 = Date.now(); let clicked = null;
    const hasLd = await page.$(SEL.loader).then(Boolean);
    if (!hasLd) inter(k, 'loader-skip', false, 'no loader element (' + SEL.loader + ')', 'warn');
    else {
      for (const s of [SEL.skip, SEL.loader]) { try { await page.click(s, { timeout: 300, force: s === SEL.loader }); clicked = s; break; } catch { } }
      const tClick = Date.now() - t0;
      const gone = await page.waitForFunction(sel => { const l = document.querySelector(sel); if (!l) return true; const cs = getComputedStyle(l), r = l.getBoundingClientRect(); return cs.display === 'none' || cs.visibility === 'hidden' || r.bottom <= 0; }, SEL.loader, { timeout: 1500, polling: 30 }).then(() => true).catch(() => false);
      const tGone = Date.now() - t0;
      await sleep(400);
      const lock = await page.evaluate(() => { const h = document.documentElement, b = document.body; const ov = e => getComputedStyle(e).overflowY; return { cls: h.className, html: ov(h), body: ov(b), lenisStopped: h.classList.contains('lenis-stopped') }; });
      const locked = /hidden|clip/.test(lock.html) || /hidden|clip/.test(lock.body) || /\block\b/.test(lock.cls) || lock.lenisStopped;
      const y0 = await page.evaluate(() => scrollY); await page.mouse.move(vp.w / 2, vp.h / 2); await page.mouse.wheel(0, 500); await sleep(700); const y1 = await page.evaluate(() => scrollY);
      inter(k, 'loader-skip', !!clicked && tClick <= 600 && gone && !locked && y1 > y0, `clicked=${clicked} at ${tClick}ms; removed=${gone} by ${tGone}ms; scroll-lock=${locked} (${JSON.stringify(lock)}); wheel ${y0}->${y1}`);
    }
    await page.close();
  } catch (e) { inter(k, 'loader-skip', false, 'harness: ' + e.message.slice(0, 160)); }

  // 2. nav links (desktop) / sheet (mobile)
  if (!mobile) {
    try {
      const page = await freshMotionPage(ctx, 'home');
      const links = await page.evaluate(sel => { const s = new Set(); for (const a of document.querySelectorAll(sel.split(',').map(x => x.trim() + ' a[href^="#"]').join(','))) { const h = a.getAttribute('href').slice(1); if (h) s.add(h); } return [...s]; }, SEL.desktopNav);
      if (!links.length) inter(k, 'desktop-nav', false, 'no links in ' + SEL.desktopNav);
      let targets = links;
      if (QUICK) targets = links.filter(h => ROUTES.includes(h) || QUICK_ANCHORS.includes(h));
      for (const h of QUICK ? [...new Set([...targets, ...QUICK_ANCHORS])] : targets) {
        const how = await clickRouteLink(page, h, false);
        await waitIdle(page, { min: 500, max: 7000 });
        const hash = await routeOf(page);
        if (ROUTES.includes(h)) {
          const y = await page.evaluate(() => scrollY);
          inter(k, 'nav:#' + h, hash === h && y < 80 && how !== 'hash-fallback', `via ${how}; hash=#${hash}; scrollY=${y}`);
        } else {
          const at = await anchorTop(page, h);
          const ok = at && at.top > -60 && at.top < at.h * 0.35;
          inter(k, 'nav:#' + h, !!ok && hash === h && how !== 'hash-fallback', `via ${how}; hash=#${hash}; target ${at ? 'top=' + at.top + 'px' : 'missing #s-' + h}`);
        }
      }
      await page.close();
    } catch (e) { inter(k, 'desktop-nav', false, 'harness: ' + e.message.slice(0, 160)); }
  } else {
    try {
      const page = await freshMotionPage(ctx, 'home');
      const sheetState = () => page.evaluate(({ sheet, btn }) => { const s = document.querySelector(sheet), b = document.querySelector(btn); if (!s) return null; const r = s.getBoundingClientRect(), cs = getComputedStyle(s); const vis = cs.visibility !== 'hidden' && cs.display !== 'none' && r.top < innerHeight - 20 && r.height > 20 && +cs.opacity > 0.5; return { vis, top: Math.round(r.top), h: Math.round(r.height), exp: b && b.getAttribute('aria-expanded'), focusIn: s.contains(document.activeElement), focusBtn: document.activeElement === b, active: document.activeElement && (document.activeElement.id || document.activeElement.tagName) }; }, { sheet: SEL.sheet, btn: SEL.menuBtn });
      const btn = await page.$(SEL.menuBtn);
      if (!btn || !(await btn.isVisible())) inter(k, 'dock-menu', false, 'menu button not visible (' + SEL.menuBtn + ')');
      else {
        await btn.click(); await sleep(800); let s = await sheetState();
        const fullScreen = s && s.h >= vp.h * 0.98;
        inter(k, 'sheet-open', !!s && s.vis && s.exp === 'true' && !fullScreen, JSON.stringify(s) + (fullScreen ? ' sheet is full-screen' : ''));
        if (s && !s.focusIn) inter(k, 'sheet-focus-moves-in', false, 'focus not moved into sheet on open (active=' + s.active + ')', 'warn');
        await page.keyboard.press('Escape'); await sleep(800); s = await sheetState();
        inter(k, 'sheet-escape', !!s && !s.vis && s.exp === 'false' && s.focusBtn, JSON.stringify(s));
        // scrim
        await btn.click(); await sleep(800);
        const pt = await page.evaluate(({ scrim, sheet }) => { const sc = [...document.querySelectorAll(scrim)].find(e => getComputedStyle(e).pointerEvents !== 'none' && e.getBoundingClientRect().height > 0); const sh = document.querySelector(sheet); const top = sh ? sh.getBoundingClientRect().top : innerHeight; if (!sc) return null; const x = innerWidth / 2, y = Math.max(5, Math.min(top - 10, top / 2)); const el = document.elementFromPoint(x, y); return { x, y, hit: el === sc || sc.contains(el), el: el && (el.id || el.tagName) }; }, { scrim: SEL.scrim, sheet: SEL.sheet });
        if (!pt) inter(k, 'sheet-scrim', false, 'no clickable scrim (' + SEL.scrim + ')');
        else { await page.mouse.click(pt.x, pt.y); await sleep(800); s = await sheetState(); inter(k, 'sheet-scrim', !!s && !s.vis && pt.hit, 'clicked ' + pt.el + ' at ' + Math.round(pt.y) + ' hitScrim=' + pt.hit + ' -> ' + JSON.stringify(s)); }
        // sheet link
        await btn.click(); await sleep(800);
        const link = page.locator(SEL.sheet.split(',').map(x => x.trim() + ' a[href="#about"]').join(',')).first();
        if (!(await link.count())) inter(k, 'sheet-link', false, 'no #about link in sheet');
        else { await link.click(); await waitIdle(page, { min: 500, max: 7000 }); s = await sheetState(); const hash = await routeOf(page); inter(k, 'sheet-link', hash === 'about' && !!s && !s.vis && s.exp === 'false', 'hash=#' + hash + ' ' + JSON.stringify(s)); }
      }
      await page.close();
    } catch (e) { inter(k, 'mobile-sheet', false, 'harness: ' + e.message.slice(0, 160)); }
  }

  // 3. contact form
  try {
    const page = await freshMotionPage(ctx, 'contact');
    const fm = await page.$(SEL.form);
    if (!fm) inter(k, 'form', false, 'no form (' + SEL.form + ')');
    else {
      await fm.scrollIntoViewIfNeeded(); await sleep(400);
      const sub = await fm.$('button[type=submit], button:not([type]), input[type=submit]');
      if (!sub) inter(k, 'form-empty', false, 'no submit button');
      else {
        await sub.click(); await sleep(500);
        const st = await page.evaluate(({ form, ok }) => { const f = document.querySelector(form), a = document.activeElement; const okEl = document.querySelector(ok); const okVis = okEl && okEl.getBoundingClientRect().height > 0 && getComputedStyle(okEl).visibility !== 'hidden' && getComputedStyle(okEl).display !== 'none'; return { formVis: f && f.getBoundingClientRect().height > 0, focusInForm: f && f.contains(a), focusInvalid: !!a && (a.matches(':invalid') || a.getAttribute('aria-invalid') === 'true'), active: a && (a.name || a.id || a.tagName), okVis: !!okVis }; }, { form: SEL.form, ok: SEL.success });
        inter(k, 'form-empty', st.formVis && !st.okVis && st.focusInForm && st.focusInvalid, JSON.stringify(st));
        // fill valid
        const fields = await fm.$$('input, textarea, select');
        for (const f of fields) {
          const info = await f.evaluate(e => ({ tag: e.tagName, type: (e.type || '').toLowerCase(), name: (e.name || e.id || '').toLowerCase(), vis: e.getBoundingClientRect().height > 0 && getComputedStyle(e).visibility !== 'hidden', req: e.required }));
          if (!info.vis || ['hidden', 'submit', 'button'].includes(info.type)) continue;
          try {
            if (info.tag === 'SELECT') { await f.selectOption({ index: 1 }).catch(() => { }); continue; }
            if (info.type === 'checkbox' || info.type === 'radio') { if (info.req) await f.check(); continue; }
            const v = info.type === 'email' || /mail/.test(info.name) ? 'qa.tester@example.com' : info.tag === 'TEXTAREA' ? 'Hello, this is an automated QA message about a leadership programme.' : /org|company/.test(info.name) ? 'QA Organisation' : /phone|tel/.test(info.name) || info.type === 'tel' ? '+10000000000' : info.type === 'url' ? 'https://example.com' : 'QA Tester';
            await f.fill(v);
          } catch { }
        }
        await sub.click().catch(() => { }); await sleep(1500);
        const ok = await visibleSel(page, SEL.success);
        const any = ok || await page.evaluate(form => { const f = document.querySelector(form); const s = f && (f.parentElement || document).querySelector('[role=status]'); return !!(s && s.textContent.trim() && s.getBoundingClientRect().height > 0); }, SEL.form);
        inter(k, 'form-valid-success', !!any, 'success visible=' + ok + ' (fallback role=status=' + any + ') url=' + page.url().slice(-30));
      }
    }
    await page.close();
  } catch (e) { inter(k, 'form', false, 'harness: ' + e.message.slice(0, 160)); }

  // 4. rapid route changes + back/forward
  try {
    const page = await freshMotionPage(ctx, 'home');
    await page.evaluate(async seq => { for (const h of seq) { location.hash = h; await new Promise(r => setTimeout(r, 50)); } }, RAPID_SEQ);
    const tLast = Date.now();
    await sleep(6000);
    const last = RAPID_SEQ[RAPID_SEQ.length - 1];
    const hash = await routeOf(page); const ns = await niaState(page); const at = await anchorTop(page, last);
    await page.mouse.move(vp.w / 2, vp.h / 2);
    const y0 = await page.evaluate(() => scrollY); await page.mouse.wheel(0, 600); await sleep(300); await page.mouse.wheel(0, 600); await sleep(900); const y1 = await page.evaluate(() => scrollY);
    const near = !!at && at.top > -60 && at.top < at.h * 0.35;
    const ok = hash === last && near && (!ns.exposed || ns.busy === false) && !ns.lenisStopped && y1 > y0 + 50;
    let rec = '';
    if (!ok) { // diagnostics: how long until it recovers (if ever)
      const t1 = Date.now(); let r2 = null;
      while (Date.now() - t1 < 6000) { const s2 = await niaState(page); if ((!s2.exposed || !s2.busy) && !s2.lenisStopped) { r2 = Date.now() - tLast; break; } await sleep(200); }
      rec = r2 == null ? '; still busy/stopped after 12s' : `; busy/stopped state cleared ~${r2}ms after last hash (checked at 6000ms)`;
    }
    inter(k, 'rapid-routes', ok, `hash=#${hash}; target #s-${last} ${at ? 'top=' + at.top + (near ? '' : ' (not near top)') : 'MISSING'}; state=${JSON.stringify(ns)}; wheel ${y0}->${y1}${rec}`);
    if (!ns.exposed) inter(k, 'nia-state-exposed', false, 'window.NIA.state() not exposed (busy/lenis not verifiable)', 'warn');
    // back / forward
    await page.evaluate(() => { location.hash = 'contact'; }); await waitIdle(page, { min: 500, max: 7000 });
    const hasForm = async () => !!(await page.$(SEL.form));
    const c1 = await routeOf(page) === 'contact' && await hasForm();
    await page.evaluate(() => history.back()); await waitIdle(page, { min: 500, max: 7000 });
    const b = await routeOf(page); const bAt = await anchorTop(page, last); const bForm = await hasForm();
    await page.evaluate(() => history.forward()); await waitIdle(page, { min: 500, max: 7000 });
    const f = await routeOf(page); const fForm = await hasForm();
    inter(k, 'back-forward', c1 && b === last && !!bAt && !bForm && f === 'contact' && fForm, `contact=${c1}; back -> #${b} (#s-${last} ${bAt ? 'present' : 'missing'}, form=${bForm}); forward -> #${f} form=${fForm}`);
    await page.close();
  } catch (e) { inter(k, 'rapid-routes', false, 'harness: ' + e.message.slice(0, 160)); }

  // 5. bio panel
  try {
    const page = await freshMotionPage(ctx, 'about');
    const btns = await page.$$(SEL.bioBtn);
    if (!btns.length) inter(k, 'bio-panel', true, 'skipped: no ' + SEL.bioBtn + ' buttons');
    else {
      const b = btns[0]; await b.scrollIntoViewIfNeeded(); await sleep(500); await b.click(); await sleep(900);
      const st = () => page.evaluate(({ panel, sheet }) => { const c = [...document.querySelectorAll(panel + ',[role=dialog],dialog')].filter(e => !e.matches(sheet)); for (const e of c) { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); if (cs.visibility !== 'hidden' && cs.display !== 'none' && r.height > 20 && r.top < innerHeight - 20 && r.left < innerWidth - 20 && r.right > 20) return { vis: true, h: Math.round(r.height), w: Math.round(r.width), id: e.id || e.className, focusIn: e.contains(document.activeElement) }; } return { vis: false, active: document.activeElement && (document.activeElement.getAttribute('data-bio') || document.activeElement.tagName) }; }, { panel: SEL.bioPanel, sheet: SEL.sheet });
      let s = await st();
      const tooTall = mobile && s.vis && s.h > vp.h * 0.86;
      inter(k, 'bio-open', s.vis && !tooTall, JSON.stringify(s) + (tooTall ? ' exceeds 85svh on mobile' : ''));
      await page.keyboard.press('Escape'); await sleep(900);
      const focusBack = await b.evaluate(e => document.activeElement === e);
      s = await st();
      inter(k, 'bio-escape', !s.vis && focusBack, JSON.stringify(s) + ' focusReturned=' + focusBack);
    }
    await page.close();
  } catch (e) { inter(k, 'bio-panel', false, 'harness: ' + e.message.slice(0, 160)); }
  await ctx.close();
}

// ---------- E: performance ----------
async function perfRun(browser, vp) {
  const k = vpKey(vp); const ctx = await newCtx(browser, vp);
  for (const route of ROUTES) {
    const page = await ctx.newPage(); attachCollector(page);
    try {
      await page.goto(URL0 + '#' + route, { waitUntil: 'domcontentloaded' });
      await skipLoader(page); await page.waitForLoadState('load').catch(() => { }); await sleep(SETTLE_MS);
      const ranges = await storyRanges(page);
      const s = ranges[0];
      if (!s) { report.perf.push({ viewport: k, route, skipped: 'no .story on route' }); await page.close(); continue; }
      const start = s ? s.start : 0, end = s ? s.end : Math.min(await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight), vp.h * 3);
      await scrollToY(page, Math.max(0, start - 10)); await sleep(600);
      const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      await page.mouse.move(vp.w / 2, vp.h / 2);
      await page.evaluate(() => { window.__qa.fr = []; window.__qa.lt = []; window.__qa.run = true; let last = performance.now(); const f = t => { window.__qa.fr.push(t - last); last = t; if (window.__qa.run) requestAnimationFrame(f); }; requestAnimationFrame(f); });
      const steps = 30, dy = Math.max(40, Math.round((end - start + 10) / steps));
      const t0 = Date.now();
      for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy); await sleep(100); }
      await sleep(600);
      const dur = Date.now() - t0;
      const m = await page.evaluate(() => { window.__qa.run = false; return { fr: window.__qa.fr.slice(1), lt: window.__qa.lt.slice(), y: scrollY }; });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await cdp.detach().catch(() => { });
      const fr = m.fr.filter(x => x > 0); const sorted = [...fr].sort((a, b) => a - b);
      const avg = fr.reduce((a, b) => a + b, 0) / (fr.length || 1);
      const rec = { viewport: k, route, story: s ? s.key : null, range: [start, end], scrolledTo: Math.round(m.y), durationMs: dur, frames: fr.length, avgFps: +(1000 / avg).toFixed(1), p95FrameMs: +(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1), framesOver50ms: fr.filter(x => x > 50).length, longTasks: m.lt.length, longTaskTotalMs: m.lt.reduce((a, b) => a + b.d, 0), throttle: 4 };
      report.perf.push(rec);
      if (rec.avgFps < FPS_WARN) add('warn', k, route, 'perf', 'fps', `avg ${rec.avgFps}fps p95 ${rec.p95FrameMs}ms, ${rec.framesOver50ms} frames >50ms, ${rec.longTasks} long tasks (4x CPU throttle)`);
      if (s && m.y < start + (end - start) * 0.5) add('warn', k, route, 'perf', 'wheel-scroll', `wheel scrolling only reached ${Math.round(m.y)} of story range ${start}-${end}`);
      log(`perf ${k} ${route}: ${rec.avgFps}fps p95 ${rec.p95FrameMs}ms >50ms:${rec.framesOver50ms} lt:${rec.longTasks}`);
    } catch (e) { add('error', k, route, 'perf', 'harness', e.message.slice(0, 200)); }
    await page.close();
  }
  await ctx.close();
}

// ---------- markdown ----------
function writeMd() {
  const c = report.checks, err = c.filter(x => x.severity === 'error'), warn = c.filter(x => x.severity === 'warn');
  const L = [];
  L.push('# NiaDelta QA report', '', `- File: \`${report.file}\``, `- Run: ${report.startedAt} (${report.quick ? 'quick' : 'full'}), ${report.summary.durationSec}s, offline=${report.offline}`, `- **Errors: ${report.summary.errors}**, Warnings: ${report.summary.warnings}`, `- Interactions: ${report.interactions.filter(i => i.pass).length}/${report.interactions.length} passed; CDN-failure routes: ${report.cdn.filter(i => i.pass).length}/${report.cdn.length} passed`, '');
  for (const [title, arr] of [['Errors', err], ['Warnings', warn]]) {
    L.push('## ' + title + ' (' + arr.length + ')', '');
    const byCheck = {}; for (const x of arr) (byCheck[x.check] = byCheck[x.check] || []).push(x);
    for (const [ck, xs] of Object.entries(byCheck).sort((a, b) => b[1].length - a[1].length)) {
      L.push('### ' + ck + ' - ' + xs.length, '');
      const g = {}; for (const x of xs) { const key = (x.sel ? x.sel + '|' : '') + x.detail.replace(/rect[^ ]*=[\d,-]+|\d+/g, '#'); (g[key] = g[key] || { d: x.detail, at: [] }).at.push(x.viewport + ' ' + x.route + ' ' + x.mode); }
      const ent = Object.entries(g); ent.slice(0, 25).forEach(([kk, v]) => L.push('- ' + v.d.replace(/\|/g, '/').slice(0, 260) + '  \n  _at:_ ' + (v.at.length > 6 ? v.at.slice(0, 6).join(', ') + ` (+${v.at.length - 6})` : v.at.join(', '))));
      if (ent.length > 25) L.push('- ... ' + (ent.length - 25) + ' more distinct items (see report.json)');
      L.push('');
    }
  }
  L.push('## Interactions', '', '| viewport | test | result | detail |', '|---|---|---|---|');
  for (const i of report.interactions) L.push(`| ${i.viewport} | ${i.name} | ${i.pass ? 'PASS' : 'FAIL'} | ${String(i.detail || '').replace(/\|/g, '/').slice(0, 220)} |`);
  L.push('', '## Performance (4x CPU throttle, wheel through first story)', '', '| viewport | route | story | avg fps | p95 ms | >50ms | long tasks |', '|---|---|---|---|---|---|---|');
  for (const p of report.perf) if (p.skipped) L.push(`| ${p.viewport} | ${p.route} | skipped: ${p.skipped} | | | | |`); else L.push(`| ${p.viewport} | ${p.route} | ${p.story || '-'} | ${p.avgFps} | ${p.p95FrameMs} | ${p.framesOver50ms} | ${p.longTasks} (${p.longTaskTotalMs}ms) |`);
  L.push('', '## CDN failure', '', '| viewport | route | result | nav | detail |', '|---|---|---|---|---|');
  for (const r of report.cdn) L.push(`| ${r.viewport} | ${r.route} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.nav ? '#' + r.nav.to + ' via ' + r.nav.how + ' ' + r.nav.ms + 'ms' : '-'} | ${r.detail.join('; ').replace(/\|/g, '/').slice(0, 200)} |`);
  L.push('', '## CLS per page', '', '| viewport | route | rm | motion |', '|---|---|---|---|');
  for (const [k, v] of Object.entries(report.viewports)) for (const [r, m] of Object.entries(v.routes)) L.push(`| ${k} | ${r} | ${m.rm ? m.rm.cls : '-'} | ${m.motion ? m.motion.cls : '-'} |`);
  if (report.notes.length) L.push('', '## Notes', '', ...report.notes.map(n => '- ' + n));
  fs.writeFileSync(path.join(OUT, 'report.md'), L.join('\n'));
}

// ---------- main ----------
(async () => {
  report.offline = await detectOffline();
  if (report.offline) report.notes.push('Offline: font host failures ignored; CDN libraries likely unavailable so motion mode == CDN-failure mode.');
  const vps = QUICK ? VIEWPORTS.filter(v => QUICK_VP.includes(vpKey(v))) : VIEWPORTS;
  const browser = await chromium.launch({ headless: true });
  try {
    const timed = async (label, fn) => { const t = Date.now(); await fn(); log(label + ' ' + ((Date.now() - t) / 1000).toFixed(1) + 's'); };
    // simple worker pool: contexts run in parallel inside one browser
    const pool = async (items, n, fn) => { const q = [...items]; await Promise.all(Array.from({ length: Math.min(n, q.length) }, async () => { while (q.length) await fn(q.shift()); })); };
    const sub = VIEWPORTS.filter(v => INTERACT_VP.includes(vpKey(v)));
    if (phaseOn('shots')) await pool(vps, CONCURRENCY, vp => timed('shots+checks ' + vpKey(vp), () => shotsAndChecks(browser, vp)));
    const jobs = [];
    if (phaseOn('cdn')) for (const vp of sub) jobs.push(() => timed('cdn ' + vpKey(vp), () => cdnRun(browser, vp)));
    if (phaseOn('interactions')) for (const vp of sub) jobs.push(() => timed('interactions ' + vpKey(vp), () => interactions(browser, vp)));
    await pool(jobs, CONCURRENCY + 1, j => j());
    // perf runs alone (no parallel load) so FPS numbers are meaningful
    if (phaseOn('perf')) for (const vp of sub) await timed('perf ' + vpKey(vp), () => perfRun(browser, vp));
    // keep report order stable
    report.interactions.sort((a, b) => a.viewport.localeCompare(b.viewport));
    report.cdn.sort((a, b) => a.viewport.localeCompare(b.viewport) || ROUTES.indexOf(a.route) - ROUTES.indexOf(b.route));
  } catch (e) { report.notes.push('Fatal: ' + e.stack); console.error(e); }
  finally { await browser.close(); }
  report.summary = { errors: report.checks.filter(x => x.severity === 'error').length, warnings: report.checks.filter(x => x.severity === 'warn').length, byCheck: report.checks.reduce((a, x) => { const kk = x.severity + ':' + x.check; a[kk] = (a[kk] || 0) + 1; return a; }, {}), interactionsPassed: report.interactions.filter(i => i.pass).length, interactionsTotal: report.interactions.length, cdnPassed: report.cdn.filter(i => i.pass).length, cdnTotal: report.cdn.length, durationSec: Math.round((Date.now() - T0) / 1000) };
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 1));
  writeMd();
  log('done in ' + report.summary.durationSec + 's: ' + report.summary.errors + ' errors, ' + report.summary.warnings + ' warnings -> ' + OUT);
  log(JSON.stringify(report.summary.byCheck));
})();
