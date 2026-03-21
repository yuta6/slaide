# slaide

A project for generating consulting-quality slides and documents from natural language, with PDF and HTML output.

## Quick Reference

```bash
npm run dev                                # Preview in Astro dev server
npm run build                              # Build standalone HTML files
npm run build:png -- --deck <deck-name>   # PNG output for LLM quality checks
npm run build:pdf -- --deck <deck-name>   # PDF output
npm run preview                           # Preview the built dist/ output
```

## Most Important Rule: Slides Use a Fixed Frame

The web scrolls vertically. **A slide is a 1920x1080px box. If content overflows, it gets clipped.**
Every layout decision should be judged by one question: "Does it fit inside the box?"
If there is too much text, cut the text. Shrinking the font is the last resort.
If it still does not fit, split it into multiple slides.

## Workflow

### Step 1: Confirm the Requirements

Clarify the following. If something is unclear, ask the user:

- What kind of deck is this? Pitch deck, proposal, report, invoice, etc.
- Who is the audience? Investors, clients, executives, etc.
- Rough slide count
- Tone: formal or casual, dark or light
- Whether any data or charts must be included
- Deck name, which becomes the directory name under `src/pages/`

### Step 2: Design the Deck Structure

Design the full structure before writing slides.

1. Decide the deck name and overall outline.
2. If you want to customize the visual direction of `SlideLayout.astro`, override CSS custom properties in `<style is:global>` inside the deck's `index.astro`. Do not break the fixed-frame structure.
3. Identify the components you will need.
4. Decide the slide order and layout pattern.
5. Show the proposed structure to the user and get confirmation.

### Step 3: Create Components

Create reusable components needed for the deck in `src/components/`.
Examples shown in the AGENTS files are optional examples, not required defaults.
For details, see `src/components/AGENTS.md`.

### Step 4: Create Slides

Define the slide order in `src/pages/<deck-name>/index.astro` and create each slide component under `_slides/`.
An agenda or closing slide can be useful, but neither is required.
Put deck-specific images in `src/pages/<deck-name>/_assets/` and shared images in `src/assets/shared/`.
For details, see `src/pages/_AGENTS.md`.

### Step 5: Quality Check with `build:png`

```bash
npm run build:png -- --deck <deck-name>
# -> dist/<deck-name>/png/01.png, 02.png, ...
```

Check the PNG output:

- Make sure text and charts do not overflow the frame
- Make sure there is enough whitespace. About 40-50% of a slide should remain empty
- Make sure colors and typography feel consistent
- Make sure SVGs and charts render correctly

If something is off, fix it and run `build:png` again. Repeat until it looks right.

### Step 6: Build

```bash
npm run build                              # dist/index.html, dist/<deck-name>.html
npm run build:pdf -- --deck <deck-name>    # dist/<deck-name>.pdf
npm run preview                            # Preview dist/ locally
```

## Project Structure

```
├── AGENTS.md                    <- The file you are reading now
├── astro.config.mjs
├── package.json
│
├── scripts/
│   ├── build-png.mjs            <- Playwright -> PNG for LLM quality checks
│   ├── build-pdf.mjs            <- Playwright print-to-PDF
│   └── lib/
│       ├── astro-inline-css.mjs <- Inlines generated CSS into built HTML files
│       └── deck-utils.mjs       <- Resolves decks and starts a preview server
│
└── src/
    ├── assets/
    │   └── shared/              <- Shared images and reusable assets
    ├── components/
    │   ├── SlideLayout.astro    <- Fixed slide frame + design tokens
    │   └── AGENTS.md            <- Component design guide
    ├── layouts/
    │   └── DeckLayout.astro     <- Presenter app shell and runtime
    └── pages/
        ├── index.astro          <- Built deck index page
        ├── _AGENTS.md           <- How to write slides
        └── <deck-name>/
            ├── index.astro      <- The single source of truth for slide order
            ├── _assets/         <- Optional deck-specific assets
            └── _slides/         <- `_` prefix excludes it from Astro routing
                └── ...
```

## `SlideLayout.astro`

It has two roles:

**Fixed frame, do not break it:** 1920x1080px, `overflow: hidden`, and the header/content/footer structure

**Visual direction, do customize it:** CSS custom property values, plus header and footer styling

At the start of a project, use `<style is:global>` in the deck's `index.astro` to align the color palette, typography, and spacing with the brand.

```astro
<!-- Example of visual customization in index.astro -->
<style is:global>
  .slide-frame {
    --color-primary: #e11d48;
    --font-family-sans: 'Inter', sans-serif;
  }
</style>
```

## Presenter

The output of `npm run build` already behaves like presentation software.
`DeckLayout.astro` provides the presenter viewport, runtime logic, progress bar, notes panel, and slide navigation behavior.

- Keyboard controls include left/right arrows, Space, `f` for fullscreen, and `p` for notes
- Click and touch-swipe interactions are supported
- `build:png` and `build:pdf` temporarily override the presenter layout so every slide becomes visible for export
- Use Playwright MCP only when you need to verify presenter behavior such as transitions, keyboard controls, notes, or interactive UI

## Styling

**Use CSS custom properties and Astro scoped CSS. Do not use Tailwind.**

Reference CSS custom properties inside each component's `<style>` block.

```astro
<!-- Good -->
<h2 class="heading">Title</h2>
<style>
  .heading {
    font-size: var(--font-size-heading);
    color: var(--color-primary);
    font-weight: 700;
  }
</style>

<!-- Bad -->
<h2 style="font-size: 36px; color: #2563eb;">Title</h2>
```

Main tokens:

- Colors: `--color-primary`, `--color-secondary`, `--color-accent`, `--color-muted`, `--color-chart-1` to `--color-chart-6`
- Font sizes: `--font-size-title` (64px), `--font-size-heading` (40px), `--font-size-body` (24px), `--font-size-caption` (16px)
- Spacing: `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (32px), `--space-xl` (64px)
- Fonts: `--font-family-sans`, `--font-family-mono`

## Design Principles

1. **Fit inside the fixed frame.** Overflow gets clipped. This is the highest priority.
2. **One slide, one message.** The title should express the key message.
3. **Do not fear whitespace.** Keep 40-50% empty. Whitespace creates a premium feel.
4. **Respect the typography hierarchy.** `title > heading > body > caption`. Do not invent in-between sizes.
5. **Use no more than three accent colors.** Background and text do not count. Use `--color-chart-1` to `--color-chart-6` for charts.
6. **Left-align by default.** Center alignment is mainly for title slides and section dividers.
7. **Maximize the data-ink ratio.** Remove chart decoration. No 3D. Keep labels minimal.

## Prohibited

1. **Breaking the fixed frame.** Do not change the fixed-size slide frame structure.
2. **Leaving overflow unchecked.** Always verify that text and charts are not clipped.
3. **Hardcoded CSS.** No `style="color: #FF0000"`. Use CSS custom properties.
4. **Overloading slides with text.** Communicate with keywords and phrases, not paragraphs.
5. **Breaking the font-size hierarchy.** Do not use font sizes outside the design tokens.
6. **Distorting image aspect ratios.** Use `object-fit: contain` or `object-fit: cover`.
7. **Using too many colors.** Keep each slide to five chromatic colors or fewer.
8. **Writing slide-side animations.** Presenter behavior belongs in `DeckLayout.astro`, not in slide components.

## Multi-Deck Setup

Each directory directly under `src/pages/` is one deck. Each deck uses its own `index.astro` as the source of truth for slide order.
