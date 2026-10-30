# NiaDelta website

Leadership development and culture change consultancy. *Nia* is Swahili for purpose, *Delta* is Greek for change.

`index.html` is the complete, self-contained site (one file: styles, scripts and images inlined). It is published with GitHub Pages.

## Editing
- Copy lives in `src/content.js`; real contact details are in the `CONTACT CONFIG` block at the top of `src/core.js`.
- Illustrated scroll scenes: `src/scenes.js`. Styles: `src/styles.css`.
- Rebuild: `node build.mjs`, then copy `dist/niadelta.html` to `index.html`.
- QA harness (needs Playwright): `node test/harness.mjs --file index.html --out shots --quick`.

Content sourced from niadelta.com.
