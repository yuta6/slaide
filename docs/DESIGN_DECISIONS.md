# Design Decisions

This document records key technical decisions and their rationale.

---

## Typography: PPTX-Compatible Sizing

**Decision:** Adopt 2x relative scaling for font sizes to match PowerPoint slide proportions.

**Rationale:**
- **Slide dimensions:** slaide uses fixed 1920×1080px (standard 16:9)
- **PPTX standard:** 10" × 7.5" @ 96 DPI = 960 × 720px
- **Ratio:** slaide size = 2× PPTX size
- **Implication:** Font sizes should be 2× PPTX equivalents for consistent relative proportions
  - PPTX 44pt Title → slaide 88px
  - PPTX 32pt Heading → slaide 64px
  - PPTX 18pt Body → slaide 36px
  - PPTX 14pt Caption → slaide 28px

**Benefits:**
- Slides generated in slaide visually match PPTX in terms of text-to-space ratio
- LLM agents can reason about content density the same way as PPTX users
- Familiar sizing to PowerPoint users
- Empirically tested to reduce "bottom padding" problem (content didn't fill the frame)

**Trade-offs:**
- Larger base font sizes mean less text fits per slide (enforces clarity principle)
- Requires explicit override if smaller typography is needed

---

## Semantic HTML for Typography

**Decision:** Use semantic HTML elements (h1, h2, h3, p, small) instead of generic divs with class names.

**Rationale:**
- **Clarity for LLM:** HTML tags are globally understood; `<h1>` = "title" is unambiguous
- **CSS cascade:** Easy to override sizes via `<style is:global>` in deck's index.astro
- **Accessibility:** Semantic markup improves screen reader support
- **Maintainability:** Clear visual hierarchy in source code

**Implementation:**
- SlideLayout.astro defines default sizes via CSS variables (--font-size-h1, etc.)
- Each semantic element styled automatically
- Decks override via `<style is:global>` if custom sizing needed

**Example:**
```astro
<!-- Automatic sizing (88px for h1, 36px for p) -->
<SlideLayout>
  <h1>Key Message</h1>
  <p>Body text</p>
</SlideLayout>

<!-- Custom sizing -->
<SlideLayout>
  <h1>Smaller Title</h1>
</SlideLayout>

<style is:global>
  .slide-frame h1 { font-size: 72px; }
</style>
```

---

## Presenter Runtime Modularity

**Decision:** Extract `SlidePresenter` class and scaling logic into separate TypeScript modules.

**Rationale:**
- **Testability:** Independent modules can be unit-tested
- **Configurability:** `SlidePresenter` constructor accepts KeyBindings, ClickConfig, TouchConfig
- **Maintainability:** DeckLayout.astro reduced from 257 lines → ~30 lines
- **Future:** Easy to migrate to Svelte/React if needed

**Architecture:**
- `src/presenter/presenter.ts` — SlidePresenter class
- `src/presenter/scale.ts` — scaleToFit logic for viewport fitting
- `src/presenter/types.ts` — Type definitions (KeyAction, KeyBindings, etc.)
- `src/layouts/DeckLayout.astro` — Minimal shell that imports and initializes

**Configurability:**
```typescript
new SlidePresenter(
  keyBindings, // CustomKeyBindings = DEFAULT_KEY_BINDINGS
  clickConfig, // { prevZone: 0.2 }
  touchConfig, // { minSwipeDelta: 50 }
);
```

---

## No Pre-defined Component Library

**Decision:** Components are created per-deck based on actual needs; no starter component set.

**Rationale:**
- **Flexibility:** LLM agents can design optimal components for each deck's content
- **Avoiding bloat:** Unnecessary components add cognitive load
- **Reusability:** Common patterns emerge organically across decks
- **AGENTS.md guidance:** Component Design Guide provides templates and principles

**Trade-off:**
- Requires clear AGENTS.md to guide LLM on component creation patterns

---

## CSS Custom Properties over Tailwind

**Decision:** Use Astro scoped CSS with CSS custom properties (design tokens) instead of Tailwind.

**Rationale:**
- **Design token control:** All colors, spacing, typography defined in one place (SlideLayout.astro)
- **Deck-level overrides:** Decks can override entire theme in `<style is:global>`
- **Minimal footprint:** No CSS framework overhead (slaide is single-file distribution)
- **Clarity:** Visual styles are explicit, not hidden in utility class names

**Design Tokens:**
- **Typography:** --font-size-h1 through --font-size-small
- **Colors:** --color-primary, --color-secondary, --color-bg, --color-text, --color-chart-1 through --color-chart-6
- **Spacing:** --space-xs, --space-sm, --space-md, --space-lg, --space-xl, --content-padding

---

## Single HTML File Output (vite-plugin-singlefile)

**Decision:** Bundle all CSS and JS into a single self-contained HTML file via vite-plugin-singlefile.

**Rationale:**
- **Portability:** One file = trivial to share, email, backup
- **Offline:** No network requests needed; works without server
- **Simplicity:** No folder structure complexity
- **Distribution:** PDF/PNG export both derive from this single file

**Process:**
- `astro build` generates per-deck HTML
- `vite-plugin-singlefile` inlines CSS, JS, assets
- `astro-inline-css.mjs` post-processes to move CSS into `<style>` tags
- Result: `dist/<deck>.html` is completely self-contained

---

## Version Numbering Strategy

**Decision:** Use release-please with conventional commits; `git tag` is the source of truth.

**Rationale:**
- **Automatic CHANGELOG:** release-please generates from commit messages
- **No manual version bumping:** `npm version` is error-prone; let commits decide
- **Semantic versioning:** conventional commits map to semver automatically
  - `fix:` → patch bump
  - `feat:` → minor bump
  - `feat!:` → major bump

**Workflow:**
1. Develop on `main` with conventional commits
2. release-please detects commits, creates Release PR automatically
3. Merge Release PR → CI publishes to npm with `--provenance`

---

## No PPTX Output

**Decision:** Do not support PowerPoint (.pptx) export.

**Rationale:**
- **Scope creep:** PPTX generation is complex (requires office library)
- **Misalignment:** slaide philosophy is "LLM generates slides", not "export to proprietary format"
- **PDF sufficient:** PDF serves as universal portable format
- **Future:** If needed, static PPTX generation could be added later, but not priority

---

## Decision Log

| Date | Decision | Owner |
|------|----------|-------|
| 2026-04-04 | Typography: 2x PPTX scaling | yuta6 |
| 2026-04-04 | Semantic HTML for typography | yuta6 |
| 2026-04-04 | Presenter runtime modularity | yuta6 |
| Earlier | No pre-defined components | yuta6 |
| Earlier | CSS custom properties over Tailwind | yuta6 |
| Earlier | Single HTML file output | yuta6 |
| Earlier | release-please versioning | yuta6 |
| Earlier | No PPTX output | yuta6 |
