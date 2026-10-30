/* ==== CONTACT CONFIG: edit real details here ==== */
/* Empty strings render nothing. Forms: when an endpoint is empty the form still
   validates and shows its success state, then offers a prefilled mailto: link to
   CONTACT.email as the real delivery path (no data leaves the browser otherwise). */
var CONTACT = {
  email: 'admin@niadelta.com',
  linkedin: 'https://www.linkedin.com/company/niadelta',
  calLeadership: 'https://calendly.com/sila-niadelta/30min',        // leadership development calls
  calCulture: 'https://calendly.com/oluwaseyeoni-niadelta',          // culture / ODC / Culture Identity Kit calls
  kitForm: 'https://docs.google.com/forms/d/e/1FAIpQLScEvK0jYCHTv3nbp3IMpotWZtATjLKRwZ6CPY8h6gQFE3Knsg/viewform',
  caseStudies: 'https://drive.google.com/file/d/1v-U00qUJxpNIwU-Wc2CWqiaWAgpBVe8a/view?usp=sharing',
  video: 'https://www.youtube.com/watch?v=NJAeQsdzHeg',
  blog: 'https://www.niadelta.com/blogs',
  phone: '',
  whatsapp: '',
  formEndpoint: '',        // POST JSON {name,email,organisation,message}
  newsletterEndpoint: ''   // POST JSON {email}
};
/* ==== end CONTACT CONFIG ==== */

(function () {
'use strict';
function boot() {
  var D = document, root = D.documentElement, W = window;
  var $ = function (s, r) { return (r || D).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || D).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var RM = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var G = !!(W.gsap && W.ScrollTrigger);
  var anim = G && !RM;
  var FINE = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mqMob = W.matchMedia('(max-width: 900px)');
  var NC = W.NIA_CONTENT, IMG = W.NIA_IMG || {};
  var app = $('#app'), hd = $('#hd'), ld = $('#ld');
  if (!NC || !app) { if (ld) ld.remove(); return; }
  var R = NC.routes, TITLES = NC.titles, LABELS = NC.labels, ic = NC.util.ic, esc = NC.util.esc;

  if (G) { gsap.registerPlugin(ScrollTrigger); ScrollTrigger.config({ ignoreMobileResize: true }); }
  if (anim) root.classList.add('js-anim');

  /* ---------- Lenis smooth scroll ---------- */
  var lenis = null, stops = {};
  if (anim && W.Lenis) {
    try {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } catch (e) { lenis = null; }
  }
  function lstop(r) { stops[r] = 1; if (lenis) lenis.stop(); }
  function lstart(r) { delete stops[r]; if (lenis && !Object.keys(stops).length) lenis.start(); }
  function lenisStopped() { return lenis ? !!lenis.isStopped : Object.keys(stops).length > 0; }

  /* ---------- header, nav, sheet ---------- */
  var lg = $('#lg'); if (lg && IMG.LOGOD) lg.src = IMG.LOGOD.src;
  var CHEV = '<svg class="ic chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  /* top item = page link + disclosure button (aria-expanded/controls) that toggles its submenu;
     hover opens it only on fine pointers, touch/keyboard use the button */
  $('#dn').innerHTML = NC.nav.map(function (n) {
    if (!n[2]) return '<li><a class="btn mag" href="#' + n[1] + '" data-n="' + n[1] + '"><span>' + n[0] + '</span></a></li>';
    return '<li class="dd"><a href="#' + n[1] + '" data-n="' + n[1] + '">' + n[0] + '</a><button type="button" class="dd-b" aria-expanded="false" aria-controls="sub-' + n[1] + '" aria-label="' + n[0] + ' sections">' + CHEV + '</button><ul class="sub" id="sub-' + n[1] + '">' +
      n[2].map(function (s) { return '<li><a href="#' + s[1] + '">' + s[0] + ic('arrow') + '</a></li>'; }).join('') + '</ul></li>';
  }).join('');
  var ddOpen = function (li, on) { li.classList.toggle('open', on); $('.dd-b', li).setAttribute('aria-expanded', on ? 'true' : 'false'); };
  var ddClose = function () { $$('#dn li.dd.open').forEach(function (li) { ddOpen(li, false); }); };
  $$('#dn li.dd').forEach(function (li) {
    var b = $('.dd-b', li);
    b.addEventListener('click', function () { var on = !li.classList.contains('open'); ddClose(); ddOpen(li, on); if (on) { var a = $('.sub a', li); if (a) a.focus(); } });
    li.addEventListener('focusout', function (e) { if (!li.contains(e.relatedTarget)) ddOpen(li, false); });
    li.addEventListener('keydown', function (e) { if (e.key === 'Escape' && li.classList.contains('open')) { e.stopPropagation(); ddOpen(li, false); b.focus(); } });
    li.addEventListener('mouseleave', function () { if (FINE) ddOpen(li, false); });
  });
  var sheet = $('#sheet'), bio = $('#bio'), scr = $('#scr'), mb = $('#mb'), mbt = $('.mb-t');
  var grp = function (n) { return '<p class="eyebrow sh-h">' + n[0] + '</p><a href="#' + n[1] + '">' + TITLES[n[1]] + ic('arrow') + '</a>' + n[2].map(function (s) { return '<a class="s2" href="#' + s[1] + '">' + s[0] + '</a>'; }).join(''); };
  sheet.innerHTML = '<button class="px" type="button" data-close aria-label="Close menu"><svg class="ic" aria-hidden="true"><use href="#i-close"/></svg></button><nav aria-label="Mobile"><div class="sh-cols"><div><p class="eyebrow sh-h">Explore</p><a href="#home">Home' + ic('arrow') + '</a>' + grp(NC.nav[0]) + '</div>' +
    '<div>' + grp(NC.nav[1]) + '<p class="eyebrow sh-h">Say hello</p><a href="#contact">Say hello' + ic('arrow') + '</a>' +
    (CONTACT.blog ? '<a href="' + esc(CONTACT.blog) + '" target="_blank" rel="noopener">Blog' + ic('out') + '</a>' : '') +
    (CONTACT.email ? '<a class="s2" href="mailto:' + esc(CONTACT.email) + '">' + esc(CONTACT.email) + '</a>' : '') + '</div></div></nav>';

  /* ---------- panels (menu sheet + bio) with focus trap ---------- */
  var openP = null, opener = null, pfT = 0, locks = {};
  // scroll lock is shared by the loader and the panels: html.lock stays until every holder has released it
  function lockOn(r) { locks[r] = 1; root.classList.add('lock'); }
  function lockOff(r) { delete locks[r]; if (!Object.keys(locks).length) root.classList.remove('lock'); }
  function focusables(p) {
    var f = $$('a[href],button:not([disabled]),input,textarea,[tabindex]:not([tabindex="-1"])', p).filter(function (e) { return e.offsetParent !== null || e === D.activeElement; });
    if (p === sheet && mb.offsetParent !== null) f.push(mb);
    return f;
  }
  function openPanel(p, from) {
    if (openP && openP !== p) closePanel(true);
    openP = p; opener = from || D.activeElement;
    // without Lenis, html overflow:hidden removes a classic scrollbar: pad by its width so the page does not jump
    var sbw = W.innerWidth - root.clientWidth; if (sbw > 0) D.body.style.paddingRight = sbw + 'px';
    p.classList.add('o'); scr.classList.add('o'); lockOn('panel'); lstop('panel');
    p.scrollTop = 0;
    if (p === sheet) { mb.setAttribute('aria-expanded', 'true'); mbt.textContent = 'Close'; }
    if (p === bio) root.classList.add('bio-open');
    clearTimeout(pfT);
    pfT = setTimeout(function () { if (openP !== p) return; var t = p.querySelector('[data-close]') || focusables(p)[0] || p; t.focus({ preventScroll: true }); }, 60);
  }
  function closePanel(silent) {
    if (!openP) return;
    var p = openP; openP = null; clearTimeout(pfT);
    p.classList.remove('o'); scr.classList.remove('o'); root.classList.remove('bio-open'); lockOff('panel'); lstart('panel'); D.body.style.paddingRight = '';
    if (p === sheet) { mb.setAttribute('aria-expanded', 'false'); mbt.textContent = 'Menu'; }
    if (!silent && opener && D.contains(opener)) opener.focus({ preventScroll: true });
  }
  mb.addEventListener('click', function () { openP === sheet ? closePanel() : openPanel(sheet, mb); });
  scr.addEventListener('click', function () { closePanel(); });
  [bio, sheet].forEach(function (p) { p.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) closePanel(); }); });
  D.addEventListener('keydown', function (e) {
    if (!openP) return;
    if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
    if (e.key === 'Tab') {
      var f = focusables(openP); if (!f.length) return;
      var i = f.indexOf(D.activeElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && (i === f.length - 1 || i === -1)) { e.preventDefault(); f[0].focus(); }
    }
  });
  function openBio(id, from) {
    if (busy) return; // the page is about to be swapped out by a transition
    var p = NC.people[id]; if (!p || !p.bio) return;
    var pic = IMG[p.img] ? NC.util.ph(p.img, 'Portrait of ' + p.name, 'pp') : '';
    $('.bio-c', bio).innerHTML = '<header class="bio-h">' + pic + '<div><h2 id="bio-t">' + esc(p.name) + '</h2><p>' + esc(p.role) + '</p></div></header><div class="bio-b">' +
      p.bio.map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</div>';
    openPanel(bio, from);
  }

  /* ---------- router ---------- */
  var cur = '', curN = '', busy = false, queued = null, curTl = null, cleanup = [], resizers = [], introDone = true, introTimer = 0;
  function parse(h) { h = (h || '').replace(/^#/, ''); return R[h] ? h : null; }
  function label(n) { return LABELS[n] || TITLES[R[n]]; }
  function mark(n) {
    var pg = R[n];
    $$('#dn a[data-n]').forEach(function (a) { a.classList.toggle('on', a.dataset.n === pg); if (a.dataset.n === pg) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $$('#sheet a[href^="#"]').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + n); });
    D.title = pg === 'home' ? 'NiaDelta | Leadership development and culture change' : TITLES[pg] + ' | NiaDelta';
    // on the contact page the dock's second action would point at the form already on screen
    var dk = $('.dk-c');
    if (dk && CONTACT.email) { var onC = pg === 'contact'; dk.setAttribute('href', onC ? 'mailto:' + CONTACT.email : '#contact'); dk.textContent = onC ? 'Email us' : 'Talk to us'; }
  }
  /* keyboard/screen-reader start point follows the navigation target (page h1 or the anchored section) */
  function focusTo(n) {
    var el = (!n || R[n] === n || n === 'hero') ? ($('h1', app) || app) : ($('#s-' + n, app) || app);
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); } catch (e) { }
  }
  function stFor(el) { return G ? ScrollTrigger.getAll().filter(function (t) { return t.pin && t.trigger && (t.trigger === el || el.contains(t.trigger)); })[0] : null; }
  function yOf(n) {
    if (!n || R[n] === n || n === 'hero') return 0;
    var e = $('#s-' + n); if (!e) return 0;
    // pinned story: its start minus whatever sits above the pin inside the section (unaffected by an active pin)
    var st = stFor(e); if (st) { var sp = st.pin && st.pin.parentNode; return Math.max(0, st.start - (sp && sp.offsetParent === e ? sp.offsetTop : 0)); }
    return Math.max(0, e.getBoundingClientRect().top + W.scrollY);
  }
  // Lenis clamps scrollTo to its cached limit; after a page swap that limit is still the old
  // page's height until its ResizeObserver fires, so re-measure first or long anchors land short.
  function lsize() { if (lenis && lenis.resize) try { lenis.resize(); } catch (e) { } }
  function jump(n) { var y = yOf(n); W.scrollTo(0, y); if (lenis) { lsize(); lenis.scrollTo(y, { immediate: true, force: true }); } }
  var holdHd = 0; // the header stays put while a nav-initiated glide is running
  function glide(n) {
    var y = yOf(n); holdHd = Date.now() + 1700;
    if (lenis) { lsize(); lenis.scrollTo(y, { duration: 1.2 }); }
    else W.scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' });
  }
  function route(n, o) {
    o = o || {};
    if (!R[n]) n = 'home';
    if (busy) { queued = n; if (curTl) curTl.timeScale(2.4); return; }
    var pg = R[n];
    closePanel(true); ddClose();
    if (pg === cur) { mark(n); glide(n); if (!o.first) focusTo(n); return; }
    var swap = function () { render(pg); cur = pg; curN = n; mark(n); jump(n); };
    if (o.first) { swap(); return; }
    if (!anim) { swap(); afterEnter(); return; }
    busy = true; lstop('tr'); hd.classList.remove('hide');
    transit(n, pg, swap).then(function () {
      busy = false; curTl = null; lstart('tr'); afterEnter();
      var q = queued; queued = null;
      var h = parse(location.hash);
      if (q) route(q);
      else if (h && R[h] !== cur) route(h);
    });
  }
  function afterEnter() {
    intro();
    hd.classList.remove('hide');
    focusTo(curN);
    revealSweep();
  }
  W.addEventListener('hashchange', function () {
    var h = location.hash.replace(/^#/, '');
    if (!h) return route('home');
    if (R[h]) route(h);
  });
  D.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var b = e.target.closest('[data-bio]');
    if (b) { e.preventDefault(); openBio(b.dataset.bio, b); return; }
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var n = a.getAttribute('href').slice(1);
    if (n === 'app') { e.preventDefault(); app.focus(); return; }
    if (!R[n]) return;
    e.preventDefault();
    closePanel(true);
    if (location.hash === '#' + n) route(n); else location.hash = n;
  });

  /* ---------- render a page ---------- */
  function runCleanup() { cleanup.forEach(function (f) { try { f(); } catch (e) { } }); cleanup = []; resizers = []; }
  function render(pg) {
    runCleanup();
    if (G) ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    app.innerHTML = NC.pages[pg]({ C: CONTACT });
    W.scrollTo(0, 0); if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    $$('.story', app).forEach(initStory);
    if (anim) prepIntro();
    initHero();
    if (anim) initScroll();
    else $('#chi').classList.remove('v');
    if (G) ScrollTrigger.refresh();
  }

  /* ---------- split headline words ---------- */
  function splitWords(el) {
    var mk = function (child) { var w = D.createElement('span'), i = D.createElement('span'); w.className = 'w'; i.className = 'wi'; i.appendChild(child); w.appendChild(i); return w; };
    Array.prototype.slice.call(el.childNodes).forEach(function (ch) {
      if (ch.nodeType === 3) {
        var frag = D.createDocumentFragment();
        ch.textContent.split(/(\s+)/).forEach(function (p) { if (!p) return; frag.appendChild(/^\s+$/.test(p) ? D.createTextNode(' ') : mk(D.createTextNode(p))); });
        ch.replaceWith(frag);
      } else if (ch.nodeType === 1 && !ch.classList.contains('vh')) {
        var w = D.createElement('span'); ch.replaceWith(w); w.className = ch.classList.contains('rw') ? 'w rwx' : 'w'; var i = D.createElement('span'); i.className = 'wi'; i.appendChild(ch); w.appendChild(i);
      }
    });
  }

  /* ---------- page intro (hero / page header) ---------- */
  function prepIntro() {
    introDone = false;
    $$('[data-split]', app).forEach(splitWords);
    gsap.set($$('.wi', app), { yPercent: 118, rotate: 6 });
    gsap.set($$('.hi', app), { autoAlpha: 0, y: 26 });
    var h = $('.hero', app);
    if (h) {
      gsap.set($('.hph', h), { clipPath: 'inset(100% 0% 0% 0% round 999px 999px 28px 28px)' });
      gsap.set($('.hph img', h), { scale: 1.35 });
      gsap.set($('.hsh', h), { autoAlpha: 0, scale: .92 });
      gsap.set($('.hsun svg', h), { autoAlpha: 0, y: 90, scale: .72 });
      gsap.set($$('.hills path', h), { y: 70 });
      gsap.set($$('.fl', h), { autoAlpha: 0, scale: 0 });
      gsap.set($('.birds', h), { autoAlpha: 0, x: -30 });
    }
    clearTimeout(introTimer); introTimer = setTimeout(intro, 7000); // failsafe: never leave the header hidden
  }
  function intro() {
    if (!anim || introDone) return;
    introDone = true; clearTimeout(introTimer);
    var h = $('.hero', app), tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    var words = $$('.wi', app), his = $$('.hi', app);
    if (h) {
      tl.to($('.hsun svg', h), { autoAlpha: 1, y: 0, scale: 1, duration: 1.6 }, 0)
        .to($$('.hills path', h), { y: 0, duration: 1.3, stagger: .08 }, 0)
        .to($('.hph', h), { clipPath: 'inset(0% 0% 0% 0% round 999px 999px 28px 28px)', duration: 1.25, ease: 'power4.inOut' }, .1)
        .to($('.hph img', h), { scale: 1.08, duration: 1.8 }, .1)
        .to($('.hsh', h), { autoAlpha: 1, scale: 1, duration: .9, ease: 'back.out(1.7)' }, .7)
        .to($$('.fl', h), { autoAlpha: 1, scale: 1, duration: .8, ease: 'back.out(2.2)', stagger: .08 }, .85)
        .to($('.birds', h), { autoAlpha: .8, x: 0, duration: 1.4 }, .6);
    }
    tl.to(words, { yPercent: 0, rotate: 0, duration: 1.15, stagger: .055 }, .05)
      .to(his, { autoAlpha: 1, y: 0, duration: 1, stagger: .08, ease: 'power3.out', onComplete: function () { his.forEach(function (e) { e.classList.add('in'); }); } }, .3)
      .add(function () { $$('.cta', app).forEach(function (c) { c.classList.add('in'); }); }, .9)
      // one-shot hand-drawn underline under the accent word, after the photo reveal
      .add(function () { $$('h1', app).forEach(function (c) { c.classList.add('in'); }); }, h ? 1.5 : .8);
    if (h) tl.add(function () { gsap.set($$('.wi', h), { clearProps: 'transform' }); }, '>');
  }

  /* ---------- hero: rotating word + pointer / tilt parallax ---------- */
  var par = null, parRaf = 0, heroVis = false;
  var tiltOK = !FINE && !RM && 'DeviceOrientationEvent' in W && typeof DeviceOrientationEvent.requestPermission !== 'function';
  function initHero() {
    par = null;
    /* idle CSS loops (sun rays, floating icons, partner marquee) pause while off screen */
    if ('IntersectionObserver' in W && !RM) {
      var offIO = new IntersectionObserver(function (en) { en.forEach(function (x) { x.target.classList.toggle('off', !x.isIntersecting); }); });
      $$('.hero,.partners', app).forEach(function (el) { offIO.observe(el); });
      cleanup.push(function () { offIO.disconnect(); });
    }
    var h = $('.hero', app); if (!h) return;
    if (RM || !(FINE || tiltOK)) return;
    par = { els: $$('.hl', h).map(function (el) { return { el: el, d: parseFloat(el.dataset.d) || 0 }; }), tx: 0, ty: 0, x: 0, y: 0 };
    if ('IntersectionObserver' in W) {
      var io = new IntersectionObserver(function (en) { heroVis = en[0].isIntersecting; }); io.observe(h);
      cleanup.push(function () { io.disconnect(); heroVis = false; });
    } else heroVis = true;
  }
  function parKick() { if (!parRaf && par) parRaf = requestAnimationFrame(parStep); }
  function parStep() {
    parRaf = 0; if (!par) return;
    par.x = lerp(par.x, par.tx, .075); par.y = lerp(par.y, par.ty, .075);
    for (var i = 0; i < par.els.length; i++) { var o = par.els[i]; o.el.style.translate = (par.x * o.d).toFixed(2) + 'px ' + (par.y * o.d * .6).toFixed(2) + 'px'; }
    if (Math.abs(par.x - par.tx) > .002 || Math.abs(par.y - par.ty) > .002) parKick();
  }
  if (tiltOK) W.addEventListener('deviceorientation', function (e) {
    if (!par || !heroVis || e.gamma == null) return;
    par.tx = clamp(e.gamma / 25, -1, 1); par.ty = clamp((e.beta - 45) / 25, -1, 1); parKick();
  }, { passive: true });

  /* ---------- scroll stories (scene engine) ---------- */
  function initStory(sec) {
    var key = sec.dataset.scene, S = (W.NIA_SCENES || {})[key], F = NC.scenesFallback[key] || { chapters: [] };
    var chapters = (S && Array.isArray(S.chapters) && S.chapters.length) ? S.chapters : F.chapters;
    var stage = $('[data-stage]', sec), cap = $('.cap', sec), pb = $('.pb b', sec), pn = $('.pn', sec);
    var stat = function () { sec.classList.add('static', 'noscene'); if (stage) stage.innerHTML = ''; };
    if (!S || typeof S.mount !== 'function' || !stage) return stat();
    var ctx = { reduced: !anim, mobile: mqMob.matches }, inst = null;
    try { inst = S.mount(stage, ctx); } catch (e) { console.warn('[NiaDelta] scene "' + key + '" failed to mount', e); return stat(); }
    if (!inst || typeof inst.update !== 'function') return stat();
    var kill = function () { try { inst.destroy && inst.destroy(); } catch (e) { } };
    if (!anim) {
      sec.classList.add('static');
      try { inst.update(1); } catch (e) { }
      cleanup.push(kill);
      resizers.push(function () { try { inst.resize && inst.resize(); inst.update(1); } catch (e) { } });
      return;
    }
    var last = -1, warned = false, useShort = false, lastP = 0;
    var capHTML = function (c) { return '<b>' + c.label + '</b>' + ((useShort && c.short) || c.text || ''); };
    /* The caption box is sized to the tallest chapter so the stage (flex:1) never changes height
       mid-scroll (which made the scene re-scale and jump). On small phones where full paragraphs
       would squeeze the stage below ~300px, captions use the scene's `short` line and the full
       chapter list is shown after the pinned stage instead (.capshort), so no copy is lost. */
    var sizeCap = function () {
      if (!cap) return;
      var measure = function () { var m = 0; chapters.forEach(function (c) { cap.innerHTML = capHTML(c); m = Math.max(m, cap.offsetHeight); }); return m; };
      cap.style.minHeight = '0px'; useShort = false;
      var cur0 = cap.offsetHeight, full = measure();
      var room = stage.clientHeight + cur0 - full;
      var canShort = chapters.every(function (c) { return !!c.short; });
      useShort = canShort && (W.innerWidth <= 640 || W.innerHeight <= 520) && room < 300;
      sec.classList.toggle('capshort', useShort);
      cap.style.minHeight = (useShort ? measure() : full) + 'px';
      last = -1;
    };
    var upd = function (p) {
      lastP = p;
      try { inst.update(p); } catch (e) { if (!warned) { warned = true; console.warn('[NiaDelta] scene "' + key + '" update error', e); } }
      if (pb) pb.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var a = 0; for (var i = 0; i < chapters.length; i++) if (p >= (chapters[i].at || 0) - .0005) a = i;
      if (a !== last && chapters[a]) {
        last = a;
        if (cap) cap.innerHTML = capHTML(chapters[a]);
        if (pn) pn.textContent = pad(a + 1);
      }
    };
    sizeCap();
    upd(0);
    // pin the .pin box (not the section) so a header placed before it (.sh-pre on short phones) scrolls by first
    var pinEl = $('.pin', sec) || sec;
    var st = ScrollTrigger.create({ trigger: pinEl, start: 'top top', end: '+=220%', pin: true, scrub: .6, anticipatePin: 1, onUpdate: function (s) { upd(s.progress); }, onRefresh: function (s) { upd(s.progress); } });
    /* `pinning` (dock/header step aside on short landscape) lasts 30vh past the pin end, so a reader who
       stops exactly at the end of a scene still sees the whole caption instead of the dock covering it. */
    var stp = ScrollTrigger.create({ start: function () { return st.start; }, end: function () { return st.end + W.innerHeight * .3; },
      onToggle: function (s) { root.classList.toggle('pinning', s.isActive); } });
    cleanup.push(function () { stp.kill(); st.kill(); kill(); root.classList.remove('pinning'); });
    resizers.push(function () { sizeCap(); try { inst.resize && inst.resize(); } catch (e) { } upd(st.progress); });
    if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { if (sec.isConnected) { var was = useShort; sizeCap(); upd(lastP); if (was !== useShort) refreshSoon(); } });
  }

  /* ---------- reveals, counters, chapter indicator ---------- */
  function reveal(els) {
    els = els.filter(function (e) { return !e.classList.contains('in'); }); if (!els.length) return;
    els.forEach(function (e) { e.classList.add('in'); });
    gsap.fromTo(els, { autoAlpha: 0, y: 32 }, { autoAlpha: 1, y: 0, duration: .95, ease: 'power3.out', stagger: .08, overwrite: true, clearProps: 'opacity,visibility,transform' });
  }
  function revealSweep() {
    if (!anim) return;
    setTimeout(function () { reveal($$('.rv:not(.in)', app).filter(function (e) { return e.getBoundingClientRect().top < W.innerHeight * .95; })); }, 120);
  }
  function initScroll() {
    ScrollTrigger.batch($$('.rv', app), { start: 'top 92%', once: true, onEnter: reveal });
    $$('[data-count]', app).forEach(function (el) {
      var v = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
      el.textContent = (0).toFixed(dec);
      ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: function () {
        var o = { v: 0 }; gsap.to(o, { v: v, duration: 1.8, ease: 'power3.out', onUpdate: function () { el.textContent = o.v.toFixed(dec); } });
      } });
    });
    var h = $('.hero .hph img', app);
    if (h) gsap.to(h, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    var chi = $('#chi'), secs = $$('[data-ch]', app), names = [];
    secs.forEach(function (s) { if (names.indexOf(s.dataset.ch) < 0) names.push(s.dataset.ch); });
    /* the chapter pill is a transient announcement: it appears when the chapter changes, then gets out of the way */
    var chiOn = false, chiK = '';
    var setChi = function (k) {
      if (k === chiK) return; chiK = k;
      $('b', chi).textContent = pad(names.indexOf(k) + 1) + ' / ' + pad(names.length); $('span', chi).textContent = k;
      if (!chiOn) return;
      chi.classList.add('v'); clearTimeout(chiT); chiT = setTimeout(function () { chi.classList.remove('v'); }, 1800);
    };
    chi.classList.remove('v'); clearTimeout(chiT);
    if (names.length > 1) {
      chiK = names[0];
      secs.forEach(function (s) { ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: function (t) { if (t.isActive) setChi(s.dataset.ch); } }); });
      ScrollTrigger.create({ trigger: app, start: 'top -40%', end: 'bottom bottom', onToggle: function (t) { chiOn = t.isActive; if (!chiOn) chi.classList.remove('v'); } });
    }
  }
  var rfT = 0, chiT = 0;
  function refreshSoon() { if (!G) return; clearTimeout(rfT); rfT = setTimeout(function () { ScrollTrigger.refresh(); }, 140); }

  /* ---------- accordions: animate a wrapper, native <details> still works without JS ---------- */
  D.addEventListener('click', function (e) {
    var s = e.target.closest('details.acc>summary'); if (!s) return;
    var d = s.parentElement, b = d.querySelector('.acc-b');
    if (RM || !b || !b.animate) { setTimeout(refreshSoon, 0); return; }
    e.preventDefault();
    /* transform/opacity only: the panel opens to its natural height at once and its content
       slides/fades in; closing fades out first, then collapses (one layout change each way) */
    var inner = b.firstElementChild || b;
    if (d._a) { d._a.cancel(); d._a = null; }
    if (!d.open || d._closing) {
      d._closing = false; d.open = true; refreshSoon();
      d._a = inner.animate([{ transform: 'translateY(-14px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      d._a.onfinish = function () { d._a = null; };
    } else {
      d._closing = true;
      d._a = inner.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-10px)', opacity: 0 }], { duration: 220, easing: 'cubic-bezier(.65,0,.35,1)' });
      d._a.onfinish = function () { d.open = false; d._closing = false; d._a = null; refreshSoon(); };
    }
  });

  /* ---------- forms ---------- */
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  D.addEventListener('input', function (e) {
    var f = e.target.closest('.fld.bad'); if (!f) return;
    f.classList.remove('bad'); e.target.removeAttribute('aria-invalid'); var er = $('.er', f); if (er) er.textContent = '';
  });
  D.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-form]'); if (!f) return;
    e.preventDefault();
    var bad = null;
    $$('input,textarea', f).forEach(function (i) {
      var fld = i.closest('.fld'), er = fld && $('.er', fld), v = i.value.trim(), msg = '';
      var nm = (fld && $('label', fld).firstChild.textContent.trim().toLowerCase()) || 'details';
      if (i.required && !v) msg = 'Please add your ' + nm + '.';
      else if (i.type === 'email' && v && !EMAIL.test(v)) msg = 'Please enter a valid email address.';
      if (fld) fld.classList.toggle('bad', !!msg);
      if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
      if (er) er.textContent = msg;
      if (msg && !bad) bad = i;
    });
    if (bad) { bad.focus(); if (anim) gsap.fromTo(f, { x: -8 }, { x: 0, duration: .6, ease: 'elastic.out(1,.3)', clearProps: 'transform' }); return; }
    var data = {}; $$('input,textarea', f).forEach(function (i) { data[i.name] = i.value.trim(); });
    var news = f.dataset.form === 'news', ep = news ? CONTACT.newsletterEndpoint : CONTACT.formEndpoint;
    var btn = $('[type=submit]', f), fe = $('.fm-er', f); if (btn) btn.disabled = true;
    if (fe) fe.textContent = '';
    // the success box follows its form; fall back to any .ok in the same container
    var ok = f.nextElementSibling;
    if (!ok || !ok.classList.contains('ok')) ok = f.parentElement && $$('.ok', f.parentElement).filter(function (o) { return o.parentElement === f.parentElement; })[0];
    var mailto = function () {
      var subj = news ? 'Newsletter: Stay in the loop' : 'Hello from ' + (data.name || 'the website') + (data.organisation ? ' (' + data.organisation + ')' : '');
      var body = news ? 'Please add ' + data.email + ' to the NiaDelta newsletter.' : (data.message || '') + '\n\n' + (data.name || '') + '\n' + (data.email || '') + (data.organisation ? '\n' + data.organisation : '');
      return 'mailto:' + esc(CONTACT.email) + '?subject=' + encodeURIComponent(subj) + '&amp;body=' + encodeURIComponent(body);
    };
    // endpoint configured but the request failed: keep the form (and what was typed), explain, offer email instead
    var fail = function () {
      if (btn) btn.disabled = false;
      if (!fe) { fe = D.createElement('p'); fe.className = 'er fm-er'; fe.setAttribute('role', 'alert'); f.appendChild(fe); }
      fe.innerHTML = 'Sorry, that did not go through. Please try again' + (CONTACT.email ? ' or <a class="lk" href="' + mailto() + '">email ' + esc(CONTACT.email) + '</a>' : '') + '.';
      refreshSoon();
    };
    var done = function (sent) {
      if (!ok) { if (btn) btn.disabled = false; return; }
      var m = $('.ok-m', ok);
      // No endpoint configured: the prefilled mailto link is the real delivery path.
      if (!sent && CONTACT.email && m) m.innerHTML = 'To make sure it reaches us, <a class="lk" href="' + mailto() + '">send it to ' + esc(CONTACT.email) + '</a>.';
      f.hidden = true; ok.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { ok.classList.add('on'); }); });
      ok.focus({ preventScroll: true });
      var r = ok.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + Math.min(r.height, 200) / 2);
      refreshSoon();
    };
    if (ep && W.fetch) {
      fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (r.ok) done(true); else fail(); }).catch(fail);
    } else done(false);
  });

  /* ---------- confetti ---------- */
  function confetti(ox, oy) {
    if (RM) return;
    var c = $('#cf'), x = c.getContext('2d'), dpr = Math.min(W.devicePixelRatio || 1, 2), w = W.innerWidth, h = W.innerHeight;
    c.width = w * dpr; c.height = h * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    ox = ox == null ? w / 2 : ox; oy = oy == null ? h * .6 : oy;
    var cols = ['#E8553D', '#F8B518', '#1F8A8A', '#FFC9A3', '#0B2A3D'];
    var P = []; for (var i = 0; i < 140; i++) { var a = -Math.PI / 2 + (Math.random() - .5) * 2.2, sp = 7 + Math.random() * 11; P.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: Math.random() * 6, vr: (Math.random() - .5) * .35, s: 6 + Math.random() * 7, c: cols[i % 5], k: i % 3, w: Math.random() * 6 }); }
    var t = 0;
    (function f() {
      x.clearRect(0, 0, w, h);
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.vy += .32; p.vx *= .985; p.vy *= .992; p.x += p.vx + Math.sin((t + p.w) * .12) * .6; p.y += p.vy; p.r += p.vr;
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.globalAlpha = t > 120 ? Math.max(0, 1 - (t - 120) / 50) : 1;
        if (p.k === 0) x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        else if (p.k === 1) { x.beginPath(); x.arc(0, 0, p.s / 3, 0, 6.283); x.fill(); }
        else { x.beginPath(); x.moveTo(0, -p.s / 2); x.lineTo(p.s / 2, p.s / 2); x.lineTo(-p.s / 2, p.s / 2); x.closePath(); x.fill(); }
        x.restore();
      }
      if (++t < 170) requestAnimationFrame(f); else x.clearRect(0, 0, w, h);
    })();
  }

  /* ---------- page transition: page turn + bands + pencil writing the page title ---------- */
  var tr = $('#tr'), bands = $$('.bd', tr), sweep = $('.sweep', tr), tcard = $('#tcard'), tt = $('#tt'), ttg = $('#ttg'), ttx = $('#ttx'), pen = $('#pen'), tk = $('#tk'), tsq = $('.tc-sq path', tcard);
  var NS = 'http://www.w3.org/2000/svg';
  /* Hand-authored single-stroke monoline script (lowercase, connected). Units: baseline y=100,
     x-height y=60; each glyph is M + absolute C segments, its last point is the exit stroke.
     Glyphs in a word are joined by a generated connector that keeps tangent continuity, so each
     word is ONE continuous pen stroke; t-crosses are second strokes written after the word. */
  var GL = {
    o: 'M10 61C14 60 19 60 23 61C11 61 4 71 4 83C4 94 10 101 17 101C26 101 31 91 31 80C31 69 27 62 22 61C19 60.5 18 64 21 65.5C25 67 32 64 38 61',
    h: 'M4 86C15 70 23 46 22 28C21 16 17 11 12 13C8 15 6 30 6 50C6 70 6 86 6 100C8 84 14 62 22 62C30 62 30 72 29 82C28 92 29 100 34 100C37 100 40 98 42 96',
    m: 'M4 74C6 68 9 62 12 62C16 62 16 72 15 84C14 92 14 97 14 100C16 84 20 62 28 62C35 62 35 72 34 84C33 92 33 97 33 100C35 84 39 62 47 62C54 62 54 72 53 82C52 92 53 100 58 100C61 100 64 98 66 96',
    e: 'M4 86C14 85 26 79 26 70C26 64 22 61 18 61C10 61 6 72 6 84C6 94 12 100 20 100C26 100 30 97 34 93',
    w: 'M2 68C4 64 7 61 10 62C12 64 8 76 8 86C8 95 11 100 16 100C21 100 24 92 24 80C24 72 24 66 24 64C24 80 27 100 34 100C41 100 44 90 44 78C44 70 43 65 41 62C39 64 39 67 43 67C47 67 51 64 56 62',
    a: 'M12 61C16 60 21 60 25 62C14 60 5 70 5 83C5 94 10 100 16 100C23 100 28 92 30 80C31 72 31 66 31 61C31 74 30 88 31 96C32 99 34 100 37 100C40 100 42 98 44 96',
    r: 'M4 88C8 78 11 68 13 58C15 62 19 63 24 62C24 72 22 86 23 96C24 99 26 100 29 100C32 100 35 98 37 96',
    t: 'M4 88C9 72 14 50 16 28C16 50 14 76 15 92C15 98 18 100 22 100C26 100 30 97 33 94',
    d: 'M12 61C16 60 21 60 25 62C14 60 5 70 5 83C5 94 10 100 16 100C23 100 28 92 30 80C32 60 33 36 34 16C33 40 31 70 31 92C31 98 34 100 37 100C40 100 43 98 45 96',
    s: 'M4 92C9 82 13 72 15 59C22 68 28 78 27 88C26 96 20 100 13 100C9 100 6 98 6 95C12 99 22 99 33 95',
    y: 'M4 70C6 65 8 62 10 62C13 63 10 74 10 84C10 94 14 100 19 100C25 100 29 92 30 80C30 72 30 66 30 62C30 90 30 120 28 132C26 142 20 146 16 144C12 142 13 134 20 126C26 118 34 106 40 98',
    l: 'M4 88C15 72 24 46 23 28C22 16 18 12 14 13C9 15 8 28 8 50C8 70 8 88 10 95C11 99 14 100 17 100C21 100 24 98 27 95'
  };
  var GENT = { o: 1, a: 1, d: 1 }; // first segment is the join along the bowl top: dropped at the start of a word
  var GXT = { t: 'M6 57C12 56 20 56 29 55' };
  function scriptStrokes(title) {
    var SL = .2, GAP = 24, out = [], x = 0;
    var r1 = function (v) { return Math.round(v * 10) / 10; };
    var pts = function (d, ox) { var n = d.match(/-?\d*\.?\d+/g).map(Number), p = []; for (var i = 0; i < n.length; i += 2) p.push([r1(n[i] + ox + SL * (100 - n[i + 1])), n[i + 1]]); return p; };
    var unit = function (a, b) { var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    var P = function (x, y) { return [r1(x), r1(y)]; };
    // a letter the hand has no glyph for: the caller sets the title as type instead (never a garbled word)
    if (!/\S/.test(title) || Array.from(title.toLowerCase()).some(function (ch) { return !/\s/.test(ch) && !GL[ch]; })) return null;
    title.toLowerCase().trim().split(/\s+/).forEach(function (word, wi) {
      if (wi) x += GAP;
      var S = [], last = null, lastC = null, extra = [];
      Array.from(word).forEach(function (ch) {
        var g = GL[ch]; if (!g) return;
        var ox = x + (last ? 2 : 0), p = pts(g, ox); if (GENT[ch] && !last) p = p.slice(3);
        var s = p[0], d1 = unit(s, p[1]);
        if (!last) {
          if (d1[1] < -.2 && d1[0] > 0) { var a = P(s[0] - 9, Math.min(s[1] + 9, 99)); S.push(a, P(a[0] + 4, a[1]), P(s[0] - d1[0] * 4, s[1] - d1[1] * 4), s); }
          else S.push(s);
        } else {
          var d0 = unit(lastC, last), L = Math.hypot(s[0] - last[0], s[1] - last[1]) * .42;
          S.push(P(last[0] + d0[0] * L, last[1] + d0[1] * L), P(s[0] - d1[0] * L, s[1] - d1[1] * L), s);
        }
        for (var i = 1; i < p.length; i++) S.push(p[i]);
        if (GXT[ch]) extra.push(pts(GXT[ch], ox));
        last = p[p.length - 1]; lastC = p[p.length - 2]; x = last[0];
      });
      if (S.length > 1) out.push(S);
      extra.forEach(function (e) { out.push(e); });
    });
    // each stroke: M + cubic triples; flatten to an arc-length table (pure maths, no DOM measuring)
    return out.map(function (S) {
      var d = 'M' + S[0].join(' '), fx = [S[0][0]], fy = [S[0][1]], fl = [0], L = 0, N = 20;
      for (var i = 1; i + 2 < S.length; i += 3) {
        var p0 = S[i - 1], c1 = S[i], c2 = S[i + 1], p1 = S[i + 2];
        d += 'C' + c1.join(' ') + ' ' + c2.join(' ') + ' ' + p1.join(' ');
        for (var k = 1; k <= N; k++) {
          var t = k / N, u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, e = t * t * t;
          var X = a * p0[0] + b * c1[0] + c * c2[0] + e * p1[0], Y = a * p0[1] + b * c1[1] + c * c2[1] + e * p1[1];
          L += Math.hypot(X - fx[fx.length - 1], Y - fy[fy.length - 1]); fx.push(X); fy.push(Y); fl.push(L);
        }
      }
      return { d: d, fx: fx, fy: fy, fl: fl, len: L };
    });
  }
  /* Build the strokes, fit them to the card (one line, any width from 320px), then precompute the pen
     route: arc-length samples every STEP units per stroke + pen-lift hops between strokes, in display px.
     drawTitle() only reads these tables (no layout reads per frame). Geometry is cached per title. */
  var STEP = 2, scriptCache = {};
  function prepTitle(title) {
    var G0 = scriptCache.hasOwnProperty(title) ? scriptCache[title] : (scriptCache[title] = scriptStrokes(title));
    while (ttg.firstChild) ttg.removeChild(ttg.firstChild);
    // no script glyphs for this title: set it in the serif and wipe it in (no pen)
    tt.style.display = G0 ? '' : 'none'; ttx.hidden = !!G0;
    if (!G0) { ttx.textContent = title; drawTitle({ text: 1 }, 0); return { text: 1, total: 1, s: 1, ps: 1 }; }
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    G0.forEach(function (g) { for (var i = 0; i < g.fx.length; i++) { if (g.fx[i] < x0) x0 = g.fx[i]; if (g.fx[i] > x1) x1 = g.fx[i]; if (g.fy[i] < y0) y0 = g.fy[i]; if (g.fy[i] > y1) y1 = g.fy[i]; } });
    var cs = getComputedStyle(tcard), cardMax = Math.min(W.innerWidth * .92, 980);
    var maxW = cardMax - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0) - 8;
    var sMax = clamp(W.innerWidth * .0014, 1, 2), pad = 6;
    var vx = x0 - pad, vy = y0 - pad, vw = x1 - x0 + pad * 2, vh = y1 - y0 + pad * 2;
    var s = Math.min(sMax, maxW / vw, W.innerHeight * .4 / vh);
    var sw = clamp(2.2 + s * .9, 3, 4);
    tt.setAttribute('viewBox', vx.toFixed(1) + ' ' + vy.toFixed(1) + ' ' + vw.toFixed(1) + ' ' + vh.toFixed(1));
    tt.setAttribute('width', Math.ceil(vw * s)); tt.setAttribute('height', Math.ceil(vh * s));
    ttg.style.strokeWidth = (sw / s).toFixed(2);
    var segs = [], t = 0, prevEnd = null;
    G0.forEach(function (g) {
      var p = D.createElementNS(NS, 'path'), len = g.len;
      p.setAttribute('d', g.d); p.setAttribute('pathLength', len.toFixed(2)); ttg.appendChild(p);
      var n = Math.ceil(len / STEP), xs = new Float32Array(n + 1), ys = new Float32Array(n + 1), j = 0;
      for (var k = 0; k <= n; k++) {
        var at = Math.min(len, k * STEP);
        while (j < g.fl.length - 2 && g.fl[j + 1] < at) j++;
        var span = g.fl[j + 1] - g.fl[j] || 1, f = clamp((at - g.fl[j]) / span, 0, 1);
        xs[k] = (lerp(g.fx[j], g.fx[j + 1], f) - vx) * s; ys[k] = (lerp(g.fy[j], g.fy[j + 1], f) - vy) * s;
      }
      p.style.strokeDasharray = len.toFixed(1) + ' ' + (len + 8).toFixed(1); p.style.strokeDashoffset = len.toFixed(1); p.style.opacity = 0;
      if (prevEnd) {
        // pen lift: travel through the air to the next stroke; time grows gently with distance
        var dist = Math.hypot(xs[0] - prevEnd[0], ys[0] - prevEnd[1]) / s;
        segs.push({ lift: 1, t0: t, t1: t + 34 + dist * .35, a: prevEnd, b: [xs[0], ys[0]] }); t = segs[segs.length - 1].t1;
      }
      segs.push({ el: p, len: len, xs: xs, ys: ys, n: n, t0: t, t1: t + len, last: -1 }); t += len;
      prevEnd = [xs[n], ys[n]];
    });
    return { segs: segs, total: t || 1, s: s, ps: clamp(.6 + s * .32, .8, 1.26) };
  }
  function penAt(x, y, lift, ang, ps) {
    pen.style.transform = 'translate(' + (x - 12).toFixed(1) + 'px,' + (y - 64 - lift).toFixed(1) + 'px) rotate(' + ang.toFixed(1) + 'deg) scale(' + (ps * (1 + lift * .004)).toFixed(3) + ')';
  }
  function drawTitle(T, p) {
    if (T.text) { ttx.style.clipPath = 'inset(-20% ' + ((1 - p) * 100).toFixed(2) + '% -20% 0)'; ttx.style.opacity = Math.min(1, p * 3).toFixed(3); return; }
    var t = p * T.total, segs = T.segs, cur = null;
    for (var i = 0; i < segs.length; i++) {
      var g = segs[i]; if (t >= g.t0 || !cur) cur = g; // last segment that has started
      if (g.lift) continue;
      var dr = clamp(t - g.t0, 0, g.len), v = Math.round((g.len - dr) * 10) / 10;
      if (g.last !== v) {
        if (g.last < 0 || (g.last >= g.len) !== (v >= g.len)) g.el.style.opacity = v < g.len ? 1 : 0;
        g.last = v; g.el.style.strokeDashoffset = v;
      }
    }
    if (!cur) return;
    if (cur.lift) {
      var u = (t - cur.t0) / (cur.t1 - cur.t0), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      penAt(lerp(cur.a[0], cur.b[0], e), lerp(cur.a[1], cur.b[1], e), Math.sin(u * Math.PI) * 16 * T.ps, 24 - Math.sin(u * Math.PI) * 6, T.ps);
      return;
    }
    // the nib sits exactly on the current end of the ink: interpolate the precomputed samples
    var d = clamp(t - cur.t0, 0, cur.len) / STEP, k = Math.min(Math.floor(d), cur.n - 1), fr = d - k;
    if (k < 0) k = 0;
    var x = lerp(cur.xs[k], cur.xs[k + 1], fr), y = lerp(cur.ys[k], cur.ys[k + 1], fr);
    // slight rock of the pencil with the horizontal direction of travel (from the sample table)
    var dx = cur.xs[Math.min(k + 3, cur.n)] - cur.xs[Math.max(k - 3, 0)];
    var end = t >= cur.t1 ? Math.min(1, (t - cur.t1) / 60) : 0;
    penAt(x, y, end * 10 * T.ps, 22 + clamp(dx * .5, -5, 5), T.ps);
  }
  /* is a pinned story on screen? (a transformed #app would turn its position:fixed pin into an absolute box) */
  function pinLive() { var y = W.scrollY; return ScrollTrigger.getAll().some(function (t) { return t.pin && (t.isActive || (y > t.start - 2 && y < t.end + 2)); }); }
  /* page turn: #app hinges on its left edge (at the viewport's middle) and lifts toward the viewer;
     the incoming page settles from a gentle opposite tilt. Written straight to style.transform from
     GSAP-driven proxies, cleared on finish and before any ScrollTrigger refresh. */
  var turning = false;
  function turnSet(deg, sc) {
    if (!turning) return;
    app.style.transform = 'perspective(' + Math.round(W.innerWidth * 1.7) + 'px) rotateY(' + deg.toFixed(3) + 'deg) scale(' + sc.toFixed(4) + ')';
  }
  function turnOn() { turning = true; app.style.transformOrigin = '0px ' + Math.round(W.scrollY + W.innerHeight / 2) + 'px'; app.style.willChange = 'transform'; }
  function turnOff() { turning = false; app.style.transform = ''; app.style.transformOrigin = ''; app.style.willChange = ''; }
  if (G) ScrollTrigger.addEventListener('refreshInit', function () { if (turning) turnOff(); });
  function transit(n, pg, swap) {
    return new Promise(function (res) {
      var finished = false, swapped = false, T = null, pr = { p: 0 }, po = { v: 0 }, pi = { v: 1 };
      var doSwap = function () {
        if (swapped) return; swapped = true;
        turnOff();
        try { swap(); } catch (e) { console.error(e); }
        if (!finished && !pinLive()) { turnOn(); turnSet(4 * pi.v, 1 - .014 * pi.v); }
      };
      var finish = function () {
        if (finished) return; finished = true; clearTimeout(fs);
        if (curTl) { curTl.kill(); }
        doSwap(); turnOff();
        gsap.set(bands, { y: 0, yPercent: 102 }); gsap.set([tcard, sweep, pen], { autoAlpha: 0 });
        tr.classList.remove('on'); tcard.style.willChange = '';
        app.inert = false;
        res();
      };
      var fs = setTimeout(finish, 6500);
      try {
        var title = TITLES[pg], sub = label(n);
        tk.textContent = sub && sub !== title ? sub : 'NiaDelta';
        app.inert = true; // keyboard cannot act on the outgoing page during the transition
        tr.classList.add('on');
        T = prepTitle(title);
        gsap.set(tsq, { strokeDashoffset: 1, autoAlpha: 0 });
        gsap.set(pen, { autoAlpha: 0 });
        drawTitle(T, 0);
        if (!pinLive()) turnOn();
        tcard.style.willChange = 'transform,opacity';
        var dur = clamp(T.total / 1350, 1, 1.5);
        /* phase 2 starts two frames after the swap: rendering the new page can take a long frame on slow
           devices, and with lagSmoothing(0) one timeline would jump straight past the card's entrance */
        var phase2 = function () {
          if (finished) return;
          var tl2 = gsap.timeline({ onComplete: finish }); curTl = tl2;
          if (queued) tl2.timeScale(2.4);
          tl2.to(tcard, { autoAlpha: 1, scale: 1, rotate: -1, y: 0, duration: .5, ease: 'back.out(1.5)' }, 0)
            .to(pen, { autoAlpha: T.text ? 0 : 1, duration: .2 }, .12)
            .to(pr, { p: 1, duration: dur, ease: 'sine.inOut', onUpdate: function () { drawTitle(T, pr.p); } }, .22)
            .to(tsq, { strokeDashoffset: 0, autoAlpha: 1, duration: .4, ease: 'power2.out' }, '>-.08')
            .to(pen, { autoAlpha: 0, duration: .28 }, '<')
            .to(tcard, { autoAlpha: 0, y: -18, rotate: 1, duration: .32, ease: 'power2.in' }, '+=.14')
            .add(intro, '<.14')
            .to(bands, { yPercent: -102, duration: .62, ease: 'power3.inOut', stagger: { each: .05, from: 'end' } }, '<')
            // incoming page settles flat from the opposite tilt as the bands lift
            .to(pi, { v: 0, duration: .8, ease: 'power3.out', onUpdate: function () { turnSet(4 * pi.v, 1 - .014 * pi.v); } }, '<.05');
        };
        var tl = gsap.timeline({ onComplete: function () { doSwap(); requestAnimationFrame(function () { requestAnimationFrame(phase2); }); } }); curTl = tl;
        tl.set(bands, { y: 0, yPercent: 102 }).set(tcard, { autoAlpha: 0, scale: .94, rotate: -2.5, y: 10 })
          // outgoing page lifts from its right edge (hinge on the left) while the paper shadow passes over it
          .to(po, { v: 1, duration: .72, ease: 'power2.inOut', onUpdate: function () { turnSet(-8 * po.v, 1 - .015 * po.v); } }, 0)
          .fromTo(sweep, { xPercent: 55, autoAlpha: 0 }, { xPercent: -25, autoAlpha: 1, duration: .62, ease: 'sine.inOut' }, .04)
          // bands follow the turn: right-hand strip lands first
          .to(bands, { yPercent: 0, duration: .56, ease: 'power3.inOut', stagger: { each: .05, from: 'end' } }, .16)
          .set(sweep, { autoAlpha: 0 });
      } catch (e) { console.error(e); finish(); }
    });
  }

  /* ---------- header hide on scroll down, show on scroll up ---------- */
  var lastY = 0, sTick = false;
  W.addEventListener('scroll', function () {
    if (magEl) magRect = null; if (tiltEl) tiltRect = null; if (labEl) { labRect = null; pKick(); }
    if (sTick) return; sTick = true;
    requestAnimationFrame(function () {
      sTick = false; var y = W.scrollY;
      hd.classList.toggle('s', y > 8);
      if (!busy && !openP && !hd.contains(D.activeElement) && Date.now() > holdHd) {
        if (y > lastY + 6 && y > 240) hd.classList.add('hide');
        else if (y < lastY - 6 || y < 240) hd.classList.remove('hide');
      }
      lastY = y;
    });
  }, { passive: true });
  hd.addEventListener('focusin', function () { hd.classList.remove('hide'); });

  /* ---------- pointer: cursor, magnet, tilt, hero parallax (one rAF loop) ---------- */
  var cur$ = $('#cur'), cd = $('.cd', cur$), cr = $('.cr', cur$), cl = $('.cu-l', cur$);
  var mx = -100, my = -100, rx = -100, ry = -100, pRaf = 0, moved = false;
  var magEl = null, magRect = null, mgx = 0, mgy = 0, mtx = 0, mty = 0, magOld = [];
  var tiltEl = null, tiltRect = null, tlx = 0, tly = 0, ttx2 = 0, tty = 0, tiltOld = [];
  var labEl = null, labRect = null;
  var useCur = FINE && !RM, useFx = FINE && !RM;
  if (useCur) root.classList.add('has-cur');
  function pKick() { if (!pRaf) pRaf = requestAnimationFrame(pStep); }
  function pStep() {
    pRaf = 0; var more = false;
    if (useCur) {
      cd.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      /* label bubble keeps off the copy: on card-sized targets it docks on the top-right corner like a sticker,
         on wide rows it trails 50/46px down-right of the pointer (the dot stays on the pointer) */
      var gx = mx, gy = my;
      if (labEl && !labEl.isConnected) { labEl = null; cur$.classList.remove('lab'); } // page swapped under the pointer
      if (labEl) {
        if (!labRect) labRect = labEl.getBoundingClientRect();
        if (labRect.width <= 560) { gx = Math.min(labRect.right - 8, W.innerWidth - 34); gy = Math.max(labRect.top + 8, 34); }
        else { gx = mx + 50; gy = my + 46; }
      }
      rx = lerp(rx, gx, .2); ry = lerp(ry, gy, .2);
      cr.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      if (Math.abs(rx - gx) > .3 || Math.abs(ry - gy) > .3) more = true;
    }
    if (magEl) {
      if (!magRect) magRect = magEl.getBoundingClientRect();
      var r = magRect, dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
      mtx = clamp(dx * .28, -14, 14); mty = clamp(dy * .36, -10, 10);
    }
    mgx = lerp(mgx, mtx, .18); mgy = lerp(mgy, mty, .18);
    if (magEl) { magEl.style.transform = 'translate3d(' + mgx.toFixed(2) + 'px,' + mgy.toFixed(2) + 'px,0)'; var sp = magEl.firstElementChild; if (sp) sp.style.transform = 'translate3d(' + (mgx * .35).toFixed(2) + 'px,' + (mgy * .35).toFixed(2) + 'px,0)'; }
    if (Math.abs(mgx - mtx) > .05 || Math.abs(mgy - mty) > .05) more = true;
    if (tiltEl) {
      if (!tiltRect) tiltRect = tiltEl.getBoundingClientRect();
      var q = tiltRect; ttx2 = clamp((mx - q.left) / q.width - .5, -.5, .5) * 7; tty = -clamp((my - q.top) / q.height - .5, -.5, .5) * 7;
      tlx = lerp(tlx, ttx2, .14); tly = lerp(tly, tty, .14);
      // a flat paper lean toward the pointer (2D: a perspective tilt split the card's hard shadow into misaligned raster tiles)
      tiltEl.style.transform = 'translate(' + (tlx * .8).toFixed(2) + 'px,' + (-tly * .8).toFixed(2) + 'px) rotate(' + (tlx * .16).toFixed(3) + 'deg)';
      if (Math.abs(tlx - ttx2) > .02 || Math.abs(tly - tty) > .02) more = true;
    }
    if (more) pKick();
  }
  function releaseMag(el) {
    if (!el) return; var sp = el.firstElementChild;
    el.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1)'; el.style.transform = '';
    if (sp) { sp.style.transform = ''; }
    setTimeout(function () { el.style.transition = ''; }, 700);
    mgx = mgy = mtx = mty = 0;
  }
  function releaseTilt(el) {
    if (!el) return; el.classList.add('tilt-rel'); el.style.transform = '';
    setTimeout(function () { el.classList.remove('tilt-rel'); }, 700);
    tlx = tly = 0;
  }
  if (FINE || useCur) {
    D.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY;
      if (useCur && !moved) { moved = true; rx = mx; ry = my; cur$.classList.remove('out'); }
      if (par && heroVis) { par.tx = mx / W.innerWidth * 2 - 1; par.ty = my / W.innerHeight * 2 - 1; parKick(); }
      if (useCur || magEl || tiltEl) pKick();
    }, { passive: true });
    D.addEventListener('pointerover', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var t = e.target;
      if (useFx) {
        var m = t.closest && t.closest('.mag');
        if (m !== magEl) { releaseMag(magEl); magEl = m; magRect = null; }
        var tl = t.closest && t.closest('[data-tilt]');
        if (tl !== tiltEl) { releaseTilt(tiltEl); tiltEl = tl; tiltRect = null; }
      }
      if (useCur) {
        var lab = t.closest && t.closest('[data-cursor]');
        var txt = t.closest && t.closest('input,textarea,select');
        var hov = t.closest && t.closest('a,button,summary,label,[data-tilt]');
        cur$.classList.toggle('txt', !!txt);
        cur$.classList.toggle('lab', !!lab && !txt);
        var nv = !!hov && !!(t.closest && t.closest('#hd'));
        cur$.classList.toggle('nv', nv && !lab && !txt);
        cur$.classList.toggle('hov', !!hov && !lab && !txt && !nv);
        if (lab) cl.textContent = lab.dataset.cursor;
        var nl = lab && !txt ? lab : null; if (nl !== labEl) { labEl = nl; labRect = null; pKick(); }
      }
    }, { passive: true });
    if (useCur) {
      D.addEventListener('pointerdown', function () { cur$.classList.add('down'); }, { passive: true });
      D.addEventListener('pointerup', function () { cur$.classList.remove('down'); }, { passive: true });
      D.documentElement.addEventListener('mouseleave', function () { cur$.classList.add('out'); });
      D.documentElement.addEventListener('mouseenter', function () { cur$.classList.remove('out'); });
    }
  }

  /* ---------- resize ---------- */
  /* width changes always re-lay out; height changes too (captions and stage size depend on it), except the
     small ones a touch browser makes while its URL bar slides in and out */
  var rw0 = W.innerWidth, rh0 = W.innerHeight, rzT = 0;
  W.addEventListener('resize', function () {
    clearTimeout(rzT);
    rzT = setTimeout(function () {
      magRect = tiltRect = labRect = null;
      var dh = Math.abs(W.innerHeight - rh0);
      if (W.innerWidth === rw0 && (dh === 0 || (!FINE && dh < 120))) return;
      rw0 = W.innerWidth; rh0 = W.innerHeight;
      resizers.forEach(function (f) { f(); });
      if (G) ScrollTrigger.refresh();
    }, 220);
  });

  /* ---------- loader: sun rises, icons assemble into a delta ---------- */
  function loader() {
    if (!ld) return Promise.resolve();
    if (RM) { ld.remove(); return Promise.resolve(); }
    return new Promise(function (res) {
      lockOn('ld'); lstop('ld');
      var rays = $('#ld-rays'), sun = $('#ld-sun'), tri = $('#ld-tri'), pc = $('#pc'), gIc = $('#ld-ics');
      var rh = ''; for (var i = 0; i < 12; i++) rh += '<path d="M0 -62V-80" transform="rotate(' + i * 30 + ')"/>'; rays.innerHTML = rh;
      var NAMES = ['book', 'pencil', 'sprout', 'spark', 'chat'];
      var TG = [[200, 30], [40, 300], [360, 300], [120, 165], [280, 165]];
      var S0 = [[26, 52], [374, 84], [6, 214], [394, 232], [292, -26]];
      gIc.innerHTML = NAMES.map(function (n) { return '<g class="ld-ic"><circle r="21"/><use href="#i-' + n + '" x="-12" y="-12" width="24" height="24"/></g>'; }).join('');
      var ics = $$('.ld-ic', gIc);
      var target = .06, shown = 0, skip = false, t0 = performance.now(), ended = false;
      var bump = function (v) { target = Math.max(target, v); };
      if (D.fonts && D.fonts.ready) D.fonts.ready.then(function () { bump(.45); });
      else bump(.45);
      var hi = $('#app img');
      Promise.race([hi && hi.decode ? hi.decode() : Promise.resolve(), new Promise(function (r) { setTimeout(r, 2600); })]).catch(function () { }).then(function () { bump(.8); });
      if (D.readyState === 'complete') bump(1); else W.addEventListener('load', function () { bump(1); });
      setTimeout(function () { bump(1); }, 4200);
      if (!G) bump(1); // CDN failed or stalled (watchdog boot): the visitor has waited enough already
      // taps made before this script booted were recorded by the inline loader script (window.__niaSkip)
      var skipNow = function () { skip = true; };
      // the visitor asked to skip while the page was still booting: no ramp, exit on the first frame
      if (W.__niaSkip) { skip = true; shown = 1; }
      ld.addEventListener('pointerdown', skipNow, { passive: true }); ld.addEventListener('click', skipNow);
      var eo = function (t) { return 1 - Math.pow(1 - t, 3); };
      var back = function (t) { var c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
      (function f(now) {
        now = now || performance.now();
        if (W.__niaSkip) skip = true;
        var goal = skip ? 1 : Math.min(target, (now - t0) / 1700);
        shown += (goal - shown) * (skip ? .42 : .075);
        if (goal >= 1 && shown > .996) shown = 1;
        sun.setAttribute('transform', 'translate(200 ' + (372 - eo(shown) * 164).toFixed(1) + ') rotate(' + ((now - t0) * .012).toFixed(1) + ')');
        rays.style.opacity = clamp(shown * 1.4 - .2, 0, 1);
        tri.style.strokeDashoffset = (1 - clamp((shown - .4) / .55, 0, 1)).toFixed(4);
        for (var i = 0; i < ics.length; i++) {
          var a = clamp((shown - (.22 + i * .07)) / .4, 0, 1), e = back(a), bob = Math.sin(now / 520 + i * 1.7) * 7 * (1 - a);
          var x = lerp(S0[i][0], TG[i][0], e), y = lerp(S0[i][1], TG[i][1], e) + bob;
          ics[i].setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') scale(' + (.9 + .1 * a).toFixed(3) + ') rotate(' + ((1 - a) * (i % 2 ? 14 : -14)).toFixed(1) + ')');
        }
        var pv = Math.round(shown * 100); if (pc._v !== pv) { pc._v = pv; pc.textContent = pv; }
        if (shown < 1) return requestAnimationFrame(f);
        if (ended) return; ended = true;
        setTimeout(function () {
          // a skip is an explicit "let me in": shorter exit so the page is usable in well under 1.5s
          if (skip) ld.classList.add('fast');
          ld.classList.add('out'); lockOff('ld'); lstart('ld');
          setTimeout(res, 260);
          setTimeout(function () { ld.remove(); }, 1250);
        }, skip ? 40 : 160);
      })();
    });
  }

  /* ---------- go ---------- */
  W.NIA = { C: CONTACT, route: route, state: function () { return { cur: cur, busy: busy, queued: queued, lenisStopped: lenisStopped() }; } };
  var first = parse(location.hash) || 'home';
  route(first, { first: true });
  /* deep link: the first jump happens before web fonts, the loader exit and pin refreshes have settled the
     layout, so keep the anchor in place through those until the visitor scrolls or navigates */
  var held = false, holdEnd = Infinity;
  var hold = function () { if (!locks.ld) held = true; };
  ['wheel', 'touchmove', 'keydown', 'pointerdown'].forEach(function (t) { W.addEventListener(t, hold, { passive: true }); });
  var reJump = function () { if (!held && !busy && curN === first && Math.abs(W.scrollY - yOf(first)) > 2) jump(first); };
  if (G) ScrollTrigger.addEventListener('refresh', function () { if (performance.now() < holdEnd) reJump(); });
  var fontsP = D.fonts && D.fonts.ready ? D.fonts.ready.then(function () { if (G) ScrollTrigger.refresh(); else reJump(); }) : Promise.resolve();
  loader().then(function () {
    intro(); revealSweep(); holdEnd = performance.now() + 2000;
    return fontsP;
  }).then(function () { requestAnimationFrame(function () { if (G) ScrollTrigger.refresh(); else reJump(); }); });
}
/* Never let the CDN gate the first render: deferred CDN scripts hold back DOMContentLoaded, so a CDN
   that hangs (rather than failing fast) would leave a blank page. This script runs at the end of <body>,
   so the DOM it needs is already parsed; if DOMContentLoaded has not fired within 2.5s, boot without
   GSAP/Lenis (static, fully readable mode). Late CDN arrivals are then ignored. */
var booted = false;
function go() { if (booted) return; booted = true; boot(); }
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', go); setTimeout(go, 2500); } else go();
})();
