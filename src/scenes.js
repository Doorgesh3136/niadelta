/* ==== NiaDelta v2 - scenes.js (SCENES builder) ====
   window.NIA_SCENES = { approach, story, values, align }
   Vanilla JS, no dependencies. Contract: see SPEC.md "Scene contract".
   mount(stage, ctx) -> { update(p), resize(), destroy() }
   - mount/resize build markup, read stage size, sample path lookup tables and lay out tags.
   - update(p) only writes transform / opacity / fill / points / strokeDashoffset on cached nodes.
*/
(function () {
  'use strict';

  /* ---------- palette ---------- */
  var INK = '#0B2A3D', PAPER = '#FBF4E8', PAPER2 = '#F3E6CF', CORAL = '#E8553D', GOLD = '#F8B518', TEAL = '#1F8A8A', PEACH = '#FFC9A3';
  function hx(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function mixHex(a, b, t) {
    var A = hx(a), B = hx(b), o = '#';
    for (var i = 0; i < 3; i++) { var v = Math.round(A[i] + (B[i] - A[i]) * t).toString(16); o += v.length < 2 ? '0' + v : v; }
    return o;
  }
  function mixRgb(A, B, t) {
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  var TEAL_T = mixHex(TEAL, PAPER, 0.5), TEAL_L = mixHex(TEAL, PAPER, 0.72), PEACH_T = mixHex(PEACH, PAPER, 0.45),
    GOLD_T = mixHex(GOLD, PAPER, 0.4), CORAL_T = mixHex(CORAL, PEACH, 0.45), GROUND = mixHex(PAPER2, PEACH, 0.3),
    HILL_FAR = mixHex(TEAL, PAPER, 0.8), HILL_NEAR = mixHex(PEACH, PAPER2, 0.45), BARK = mixHex(CORAL, INK, 0.55),
    DEEP = mixHex(TEAL, INK, 0.5), GREY = mixHex(PAPER2, INK, 0.2), FOG = mixHex(PAPER2, INK, 0.1), DUSK = mixHex(CORAL, PEACH, 0.5), NIGHT = mixHex(TEAL, INK, 0.62);

  /* ---------- math + easing ---------- */
  function f(v) { return Math.round(v * 100) / 100; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function remap(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smoothstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function easeOut(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t) * (1 - t); }
  function easeOutBack(t) { t = clamp(t, 0, 1); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function spring(t) { if (t <= 0) return 0; if (t >= 1) return 1; return 1 - Math.exp(-6 * t) * Math.cos(9 * t); }
  function rng(seed) {
    return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /* piecewise keyframes [[p,v],...] with smoothstep inside each segment */
  function kf(p, K) {
    if (p <= K[0][0]) return K[0][1];
    for (var i = 1; i < K.length; i++) {
      if (p <= K[i][0]) { var a = K[i - 1], b = K[i], t = (p - a[0]) / (b[0] - a[0] || 1); t = t * t * (3 - 2 * t); return a[1] + (b[1] - a[1]) * t; }
    }
    return K[K.length - 1][1];
  }
  function rot(x, y, th) { var c = Math.cos(th), s = Math.sin(th); return [x * c - y * s, x * s + y * c]; }

  /* Catmull-Rom spline through points -> cubic path */
  function crPath(P) {
    var d = 'M' + P[0][0] + ' ' + P[0][1];
    for (var i = 0; i < P.length - 1; i++) {
      var a = P[i - 1] || P[i], b = P[i], e = P[i + 1], g = P[i + 2] || e;
      d += 'C' + f(b[0] + (e[0] - a[0]) / 6) + ' ' + f(b[1] + (e[1] - a[1]) / 6) + ' ' + f(e[0] - (g[0] - b[0]) / 6) + ' ' + f(e[1] - (g[1] - b[1]) / 6) + ' ' + e[0] + ' ' + e[1];
    }
    return d;
  }

  /* ---------- path lookup tables (built in mount/resize only) ---------- */
  function mkLut(path) {
    var len = path.getTotalLength(), n = Math.max(80, Math.min(480, Math.round(len / 4)));
    var xs = new Float32Array(n + 1), ys = new Float32Array(n + 1);
    for (var i = 0; i <= n; i++) { var pt = path.getPointAtLength(len * i / n); xs[i] = pt.x; ys[i] = pt.y; }
    return { len: len, n: n, xs: xs, ys: ys };
  }
  var PT = [0, 0, 0];
  function at(l, s) {
    var u = clamp(s / l.len, 0, 1) * l.n, i = Math.min(l.n - 1, u | 0), r = u - i;
    var i0 = Math.max(0, i - 1), i1 = Math.min(l.n, i + 2);
    PT[0] = l.xs[i] + (l.xs[i + 1] - l.xs[i]) * r;
    PT[1] = l.ys[i] + (l.ys[i + 1] - l.ys[i]) * r;
    PT[2] = Math.atan2(l.ys[i1] - l.ys[i0], l.xs[i1] - l.xs[i0]);
    return PT;
  }
  function nearestS(l, x, y) {
    var b = 0, bd = 1e12;
    for (var i = 0; i <= l.n; i++) { var dx = l.xs[i] - x, dy = l.ys[i] - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; b = i; } }
    return l.len * b / l.n;
  }

  /* ---------- cached writers (update() uses only these) ---------- */
  function T(n, v) { if (n._t !== v) { n._t = v; n.setAttribute('transform', v); } }
  function Op(n, v) { v = Math.round(clamp(v, 0, 1) * 1000) / 1000; if (n._o !== v) { n._o = v; n.setAttribute('opacity', v); } }
  function At(n, k, v) { if (n['_' + k] !== v) { n['_' + k] = v; n.setAttribute(k, v); } }
  /* colour cross-fade quantised to `steps`: no string building and no write until the step changes */
  function Fill(n, A, B, t, steps) { t = Math.round(clamp(t, 0, 1) * steps); if (n._q !== t) { n._q = t; n.setAttribute('fill', mixRgb(A, B, t / steps)); } }
  function Draw(n, t, base) {
    t = clamp(t, 0, 1); var d = Math.round((1 - t) * 10000) / 10000;
    if (n._d !== d) { n._d = d; n.style.strokeDashoffset = d; }
    Op(n, t > 0.003 ? (base == null ? 1 : base) : 0);
  }
  function tl(x, y) { return 'translate(' + f(x) + ' ' + f(y) + ')'; }
  function sc(s, sy) { return ' scale(' + f(s) + (sy == null ? '' : ' ' + f(sy)) + ')'; }

  /* ---------- svg snippets ---------- */
  var O = ' stroke="' + INK + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"';
  var O15 = ' stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"';
  var DR = ' pathLength="1" stroke-dasharray="1 2" stroke-dashoffset="1" opacity="0" class="scn-dr"';
  function use(id, name, tr, extra) { return '<use href="#' + id + '-' + name + '"' + (tr ? ' transform="' + tr + '"' : '') + (extra || '') + '/>'; }
  function star5(r1, r2) {
    var d = '';
    for (var i = 0; i < 10; i++) { var r = i % 2 ? r2 : r1, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L' : 'M') + f(Math.cos(a) * r) + ' ' + f(Math.sin(a) * r); }
    return d + 'Z';
  }
  function skyGrad(id, y0, y1) {
    return '<linearGradient id="' + id + '-sky" gradientUnits="userSpaceOnUse" x1="0" y1="' + y0 + '" x2="0" y2="' + y1 + '"><stop offset="0" stop-color="' + PAPER + '" stop-opacity="0"/><stop offset=".55" stop-color="' + PEACH + '" stop-opacity=".2"/><stop offset="1" stop-color="' + PEACH + '" stop-opacity=".62"/></linearGradient>';
  }
  function defsCommon(id) {
    return '<path id="' + id + '-cloud" d="M-60 16C-78 16-80-6-62-10C-64-30-36-36-26-20C-20-40 14-44 22-22C36-34 62-24 58-4C76-2 76 16 60 16Z" fill="' + PAPER + '"' + O + '/>' +
      '<path id="' + id + '-tuft" d="M-9 0C-9-7-11-12-14-16M-2 0C-2-9-1-16 2-22M5 0C6-6 9-10 13-13" fill="none"' + O + '/>' +
      '<path id="' + id + '-spk" d="M0-9L2.2-2.2L9 0L2.2 2.2L0 9L-2.2 2.2L-9 0L-2.2-2.2Z" fill="' + GOLD + '"' + O15 + '/>' +
      '<g id="' + id + '-per"><path d="M-11 0C-12-16-9-27 0-27C9-27 12-16 11 0Z"' + O + '/><circle cy="-35" r="7.5" fill="' + PAPER + '"' + O + '/><circle cx="-2.6" cy="-36" r="1.3" fill="' + INK + '"/><circle cx="2.6" cy="-36" r="1.3" fill="' + INK + '"/></g>' +
      '<g id="' + id + '-flw"><path d="M0 0V-14" fill="none"' + O15 + '/><circle cy="-17" r="4.5" fill="' + CORAL + '"' + O15 + '/><circle cy="-17" r="1.4" fill="' + GOLD + '"/></g>' +
      '<path id="' + id + '-stone" d="M-14 0C-14-8-6-11 1-11C9-11 14-6 14 0Z" fill="' + PAPER2 + '"' + O + '/>';
  }
  function frontSVG(id, list) {
    return list.map(function (e) {
      var t = tl(e[1], e[2]) + sc(e[3]);
      return use(id, e[0] === 't' ? 'tuft' : e[0] === 'f' ? 'flw' : 'stone', t);
    }).join('');
  }
  /* walking character: origin at feet. data-k: k (position), kf (facing/scale), ky (bob), ka/kb (legs) */
  function walkerSVG(k, body, back, front) {
    var leg = ' fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"';
    return '<g data-k="' + k + '"><g data-k="' + k + 'f"><g data-k="' + k + 'y">' + (back || '') +
      '<path data-k="' + k + 'a" d="M-5 -16V-1"' + leg + '/><path data-k="' + k + 'b" d="M5 -16V-1"' + leg + '/>' +
      '<path d="M-11 -13C-13 -31-9 -39 0 -39C9 -39 13 -31 11 -13Z" fill="' + body + '"' + O + '/>' +
      '<circle cy="-47" r="9" fill="' + PAPER + '"' + O + '/>' +
      '<circle cx="3" cy="-48" r="1.6" fill="' + INK + '"/><circle cx="7.4" cy="-48" r="1.6" fill="' + INK + '"/>' +
      (front || '') + '</g></g></g>';
  }
  function walk(q, k, l, s, amp, face, size) {
    var P = at(l, s), x = P[0], y = P[1];
    var ax = at(l, s + 16)[0], bx = at(l, s - 16)[0];
    var dir = face != null ? face : clamp((ax - bx) / 12, -1, 1);
    if (face == null && Math.abs(dir) < 0.35) dir = dir < 0 ? -0.35 : 0.35;
    T(q[k], tl(x, y));
    T(q[k + 'f'], 'scale(' + f(dir * size) + ' ' + f(size) + ')');
    var ph = s / (6.5 * size), a = Math.sin(ph) * 28 * amp;
    T(q[k + 'a'], 'rotate(' + f(a) + ' -5 -16)');
    T(q[k + 'b'], 'rotate(' + f(-a) + ' 5 -16)');
    T(q[k + 'y'], tl(0, -Math.abs(Math.cos(ph)) * 2.2 * amp));
  }

  /* =====================================================================
     ENGINE: mount, composition switch, tag layout, tag animation
     ===================================================================== */
  var UID = 0, SHIFT = [0.5, 0.22, 0.78, 0.06, 0.94];
  function ov(x, y, w, h, X, Y, W2, H2, m) {
    var dx = Math.min(x + w + m, X + W2) - Math.max(x - m, X), dy = Math.min(y + h + m, Y + H2) - Math.max(y - m, Y);
    return dx > 0 && dy > 0 ? dx * dy : 0;
  }
  /* LV[i] = [from, to] progress window of tag i: tags that are never on screen together do not repel */
  function placeAll(A, AV, sz, w, h, one, aw, LV) {
    var co = function (i, j) { return !LV || (LV[i][0] < LV[j][1] && LV[j][0] < LV[i][1]); };
    var out = [], pad = 6, gap = 14, i, j;
    for (i = 0; i < A.length; i++) {
      var a = A[i], tw = sz[i][0], th = sz[i][1], best = null, bc = 1e18, sides = a[2];
      for (var si = 0; si < sides.length; si++) {
        var sd = sides[si], rows = (sd === 't' || sd === 'b') ? [0, 1, 2] : [0, -1, 1, -2, 2];
        for (var ri = 0; ri < rows.length; ri++) {
          for (var fi = 0; fi < SHIFT.length; fi++) {
            var fr = SHIFT[fi], x, y, rk = rows[ri];
            if (sd === 't') { x = a[0] - tw * fr; y = a[1] - th - gap - rk * (th + 6); }
            else if (sd === 'b') { x = a[0] - tw * fr; y = a[1] + gap + rk * (th + 6); }
            else if (sd === 'l') { x = a[0] - tw - gap; y = a[1] - th * fr + rk * (th + 8); }
            else { x = a[0] + gap; y = a[1] - th * fr + rk * (th + 8); }
            var cx = clamp(x, pad, Math.max(pad, w - tw - pad)), cy = clamp(y, pad, Math.max(pad, h - th - pad));
            var cost = si * 40 + Math.abs(rk) * 55 + fi * 6 + (Math.abs(cx - x) + Math.abs(cy - y)) * 1.2;
            for (j = 0; j < AV.length; j++) cost += ov(cx, cy, tw, th, AV[j][0], AV[j][1], AV[j][2], AV[j][3], 0) / (tw * th) * (aw || 260);
            if (!one) for (j = 0; j < out.length; j++) if (co(i, j)) cost += ov(cx, cy, tw, th, out[j][0], out[j][1], sz[j][0], sz[j][1], 8) * 40;
            if (cost < bc) { bc = cost; best = [cx, cy, sd, rk]; }
          }
        }
      }
      out.push(best);
    }
    if (!one) for (i = 0; i < out.length; i++) for (j = i + 1; j < out.length; j++) if (co(i, j) && ov(out[i][0], out[i][1], sz[i][0], sz[i][1], out[j][0], out[j][1], sz[j][0], sz[j][1], 4) > 0) return null;
    return out;
  }

  function makeScene(def) {
    return {
      eyebrow: def.eyebrow, title: def.title, lede: def.lede, chapters: def.chapters,
      mount: function (stage, ctx) { return mountScene(def, stage, ctx || {}); }
    };
  }

  function mountScene(def, stage, ctx) {
    var reduced = !!ctx.reduced, id = 'scn' + (++UID) + def.key;
    var root = document.createElement('div');
    root.className = 'scn-root scn-' + def.key + (reduced ? ' scn-static' : '');
    root.setAttribute('aria-hidden', 'true');
    stage.appendChild(root);
    var comp = '', S = null, wrap = null, tags = [], mode = 'acc', w0 = -1, h0 = -1, last = reduced ? 1 : 0, ro = null, raf = 0, dead = false;
    var CH = def.chapters, TAT = def.tagAt, TC = def.tagC, TU = def.tagUntil, TS = def.tagShort || [];
    /* composition: whichever layout (landscape 'L' or portrait 'P') covers more of the stage */
    function pick(w, h) {
      var a = def.layouts.L.vb, b = def.layouts.P.vb, sl = Math.min(w / a[0], h / a[1]), sp = Math.min(w / b[0], h / b[1]);
      return sl * sl * a[0] * a[1] >= sp * sp * b[0] * b[1] ? 'L' : 'P';
    }

    function build(c) {
      comp = c;
      var L = def.layouts[c], vb = L.vb;
      root.innerHTML = '<svg class="scn-svg" viewBox="0 0 ' + vb[0] + ' ' + vb[1] + '" preserveAspectRatio="xMidYMid meet" focusable="false">' + def.svg(L, id) + '</svg>' +
        '<div class="scn-tags">' + CH.map(function (ch, i) {
          return '<div class="scn-tag" style="--c:' + TC[i] + '"><b>' + ch.label + '</b>' + (TS[i] ? '<i class="scn-ab">' + TS[i] + '</i>' : '') + (ch.short ? '<span>' + ch.short + '</span>' : '') + '</div>';
        }).join('') + '</div>';
      wrap = root.lastChild; tags = [].slice.call(wrap.children);
      var q = {}, ns = root.firstChild.querySelectorAll('[data-k]');
      for (var i = 0; i < ns.length; i++) q[ns[i].getAttribute('data-k')] = ns[i];
      S = { q: q, L: L, c: c, view: [0, 0, vb[0], vb[1]], fy: 0 };
      def.bind(S, L);
      for (i = 0; i < tags.length; i++) { tags[i]._t = tags[i]._o = null; }
    }

    /* "plinth" labels (layout tags with fix:1): anchored straight under their object on one or two
       staggered rows, never moved by the collision placer, never faded out in 'one' mode. Returns
       the occupied rects, or null when they do not fit below the anchor line (then the generic placer takes them). */
    /* Variants, best first: full names under each column (13px, then 12px) -> short names under each
       column (one row, then two staggered rows) -> one row of short chips spread around the colonnade
       (colour dot = column capital) -> a 2+3 (or 2+2+1) legend in the ground band -> the same legend
       pinned to the bottom of the stage. The last one always succeeds, so the names never disappear. */
    /* legend `rows` are row sizes (the last size repeats until every fixed tag is placed): [2,3] = 2+3, [2] = 2+2+1 */
    var FIXV = [{ k: 'pl' }, { k: 'pl', c: ' scn-pls' }, { k: 'pl', sh: 1, one: 1 }, { k: 'pl', sh: 1 }, { k: 'row' },
      { k: 'key', rows: [2, 3] }, { k: 'key', rows: [2] }, { k: 'key', c: ' scn-k12', rows: [2] },
      { k: 'key', c: ' scn-k12', rows: [2], force: 1 }];
    function chunkRows(n, sizes) {
      var out = [], j = 0, r = 0;
      while (j < n) { var len = sizes[Math.min(r++, sizes.length - 1)], row = []; while (row.length < len && j < n) row.push(j++); out.push(row); }
      return out;
    }
    function resetTag(el) {
      el.className = 'scn-tag'; el.style.maxWidth = ''; el.style.removeProperty('--tx'); el.style.removeProperty('--ld');
      el._fx = el._cp = false; el._t = el._o = null;
    }
    function fixVariant(V, ix, s, ox, oy, w, h) {
      var L = S.L, gy = oy + (L.plY || 0) * s, n = ix.length, k, el, sz, out = [];
      var base = V.k === 'pl' ? 'scn-tag scn-pl scn-sb' + (V.sh ? ' scn-cp' : '') : V.k === 'row' ? 'scn-tag scn-dt scn-cp scn-nt' : 'scn-tag scn-key scn-cp scn-nt';
      var maxW = Math.max(64, Math.min(230, 2 * (L.plw || 100) * s - 10));
      for (k = 0; k < n; k++) { el = tags[ix[k]]; resetTag(el); el.className = base + (V.c || ''); if (V.k === 'pl' && !V.sh) el.style.maxWidth = f(maxW) + 'px'; }
      sz = ix.map(function (j) { return [tags[j].offsetWidth, tags[j].offsetHeight]; });
      var AX = ix.map(function (j) { return ox + L.tags[j].a[0] * s; });
      if (V.k === 'pl') {
        /* a single word wider than the label (e.g. "Transformation" on a narrow stage) means it does not fit */
        if (!V.sh && ix.some(function (j) { var bb = tags[j].firstChild; return bb && bb.scrollWidth > bb.clientWidth + 1; })) return null;
        var hr = [0, 0], rowOf = function (k) { return V.one ? 0 : (L.tags[ix[k]].row ? 1 : 0); };
        for (k = 0; k < n; k++) hr[rowOf(k)] = Math.max(hr[rowOf(k)], sz[k][1]);
        var y0 = gy + 10, y1 = y0 + hr[0] + 6, bottom = hr[1] ? y1 + hr[1] : y0 + hr[0];
        if (bottom > h - 4) return null;
        for (k = 0; k < n; k++) {
          el = tags[ix[k]];
          var tw = sz[k][0], th = sz[k][1], y = rowOf(k) ? y1 : y0, x = clamp(AX[k] - tw / 2, 4, w - tw - 4), tx = clamp(AX[k] - x, 12, tw - 12);
          if (Math.abs(AX[k] - x - tx) > 1) return null;
          el.style.setProperty('--tx', f(tx) + 'px'); el.style.setProperty('--ld', f(Math.max(0, y - gy - 6)) + 'px');
          el.style.transformOrigin = f(tx) + 'px 0px';
          out.push([x, y, tw, th]);
        }
        for (var a1 = 0; a1 < n; a1++) for (var a2 = a1 + 1; a2 < n; a2++) if (ov(out[a1][0], out[a1][1], out[a1][2], out[a1][3], out[a2][0], out[a2][1], out[a2][2], out[a2][3], 3) > 0) return null;
      } else if (V.k === 'row') {
        /* one line of chips: start centred under each column, then relax overlaps symmetrically */
        var tot = 6 * (n - 1); for (k = 0; k < n; k++) tot += sz[k][0];
        var rh = Math.max.apply(null, sz.map(function (z) { return z[1]; })), ry = Math.max(gy + 10, Math.min(gy + 34, h - rh - 8));
        if (tot > w - 8 || ry + rh > h - 4) return null;
        var X = AX.map(function (a, k) { return a - sz[k][0] / 2; });
        for (var it = 0; it < 80; it++) {
          var moved = false;
          for (k = 1; k < n; k++) { var d = X[k - 1] + sz[k - 1][0] + 6 - X[k]; if (d > 0.1) { X[k - 1] -= d / 2; X[k] += d / 2; moved = true; } }
          if (X[0] < 4) { var dl = 4 - X[0]; for (k = 0; k < n; k++) X[k] += dl; }
          if (X[n - 1] + sz[n - 1][0] > w - 4) { var dr = X[n - 1] + sz[n - 1][0] - (w - 4); for (k = 0; k < n; k++) X[k] -= dr; }
          if (!moved) break;
        }
        for (k = 0; k < n; k++) { tags[ix[k]].style.transformOrigin = '50% 0px'; out.push([X[k], ry, sz[k][0], sz[k][1]]); }
      } else {
        var R = chunkRows(n, V.rows), gap = 8, lh = Math.max.apply(null, sz.map(function (z) { return z[1]; })), H = R.length * lh + (R.length - 1) * 2;
        var rw = R.map(function (r) { return r.reduce(function (a, j) { return a + sz[j][0]; }, 0) + gap * (r.length - 1); });
        if (Math.max.apply(null, rw) > w - 8 && !V.force) return null;
        var ky = gy + 8;
        if (ky + H > h - 4) { if (!V.force) return null; ky = Math.max(4, h - 4 - H); }
        var cx = ox + (L.plc || L.vb[0] / 2) * s;
        R.forEach(function (r, ri) {
          var x = clamp(cx - rw[ri] / 2, 4, Math.max(4, w - 4 - rw[ri]));
          r.forEach(function (j) { out[j] = [x, ky + ri * (lh + 2), sz[j][0], sz[j][1]]; tags[ix[j]].style.transformOrigin = '0px 50%'; x += sz[j][0] + gap; });
        });
      }
      for (k = 0; k < n; k++) {
        el = tags[ix[k]]; el.style.left = f(out[k][0] / w * 100) + '%'; el.style.top = f(out[k][1] / h * 100) + '%';
        el._t = el._o = null; el._fx = true; el._cp = V.k !== 'pl';
      }
      return out;
    }
    function layoutFixed(ix, s, ox, oy, w, h) {
      for (var v = 0; v < FIXV.length; v++) {
        if (FIXV[v].k !== 'pl' && !TS[ix[0]]) break;
        var r = fixVariant(FIXV[v], ix, s, ox, oy, w, h);
        if (r) return r;
      }
      for (var z = 0; z < ix.length; z++) resetTag(tags[ix[z]]);
      return null;
    }
    function layout(w, h) {
      var L = S.L, v = S.view, s = Math.min(w / v[2], h / v[3]), ox = (w - v[2] * s) / 2 - v[0] * s, oy = (h - v[3] * s) / 2 - v[1] * s;
      wrap.className = 'scn-tags' + (w < 460 || h < 300 ? ' scn-sm' : '');
      var fixIx = [], freeIx = [], i;
      for (i = 0; i < tags.length; i++) { tags[i]._fx = false; (L.tags[i].fix ? fixIx : freeIx).push(i); }
      var FR = fixIx.length ? layoutFixed(fixIx, s, ox, oy, w, h) : null;
      var use = FR ? freeIx : fixIx.concat(freeIx).sort(function (a, b) { return a - b; });
      var A = use.map(function (j) { var t = L.tags[j]; return [ox + t.a[0] * s, oy + t.a[1] * s, t.p || 'tbrl']; });
      var LV = use.map(function (j) { return [TAT[j], TU && TU[j] != null ? TU[j] : 2]; });
      var AV = (L.avoid || []).map(function (r) { return [ox + r[0] * s, oy + r[1] * s, r[2] * s, r[3] * s]; }).concat(FR || []);
      var tries = [];
      if (w >= 700 && h >= 360) tries.push([1, 0]);
      tries.push([0, 0]);
      if (w >= 360 && h >= 300) tries.push([1, 1]);
      tries.push([0, 1]);
      for (var k = 0; k < tries.length; k++) {
        var rich = tries[k][0], one = tries[k][1];
        wrap.className = 'scn-tags' + (rich ? ' scn-rich' : '') + (w < 460 || h < 300 ? ' scn-sm' : '');
        var sz = use.map(function (j) { return [tags[j].offsetWidth, tags[j].offsetHeight]; });
        /* accumulating every tag is only allowed while they cover < 18% of the stage (static frames: 30%) */
        var area = 0; for (var z = 0; z < sz.length; z++) area += sz[z][0] * sz[z][1];
        var res = (!one && area > w * h * (reduced ? 0.3 : 0.18)) ? null : placeAll(A, AV, sz, w, h, one, def.avoidW, LV);
        /* scenes with def.avoidMax: showing every tag at once is only allowed while none of them sits on the art */
        if (res && !one && def.avoidMax && !reduced && k < tries.length - 1) {
          for (z = 0; res && z < res.length; z++) {
            var cov = 0; for (var y2 = 0; y2 < AV.length; y2++) cov += ov(res[z][0], res[z][1], sz[z][0], sz[z][1], AV[y2][0], AV[y2][1], AV[y2][2], AV[y2][3], 0);
            if (cov > sz[z][0] * sz[z][1] * def.avoidMax) res = null;
          }
        }
        if (res || k === tries.length - 1) { apply(res, A, sz, w, h, use); mode = one ? 'one' : 'acc'; return; }
      }
    }
    function apply(res, A, sz, w, h, use) {
      for (var u = 0; u < use.length; u++) {
        var i = use[u], el = tags[i], r = res[u], a = A[u], tw = sz[u][0], th = sz[u][1], sd = r[2], tail, ox, oy;
        if (sd === 't' || sd === 'b') {
          var tx = a[0] - r[0], edge = sd === 't' ? r[1] + th : r[1];
          tail = !r[3] && tx > 12 && tx < tw - 12 && Math.abs(edge - a[1]) < 34;
          ox = clamp(tx, 12, tw - 12); oy = sd === 't' ? th : 0;
          el.style.setProperty('--tx', f(ox) + 'px');
        } else {
          var ty = a[1] - r[1], edge2 = sd === 'l' ? r[0] + tw : r[0];
          tail = !r[3] && ty > 10 && ty < th - 10 && Math.abs(edge2 - a[0]) < 34;
          oy = clamp(ty, 10, th - 10); ox = sd === 'l' ? tw : 0;
          el.style.setProperty('--ty', f(oy) + 'px');
        }
        el.className = 'scn-tag scn-s' + sd + (tail ? '' : ' scn-nt');
        el.style.left = f(r[0] / w * 100) + '%';
        el.style.top = f(r[1] / h * 100) + '%';
        el.style.transformOrigin = f(ox) + 'px ' + f(oy) + 'px';
        el._t = el._o = null;
      }
    }
    function tagFrame(p) {
      var n = tags.length;
      for (var i = 0; i < n; i++) {
        var el = tags[i], a = TAT[i], k = remap(p, a, a + 0.075), out = 0;
        if (mode === 'one' && i < n - 1 && !el._fx) { var nx = TAT[i + 1]; out = remap(p, nx - 0.035, nx - 0.005); }
        if (TU && TU[i] != null) out = Math.max(out, remap(p, TU[i] - 0.035, TU[i]));
        var sp = spring(k), o = clamp(k * 4, 0, 1) * (1 - out);
        var tf = 'translate3d(0,' + f((1 - sp) * 10 - out * 6) + 'px,0) rotate(' + f((el._cp ? 0 : (i % 2 ? 1.1 : -1.1)) + (1 - sp) * -8) + 'deg) scale(' + f(0.5 + 0.5 * sp - out * 0.08) + ')';
        if (el._t !== tf) { el._t = tf; el.style.transform = tf; }
        o = Math.round(o * 1000) / 1000;
        if (el._o !== o) { el._o = o; el.style.opacity = o; el.style.visibility = o > 0 ? 'visible' : 'hidden'; }
      }
    }
    function render(p) { def.frame(p, S); tagFrame(p); }
    function resize() {
      if (dead) return;
      var w = stage.clientWidth, h = stage.clientHeight;
      if (!w || !h || (w === w0 && h === h0)) return;
      w0 = w; h0 = h;
      var c = pick(w, h);
      if (c !== comp) build(c);
      /* very wide stages: trim empty sky/foreground (L.crop = [maxTop, maxBottom]) so the art can grow */
      var L = S.L, vb = L.vb, cr = L.crop || [0, 0], need = vb[1] - vb[0] * h / w, cut = clamp(need, 0, cr[0] + cr[1]);
      var top = cut > 0 ? cut * cr[0] / (cr[0] + cr[1]) : 0;
      S.view = [0, top, vb[0], vb[1] - cut];
      /* the front (grass) layer rides on the visible bottom edge instead of being half-cropped away */
      S.fy = f(top + vb[1] - cut - vb[1]);
      root.firstChild.setAttribute('viewBox', S.view.join(' '));
      layout(w, h);
      render(last);
    }
    function update(p) {
      if (dead || !S) return;
      p = reduced ? 1 : clamp(+p || 0, 0, 1);
      last = p;
      render(p);
    }
    build(pick(stage.clientWidth || 1200, stage.clientHeight || 600));
    resize();
    render(last);
    if (window.ResizeObserver) {
      ro = new ResizeObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(resize); });
      ro.observe(stage);
    }
    return {
      update: update,
      resize: function () { w0 = -1; resize(); },
      destroy: function () {
        dead = true; cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        if (root.parentNode) root.parentNode.removeChild(root);
        S = null;
      }
    };
  }

  /* =====================================================================
     1. APPROACH (home) - traveller + partner walk four stops
     ===================================================================== */
  var APPROACH = {
    key: 'approach',
    eyebrow: 'How we work',
    title: 'Our <em class="it">approach</em>',
    lede: 'When it comes to leadership development and creating enabling cultures and environments, every client experiences a different problem. With every client, we find a unique solution that gives them a competitive edge.',
    chapters: [
      { at: 0, label: 'We partner in the process', short: 'We do not treat our clients as clients, but as partners.', text: 'We do not treat our clients as clients, but as partners. We get intentionally & heartily involved in the intricacies; we walk alongside you through the challenges you are facing & celebrate with you when the solutions are successful.' },
      { at: 0.27, label: 'We think outside the box', short: 'We approach our work as artists.', text: 'We approach our work as artists and are constantly pushing ourselves to reimagine what the possibilities could be. We provide fresh perspectives and insights and bring creativity and imagination to our work.' },
      { at: 0.52, label: 'We are committed to the delta', short: 'The experiences we co-create with our clients are driven by the north star of transformation and impact.', text: 'The experiences we co-create with our clients are driven by the north star of transformation and impact. We are intentional about creating experiences that optimize for the desired outcomes.' },
      { at: 0.77, label: 'We build transformative experiences', short: 'We believe that transformation happens best in thoughtfully crafted experiences.', text: 'We believe that transformation happens best in thoughtfully crafted experiences. We have spent years mastering the art of creating spaces that are highly engaging and lead to deep human connections. The experiences we design are memorable, purpose-driven, holistic and, as a result, transformative.' }
    ],
    tagAt: [0.07, 0.31, 0.58, 0.83],
    tagC: [TEAL, GOLD, CORAL, TEAL],
    avoidW: 600,
    layouts: {
      L: {
        vb: [1200, 600], crop: [20, 90], fs: 1.3, sky: [0, 470],
        trail: [[46, 504], [110, 494], [180, 478], [290, 470], [385, 468], [490, 472], [600, 456], [850, 386], [712, 306], [800, 228], [780, 172], [860, 300], [940, 432], [1000, 474], [1034, 476], [1070, 477]],
        stops: [2, 4, 10, 14],
        sunPath: [[330, 100], [210, 190], [100, 320], [30, 470]], sunR: 34,
        stars: [[620, 60, 0.8], [700, 140, 0.55], [950, 70, 0.9], [1060, 150, 0.6], [880, 44, 0.5], [1150, 56, 0.7], [520, 130, 0.5]],
        clouds: [[250, 120, 1], [560, 82, 0.8], [1010, 170, 0.85]],
        hills: ['M-900 470C-600 380-300 340 0 390C180 420 300 330 470 340C640 350 700 300 860 330C1020 360 1150 300 1330 350C1550 410 1800 380 2100 420V1000H-900Z',
          'M-900 470C-500 420-200 450 80 420C260 400 380 440 560 430C800 416 1000 440 1180 410C1400 380 1700 430 2100 440V1000H-900Z'],
        ground: 'M-900 458C-500 446-100 466 200 452C450 442 700 452 1000 446C1300 442 1600 460 2100 452V1400H-900Z',
        mtn: [580, 470, 980, 470, 780, 150],
        box: [458, 466], star: [780, 66], fire: [1102, 474], arch: [1012, 476, 1102, 190, 1192, 476],
        seat: [[1086, 454, 0.8, TEAL_T], [1126, 452, 0.8, CORAL], [1140, 482, 1, GOLD], [1172, 477, 1, PEACH]], seatBack: 2,
        front: [['t', 50, 580, 1.4], ['t', 230, 592, 1.2], ['f', 330, 576, 1.3], ['t', 520, 596, 1.5], ['s', 610, 590, 1.1], ['t', 700, 584, 1.2], ['f', 790, 590, 1.2], ['t', 905, 594, 1.4], ['t', 1080, 588, 1.3], ['f', 1185, 592, 1.2], ['s', 420, 592, 0.9]],
        tags: [{ a: [180, 418], p: 'tl' }, { a: [458, 330], p: 'tlr' }, { a: [780, 66], p: 'rlb' }, { a: [1102, 330], p: 'tl' }],
        avoid: [[580, 150, 400, 320], [405, 330, 80, 140], [1010, 330, 190, 150], [730, 22, 100, 96], [130, 420, 110, 70], [96, 170, 170, 150]]
      },
      P: {
        vb: [600, 720], fs: 1.25, sky: [0, 480],
        trail: [[38, 690], [84, 682], [130, 666], [260, 666], [385, 660], [500, 652], [560, 600], [530, 524], [420, 494], [262, 470], [440, 400], [322, 322], [372, 256], [360, 214], [298, 300], [242, 400], [198, 486], [152, 496], [104, 499]],
        stops: [2, 4, 13, 17],
        sunPath: [[150, 110], [80, 250], [24, 430]], sunR: 30,
        stars: [[300, 60, 0.7], [440, 150, 0.55], [520, 56, 0.8], [200, 170, 0.5], [565, 210, 0.6], [250, 40, 0.5]],
        clouds: [[150, 150, 0.8], [500, 270, 0.7]],
        hills: ['M-900 480C-500 400-200 380 0 400C150 412 260 360 400 372C520 382 600 350 760 380C1000 420 1300 400 1500 430V1000H-900Z',
          'M-900 490C-400 450-100 470 120 450C260 438 380 462 520 452C700 440 900 460 1500 470V1000H-900Z'],
        ground: 'M-900 488C-500 476-200 496 60 484C200 476 400 490 600 482C900 474 1200 492 1500 486V1400H-900Z',
        mtn: [180, 500, 540, 500, 360, 205],
        box: [452, 654], star: [360, 100], fire: [66, 496], arch: [12, 500, 66, 250, 120, 500],
        seat: [[46, 476, 0.8, TEAL_T], [88, 474, 0.8, CORAL], [26, 504, 1, GOLD]], seatBack: 2,
        front: [['t', 30, 712, 1.3], ['f', 140, 716, 1.2], ['t', 250, 714, 1.2], ['s', 330, 716, 1], ['t', 420, 716, 1.4], ['f', 480, 712, 1.2], ['t', 590, 708, 1.2]],
        tags: [{ a: [130, 598], p: 'tr' }, { a: [462, 512], p: 'tl' }, { a: [360, 100], p: 'lrb' }, { a: [66, 372], p: 'tr' }],
        avoid: [[180, 205, 360, 295], [420, 520, 64, 134], [10, 370, 120, 134], [320, 60, 80, 80], [90, 600, 90, 70]]
      }
    },
    svg: function (L, id) {
      var o = [], i, m = L.mtn, ar = L.arch;
      o.push('<defs>' + skyGrad(id, L.sky[0], L.sky[1]) + defsCommon(id) +
        '<path id="' + id + '-pn" d="M-7 0L7 0L0 13Z"' + O15 + '/></defs>');
      /* back layer */
      o.push('<g data-k="back"><rect x="-1600" y="-1200" width="4400" height="3000" fill="url(#' + id + '-sky)"/>');
      o.push('<rect data-k="dusk" x="-1600" y="-1200" width="4400" height="3000" fill="' + DUSK + '" opacity="0"/>');
      o.push('<g data-k="stars" opacity="0">' + L.stars.map(function (s) { return use(id, 'spk', tl(s[0], s[1]) + sc(s[2])); }).join('') + '</g>');
      o.push('<path data-k="sunp" d="' + crPath(L.sunPath) + '" fill="none" stroke="none"/>');
      o.push('<g data-k="sun"><circle r="' + (L.sunR + 14) + '" fill="' + GOLD + '" opacity=".18"/><circle r="' + L.sunR + '" fill="' + GOLD + '"' + O + '/></g>');
      o.push(L.clouds.map(function (c) { return use(id, 'cloud', tl(c[0], c[1]) + sc(c[2])); }).join(''));
      o.push('<path d="M640 120c6-6 12-6 18 0c6-6 12-6 18 0M700 96c5-5 10-5 15 0c5-5 10-5 15 0" fill="none"' + O15 + '/>');
      o.push('<path d="' + L.hills[0] + '" fill="' + HILL_FAR + '"' + O + '/><path d="' + L.hills[1] + '" fill="' + HILL_NEAR + '"' + O + '/></g>');
      /* mid layer */
      o.push('<g data-k="mid"><path d="' + L.ground + '" fill="' + GROUND + '"' + O + '/>');
      var mx = m[4] + 20, sa = 0.22;
      o.push('<path d="M' + (m[0] + 8) + ' ' + (m[1] + 6) + 'L' + (m[4] + 8) + ' ' + (m[5] + 6) + 'L' + (m[2] + 8) + ' ' + (m[3] + 6) + 'Z" fill="' + INK + '"/>');
      o.push('<path d="M' + m[0] + ' ' + m[1] + 'L' + m[4] + ' ' + m[5] + 'L' + mx + ' ' + m[1] + 'Z" fill="' + GOLD_T + '"' + O + '/>');
      o.push('<path d="M' + mx + ' ' + m[1] + 'L' + m[4] + ' ' + m[5] + 'L' + m[2] + ' ' + m[3] + 'Z" fill="' + CORAL_T + '"' + O + '/>');
      var lx = lerp(m[4], m[0], sa), ly = lerp(m[5], m[1], sa), rx = lerp(m[4], m[2], sa), ry = lerp(m[5], m[3], sa);
      o.push('<path d="M' + f(lx) + ' ' + f(ly) + 'L' + m[4] + ' ' + m[5] + 'L' + f(rx) + ' ' + f(ry) + 'L' + f(m[4] + 14) + ' ' + f(ry - 12) + 'L' + f(m[4] + 2) + ' ' + f(ly + 4) + 'L' + f(m[4] - 12) + ' ' + f(ly - 10) + 'Z" fill="' + PAPER + '"' + O + '/>');
      var hh = (m[1] - m[5]);
      o.push('<path d="M' + f(lerp(mx, m[2], 0.45)) + ' ' + f(m[1] - hh * 0.18) + 'l' + f(hh * 0.05) + ' ' + f(hh * 0.08) + 'M' + f(lerp(mx, m[2], 0.6)) + ' ' + f(m[1] - hh * 0.06) + 'l' + f(hh * 0.05) + ' ' + f(hh * 0.08) + 'M' + f(lerp(mx, m[2], 0.25)) + ' ' + f(m[1] - hh * 0.4) + 'l' + f(hh * 0.05) + ' ' + f(hh * 0.08) + '" fill="none"' + O15 + '/>');
      o.push('<g data-k="flag" transform="' + tl(m[4], m[5] + 2) + ' scale(0)"><path d="M0 0V-40" fill="none"' + O + '/><path d="M0 -40L26 -33L0 -26Z" fill="' + CORAL + '"' + O + '/></g>');
      /* north star */
      o.push('<g data-k="star" transform="' + tl(L.star[0], L.star[1]) + ' scale(0)"><circle data-k="sglow" r="46" fill="' + GOLD + '" opacity="0"/>' +
        '<path d="M0-22V-36M0 22V36M-22 0H-36M22 0H36M-16-16L-24-24M16 16L24 24M16-16L24-24M-16 16L-24 24" fill="none"' + O15 + '/>' +
        '<path d="M0 -28L6 -6L28 0L6 6L0 28L-6 6L-28 0L-6 -6Z" fill="' + GOLD + '"' + O + '/></g>');
      /* trail */
      o.push('<path data-k="trail" d="' + crPath(L.trail) + '" fill="none" stroke="' + INK + '" stroke-opacity=".38" stroke-width="2.4" stroke-dasharray="1 9" stroke-linecap="round"/>');
      o.push('<path data-k="prog" d="' + crPath(L.trail) + '" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"' + DR + '/>');
      /* box -> lightbulb */
      o.push('<g transform="' + tl(L.box[0], L.box[1]) + '"><path d="M-26 -42H38V8H-26Z" fill="' + INK + '"/>' +
        '<g data-k="bulb"><g transform="translate(0 -22)"><g transform="translate(0 -16)"><g data-k="rays" opacity="0"><path d="M0-22V-34M0 22V30M-22 0H-34M22 0H34M-16-16L-25-25M16-16L25-25M-16 16L-23 23M16 16L23 23" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/></g></g>' +
        '<path d="M-6 0H6V8H-6Z" fill="' + PAPER2 + '"' + O15 + '/><circle cy="-16" r="15" fill="' + PAPER + '"' + O + '/><circle data-k="bulbOn" cy="-16" r="15" fill="' + GOLD + '"' + O + ' opacity="0"/><path d="M-4 -2L-4 -12L0 -16L4 -12L4 -2" fill="none"' + O15 + '/></g></g>' +
        '<g transform="translate(-30 -48)"><path data-k="fl" d="M0 0H30V-6H0Z" fill="' + PEACH_T + '"' + O15 + '/></g>' +
        '<g transform="translate(30 -48)"><path data-k="fr" d="M0 0H-30V-6H0Z" fill="' + PEACH_T + '"' + O15 + '/></g>' +
        '<path d="M-30 -48H30V0H-30Z" fill="' + PEACH + '"' + O + '/><path d="M-30 -38H30M-6 -48V-38" fill="none"' + O15 + '/></g>');
      /* gathering: glow, arch with pennants, seats, fire */
      o.push('<ellipse data-k="fglow" cx="' + L.fire[0] + '" cy="' + (L.fire[1] - 14) + '" rx="74" ry="40" fill="' + GOLD + '" opacity="0"/>');
      o.push('<path data-k="arch" d="M' + ar[0] + ' ' + ar[1] + 'Q' + ar[2] + ' ' + ar[3] + ' ' + ar[4] + ' ' + ar[5] + '" fill="none"' + O + DR + '/>');
      var pcol = [CORAL, GOLD, TEAL, PEACH, CORAL, GOLD, TEAL];
      for (i = 0; i < 7; i++) {
        var t = 0.14 + i * 0.12, u = 1 - t, px = u * u * ar[0] + 2 * u * t * ar[2] + t * t * ar[4], py = u * u * ar[1] + 2 * u * t * ar[3] + t * t * ar[5];
        var ang = Math.atan2(2 * u * (ar[3] - ar[1]) + 2 * t * (ar[5] - ar[3]), 2 * u * (ar[2] - ar[0]) + 2 * t * (ar[4] - ar[2])) * 180 / Math.PI;
        o.push(use(id, 'pn', tl(px, py) + ' rotate(' + f(ang) + ') scale(0)', ' data-k="pn' + i + '" fill="' + pcol[i] + '"'));
      }
      var seatSVG = function (s, idx) { return use(id, 'per', tl(s[0], s[1]) + ' scale(0)', ' data-k="se' + idx + '" fill="' + s[3] + '"'); };
      for (i = 0; i < L.seatBack; i++) o.push(seatSVG(L.seat[i], i));
      o.push('<g transform="' + tl(L.fire[0], L.fire[1]) + '"><path d="M-22 -2L20 -12M-20 -12L22 -2" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M-22 -2L20 -12M-20 -12L22 -2" fill="none" stroke="' + BARK + '" stroke-width="3.5" stroke-linecap="round"/>' +
        '<g data-k="flame" transform="scale(0)"><path d="M0 -6C-18 -10-18-34-4-52C-2-38 8-40 6-58C22-40 22-12 0-6Z" fill="' + CORAL + '"' + O + '/><path d="M0 -8C-9 -12-8-24 0-32C2-24 9-24 8-16C8-11 4-8 0-8Z" fill="' + GOLD + '"' + O15 + '/></g></g>');
      for (i = L.seatBack; i < L.seat.length; i++) o.push(seatSVG(L.seat[i], i));
      /* meeting heart */
      o.push('<g data-k="meet" transform="scale(0)"><path d="M0 8C-14 -2-14-14-6-14C-3-14-1-12 0-9C1-12 3-14 6-14C14-14 14-2 0 8Z" fill="' + CORAL + '"' + O15 + '/></g>');
      /* characters */
      o.push(walkerSVG('pt', TEAL, '', '<path d="M-7 -55C-7 -64 7 -64 7 -55Z" fill="' + GOLD + '"' + O15 + '/><path d="M-13 -55H13" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/><path data-k="ptw" d="M7 -32L11 -20" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>'));
      o.push(walkerSVG('tv', CORAL, '<path d="M-16 -36H-8V-18H-16Z" fill="' + GOLD + '"' + O15 + '/>', '<path d="M-8 -37C-3 -34 4 -34 9 -37" fill="none" stroke="' + PEACH + '" stroke-width="3.4" stroke-linecap="round"/>'));
      o.push('</g>');
      /* front layer */
      o.push('<g data-k="front">' + frontSVG(id, L.front) + '</g>');
      return o.join('');
    },
    bind: function (S, L) {
      var q = S.q;
      S.path = mkLut(q.trail);
      S.sun = mkLut(q.sunp);
      var st = L.stops.map(function (k) { return nearestS(S.path, L.trail[k][0], L.trail[k][1]); });
      S.st = st;
      S.K = [[0, 0], [0.1, st[0]], [0.17, st[0]], [0.3, st[1]], [0.41, st[1]], [0.58, st[2]], [0.68, st[2]], [0.84, st[3]], [1, st[3]]];
      S.gap = 27 * L.fs;
      S.pnB = [];
      for (var i = 0; i < 7; i++) S.pnB.push(q['pn' + i].getAttribute('transform').replace(/ scale\([^)]*\)$/, ''));
    },
    frame: function (p, S) {
      var q = S.q, L = S.L, i, k;
      T(q.back, tl((0.5 - p) * 50, 0));
      T(q.front, tl((0.5 - p) * 170, S.fy));
      Op(q.dusk, remap(p, 0.45, 1) * 0.42);
      Op(q.stars, remap(p, 0.62, 0.92));
      var sp = at(S.sun, S.sun.len * smoothstep(remap(p, 0, 0.95)));
      T(q.sun, tl(sp[0], sp[1]));
      /* travellers */
      var s = kf(p, S.K), v = Math.abs(kf(clamp(p + 0.004, 0, 1), S.K) - kf(clamp(p - 0.004, 0, 1), S.K)), amp = clamp(v / 3, 0, 1);
      Draw(q.prog, s / S.path.len);
      var ps = Math.min(S.path.len, Math.max(S.st[0] + S.gap, s + S.gap));
      walk(q, 'pt', S.path, ps, ps > S.st[0] + S.gap + 0.5 ? amp : 0, p < 0.13 ? -1 : null, L.fs);
      walk(q, 'tv', S.path, s, amp, null, L.fs);
      var wv = 1 - remap(p, 0.09, 0.13);
      T(q.ptw, 'rotate(' + f(wv * (-150 + Math.sin(p * 160) * 28) + (1 - wv) * Math.sin(ps / (6.5 * L.fs)) * 18 * amp) + ' 7 -32)');
      var mp = at(S.path, S.st[0] + S.gap * 0.5), mk = spring(remap(p, 0.1, 0.16)) * (1 - smoothstep(remap(p, 0.2, 0.25)));
      T(q.meet, tl(mp[0], mp[1] - 74 * L.fs - mk * 8) + sc(mk * L.fs));
      /* box -> bulb */
      var bo = easeOutBack(remap(p, 0.29, 0.35));
      T(q.fl, 'rotate(' + f(-128 * bo) + ')');
      T(q.fr, 'rotate(' + f(128 * bo) + ')');
      var br = spring(remap(p, 0.31, 0.39)), bob = Math.sin(p * 40) * 2.5 * remap(p, 0.39, 0.45);
      T(q.bulb, tl(0, -br * 92 + bob) + sc(0.55 + 0.45 * br));
      Op(q.bulbOn, remap(p, 0.36, 0.41));
      var rs = spring(remap(p, 0.37, 0.44));
      T(q.rays, sc(rs)); Op(q.rays, rs > 0.01 ? 1 : 0);
      /* delta: flag + north star */
      T(q.flag, tl(L.mtn[4], L.mtn[5] + 2) + sc(spring(remap(p, 0.57, 0.62))));
      var ss = spring(remap(p, 0.58, 0.66)), pulse = 1 + Math.sin(p * 60) * 0.035 * remap(p, 0.66, 0.72);
      T(q.star, tl(L.star[0], L.star[1]) + ' rotate(' + f((1 - ss) * -120) + ')' + sc(ss * pulse));
      Op(q.sglow, remap(p, 0.6, 0.72) * 0.4);
      /* gathering */
      var fs = spring(remap(p, 0.8, 0.87)), fl = 1 + Math.sin(p * 230) * 0.07 * fs;
      T(q.flame, sc(fs, fs * fl));
      Op(q.fglow, remap(p, 0.8, 0.9) * (0.34 + Math.sin(p * 180) * 0.04));
      for (i = 0; i < L.seat.length; i++) {
        var se = L.seat[i]; k = spring(remap(p, 0.83 + i * 0.03, 0.89 + i * 0.03));
        T(q['se' + i], tl(se[0], se[1] + (1 - k) * 6) + sc(se[2] * k * L.fs));
      }
      Draw(q.arch, smoothstep(remap(p, 0.84, 0.95)));
      for (i = 0; i < 7; i++) {
        k = spring(remap(p, 0.86 + i * 0.016, 0.9 + i * 0.016));
        T(q['pn' + i], S.pnB[i] + sc(k));
      }
    }
  };

  /* =====================================================================
     2. STORY (about) - two friends -> the question -> it is possible -> today
     ===================================================================== */
  function planet(L, th, lift) { var r = L.pr + (lift || 0); return [L.pc[0] + r * Math.sin(th), L.pc[1] - r * Math.cos(th)]; }
  function onPlanet(L, th) { var p = planet(L, th); return tl(p[0], p[1]) + ' rotate(' + f(th * 180 / Math.PI) + ')'; }
  var CROWN = [[0, -182, 60, TEAL], [-58, -150, 42, TEAL_T], [58, -152, 44, TEAL_T], [-30, -224, 40, TEAL_T], [32, -226, 42, TEAL]];
  var BADGE = [[-90, -206, 'M-6 6L-5 1L4-8L8-4L-1 5Z'], [0, -290, 'M-8-6H8V4H-1L-6 8V4H-8Z'], [92, -206, 'M-7 5L0-6L7 5Z']];
  var STORY = {
    key: 'story',
    eyebrow: 'How NiaDelta began',
    title: 'Our <em class="it">story</em>',
    lede: 'NiaDelta’s story is about more than just a company; it is about a vision for a world where organisations are spaces where people flourish.',
    chapters: [
      { at: 0, label: 'January 2020', short: 'Two friends working together on a project in Nigeria.', text: 'Two friends working together on a project in Nigeria, with a shared passion for organisational leadership and people development.' },
      { at: 0.24, label: 'The question', short: 'What would the world look like if every human being was flourishing and doing their best work?', text: 'What would the world look like if every human being was flourishing and doing their best work? They envisioned creating an organisation that enables human flourishing.' },
      { at: 0.54, label: 'The hypothesis', short: 'It is possible.', text: 'With a simple yet audacious hypothesis—It is possible—NiaDelta was born.' },
      { at: 0.79, label: 'Today', short: 'Purposeful, enduring culture shifts.', text: 'Today, we blend our design and facilitation expertise with organisational development to create purposeful, enduring culture shifts.' }
    ],
    tagAt: [0.04, 0.3, 0.6, 0.84],
    tagC: [GOLD, CORAL, TEAL, GOLD],
    layouts: {
      L: {
        vb: [1200, 600], crop: [70, 50], pc: [600, 2460], pr: 2000, sky: [0, 470],
        friends: -0.14, fs: 1.62, bubbles: [[364, 360, 6], [388, 314, 9], [414, 262, 13]],
        cloud: [452, 182, 1.9], tree: 0.1, ts: 1,
        seedMid: [[600, 196], [740, 290]],
        sunPath: [[1010, 620], [1010, 420], [985, 196]], sunR: 54,
        figs: [-0.28, -0.22, -0.075, 0.0, 0.185, 0.235, 0.285], figS: 1.2,
        moon: [130, 112], stars: [[90, 210, 0.6], [236, 104, 0.8], [560, 94, 0.6], [700, 136, 0.7], [870, 104, 0.9], [1040, 114, 0.6], [1150, 200, 0.7], [640, 196, 0.5], [330, 160, 0.5]], orb: 0.19,
        clouds: [[780, 120, 0.7], [1100, 300, 0.6], [124, 300, 0.55]],
        front: [['t', 40, 588, 1.4], ['f', 150, 594, 1.2], ['t', 360, 596, 1.3], ['t', 560, 590, 1.2], ['f', 640, 596, 1.1], ['t', 900, 594, 1.4], ['s', 1010, 596, 1], ['t', 1160, 588, 1.3]],
        tags: [{ a: [300, 340], p: 'tl' }, { a: [452, 96], p: 'rlt' }, { a: [800, 300], p: 'lrt' }, { a: [1076, 400], p: 'tl' }],
        avoid: [[190, 330, 250, 170], [300, 90, 305, 125], [690, 200, 220, 280], [920, 130, 110, 110]]
      },
      P: {
        vb: [600, 720], pc: [300, 2580], pr: 2000, sky: [0, 580],
        friends: -0.09, fs: 1.25, bubbles: [[162, 486, 5], [184, 440, 8], [210, 384, 11], [238, 318, 14]],
        cloud: [300, 196, 1.5], tree: 0.08, ts: 0.95,
        seedMid: [[400, 260], [455, 420]],
        sunPath: [[560, 780], [560, 520], [520, 262]], sunR: 44,
        figs: [-0.142, -0.03, 0.017, 0.142], figS: 1.05,
        moon: [80, 92], stars: [[44, 210, 0.6], [200, 60, 0.7], [420, 70, 0.6], [540, 150, 0.7], [480, 46, 0.5], [130, 300, 0.5]], orb: 0.135,
        clouds: [[520, 110, 0.55], [96, 400, 0.5]],
        front: [['t', 30, 712, 1.3], ['f', 150, 716, 1.2], ['t', 300, 714, 1.2], ['s', 420, 716, 1], ['t', 560, 712, 1.3]],
        tags: [{ a: [118, 476], p: 'tr' }, { a: [300, 126], p: 'tb' }, { a: [460, 340], p: 'ltb' }, { a: [580, 520], p: 'tl' }],
        avoid: [[24, 480, 196, 130], [176, 126, 248, 112], [360, 300, 200, 290], [460, 210, 110, 110]]
      }
    },
    svg: function (L, id) {
      var o = [], i;
      var cs = L.cloud[2], seed0 = [L.cloud[0], L.cloud[1] + 6 * cs * 1.08];
      var tb = planet(L, L.tree);
      o.push('<defs>' + skyGrad(id, L.sky[0], L.sky[1]) + defsCommon(id) +
        '<path id="' + id + '-seed" d="M0-5C3-2 4.5 1 4.5 3C4.5 6.5-4.5 6.5-4.5 3C-4.5 1-3-2 0-5Z" fill="' + GOLD + '"' + O15 + '/></defs>');
      /* back */
      o.push('<g data-k="back"><rect x="-1600" y="-1200" width="4400" height="3000" fill="url(#' + id + '-sky)"/>');
      o.push('<rect data-k="night" x="-1600" y="-1200" width="4400" height="3000" fill="' + NIGHT + '" opacity=".6"/>');
      o.push('<g data-k="stars">' + L.stars.map(function (s) { return use(id, 'spk', tl(s[0], s[1]) + sc(s[2]), ' fill="' + PAPER + '"'); }).join('') +
        '<path transform="' + tl(L.moon[0], L.moon[1]) + '" d="M2 -22A22 22 0 1 0 20 12A17 17 0 1 1 2 -22Z" fill="' + PAPER2 + '"' + O + '/></g>');
      o.push('<path data-k="sunp" d="' + crPath(L.sunPath) + '" fill="none" stroke="none"/>');
      o.push('<g data-k="sun"><g data-k="srays"><path d="' + (function () { var d = ''; for (var j = 0; j < 12; j++) { var a = j * Math.PI / 6, r0 = L.sunR + 10, r1 = L.sunR + 24; d += 'M' + f(Math.cos(a) * r0) + ' ' + f(Math.sin(a) * r0) + 'L' + f(Math.cos(a) * r1) + ' ' + f(Math.sin(a) * r1); } return d; })() + '" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/></g><circle r="' + L.sunR + '" fill="' + GOLD + '"' + O + '/></g>');
      o.push(L.clouds.map(function (c) { return use(id, 'cloud', tl(c[0], c[1]) + sc(c[2])); }).join('') + '</g>');
      /* mid */
      o.push('<g data-k="mid"><circle cx="' + L.pc[0] + '" cy="' + L.pc[1] + '" r="' + L.pr + '" fill="' + GROUND + '"' + O + '/>');
      var orr = L.pr - 46, oa = Math.sin(L.orb) * orr, ob = L.pc[1] - Math.cos(L.orb) * orr;
      o.push('<path d="M' + f(L.pc[0] - oa) + ' ' + f(ob) + 'A' + orr + ' ' + orr + ' 0 0 1 ' + f(L.pc[0] + oa) + ' ' + f(ob) + '" fill="none" stroke="' + TEAL + '" stroke-opacity=".35" stroke-width="2" stroke-dasharray="2 10" stroke-linecap="round"/>');
      /* friends at the table */
      var fh = function (k, x, body, eye) {
        return '<g data-k="' + k + '"><path d="M' + (x - 12) + ' -20C' + (x - 14) + ' -40 ' + (x - 8) + ' -50 ' + x + ' -50C' + (x + 8) + ' -50 ' + (x + 14) + ' -40 ' + (x + 12) + ' -20Z" fill="' + body + '"' + O + '/>' +
          '<circle cx="' + x + '" cy="-60" r="9" fill="' + PAPER + '"' + O + '/><circle cx="' + (x + eye) + '" cy="-61" r="1.6" fill="' + INK + '"/><circle cx="' + (x + eye * 2.3) + '" cy="-61" r="1.6" fill="' + INK + '"/></g>';
      };
      o.push('<g transform="' + onPlanet(L, L.friends) + sc(L.fs) + '">' +
        /* warm pool of lamp light: the one bright spot of the night */
        '<circle data-k="lglow" cx="-20" cy="-50" r="120" fill="url(#g-glow)" opacity="1"/>' +
        '<path data-k="cone" d="M-31 -71H-13L6 -38H-50Z" fill="' + GOLD + '" opacity=".5"/>' +
        '<path d="M-72 -20H-44V0M-58 -20V0M72 -20H44V0M58 -20V0" fill="none"' + O + '/>' +
        '<path d="M-30 -36L-32 0M30 -36L32 0" fill="none"' + O + '/>' +
        fh('fa', -58, TEAL, 2.4) + fh('fb', 58, CORAL, -2.4) +
        '<path d="M-48 -36L-30 -40M48 -36L30 -40" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M-42 -42H42V-35H-42Z" fill="' + PEACH + '"' + O + '/>' +
        '<path d="M-4 -42L0 -60H22L18 -42Z" fill="' + PAPER2 + '"' + O15 + '/><path d="M-30 -45H-14" fill="none" stroke="' + PAPER + '" stroke-width="3"/>' +
        '<path d="M-22 -42L-20 -70" fill="none"' + O15 + '/><path d="M-31 -70H-13L-17 -80H-27Z" fill="' + GOLD + '"' + O15 + '/></g>');
      /* thought bubbles + cloud with question mark */
      L.bubbles.forEach(function (b, j) { o.push('<circle data-k="bb' + j + '" r="' + b[2] + '" fill="' + PAPER + '"' + O + ' transform="' + tl(b[0], b[1]) + ' scale(0)"/>'); });
      o.push('<g data-k="cloud" transform="' + tl(L.cloud[0], L.cloud[1]) + ' scale(0)">' + use(id, 'cloud', 'translate(5 5)', ' fill="' + INK + '"') +
        '<path d="M-60 16C-78 16-80-6-62-10C-64-30-36-36-26-20C-20-40 14-44 22-22C36-34 62-24 58-4C76-2 76 16 60 16Z" fill="' + PAPER + '"' + O + '/>' +
        '<path data-k="qm" d="M-9 -24C-9 -36 10 -36 10 -24C10 -15 0 -14 0 -4" fill="none" stroke="' + CORAL + '" stroke-width="5" stroke-linecap="round"' + DR + '/>' +
        use(id, 'seed', 'translate(0 6) scale(0)', ' data-k="qd"') + '</g>');
      /* seed path + seed */
      o.push('<path data-k="seedp" d="' + crPath([seed0].concat(L.seedMid, [[f(tb[0]), f(tb[1] - 4)]])) + '" fill="none" stroke="none"/>');
      o.push(use(id, 'seed', 'scale(0)', ' data-k="seed"'));
      /* tree */
      var tr = onPlanet(L, L.tree) + sc(L.ts);
      o.push('<g transform="' + tr + '">');
      o.push('<g data-k="sprout"><path data-k="stem" d="M0 0C0 -10-2 -20 0 -30" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"' + DR + '/>' +
        '<g data-k="lvs" transform="translate(0 -28) scale(0)"><path d="M0 0C-8-8-18-6-22 0C-14 6-6 6 0 0Z" fill="' + TEAL + '"' + O15 + '/><path d="M0 0C8-10 18-8 22-2C14 5 6 5 0 0Z" fill="' + TEAL_T + '"' + O15 + '/></g></g>');
      o.push('<g data-k="trunk" transform="scale(0)"><path d="M-11 0C-8-40-12-90-7-150H7C12-90 8-40 11 0Z" fill="' + BARK + '"' + O + '/><path d="M-4-96C-22-112-36-124-50-146M3-110C18-124 32-136 44-160" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/></g>');
      o.push('<g data-k="crown">');
      CROWN.forEach(function (c, j) { o.push('<circle data-k="cr' + j + '" r="' + c[2] + '" fill="' + c[3] + '"' + O + ' transform="' + tl(c[0], c[1]) + ' scale(0)"/>'); });
      o.push('<g data-k="fruit" opacity="0"><circle cx="-22" cy="-170" r="6" fill="' + GOLD + '"' + O15 + '/><circle cx="30" cy="-198" r="6" fill="' + CORAL + '"' + O15 + '/><circle cx="-50" cy="-142" r="5" fill="' + GOLD + '"' + O15 + '/><circle cx="56" cy="-140" r="5" fill="' + PEACH + '"' + O15 + '/></g>');
      BADGE.forEach(function (b, j) { o.push('<g data-k="bd' + j + '" transform="' + tl(b[0], b[1]) + ' scale(0)"><circle r="17" fill="' + PAPER + '"' + O + '/><path d="' + b[2] + '" fill="' + [GOLD, PEACH, TEAL_T][j] + '"' + O15 + '/></g>'); });
      o.push('</g></g>');
      /* branches out to people around the globe */
      var cc = rot(0, -182 * L.ts, L.tree); cc = [tb[0] + cc[0], tb[1] + cc[1]];
      L.figs.forEach(function (th, j) {
        var hp = planet(L, th), hd = rot(0, -46 * L.figS, th); hd = [hp[0] + hd[0], hp[1] + hd[1]];
        var dx = hd[0] - cc[0], dy = hd[1] - cc[1], dl = Math.sqrt(dx * dx + dy * dy), sx = cc[0] + dx / dl * 62 * L.ts, sy = cc[1] + dy / dl * 62 * L.ts;
        var mx = (sx + hd[0]) / 2, my = Math.min(sy, hd[1]) - 60 - Math.abs(dx) * 0.12;
        o.push('<path data-k="br' + j + '" d="M' + f(sx) + ' ' + f(sy) + 'Q' + f(mx) + ' ' + f(my) + ' ' + f(hd[0]) + ' ' + f(hd[1]) + '" fill="none" stroke="' + TEAL + '" stroke-width="2" stroke-linecap="round"' + DR + '/>');
      });
      var fc = [CORAL, GOLD, TEAL_T, PEACH, CORAL, TEAL, GOLD];
      L.figs.forEach(function (th, j) { o.push('<g transform="' + onPlanet(L, th) + '">' + use(id, 'per', 'scale(0)', ' data-k="fg' + j + '" fill="' + fc[j % fc.length] + '"') + '</g>'); });
      o.push('</g>');
      o.push('<g data-k="front">' + frontSVG(id, L.front) + '</g>');
      return o.join('');
    },
    bind: function (S) {
      S.sun = mkLut(S.q.sunp);
      S.seed = mkLut(S.q.seedp);
    },
    frame: function (p, S) {
      var q = S.q, L = S.L, i, k;
      T(q.back, tl((0.5 - p) * 40, 0));
      T(q.front, tl((0.5 - p) * 150, S.fy));
      var night = 1 - smoothstep(remap(p, 0.5, 0.76));
      Op(q.night, night * 0.62); Op(q.stars, night); Op(q.cone, night * 0.5);
      Op(q.lglow, night);
      var su = at(S.sun, S.sun.len * smoothstep(remap(p, 0.54, 0.9)));
      T(q.sun, tl(su[0], su[1])); T(q.srays, 'rotate(' + f(p * 120) + ')');
      T(q.fa, tl(0, Math.sin(p * 70) * 1.4 * (1 - remap(p, 0.4, 0.5))));
      T(q.fb, tl(0, Math.cos(p * 70) * 1.4 * (1 - remap(p, 0.4, 0.5))));
      for (i = 0; i < L.bubbles.length; i++) {
        var b = L.bubbles[i]; k = spring(remap(p, 0.2 + i * 0.022, 0.25 + i * 0.022));
        T(q['bb' + i], tl(b[0], b[1]) + sc(k));
      }
      var ck = spring(remap(p, 0.26, 0.36)), grow = 1 + 0.08 * smoothstep(remap(p, 0.36, 0.46)), drift = smoothstep(remap(p, 0.6, 0.9));
      T(q.cloud, tl(L.cloud[0] - drift * 30, L.cloud[1] - drift * 10) + sc(L.cloud[2] * ck * grow));
      Draw(q.qm, smoothstep(remap(p, 0.31, 0.4)));
      var dk = spring(remap(p, 0.39, 0.43));
      T(q.qd, 'translate(0 6)' + sc(p >= 0.48 ? 0 : dk));
      var sk = remap(p, 0.48, 0.57), sp = at(S.seed, S.seed.len * smoothstep(sk)), land = 1 - remap(p, 0.57, 0.6);
      T(q.seed, tl(sp[0], sp[1]) + ' rotate(' + f(sk * 300) + ')' + sc(p < 0.48 ? 0 : L.cloud[2] * 1.08 * land));
      Draw(q.stem, remap(p, 0.57, 0.61));
      T(q.lvs, 'translate(0 -28)' + sc(spring(remap(p, 0.59, 0.64))));
      Op(q.sprout, 1 - remap(p, 0.66, 0.7));
      T(q.trunk, sc(spring(remap(p, 0.63, 0.73))));
      var cg = 1 + 0.1 * smoothstep(remap(p, 0.76, 0.9));
      T(q.crown, 'translate(0 -182)' + sc(cg) + ' translate(0 182)');
      for (i = 0; i < CROWN.length; i++) {
        var c = CROWN[i]; k = spring(remap(p, 0.66 + i * 0.016, 0.73 + i * 0.016));
        T(q['cr' + i], tl(c[0], c[1]) + sc(k));
      }
      Op(q.fruit, remap(p, 0.74, 0.78));
      for (i = 0; i < 3; i++) {
        k = spring(remap(p, 0.78 + i * 0.03, 0.84 + i * 0.03));
        T(q['bd' + i], tl(BADGE[i][0], BADGE[i][1]) + sc(k / cg));
      }
      for (i = 0; i < L.figs.length; i++) {
        Draw(q['br' + i], smoothstep(remap(p, 0.8 + i * 0.016, 0.9 + i * 0.016)), 0.8);
        k = spring(remap(p, 0.86 + i * 0.016, 0.92 + i * 0.016));
        T(q['fg' + i], sc(k * L.figS));
      }
    }
  };

  /* =====================================================================
     3. VALUES (about) - a delta kite visits five illustrated stations
     ===================================================================== */
  var CONF_COL = [CORAL, GOLD, TEAL, PEACH, CORAL, GOLD, TEAL, INK];
  /* confetti: [angle offset, speed, start rotation, spin, kind, colour]; the burst direction is per layout
     (L.ca) so the pieces always land well inside the frame */
  var CONF = (function () {
    var r = rng(7), out = [];
    for (var i = 0; i < 22; i++) out.push([(r() - 0.5) * 1.5, 70 + r() * 90, r() * 360, (r() - 0.5) * 3, i % 3, CONF_COL[i % CONF_COL.length]]);
    return out;
  })();
  var VALUES = {
    key: 'values',
    eyebrow: 'Our values',
    title: 'What we hold <em class="it">ourselves</em> to',
    lede: 'Five values.<span class="scn-mo"> Scroll to meet them.</span>',
    chapters: [
      { at: 0, label: 'Excellence', short: 'We set a high bar for everything we do.', text: 'We set a high bar for everything we do. We are thorough and strive for perfection.' },
      { at: 0.22, label: 'Creativity', short: 'We approach our work as artists.', text: 'We approach our work as artists. We think outside the box and constantly reimagine what is possible.' },
      { at: 0.42, label: 'Co-creation', short: 'We believe in the power of collaboration.', text: 'We believe in the power of collaboration. We constantly seek opportunities to partner with others in order to learn and grow together.' },
      { at: 0.62, label: 'Service', short: 'We appreciate the importance of serving.', text: 'We appreciate the importance of serving. We seek to provide exceptional service and experience, and we are deeply involved in our work.' },
      { at: 0.82, label: 'Fun and joy', short: 'We believe that doing great work can also be fun.', text: 'We believe that doing great work can also be fun. We aim to bring fun and joy into every experience we put together.' }
    ],
    tagAt: [0.05, 0.25, 0.45, 0.65, 0.85],
    tagC: [GOLD, CORAL, TEAL, PEACH, CORAL],
    avoidMax: 0.1, avoidW: 600,
    layouts: {
      L: {
        vb: [1200, 600], crop: [50, 60], sky: [0, 600], is: 1,
        st: [[150, 432], [375, 330], [600, 432], [825, 330], [1050, 432]],
        kite: [[30, 100], [222, 262], [322, 130], [448, 158], [547, 106], [672, 262], [772, 130], [898, 158], [997, 106], [1122, 262], [1172, 196], [1140, 124], [1074, 150], [1104, 214], [1150, 100]],
        stops: [1, 3, 5, 7, 9], ks: 1, ca: -Math.PI * 0.62,
        sun: [1090, 112, 40], clouds: [[290, 112, 0.9], [700, 108, 0.7], [960, 236, 0.55], [80, 256, 0.6]],
        hills: ['M-900 600C-500 520-200 500 100 548C300 572 450 510 650 526C850 542 1000 506 1200 534C1500 572 1800 540 2100 560V1200H-900Z'],
        petals: [[230, 215], [500, 150], [660, 250], [950, 160], [1100, 300]],
        front: [['t', 30, 592, 1.4], ['f', 120, 598, 1.2], ['t', 480, 598, 1.3], ['t', 760, 596, 1.2], ['f', 1100, 598, 1.2], ['t', 1180, 590, 1.3]],
        /* tags beside the islands: right of the rim on the low ones, right of the bowl tip on the high ones */
        tags: [{ a: [238, 436], p: 'r' }, { a: [428, 390], p: 'rb' }, { a: [688, 436], p: 'r' }, { a: [878, 390], p: 'rb' }, { a: [962, 436], p: 'l' }],
        /* station art + rim, and the narrow lower bowl, per island */
        avoid: [[70, 281, 166, 185], [105, 466, 96, 39], [295, 177, 166, 187], [330, 364, 96, 39], [520, 302, 166, 164], [555, 466, 96, 39],
          [745, 223, 166, 141], [780, 364, 96, 39], [970, 367, 166, 99], [1005, 466, 96, 39]]
      },
      P: {
        vb: [600, 720], sky: [0, 720], is: 0.85,
        st: [[150, 180], [450, 300], [150, 420], [450, 540], [170, 662]],
        kite: [[556, 150], [70, 60], [300, 118], [530, 182], [300, 240], [70, 300], [300, 360], [530, 422], [300, 478], [64, 540], [300, 600], [470, 604], [520, 656], [454, 690], [420, 640], [554, 592]],
        stops: [1, 3, 5, 7, 9], ks: 0.9, ca: -Math.PI * 0.38,
        sun: [520, 64, 30], clouds: [[420, 104, 0.55], [130, 560, 0.5]],
        hills: ['M-900 720C-500 680-200 660 60 690C220 708 380 660 600 676C900 698 1200 680 1500 700V1200H-900Z'],
        petals: [[300, 130], [300, 372], [330, 640], [230, 262], [380, 500]],
        front: [['t', 30, 716, 1.2], ['f', 300, 718, 1.1], ['t', 580, 714, 1.2]],
        tags: [{ a: [232, 150], p: 'rbt' }, { a: [368, 270], p: 'lbt' }, { a: [232, 390], p: 'rbt' }, { a: [368, 510], p: 'lbt' }, { a: [252, 640], p: 'rt' }],
        avoid: [[82, 90, 136, 150], [382, 210, 136, 150], [82, 330, 136, 150], [382, 450, 136, 150], [100, 540, 140, 180]]
      }
    },
    svg: function (L, id) {
      var o = [], i;
      o.push('<defs>' + skyGrad(id, L.sky[0], L.sky[1]) + defsCommon(id) +
        '<g id="' + id + '-isl"><path d="M-78 4C-66 34-30 60 0 68C30 60 66 34 78 4Z" fill="' + INK + '" transform="translate(6 5)"/><path d="M-78 2C-66 34-30 60 0 68C30 60 66 34 78 2Z" fill="' + HILL_NEAR + '"' + O + '/><path d="M-12 30L-4 44M20 22L26 34M-40 18L-32 28" fill="none"' + O15 + '/><path d="M-80 2C-60-12 60-12 80 2C60 14-60 14-80 2Z" fill="' + TEAL_T + '"' + O + '/></g>' +
        '<path id="' + id + '-cr" d="M-4-2.5H4V2.5H-4Z"' + O15 + '/><circle id="' + id + '-cc" r="3.2"' + O15 + '/><path id="' + id + '-cq" d="M-5 0C-3-4-1 4 1 0S5-4 5 0" fill="none" stroke-width="3" stroke-linecap="round"/>' +
        '<path id="' + id + '-pt" d="M0-6C5-6 7 0 0 6C-7 0-5-6 0-6Z" fill="' + PEACH + '"' + O15 + '/></defs>');
      o.push('<g data-k="back"><rect x="-1600" y="-1200" width="4400" height="3000" fill="url(#' + id + '-sky)"/>');
      o.push('<g transform="' + tl(L.sun[0], L.sun[1]) + '"><circle r="' + (L.sun[2] + 14) + '" fill="' + GOLD + '" opacity=".2"/><circle r="' + L.sun[2] + '" fill="' + GOLD + '"' + O + '/></g>');
      o.push(L.clouds.map(function (c) { return use(id, 'cloud', tl(c[0], c[1]) + sc(c[2])); }).join(''));
      o.push('<path d="' + L.hills[0] + '" fill="' + HILL_FAR + '"' + O + '/></g>');
      o.push('<g data-k="mid">');
      o.push('<path data-k="kp" d="' + crPath(L.kite) + '" fill="none" stroke="' + INK + '" stroke-opacity=".3" stroke-width="2" stroke-dasharray="1 9" stroke-linecap="round"/>');
      var ST = [
        /* 1 Excellence: pedestal, star polished to gold, sparkles */
        '<path d="M-24 0L-20-26H20L24 0Z" fill="' + PAPER2 + '"' + O + '/><path d="M-27-26H27V-33H-27Z" fill="' + PEACH + '"' + O + '/>' +
        '<g data-k="xs" transform="translate(0 -64)"><path d="' + star5(30, 13) + '" fill="' + GREY + '"' + O + '/><path data-k="xg" d="' + star5(30, 13) + '" fill="' + GOLD + '"' + O + ' opacity="0"/></g>' +
        '<path data-k="xc" d="M-15-8C-6-12 6-12 15-8L13 8C4 12-4 12-13 8Z" fill="' + CORAL_T + '"' + O15 + ' opacity="0"/>' +
        use(id, 'spk', 'translate(-40 -96) scale(0)', ' data-k="xk0"') + use(id, 'spk', 'translate(40 -84) scale(0)', ' data-k="xk1"') + use(id, 'spk', 'translate(24 -116) scale(0)', ' data-k="xk2"'),
        /* 2 Creativity: easel, paintbrush draws a stroke */
        '<path d="M-30 0L-18-112M30 0L18-112M2-46L5 0" fill="none"' + O + '/><path d="M-42-118L40-114L38-48L-40-50Z" fill="' + PAPER + '"' + O + '/>' +
        '<path data-k="cs" d="M-28-66C-20-102-6-70 2-92C10-112 20-74 30-98" fill="none" stroke="' + CORAL + '" stroke-width="6" stroke-linecap="round"' + DR + '/>' +
        '<g data-k="cd" transform="scale(0)"><circle cx="-18" cy="-98" r="6" fill="' + GOLD + '"' + O15 + '/><circle cx="18" cy="-60" r="5" fill="' + TEAL + '"' + O15 + '/></g>' +
        '<g data-k="cb"><path d="M0 0C-2-4 0-9 4-10L8-7C7-3 4 0 0 0Z" fill="' + CORAL + '"' + O15 + '/><path d="M4-10L8-7L26-34L22-37Z" fill="' + GOLD + '"' + O15 + '/></g>',
        /* 3 Co-creation: two puzzle pieces join */
        '<g data-k="pa"><path d="M-44-46H0V-32C8-36 14-30 14-24C14-18 8-12 0-16V-2H-44Z" fill="' + TEAL + '"' + O + '/></g>' +
        '<g data-k="pb"><path d="M0-46H44V-2H0V-16C8-12 14-18 14-24C14-30 8-36 0-32Z" fill="' + GOLD + '"' + O + '/></g>' +
        '<g data-k="pz" transform="translate(6 -60) scale(0)"><path d="M0-10V-22M14-6L24-14M-14-6L-24-14" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/><path d="M0 8C-12 0-12-10-5-10C-2-10-1-8 0-6C1-8 2-10 5-10C12-10 12 0 0 8Z" fill="' + CORAL + '"' + O15 + ' transform="translate(0 -30)"/></g>',
        /* 4 Service: an open hand offers a cup, steam rises */
        '<g data-k="sv"><path d="M-76-15H-62V1H-76Z" fill="' + CORAL + '"' + O15 + '/><path d="M-64-11C-40-15-10-17 22-17C33-17 33-6 22-6L-10-4C-30-2-50 0-64 0Z" fill="' + PEACH + '"' + O + '/>' +
        '<path d="M-26-18C-14-14 14-14 26-18" fill="none"' + O + '/><path d="M14-42C26-42 26-28 12-28" fill="none"' + O + '/><path d="M-15-48H15L11-20C4-17-4-17-11-20Z" fill="' + PAPER + '"' + O + '/><path d="M-15-40H15" fill="none" stroke="' + TEAL + '" stroke-width="3"/>' +
        '<path d="M2-11H26M6-6H24" fill="none"' + O15 + '/><path d="M-34-13C-37-25-27-31-21-21L-20-13Z" fill="' + PEACH + '"' + O + '/>' +
        '<path data-k="sm0" d="M-6-54C-12-62 0-68-6-78" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"' + DR + '/><path data-k="sm1" d="M4-54C-2-64 10-70 4-82" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"' + DR + '/><path data-k="sm2" d="M13-54C8-62 18-66 13-74" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"' + DR + '/></g>',
        /* 5 Fun and joy: popper bursts confetti */
        (function () {
          var s = '<g transform="translate(-8 -2) rotate(18)"><g data-k="pp"><path d="M-4 0L-16-44C-6-50 6-50 16-44L4 0Z" fill="' + GOLD + '"' + O + '/><path d="M-11-22L11-22M-14-34L14-34" fill="none" stroke="' + CORAL + '" stroke-width="3"/></g></g><g transform="translate(6 -46)">';
          for (var j = 0; j < CONF.length; j++) {
            var c = CONF[j], nm = ['cr', 'cc', 'cq'][c[4]];
            s += use(id, nm, 'scale(0)', ' data-k="cf' + j + '" fill="' + (c[4] === 2 ? 'none' : c[5]) + '"' + (c[4] === 2 ? ' stroke="' + c[5] + '"' : ''));
          }
          return s + '</g>';
        })()
      ];
      for (i = 0; i < 5; i++) {
        o.push('<g data-k="st' + i + '" transform="' + tl(L.st[i][0], L.st[i][1]) + sc(L.is) + '">' + use(id, 'isl') + '<g transform="scale(1.3)">' + ST[i] + '</g></g>');
      }
      /* kite */
      o.push('<polyline data-k="tail" points="0,0 0,0" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>');
      for (i = 0; i < 3; i++) o.push('<path data-k="bw' + i + '" d="M-6-4L6 4V-4L-6 4Z" fill="' + [TEAL, GOLD, CORAL][i] + '"' + O15 + '/>');
      o.push('<g data-k="kite"><g transform="scale(' + L.ks + ')"><path d="M0-28L-19 6L0 15Z" fill="' + CORAL + '"' + O + '/><path d="M0-28L19 6L0 15Z" fill="' + GOLD + '"' + O + '/><path d="M-19 6H19M0-28V15" fill="none"' + O15 + '/></g></g>');
      o.push('</g><g data-k="front">' + L.petals.map(function (pt, j) { return use(id, 'pt', tl(pt[0], pt[1]), ' data-k="pe' + j + '"'); }).join('') + frontSVG(id, L.front) + '</g>');
      return o.join('');
    },
    bind: function (S, L) {
      var q = S.q;
      S.path = mkLut(q.kp);
      S.cs = mkLut(q.cs);
      var st = L.stops.map(function (k) { return nearestS(S.path, L.kite[k][0], L.kite[k][1]); });
      S.K = [[0, 0], [0.05, st[0]], [0.16, st[0]], [0.25, st[1]], [0.36, st[1]], [0.45, st[2]], [0.56, st[2]], [0.65, st[3]], [0.76, st[3]], [0.85, st[4]], [0.9, st[4]], [1, S.path.len]];
      S.tailBuf = new Array(9);
      S.conf = CONF.map(function (c) { var a = L.ca + c[0]; return [Math.cos(a) * c[1], Math.sin(a) * c[1]]; });
    },
    frame: function (p, S) {
      var q = S.q, L = S.L, A = VALUES.tagAt, i, k, t;
      T(q.back, tl((0.5 - p) * 40, 0));
      T(q.front, tl((0.5 - p) * 160, S.fy));
      for (i = 0; i < L.petals.length; i++) {
        var pe = L.petals[i];
        T(q['pe' + i], tl(pe[0] + Math.sin(p * 6 + i) * 20, pe[1] - p * 40 + Math.cos(p * 9 + i * 2) * 8) + ' rotate(' + f(p * 360 * (i % 2 ? 1 : -1) + i * 40) + ')' + sc(1 + (i % 3) * 0.25));
      }
      for (i = 0; i < 5; i++) T(q['st' + i], tl(L.st[i][0], L.st[i][1] + Math.sin(p * 9 + i * 1.3) * 3) + sc(L.is));
      /* kite + tail */
      var s = kf(p, S.K), P = at(S.path, s), kx = P[0], ky = P[1];
      var ax = at(S.path, s + 12)[0], bx = at(S.path, s - 12)[0];
      var tilt = clamp((ax - bx) / 24, -1, 1) * 18 + Math.sin(p * 55) * 5;
      T(q.kite, tl(kx, ky) + ' rotate(' + f(tilt) + ')');
      var pts = '', ks = L.ks;
      for (i = 0; i < 9; i++) {
        var B = at(S.path, s - i * 13 * ks), w = i / 8;
        var tx = lerp(kx, B[0], 0.55) + Math.sin(i * 0.9 - p * 40) * 5 * w, ty = lerp(ky + 14 * ks + i * 12 * ks, B[1] + 14 * ks, 0.45);
        if (i === 0) { tx = kx; ty = ky + 14 * ks; }
        pts += f(tx) + ',' + f(ty) + ' ';
        if (i === 3 || i === 5 || i === 7) T(q['bw' + ((i - 3) / 2)], tl(tx, ty) + ' rotate(' + f(Math.sin(p * 30 + i) * 25) + ')' + sc(ks));
      }
      At(q.tail, 'points', pts);
      /* 1 Excellence */
      t = remap(p, A[0], A[0] + 0.13);
      var pol = t > 0 && t < 0.8 ? 1 - remap(t, 0.65, 0.8) : 0;
      T(q.xc, tl(Math.sin(t * Math.PI * 4) * 26, -64 + Math.cos(t * Math.PI * 8) * 4) + ' rotate(' + f(Math.sin(t * Math.PI * 4) * 12) + ')');
      Op(q.xc, pol * (t > 0 ? 1 : 0) * clamp(t * 12, 0, 1));
      var gold = smoothstep(remap(t, 0.12, 0.7));
      Op(q.xg, gold);
      T(q.xs, 'translate(0 -64)' + sc(1 + 0.2 * Math.sin(Math.PI * remap(t, 0.66, 0.95))) + ' rotate(' + f((1 - gold) * -8) + ')');
      for (i = 0; i < 3; i++) {
        k = spring(remap(t, 0.7 + i * 0.07, 0.92 + i * 0.07)) * (1 + 0.15 * Math.sin(p * 70 + i * 2) * (t >= 1 ? 1 : 0));
        var xk = [[-40, -96], [40, -84], [24, -116]][i];
        T(q['xk' + i], tl(xk[0], xk[1]) + sc(k));
      }
      /* 2 Creativity */
      t = remap(p, A[1], A[1] + 0.13);
      var dr = remap(t, 0.15, 0.85), rest = [36, -20];
      Draw(q.cs, dr);
      var bp = at(S.cs, S.cs.len * dr), bxp = bp[0], byp = bp[1];
      if (t < 0.15) { var e = smoothstep(t / 0.15); bxp = lerp(rest[0], bxp, e); byp = lerp(rest[1], byp, e); }
      else if (t > 0.85) { var e2 = smoothstep((t - 0.85) / 0.15); bxp = lerp(bxp, rest[0], e2); byp = lerp(byp, rest[1], e2); }
      var lift = t > 0 && t < 1 ? 0 : 1;
      T(q.cb, tl(bxp, byp) + ' rotate(' + f(lift * 18 + Math.sin(t * 30) * 6 * (1 - lift)) + ')');
      T(q.cd, sc(spring(remap(t, 0.8, 1))));
      /* 3 Co-creation */
      t = remap(p, A[2], A[2] + 0.13);
      var j = easeOutBack(remap(t, 0.05, 0.6)), jn = 1 - j;
      T(q.pa, tl(-46 * jn, 12 * jn) + ' rotate(' + f(-24 * jn) + ' -22 -24)');
      T(q.pb, tl(46 * jn, -8 * jn) + ' rotate(' + f(20 * jn) + ' 22 -24)');
      T(q.pz, 'translate(6 -60)' + sc(spring(remap(t, 0.55, 0.85))));
      /* 4 Service */
      t = remap(p, A[3], A[3] + 0.13);
      var sv = spring(remap(t, 0, 0.45));
      T(q.sv, tl(-34 * (1 - sv), 18 * (1 - sv)));
      for (i = 0; i < 3; i++) Draw(q['sm' + i], remap(t, 0.35 + i * 0.1, 0.75 + i * 0.08), 0.85);
      /* 5 Fun and joy */
      t = remap(p, A[4], A[4] + 0.12);
      var kick = Math.sin(Math.PI * remap(t, 0.05, 0.3));
      T(q.pp, 'rotate(' + f(kick * -10) + ')' + sc(1 + kick * 0.12));
      var tt = easeOut(remap(t, 0.08, 1));
      for (i = 0; i < CONF.length; i++) {
        var c = CONF[i], cv = S.conf[i];
        var cx = cv[0] * tt * 1.15, cy = cv[1] * tt * 1.15 + 46 * tt * tt;
        T(q['cf' + i], tl(cx, cy) + ' rotate(' + f(c[2] + c[3] * tt * 360) + ')' + sc(t > 0.08 ? 1.5 : 0));
      }
    }
  };

  /* =====================================================================
     4. ALIGN (work) - fragments pulled into one delta by five pillars
     ===================================================================== */
  var ALIGN = {
    key: 'align',
    eyebrow: 'Five interconnected pillars',
    title: 'How We Drive <em class="it">Transformation</em>',
    lede: 'We design and deliver integrated, human-centred solutions across five interconnected pillars, helping organisations evolve from the inside out and achieve lasting impact.',
    chapters: [
      { at: 0, label: 'Disconnected teams', short: 'Strong talent, but unclear leadership. Strategic plans, but little follow-through.', text: 'Too many organisations have compelling visions but disconnected teams. Strong talent, but unclear leadership. Strategic plans, but little follow-through.' },
      { at: 0.14, label: 'Purpose Alignment', short: 'Clarify your “why” and embed it into everything you do.', text: 'Clarify your “why” and embed it into everything you do.' },
      { at: 0.28, label: 'Strategy Activation', short: 'Turn strategy from a static document into an execution-ready roadmap.', text: 'Turn strategy from a static document into an execution-ready roadmap.' },
      { at: 0.42, label: 'Culture Transformation', short: 'Shape a thriving workplace culture—by design, not by default.', text: 'Shape a thriving workplace culture—by design, not by default.' },
      { at: 0.56, label: 'Leadership Transformation', short: 'Define what great leadership looks like, and grow it at every level.', text: 'Define what great leadership looks like, and grow it at every level.' },
      { at: 0.7, label: 'On-boarding Transformation', short: 'Connect people to purpose, culture, and clarity – from day one and every change point.', text: 'Connect people to purpose, culture, and clarity – from day one and every change point.' },
      { at: 0.84, label: 'One powerful, integrated system', short: 'We help bridge the gap.', text: 'We help bridge the gap, aligning the core drivers of organisational success into one powerful, integrated system for flourishing.' }
    ],
    tagAt: [0.03, 0.16, 0.3, 0.44, 0.58, 0.72, 0.88],
    tagUntil: [0.18],
    /* compact visual labels for small stages (full names stay in the caption and the static chapter list) */
    avoidW: 900,
    tagShort: ['', 'Purpose', 'Strategy', 'Culture', 'Leadership', 'On-boarding', ''],
    tagC: [INK, CORAL, GOLD, TEAL, PEACH, DEEP, GOLD],
    pillarAt: [0.16, 0.3, 0.44, 0.58, 0.72],
    cols: [CORAL, GOLD, TEAL, PEACH, DEEP],
    layouts: {
      L: {
        vb: [1200, 600], sky: [0, 450], ground: 450,
        cols: [392, 496, 600, 704, 808], cw: 46, ch: 112, beam: [330, 320, 540, 18],
        ped: [340, 320, 860, 112],
        /* the sun rises from behind the temple and settles in the upper-left sky, clear of the apex */
        sunPath: [[600, 760], [600, 420], [430, 88]], sunR: 36,
        scatter: [40, 40, 1120, 400],
        groundD: 'M-900 456C-500 442-100 460 300 448C600 440 900 452 1200 446C1500 440 1800 456 2100 450V1400H-900Z',
        hills: ['M-900 470C-600 380-300 350 0 396C200 426 330 360 520 372C700 384 820 340 1000 366C1180 392 1300 340 1500 380C1700 420 1900 400 2100 430V1000H-900Z'],
        clouds: [[160, 120, 0.9], [1080, 210, 0.7], [930, 290, 0.55]],
        people: [[92, 488], [178, 502], [262, 478], [940, 482], [1034, 502], [1122, 476]], ps: 1,
        /* end state: the six figures stand together in the colonnade */
        peopleEnd: [[326, 450], [444, 450], [548, 450], [652, 450], [756, 450], [874, 450]],
        plw: 104, plY: 450, plc: 600,
        tags: [{ a: [150, 90], p: 'br' }, { a: [392, 450], p: 'b', fix: 1 }, { a: [496, 450], p: 'b', fix: 1, row: 1 }, { a: [600, 450], p: 'b', fix: 1 }, { a: [704, 450], p: 'b', fix: 1, row: 1 }, { a: [808, 450], p: 'b', fix: 1 }, { a: [624, 100], p: 'r' }],
        /* roof as steps, colonnade, and the sun's resting place */
        avoid: [[560, 98, 80, 42], [490, 140, 220, 60], [415, 200, 370, 60], [330, 260, 540, 210], [354, 12, 152, 152]]
      },
      P: {
        /* temple sits higher than in the other portrait scenes so the five plinth labels fit below the ground line */
        vb: [600, 720], crop: [40, 0], sky: [0, 500], ground: 500,
        cols: [70, 185, 300, 415, 530], cw: 38, ch: 110, beam: [14, 374, 572, 16],
        /* a lower roof leaves a band of sky above the apex: sun to the left, closing callout to the right */
        ped: [20, 374, 580, 170],
        sunPath: [[300, 800], [300, 450], [122, 106]], sunR: 34,
        scatter: [40, 60, 520, 400],
        groundD: 'M-900 506C-500 492-100 510 100 500C300 492 450 506 600 498C900 492 1200 506 1500 500V1400H-900Z',
        hills: ['M-900 510C-600 420-300 390 0 430C150 450 260 400 400 410C520 420 600 380 760 410C1000 450 1300 440 1500 470V1000H-900Z'],
        clouds: [[70, 262, 0.5], [536, 252, 0.5]],
        people: [[22, 440], [128, 472], [240, 426], [360, 480], [470, 440], [578, 466]], ps: 1.1,
        peopleEnd: [[28, 500], [127, 500], [242, 500], [358, 500], [473, 500], [572, 500]],
        plw: 115, plY: 500, plc: 300,
        tags: [{ a: [110, 64], p: 'br' }, { a: [70, 500], p: 'b', fix: 1 }, { a: [185, 500], p: 'b', fix: 1, row: 1 }, { a: [300, 500], p: 'b', fix: 1 }, { a: [415, 500], p: 'b', fix: 1, row: 1 }, { a: [530, 500], p: 'b', fix: 1 }, { a: [318, 124], p: 'r' }],
        avoid: [[245, 160, 110, 50], [163, 210, 274, 60], [80, 270, 440, 60], [14, 330, 572, 190], [48, 32, 148, 148]]
      }
    },
    svg: function (L, id) {
      var o = [], i, pd = L.ped, tb = (pd[2] - pd[0]) / 5, th = (pd[1] - pd[3]) / 5;
      var r = rng(11), self = ALIGN;
      /* slots of the delta mosaic */
      var slots = [];
      for (var row = 0; row < 5; row++) {
        var yt = pd[3] + th * row, ax = (pd[0] + pd[2]) / 2;
        for (var k2 = 0; k2 <= row; k2++) slots.push([ax - tb / 2 * row + tb * k2, yt + th * 2 / 3, 0]);
        for (k2 = 0; k2 < row; k2++) slots.push([ax - tb / 2 * row + tb * k2 + tb / 2, yt + th / 3, 180]);
      }
      var order = slots.map(function (s, j) { return [r(), j]; }).sort(function (a, b) { return a[0] - b[0]; });
      var sh = [];
      order.forEach(function (oo, j) {
        var sl = slots[oo[1]], sc0 = L.scatter;
        sh.push({ g: j % 5, i: Math.floor(j / 5), e: sl, s: [sc0[0] + r() * sc0[2], sc0[1] + r() * sc0[3]], r0: (r() - 0.5) * 340, z: 0.45 + r() * 0.25, seed: r() * 10 });
      });
      self._sh = self._sh || {}; self._sh[L.vb[0]] = sh;
      o.push('<defs>' + skyGrad(id, L.sky[0], L.sky[1]) + defsCommon(id) +
        '<path id="' + id + '-tri" d="M0 ' + f(-th * 2 / 3) + 'L' + f(tb / 2) + ' ' + f(th / 3) + 'L' + f(-tb / 2) + ' ' + f(th / 3) + 'Z"' + O + '/>' +
        '<g id="' + id + '-p2"><path d="M-11 0C-12-16-9-27 0-27C9-27 12-16 11 0Z"' + O + '/><path d="M4-18L15-22" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/><circle cy="-35" r="7.5" fill="' + PAPER + '"' + O + '/><circle cx="2.6" cy="-36" r="1.3" fill="' + INK + '"/><circle cx="6" cy="-36" r="1.3" fill="' + INK + '"/></g></defs>');
      o.push('<g data-k="back"><rect x="-1600" y="-1200" width="4400" height="3000" fill="url(#' + id + '-sky)"/>');
      o.push('<path data-k="sunp" d="' + crPath(L.sunPath) + '" fill="none" stroke="none"/>');
      o.push('<g data-k="sun"><g data-k="srays"><path d="' + (function () { var d = ''; for (var j = 0; j < 16; j++) { var a = j * Math.PI / 8, r0 = L.sunR + 12, r1 = L.sunR + (j % 2 ? 26 : 40); d += 'M' + f(Math.cos(a) * r0) + ' ' + f(Math.sin(a) * r0) + 'L' + f(Math.cos(a) * r1) + ' ' + f(Math.sin(a) * r1); } return d; })() + '" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/></g><circle r="' + (L.sunR + 6) + '" fill="' + GOLD + '" opacity=".25"/><circle r="' + L.sunR + '" fill="' + GOLD + '"' + O + '/></g>');
      o.push(L.clouds.map(function (c) { return use(id, 'cloud', tl(c[0], c[1]) + sc(c[2])); }).join(''));
      o.push('<path data-k="hill" d="' + L.hills[0] + '" fill="' + GREY + '"' + O + '/>');
      o.push('<rect data-k="fog" x="-1600" y="-1200" width="4400" height="3000" fill="' + FOG + '" opacity=".8"/></g>');
      o.push('<g data-k="mid"><path data-k="gr" d="' + L.groundD + '" fill="' + GREY + '"' + O + '/>');
      var ghost = 'M' + pd[0] + ' ' + pd[1] + 'L' + ((pd[0] + pd[2]) / 2) + ' ' + pd[3] + 'L' + pd[2] + ' ' + pd[1] + 'Z';
      o.push('<path data-k="ghost" d="' + ghost + '" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round" opacity="0"/>');
      /* columns */
      L.cols.forEach(function (x, j) {
        var w = L.cw, h = L.ch;
        o.push('<g transform="' + tl(x, L.ground) + '"><circle data-k="ring' + j + '" cy="' + (-h - 8) + '" r="34" fill="none" stroke="' + self.cols[j] + '" stroke-width="3" opacity="0"/><g data-k="col' + j + '" transform="scale(1 0)">' +
          '<path d="M' + (-w / 2 + 6) + ' ' + (-2) + 'H' + (w / 2 + 6) + 'V' + (-h + 4) + 'H' + (-w / 2 + 6) + 'Z" fill="' + INK + '"/>' +
          '<path d="M' + (-w / 2) + ' -8H' + (w / 2) + 'V' + (-h + 10) + 'H' + (-w / 2) + 'Z" fill="' + PAPER + '"' + O + '/>' +
          '<path d="M' + (-w / 6) + ' -14V' + (-h + 16) + 'M' + (w / 6) + ' -14V' + (-h + 16) + '" fill="none"' + O15 + '/>' +
          '<path d="M' + (-w / 2 - 8) + ' 0H' + (w / 2 + 8) + 'V-8H' + (-w / 2 - 8) + 'Z" fill="' + PAPER2 + '"' + O + '/>' +
          '<path d="M' + (-w / 2 - 10) + ' ' + (-h + 10) + 'H' + (w / 2 + 10) + 'V' + (-h) + 'H' + (-w / 2 - 10) + 'Z" fill="' + self.cols[j] + '"' + O + '/></g></g>');
      });
      var bm = L.beam;
      o.push('<g data-k="beam" transform="' + tl(bm[0] + bm[2] / 2, 0) + ' scale(0 1)"><path d="M' + (-bm[2] / 2) + ' ' + bm[1] + 'h' + bm[2] + 'v' + bm[3] + 'h' + (-bm[2]) + 'Z" fill="' + PAPER2 + '"' + O + '/></g>');
      o.push('<path data-k="outline" d="' + ghost + '" fill="none" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"' + DR + '/>');
      for (i = 0; i < sh.length; i++) o.push(use(id, 'tri', '', ' data-k="sh' + i + '" fill="' + GREY + '"'));
      o.push('<path data-k="arrow" d="M-24 10L0-14L24 10" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="scale(0)"/>');
      /* people live in the mid layer (same parallax as the colonnade they walk into) */
      L.people.forEach(function (pp, j) { o.push(use(id, 'p2', '', ' data-k="pe' + j + '" fill="' + GREY + '"')); });
      o.push('</g><g data-k="front">');
      o.push(frontSVG(id, [['t', 40, L.vb[1] - 6, 1.3], ['t', L.vb[0] * 0.5, L.vb[1] - 4, 1.2], ['t', L.vb[0] - 40, L.vb[1] - 8, 1.3]]) + '</g>');
      return o.join('');
    },
    bind: function (S, L) {
      S.sun = mkLut(S.q.sunp);
      /* per-mount copies with their resting transforms precomputed (start pile / finished mosaic) */
      S.sh = ALIGN._sh[L.vb[0]].map(function (o) {
        var re = o.e[2] + (o.r0 > 0 ? 360 : -360) * (Math.abs(o.r0) > 120 ? 1 : 0);
        return { g: o.g, i: o.i, e: o.e, s: o.s, r0: o.r0, z: o.z, seed: o.seed, re: re, rest: 0,
          t0: tl(o.s[0], o.s[1]) + ' rotate(' + f(o.r0) + ')' + sc(o.z), t1: tl(o.e[0], o.e[1]) + ' rotate(' + f(re) + ')' + sc(0.86) };
      });
      S.grey = hx(GREY); S.ground = hx(GROUND); S.hillW = hx(HILL_FAR);
      S.colR = ALIGN.cols.map(hx);
      S.pc = [CORAL, GOLD, TEAL, PEACH, TEAL_T, GOLD].map(hx);
      var r = rng(5);
      S.pp = L.people.map(function (pp, j) { var e = L.peopleEnd[j]; return { x: pp[0], y: pp[1], ex: e[0], ey: e[1], f0: r() < 0.5 ? -1 : 1, r0: (r() - 0.5) * 30, fe: e[0] < L.vb[0] / 2 ? 1 : -1 }; });
      /* fragmented start: pieces keep a muted version of their own colour instead of flat grey */
      S.mute = ALIGN.cols.map(function (c) { return hx(mixHex(c, PAPER2, 0.55)); });
      S.pmute = S.pc.map(function (c) { return [Math.round(c[0] * 0.5 + 243 * 0.5), Math.round(c[1] * 0.5 + 230 * 0.5), Math.round(c[2] * 0.5 + 207 * 0.5)]; });
    },
    frame: function (p, S) {
      var q = S.q, L = S.L, PA = ALIGN.pillarAt, i, k, warm = smoothstep(remap(p, 0.1, 0.92));
      T(q.back, tl((0.5 - p) * 40, 0));
      T(q.front, tl((0.5 - p) * 120, S.fy));
      /* colour shifts are quantised (Fill/Op skip the write until the step changes): a fill write on a
         rendered SVG node costs a style recalc, so writing every frame was the main cost of this scene */
      Op(q.fog, Math.round((1 - warm) * 40) / 40 * 0.45);
      Fill(q.hill, S.grey, S.hillW, warm, 40);
      Fill(q.gr, S.grey, S.ground, warm, 40);
      var sk = remap(p, 0.7, 0.98), su = at(S.sun, S.sun.len * smoothstep(sk));
      T(q.sun, tl(su[0], su[1])); T(q.srays, 'rotate(' + f(remap(p, 0.66, 1) * 80) + ')');
      Op(q.ghost, smoothstep(remap(p, 0.1, 0.18)) * (0.6 + 0.4 * remap(p, 0.84, 0.95)));
      T(q.beam, tl(L.beam[0] + L.beam[2] / 2, 0) + sc(easeOutBack(remap(p, PA[0] + 0.02, PA[0] + 0.1)), 1));
      for (i = 0; i < 5; i++) {
        k = spring(remap(p, PA[i], PA[i] + 0.07));
        T(q['col' + i], 'scale(1 ' + f(Math.max(0.0001, k)) + ')');
        var rg = remap(p, PA[i] + 0.03, PA[i] + 0.14);
        T(q['ring' + i], 'translate(0 ' + f(-L.ch - 8) + ')' + sc(0.6 + rg * 1.6) + ' translate(0 ' + f(L.ch + 8) + ')');
        Op(q['ring' + i], rg > 0 && rg < 1 ? (1 - rg) * 0.9 : 0);
      }
      for (i = 0; i < S.sh.length; i++) {
        var s = S.sh[i], a0 = PA[s.g] + 0.02 + s.i * 0.013;
        /* resting pieces are left alone (no write); a piece shivers just before its pillar calls it, then flies */
        if (p <= a0 - 0.06) { if (s.rest !== 1) { s.rest = 1; T(q['sh' + i], s.t0); Fill(q['sh' + i], S.mute[s.g], S.colR[s.g], 0, 12); } continue; }
        if (p >= a0 + 0.085) { if (s.rest !== 2) { s.rest = 2; T(q['sh' + i], s.t1); Fill(q['sh' + i], S.mute[s.g], S.colR[s.g], 1, 12); } continue; }
        s.rest = 0;
        var t = remap(p, a0, a0 + 0.085), e = easeOutBack(t), st = smoothstep(t);
        var cx = (s.s[0] + s.e[0]) / 2, cy = Math.min(s.s[1], s.e[1]) - 90;
        var u = 1 - e, x = u * u * s.s[0] + 2 * u * e * cx + e * e * s.e[0], y = u * u * s.s[1] + 2 * u * e * cy + e * e * s.e[1];
        var jit = (1 - st) * smoothstep(remap(p, a0 - 0.06, a0 - 0.01));
        x += Math.sin(p * 290 + s.seed * 4) * 3.5 * jit; y += Math.cos(p * 230 + s.seed * 3) * 3.5 * jit;
        var rr = lerp(s.r0, s.re, st) + Math.sin(p * 370 + s.seed * 6) * 7 * jit;
        T(q['sh' + i], tl(x, y) + ' rotate(' + f(rr) + ')' + sc(lerp(s.z, 0.86, st)));
        Fill(q['sh' + i], S.mute[s.g], S.colR[s.g], st, 12);
      }
      Draw(q.outline, smoothstep(remap(p, 0.84, 0.95)));
      var ak = spring(remap(p, 0.9, 0.97));
      T(q.arrow, tl((L.ped[0] + L.ped[2]) / 2, L.ped[3] - 9 - ak * 4) + sc(ak * 0.7));
      /* people: idle and scattered, then one by one hop into the colonnade and face the centre */
      for (i = 0; i < S.pp.length; i++) {
        var pp = S.pp[i], mv = remap(p, 0.72 + i * 0.022, 0.84 + i * 0.022), me = smoothstep(mv), dir = pp.ex > pp.x ? 1 : -1;
        var turn = smoothstep(remap(p, 0.6, 0.72 + i * 0.022));
        var fc = mv >= 1 ? pp.fe : lerp(pp.f0, dir, turn);
        if (Math.abs(fc) < 0.3) fc = 0.3 * (fc < 0 ? -1 : 1);
        var land = mv >= 1 ? spring(remap(p, 0.84 + i * 0.022, 0.9 + i * 0.022)) : 0;
        var px = lerp(pp.x, pp.ex, me), py = lerp(pp.y, pp.ey, me) - Math.sin(Math.PI * mv) * 16 - Math.abs(Math.sin(mv * Math.PI * 5)) * 4 * (mv > 0 && mv < 1 ? 1 : 0);
        var wob = Math.sin(p * 40 + i * 2) * 6 * (1 - turn);
        var sy = L.ps * (1 + (land > 0 && land < 1 ? Math.sin(land * Math.PI) * 0.08 : 0));
        T(q['pe' + i], tl(px, py) + ' rotate(' + f(pp.r0 * (1 - Math.max(turn, me)) + wob) + ')' + sc(fc * L.ps, sy));
        Fill(q['pe' + i], S.pmute[i % S.pmute.length], S.pc[i % S.pc.length], warm, 24);
      }
    }
  };

  window.NIA_SCENES = {
    approach: makeScene(APPROACH),
    story: makeScene(STORY),
    values: makeScene(VALUES),
    align: makeScene(ALIGN)
  };
  /* exposed for the QA harness only */
  Object.defineProperty(window.NIA_SCENES, '_ease', { value: { easeOutBack: easeOutBack, spring: spring, smoothstep: smoothstep, remap: remap }, enumerable: false });
})();
