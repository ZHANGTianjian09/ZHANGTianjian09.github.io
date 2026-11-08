# Tianjian Zhang — personal website

Buildless, bilingual GitHub Pages site. `index.html` and `zh.html` contain the full page content. Both pages use the shared Academic UI component library in `assets/`.

## Local preview

```sh
python3 -m http.server 8432 --bind 127.0.0.1
```

Open `http://127.0.0.1:8432/index.html` or `http://127.0.0.1:8432/zh.html`.

## Component library

Open `http://127.0.0.1:8432/components.html` for the live palette, typography, buttons, language switch, disclosures, project composition and all four compact project previews. The gallery includes a reduced-motion switch and HTML examples taken directly from its demo markup.

- Theme values: `assets/tokens.css`
- Shared styles: `assets/components.css` (loaded through `assets/site.css`)
- Shared interaction modules: `assets/components/`
- Usage and maintenance: [docs/design-system.md](docs/design-system.md)

The gallery and both homepages share the same source; changing a token or component updates all three. The gallery is separate from the visitor navigation and marked `noindex`.

## Check

```sh
node scripts/check-site.mjs
git diff --check
```

## Project previews and copy

Project titles and bullet points on both homepages match the original site at `04dc230`. They are visible by default. Do not add generated summaries, interpretations, research caveats or slogans to the visitor pages; substantive copy changes belong to the site owner.

Both homepages use the selected **A / full-copy** pattern: every original bullet stays visible beside a small illustration. Hovering anywhere in a project row—title, bullets, thumbnail or spacing—gives its thumbnail one brief CSS animation; text, thumbnail size and row height stay fixed. Leaving restores the complete still, and entering again replays it. Keyboard focus on a linked thumbnail gives the same visual cue; pointer-click focus does not keep playback active after leaving. Touch screens keep the still. There are no expansion controls, tabs, playback buttons, progress text, captions or image dialogs. The ERM thumbnail and title are native links to the existing paper’s online PDF view; projects without a supplied paper URL do not invent a destination.

- **ERM:** one unchanged original marginal-distribution PNG, briefly revealed on hover. No chart switching or generated numerical data.
- **Sampling:** a schematic point moves through a drift step and a noise step. It is not a numerical sampler.
- **Motion:** two small poses align; the background matches come from the existing synthetic DTW example. It does not run AlphaPose or MotionBERT.
- **N-queens:** four queens appear in a valid solution computed by the existing bit-mask solver. The thumbnail does not replay the full search or the 18-queens benchmark.

System reduced-motion preferences disable all animation. Linked figures retain native keyboard and touch navigation; unlinked figures are passive illustrations. Original images remain in `images/` and provide the no-JavaScript fallback. The optional image-dialog component remains available to other consumers but is not bound to homepage previews.

Language links keep the current section or project. Explicit language URLs are respected; only the bare homepage applies the saved or browser language preference. No IP lookup is used.
