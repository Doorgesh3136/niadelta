# NiaDelta v2 build spec (shared contract for all agents)

Project root: `C:\Users\Darsh\Desktop\EduWebsite\niadelta`
Output: ONE self-contained file `dist/niadelta.html`, produced by `node build.mjs` from `src/`.
Tooling lives in `C:\Users\Darsh\AppData\Local\Temp\claude\C--Users-Darsh-Desktop-EduWebsite\4422bc4f-215a-4b0e-a5e1-9ab78026887d\scratchpad\tools` (has `playwright` + chromium and `sharp` in node_modules). Run node scripts from there or set NODE_PATH to its node_modules.

## Source layout (each file owned by exactly one builder)
| file | owner | contents |
|---|---|---|
| `src/shell.html` | CORE | `<!DOCTYPE html>` … head, inline SVG symbol sprite + filters, loader markup, header, `#app`, dock, sheet, transition layer, cursor, noscript fallback. Placeholders `/*@CSS*/`, `/*@ASSETS*/`, `/*@SCENES*/`, `/*@CONTENT*/`, `/*@CORE*/` |
| `src/styles.css` | CORE | all CSS (scene-specific CSS goes in `src/scenes.css`) |
| `src/content.js` | CORE | `window.NIA_CONTENT` + page template functions (all copy lives here) |
| `src/core.js` | CORE | router, loader, transitions, Lenis/GSAP setup, story pinning engine, micro-interactions, forms, confetti |
| `src/scenes.js` | SCENES | `window.NIA_SCENES` (four illustrated SVG scroll stories) — vanilla JS, NO gsap dependency |
| `src/scenes.css` | SCENES | CSS for scenes only, every selector prefixed `.scn` |
| `src/assets.json` | done | `{KEY:{src,w,h,note}}` images as data URIs. Build injects as `window.NIA_IMG={KEY:{src,w,h}}` |
| `build.mjs` | CORE | inlines everything into `dist/niadelta.html` |
| `test/*.mjs` | QA | Playwright harness |

Build order in the final file: CSS (styles + scenes) in head; scripts at end of body: CDN gsap/ScrollTrigger/Lenis (`defer`), then inline `NIA_IMG`, `NIA_SCENES`, `NIA_CONTENT`, then core (runs on DOMContentLoaded, after deferred CDN scripts).

## Content source (verbatim, do not invent)
All copy comes from niadelta.com, scraped into `ref/`:
`home.txt, who-we-are.txt, core-competencies-services.txt, leadership-development.txt, organisational-development-and-culture.txt, culture-identity-kit-package.txt, meet-the-team.txt, careers.txt, contact-us.txt, blogs.txt` plus `bios.json` (extended bio per member, keyed by bio path), `team_raw.json` (name, role, bio key), `pages.json` (3 full testimonials, Rockstar Radar, case-studies page). `ref/original.html` is the previous site (keep its values text, story beats and style DNA).
Rules: keep copy verbatim (light trimming of site-builder noise only; fix obvious typos like "SCALEcomes", "Xolane"→"Xolani" in bios, "Amanda Warima"→"Waruima"). British spelling as in source. No invented clients, numbers, people, phone numbers, quotes. Numbers you MAY use (all from the site): 5 continents; 30+ years combined experience; 4.5/5 average rating from 550+ participants; 2000+ hours of classroom and workshop sessions; founded January 2020; case-study figures 92%+ engagement satisfaction, 4.8+/5 rated experiences, 88%+ purpose alignment.
Real contact details from the site, put in a clearly marked `CONTACT` config object at the TOP of core.js (`/* ==== CONTACT CONFIG: edit real details here ==== */`): email `admin@niadelta.com`, LinkedIn `https://www.linkedin.com/company/niadelta`, Calendly leadership `https://calendly.com/sila-niadelta/30min`, Calendly culture/ODC/kit `https://calendly.com/oluwaseyeoni-niadelta`, Culture Kit sign-up Google Form `https://docs.google.com/forms/d/e/1FAIpQLScEvK0jYCHTv3nbp3IMpotWZtATjLKRwZ6CPY8h6gQFE3Knsg/viewform`, case-study compilation `https://drive.google.com/file/d/1v-U00qUJxpNIwU-Wc2CWqiaWAgpBVe8a/view?usp=sharing`, 2024 video `https://www.youtube.com/watch?v=NJAeQsdzHeg`, blog index `https://www.niadelta.com/blogs`, `phone:''`, `whatsapp:''`, `formEndpoint:''`, `newsletterEndpoint:''`. Empty fields render nothing. Forms: if endpoint empty, validate, show success state (illustration + confetti) and offer a prefilled `mailto:` link as the real delivery path; note in a code comment.

## Information architecture (hash routes)
Pages: `home`, `about`, `work`, `contact`. Anchor routes map to a page + section id `s-<anchor>`:
- home: hero, `approach` (pinned scene "approach"), services (4 cards → link into work anchors), experience design, `apart` (What sets us apart: oversized numerals 01–05 + stats 5 continents / 30+ yrs / 4.5 of 5 from 550+ / 2000+ hours), `partners` (typographic marquee of partner names, NOT logos), `impact` (testimonials: Liz Berry Gips, Suzanne Hunter, Laura Kaub — full text from pages.json; expandable), closing CTA band, newsletter "Stay in the loop".
  Partner names: ALU School of Wildlife Conservation, African Leadership Academy, ALU School of Business, ELMA Philanthropies, filamujani, Morehead-Cain, Kigutu International Academy, Rwanda National Police, Gavi, Chatham House, The Afara Initiative, APA Insurance, BAOBAB, HALI Access Network, YouthConnekt Africa, THE ROOM, FirstWave Group, Teach For Kenya, Fingo Africa.
- about: "Who we are" intro, `story` (pinned scene "story"), story long text, `mission` (vision + mission with VIS/MIS discs), `values` (pinned scene "values"), `reflections` (2024 video card using APP image), `team` (founders large with F_KATLEHO/F_VEDA; core team; adjunct facilitators; strategic advisors; each card opens a bottom sheet / side panel with the extended bio from bios.json — Oba-anu Oladipupo and Timothy Yapilami Jr. have no bio: card is not clickable), `careers` (Join our team + Rockstar Radar), `blog` (8 posts from blogs.txt as outbound links, title + date).
- work: intro ("We believe in a world where everyone is flourishing…"), `competencies` (3: Learning Experience Design / FLOE, Facilitation / ELE-VATE, ODC), `services` (4 core services full text), `align` (NEW pinned scene "align": culture shifting from fragmented to aligned — the five ODC pillars), `leadership` (problem statement, 4 gains, Blueprint, SCALE 5 principles, 6 programmes, 4 tiers, delivery formats, Thwala quote, Calendly CTA), `culture` (ODC: Discover How, 5 pillars each with "Our services include" lists in accordions, How we work + best-fit list, Measurable impact list + case-study figures + download link, 4 testimonials Elie/Steve/Irene/Tarik, Where do you begin + Calendly), `kit` (Culture Identity Kit: hero line, 4 problems, Introducing the kit + Culture Tree benefits, 4 packages as stepped cards Essentials→Blueprint→Compass→Amplifier, custom proposal note + Calendly + sign-up form link, client stories Elie + Fingo).
- contact: "How can we help you?" copy, form (name, email, organisation optional, message), success state, direct contact links from CONTACT, Calendly links.
Desktop nav: About us ▾ (Our story, Mission and vision, Values, 2024 reflections, The team, Careers), What we do ▾ (Core competencies, Services, Leadership development, Organisational culture, Culture Identity Kit), Say hello. Mobile: bottom dock (Menu | Talk to us) + bottom sheet with all routes.

## Art direction
Palette (keep): paper #FBF4E8, paper2 #F3E6CF, ink #0B2A3D, coral #E8553D, gold #F8B518, teal #1F8A8A, peach #FFC9A3. Extra tints allowed only as mixes of these. NO purple/neon gradients, NO glassmorphism, NO emoji, NO buzzword copy.
Type: Instrument Sans 400/600 + Instrument Serif italic for ONE accent word per heading (`<em class="it">`). Fallbacks system-ui / Georgia. Fluid scale with clamp. Text never below 12px (body ≥16px). `text-wrap:balance` headings, `pretty` paragraphs.
Spacing scale (only these): 4 8 12 16 24 32 48 72 112 160 px as `--s1…--s10`. Section rhythm `--sec: clamp(72px, 10vw, 160px)`.
Visual language: 1.5–2px ink outlines, hard offset shadows in gold/coral/teal, hand-drawn SVG squiggles/underlines/arrows (stroke-drawn on reveal), paper grain (one tiny inline SVG feTurbulence data-URI as a fixed `body::before` overlay at ~5% opacity, pointer-events none, no animation), organic blob masks for photos (`clip-path:url(#blobN)` with objectBoundingBox clipPaths in the sprite), consistent warm photo grade (e.g. `filter: sepia(.12) saturate(.92) contrast(1.04)` + peach multiply overlay). Editorial composition: asymmetric grids, oversized numerals, mixed crops (arch, blob, wide letterbox, tall), overlapping captions. Nothing empty, nothing bloated.

## Motion rules
Transform/opacity only (clip-path reveals allowed sparingly on small elements; SVG stroke-dashoffset allowed). `will-change` only during active animation. Pointer effects throttled via rAF. No layout reads inside scroll/pointer handlers except cached rects (recompute on resize). Desktop-only effects gated by `matchMedia('(hover:hover) and (pointer:fine)')`. Device-tilt only when `DeviceOrientationEvent` fires without permission prompt (no iOS permission popup).
`prefers-reduced-motion: reduce` → no loader animation (skip straight in), no Lenis, no pins: scenes render their final frame statically + chapter list, transitions are instant swaps, no cursor/magnet/tilt, no confetti (success illustration still shown).
CDN failure (no gsap/ScrollTrigger/Lenis): site fully readable and navigable; reveals visible (never leave content at opacity 0 unless `html.js-anim` class is set, which is only added when GSAP loaded and not RM); scenes static; transitions instant.

## Scene contract (SCENES builder implements, CORE consumes)
```js
window.NIA_SCENES = {
  approach: Scene, // home: "Our approach" — partner in the process / think outside the box / committed to the delta / build transformative experiences
  story: Scene,    // about: Jan 2020 two friends in Nigeria → the question → "It is possible" hypothesis → today (design+facilitation+OD)
  values: Scene,   // about: Excellence, Creativity, Co-creation, Service, Fun and joy (text from ref/original.html)
  align: Scene     // work: fragmented → aligned via 5 ODC pillars (Purpose Alignment, Strategy Activation, Culture Transformation, Leadership Transformation, On-boarding Transformation)
}
Scene = {
  eyebrow, title /* may contain one <em class="it">word</em> */, lede,
  chapters: [{at:0..1, label, text}],          // copy for caption + static list; `at` = progress where chapter becomes active
  mount(stage /* HTMLElement, position:relative, sized by CSS */, ctx /* {reduced:boolean, mobile:boolean} */)
     -> { update(p /* 0..1, may be called every frame */), resize(), destroy() }
}
```
- Scene builds its own inline SVG + HTML tags inside `stage`. Everything inside uses class prefix `scn-`.
- `update(p)` must be pure-ish and cheap: only set transforms/opacity/strokeDashoffset/attributes on cached nodes, NO DOM creation, NO getBoundingClientRect. Deterministic from p (scrubbing backwards must reverse perfectly). "Physics" feel = spring/overshoot easing functions of p, not simulations.
- Each scene: clear beginning / middle / end; drawn characters or objects moving along paths (getPointAtLength cached on mount/resize — precompute a lookup table), 2–3 parallax depth layers, tags/labels that pop in with overshoot easing. Use the palette and ink-outline style. Must fit stage at any size from 280×220 to 1800×900 (portrait phones get a vertical composition). No text inside SVG below 12px rendered size; prefer HTML tags for text.
- `ctx.reduced` true → render final frame (update(1)) and never animate.
- CORE wraps each scene in: `<section class="story" data-scene="KEY" id="s-ANCHOR"><div class="pin"><header class="wrap sh"><p class="eyebrow">…</p><h2>…</h2><p class="lede">…</p></header><div class="stage scn" data-stage></div><p class="wrap cap" aria-live="polite"></p><div class="wrap prog"></div></div><ol class="wrap tl">…chapters…</ol></section>`; pins with ScrollTrigger (`end:'+=220%'`, scrub ~0.6) and calls `update(progress)`; updates caption from chapters; `.tl` list visible only in static mode (`.story.static`). Stage height: flex:1 of a 100svh pin (min 220px). Header uses `--ht` offset.

## Hard constraints (QA will verify)
No horizontal overflow or clipped text 320–1920px, portrait + landscape (e.g. 568×320, 844×390, 932×430). Tap targets ≥44×44 (inline text links inside paragraphs excepted). No text <12px. Mobile (≤900px): bottom dock with primary actions, menu = bottom sheet, NO full-screen popups (bio panel on mobile = bottom sheet ≤85svh). Zero console errors. No layout shift (all imgs have width/height; below-fold imgs `loading="lazy" decoding="async"`). Focus-visible styles, skip link, aria on menus/sheets, Escape closes sheets, focus returns to opener. Interrupted navigation: route changes during a transition are queued (latest wins), never stuck with `busy=true`, Lenis never left stopped.
