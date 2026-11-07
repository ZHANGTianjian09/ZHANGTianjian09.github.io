# Tianjian Zhang — personal website

Buildless, bilingual GitHub Pages site. `index.html` and `zh.html` contain the full page content. Shared styling and progressive interactions live in `assets/`.

## Local preview

```sh
python3 -m http.server 8432 --bind 127.0.0.1
```

Open `http://127.0.0.1:8432/index.html` or `http://127.0.0.1:8432/zh.html`.

## Check

```sh
node --check assets/site.js
node scripts/check-site.mjs
git diff --check
```

## Figures

- **ERM:** the original PNGs are preserved. The interaction moves between feature and prediction distributions; it does not regenerate experiment data.
- **Sampling:** a schematic highlights scaling, implicit drift, state-dependent Gaussian noise, and the next state. It is not a simulated sampler.
- **Motion:** a small synthetic joint-angle example uses cosine-distance dynamic time warping to align two differently paced sequences. It does not run AlphaPose or MotionBERT in the browser.
- **N-queens:** a real 4-queens bit-mask search generates legal placements, dead ends, backtracking, and a solution. It illustrates the algorithm; it is not a replay of the 18-queens benchmark.

Animations play once when visible, pause offscreen and while an image dialog is open, and expose pause/replay controls. With `prefers-reduced-motion: reduce`, automatic playback is disabled and the control advances one step at a time. Original figures remain accessible in the image dialog and as no-JavaScript fallbacks.

Language links keep the current section or project. Explicit language URLs are respected; only the bare homepage applies the saved or browser language preference. No IP lookup is used.

The ERM detail note reflects the conditions in the linked paper: prediction transfer is conditional on its fresh-score conjecture and assumptions; support-statistic transfer remains open.
