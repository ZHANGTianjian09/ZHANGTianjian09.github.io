# Academic UI — component library

Open [the live component gallery](../components.html) through the local HTTP server. It imports the same styles and interaction modules as both homepages. There is no build step or package dependency.

## Source ownership

| Source | Owns |
| --- | --- |
| `assets/tokens.css` | Semantic colors, fonts, radii, spacing and motion durations |
| `assets/components.css` | Shared elements and compositions, including responsive rules |
| `assets/components/index.js` | `initComponents()` and the individual component exports |
| `assets/components/navigation.js` | Sticky-section tracking, mobile menu and language anchors |
| `assets/components/copy.js` | Copy buttons and accessible status feedback |
| `assets/components/gallery.js` | One image dialog per document, keyboard navigation and focus return |
| `assets/components/diagrams.js` | Four passive thumbnail renderers and the reduced-motion preference |
| `assets/diagram-models.mjs` | Pure DTW and N-queens teaching-example calculations |
| `assets/site.js` | Homepage initialization and the bare-homepage language preference |
| `assets/library.js`, `assets/library.css` | Documentation-page controls and layout only |

`assets/site.css` is the stable CSS entry point. It imports tokens before component rules. Keep UI color literals in `tokens.css`, including the colors used by animated SVGs. The original research images retain their original legends and colors.

The palette follows the original site's white page and colored navigation, with a deep-blue navigation bar, blue-gray text and restrained blue accents. The second diagram series uses indigo. Match browser `theme-color` and the favicon to the navigation token when changing that token.

Chinese pages (`lang="zh-CN"`) use the `--chinese-sans` Heiti stack: Heiti SC, SimHei, STHeiti, Noto Sans CJK SC, Microsoft YaHei and PingFang SC, with a sans-serif fallback. Both `--heading` and `--sans` resolve to this stack, covering headings, body text, controls and SVG labels. English headings keep the Georgia-based `--serif` stack through `--heading`. Latin branding and decorative numerals use `--serif` directly. Maintain these choices in `tokens.css`; no font download is required.

## Use the library

```html
<link rel="stylesheet" href="assets/site.css">
<script type="module">
  import { initComponents } from './assets/components/index.js';
  const { gallery, diagrams } = initComponents();
</script>
```

Initialize after the document markup exists; module scripts already defer execution. The default root is `document`. For a newly inserted group of components, pass its containing element as the root. Re-initializing the same root does not duplicate listeners or renderers. The image dialog is shared across roots in the same document.

The homepages keep their content in HTML. Native links and disclosures work without JavaScript, and each figure provides an original-image fallback.

## Markup contracts

| Component | Contract | Preview |
| --- | --- | --- |
| Header / navigation | `.site-header`, `.main-nav`, a `.menu-toggle` with `aria-controls` and `aria-expanded`; nav anchors point to real section IDs | Gallery header |
| Language switch | `.language-switch`; current link has `aria-current="page"`; `data-language` enables preference and section preservation | Basic components and homepages |
| Primary / secondary buttons | `.button-primary` / `.button-secondary`; use links for navigation and native buttons for actions; use native `disabled` | Default, disabled, hover and keyboard focus |
| Text link / tag | `.text-link` / `.tag`; tags describe topics and are not interactive | Basic components |
| Copy button | `data-copy="value"`; optional `data-copy-status="element-id"` points to a `role="status"` element | Copy-feedback example |
| Project | Selected pattern A: `.project` combines `.project-copy`, the complete always-visible `.project-description` list and a compact `.diagram`; hovering any part of the row animates only the figure | Project composition |
| Disclosure | Native `details.project-details` and `summary`; `open` is the initial expanded state | Open and closed examples |
| Figure | `.diagram[data-diagram]` contains `.diagram-live` (hidden from assistive technology) and an original-image `.diagram-fallback`. Use a native anchor with the real paper URL, or a passive `figure` with `role="img"`; provide an accessible label | All four small previews |
| Image dialog | Optional API from `initImageGallery()`; do not intercept paper links with a dialog | Available to other consumers; unused by homepage previews |

Use `data-nav-anchor` on a nested project with its own ID to preserve that project when switching languages. Give all heading, caption, status and section IDs unique values within a page. The library page deliberately includes two instances of the sampling figure to exercise instance isolation.

The gallery's “查看 HTML” examples are read from the actual demo markup before enhancement. Edit the demo itself to update both the rendered example and its source snippet.

## Image and animation APIs

```js
const { gallery, diagrams } = initComponents();

gallery.open([
  ['images/erm-marginal.png', 'Feature marginal distributions'],
  ['images/erm-score.png', 'Prediction score distributions']
], 0);

// Keep the complete static thumbnail; paper links still work normally.
diagrams.setReducedMotion(true);
// Return to the system preference; a system reduction preference still wins.
diagrams.setReducedMotion(false);
```

Supported `data-diagram` values: `erm`, `sampling`, `motion`, `queens`. Assets resolve relative to their module. Each preview is at most 228 × 152px on desktop and 152 × 101.3px in the narrow homepage layout. Its size stays fixed during hover. Project headings, bullets, spacing and top alignment follow the selected A composition in both languages.

Previews are complete stills by default. On devices with hover, CSS plays one short animation when the pointer enters any part of the containing `.project` row: heading, bullets, image or spacing. Only the thumbnail's contents animate; no text is hidden or revealed, and no dimensions change. Moving between the text and figure does not restart the animation. Leaving the row resets it, so the next entry can replay it. Standalone thumbnails still animate on their own hover. Keyboard focus on a linked thumbnail also triggers the visual cue. Do not use `:focus-within` as a playback trigger: a pointer click can retain focus after leaving the row and prevent hover replay. The animation never loops. No click, tap, Enter or Space handler overrides native navigation. Unlinked illustrations add no tab stops. Touch users see the still and can open a linked paper with one tap. Paper links use the source repository’s PDF viewer because its raw endpoint responds as an octet-stream download. System reduced-motion settings and the gallery's switch disable the animation without changing link behavior.

ERM reveals the unchanged original PNG. Sampling moves a schematic point through drift and noise. Motion pairs two small poses over the existing synthetic DTW alignment. N-queens places the four queens in one legal computed solution. These are small visual cues, not interactive lessons or experimental results.

The owner's project titles and bullet points are preserved from `04dc230` in both languages and remain visible without expansion. Keep summaries, rewritten contributions, disclaimers and editorial slogans out of the visitor pages unless the owner supplies or approves that copy. Do not add labels, frame counters, playback buttons, chart tabs or an image dialog to the project previews.

## Adding or changing a component

1. Add or reuse semantic tokens; keep component code free of literal UI colors.
2. Put reusable styles in `components.css` and behavior in `assets/components/`. Keep documentation-only styles in `library.css`.
3. Add a working example to `components.html`, including its relevant open, closed, disabled, keyboard or motion states. Prefer a `data-code-for` snippet derived from the example.
4. Update this component table. Keep content facts in the homepages; avoid coupling component behavior to a particular project description.
5. Run `node scripts/check-site.mjs` and `git diff --check`. Review both languages and the live gallery in desktop and narrow viewports, including menu, disclosure, image-dialog and motion controls after changing those components.
