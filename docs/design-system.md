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
| `assets/components/playback.js` | Hover-led playback, touch/keyboard alternatives, visibility pauses and reduced motion |
| `assets/components/diagrams.js` | The four project-specific figure renderers |
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

Initialize after the document markup exists; module scripts already defer execution. The default root is `document`. For a newly inserted group of components, pass its containing element as the root. Re-initializing the same root does not duplicate listeners or playback controllers. The image dialog is shared across roots in the same document.

The homepages keep their content in HTML. Native links and disclosures work without JavaScript, and each figure provides an original-image fallback.

## Markup contracts

| Component | Contract | Preview |
| --- | --- | --- |
| Header / navigation | `.site-header`, `.main-nav`, a `.menu-toggle` with `aria-controls` and `aria-expanded`; nav anchors point to real section IDs | Gallery header |
| Language switch | `.language-switch`; current link has `aria-current="page"`; `data-language` enables preference and section preservation | Basic components and homepages |
| Primary / secondary buttons | `.button-primary` / `.button-secondary`; use links for navigation and native buttons for actions; use native `disabled` | Default, disabled, hover and keyboard focus |
| Text link / tag | `.text-link` / `.tag`; tags describe topics and are not interactive | Basic components |
| Copy button | `data-copy="value"`; optional `data-copy-status="element-id"` points to a `role="status"` element | Copy-feedback example |
| Project | `.project` combines `.project-copy` with `.diagram`; use a real heading and a unique `aria-labelledby` | Project composition |
| Disclosure | Native `details.project-details` and `summary`; `open` is the initial expanded state | Open and closed examples |
| Figure | `figure.diagram[data-diagram]` with `.figure-head`, a non-interactive `.animation-hint`, `.diagram-live`, `.diagram-fallback` and a unique caption | All four interactive figures |
| Image dialog | Created by `initImageGallery()`; do not duplicate its HTML on individual pages | Figure enlarge/original links |

Use `data-nav-anchor` on a nested project with its own ID to preserve that project when switching languages. Give all heading, caption, status and section IDs unique values within a page. The library page deliberately includes two instances of the sampling figure to exercise instance isolation.

The gallery's “查看 HTML” examples are read from the actual demo markup before enhancement. Edit the demo itself to update both the rendered example and its source snippet.

## Image and animation APIs

```js
const { gallery, diagrams } = initComponents();

gallery.open([
  ['images/erm-marginal.png', 'Feature marginal distributions'],
  ['images/erm-score.png', 'Prediction score distributions']
], 0);

// Keep hover static; click/tap the figure or press Enter/Space to advance.
diagrams.setReducedMotion(true);
// Return to the system preference; a system reduction preference still wins.
diagrams.setReducedMotion(false);
```

Supported `data-diagram` values: `erm`, `sampling`, `motion`, `queens`. Original-image links inside a figure use the matching `data-gallery` value. All renderers share the playback controller and image dialog. Diagram assets resolve relative to their module, so their URLs also work if the HTML is moved into a subdirectory.

Visibility alone never starts an animation. A mouse/pen entering the figure starts it; leaving pauses at the current frame. Re-entry resumes an unfinished sequence and restarts a completed sequence. Each entry plays at most one pass. Touch users tap a non-control part of the figure to toggle playback. A keyboard user can Tab onto the figure to start, use Enter/Space to pause or resume, and Tab away to pause. The small corner hint is text, not a playback button.

Chart tabs, image links and other nested controls keep their own actions. Every figure also pauses offscreen, when the document is hidden or when the image dialog is open. System reduced-motion settings and the gallery's step-through mode disable hover/focus animation and CSS motion; click/tap the figure or press Enter/Space to advance one step. Returning to normal motion does not automatically resume a paused figure.

These are explanatory illustrations. ERM uses unchanged original images; sampling illustrates an update; motion uses synthetic pose sequences; N-queens runs a small 4-queen example. Their animations are not additional experimental evidence.

## Adding or changing a component

1. Add or reuse semantic tokens; keep component code free of literal UI colors.
2. Put reusable styles in `components.css` and behavior in `assets/components/`. Keep documentation-only styles in `library.css`.
3. Add a working example to `components.html`, including its relevant open, closed, disabled, keyboard or motion states. Prefer a `data-code-for` snippet derived from the example.
4. Update this component table. Keep content facts in the homepages; avoid coupling component behavior to a particular project description.
5. Run `node scripts/check-site.mjs` and `git diff --check`. Review both languages and the live gallery in desktop and narrow viewports, including menu, disclosure, image-dialog and motion controls after changing those components.
