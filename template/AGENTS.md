# slaide

A project for generating consulting-quality slides and documents from natural language, with PDF and HTML output.

## TL;DR — Read This First

1. **Run `npm install`, `npx playwright install chromium`, and `npm run dev` before anything else.**
2. **Talk to the user first.** Confirm requirements and structure before writing any code.
3. **Slides are 1920x1080px fixed frames.** Overflow is clipped, not scrolled.
4. **Only use the 5 font sizes:** `--font-size-h1` (88px), `--font-size-h2` (64px), `--font-size-h3` (48px), `--font-size-body` (36px), `--font-size-small` (28px). No custom sizes.
5. **No hardcoded CSS.** All colors, fonts, and spacing must use CSS variables (`var(--color-primary)`, `var(--space-md)`, etc.).
6. **Run `npm run build:png` after every change** and check the PNG output visually. This is the only way to verify layout.
7. **When done**, run `npm run build` then `open dist/<deck-name>.html` to show the user.

---

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

---

## Workflow

### Step 0: Environment Setup

```bash
npm install
npx playwright install chromium
npm run dev
```

You MUST run these before anything else.
- `npm install` and `npx playwright install chromium` are required for `build:png`.
- `npm run dev` starts the Astro dev server so the user can see slides being built in real time at `http://localhost:4321/`. Keep it running throughout the session.

### Step 1: Confirm the Requirements

**Talk to the user.** Do not start generating slides silently. Ask questions and confirm before writing code.

Clarify the following. If something is unclear, ask the user:

- What kind of deck is this? Pitch deck, proposal, report, invoice, etc.
- Who is the audience? Investors, clients, executives, etc.
- Rough slide count
- Tone: formal or casual, dark or light
- Whether any data or charts must be included
- Deck name, which becomes the directory name under `src/pages/`

### Step 2: Design the Deck Structure

Design the full structure before writing slides. **Show the proposed structure to the user and get confirmation before proceeding.**

1. Decide the deck name and overall outline.
2. If you want to customize the visual direction of `SlideLayout.astro`, override CSS custom properties in `<style is:global>` inside the deck's `index.astro`. Do not break the fixed-frame structure.
3. Identify the components you will need.
4. Decide the slide order and layout pattern.
5. **Present the structure to the user. Wait for approval before writing any slides.**

### Step 3: Create Components

Create reusable components needed for the deck in `src/components/`.
Components are not predefined. Create them freely based on the needs of the deck. Extract reusable patterns into components. If something is used only once, it does not need to become a component.

### Step 4: Create Slides

Define the slide order in `src/pages/<deck-name>/index.astro` and create each slide component under `_slides/`.
An agenda or closing slide can be useful, but neither is required.
Put deck-specific images in `src/pages/<deck-name>/_assets/` and shared images in `src/assets/shared/`.

**Important: The `sample/` deck is read-only.** Do not edit, rename, or delete files under `src/pages/sample/`. Always create a new deck directory.

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

### Step 6: Build and Deliver

```bash
npm run build                              # dist/index.html, dist/<deck-name>.html
npm run build:pdf -- --deck <deck-name>    # dist/<deck-name>.pdf
open dist/<deck-name>.html                 # Open in browser for the user
```

Always open the final output in the browser so the user can see the result immediately.

---

## Working with the User

- **Always ask before generating.** Confirm requirements and structure before writing code.
- **Show progress.** The dev server is running — tell the user to check the browser after each batch of slides.
- **Iterate per slide or per section**, not all at once. Create 2-3 slides, run `build:png`, show the user, get feedback, then continue.
- **After each `build:png` check**, share what you found (overflow, whitespace issues, etc.) and how you plan to fix it.
- **When done**, run `npm run build` and `open dist/<deck-name>.html` to show the final result.

---

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
    │   └── SlideLayout.astro    <- Fixed slide frame + design tokens
    ├── layouts/
    │   └── DeckLayout.astro     <- Presenter app shell and runtime
    └── pages/
        ├── index.astro          <- Built deck index page
        ├── sample/              <- Read-only reference deck. Do NOT edit.
        └── <deck-name>/
            ├── index.astro      <- The single source of truth for slide order
            ├── _assets/         <- Optional deck-specific assets
            └── _slides/         <- `_` prefix excludes it from Astro routing
                └── ...
```

---

## Typography (STRICT)

Use semantic HTML elements for automatic sizing. **Do not invent custom font sizes.**

| Element | CSS Variable | Size | PPTX Equivalent | Use For |
|---------|-------------|------|-----------------|---------|
| `<h1>` | `--font-size-h1` | 88px | 44pt | Slide title, main message |
| `<h2>` | `--font-size-h2` | 64px | 32pt | Section heading, large emphasis |
| `<h3>` | `--font-size-h3` | 48px | 36pt | Subheading, secondary emphasis |
| `<p>` | `--font-size-body` | 36px | 18pt | Body text, main content |
| `<small>` | `--font-size-small` | 28px | 14pt | Caption, source, footnotes |

**These five sizes are the ONLY font sizes you may use.** Do not write `font-size: 22px` or `font-size: 52px`. If text does not fit, reduce the amount of text, not the font size.

Example:

```astro
<SlideLayout title="My Slide">
  <h1>Key Message</h1>
  <p>Supporting paragraph that explains the key message.</p>
  <small>Source: data.example.com</small>
</SlideLayout>
```

---

## Styling (STRICT)

**Use CSS custom properties and Astro scoped CSS. Do not use Tailwind. Do not hardcode values.**

```astro
<!-- GOOD -->
<h2 class="heading">Title</h2>
<style>
  .heading {
    font-size: var(--font-size-h2);
    color: var(--color-primary);
    font-weight: 700;
  }
</style>

<!-- BAD — hardcoded values -->
<h2 style="font-size: 36px; color: #2563eb;">Title</h2>
```

### Design Tokens

**Colors:**
- `--color-primary`, `--color-secondary`, `--color-accent`, `--color-muted`
- `--color-chart-1` through `--color-chart-6` for charts

**Font sizes:** `--font-size-h1`, `--font-size-h2`, `--font-size-h3`, `--font-size-body`, `--font-size-small` (see Typography table above)

**Spacing:** `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (32px), `--space-xl` (64px)

**Fonts:** `--font-family-sans`, `--font-family-mono`

### Overriding the Visual Direction

Override CSS custom properties in `<style is:global>` inside the deck's `index.astro`:

```astro
<style is:global>
  .slide-frame {
    --color-primary: #e11d48;
    --font-family-sans: 'Inter', sans-serif;
  }
</style>
```

---

## SlideLayout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | '' | Title shown in the header |
| theme | 'light' \| 'dark' | 'light' | Theme |
| aspectRatio | '16:9' \| '4:3' \| 'A4' \| 'A4-landscape' | '16:9' | Aspect ratio |
| showHeader | boolean | true | Whether to show the header |
| showFooter | boolean | true | Whether to show the footer |
| pageNumber | number | undefined | Page number |
| transition | string | 'fade' | Transition type |
| notes | string | '' | Speaker notes |
| class | string | undefined | Additional CSS class |

---

## A4 Documents (Word-Compatible)

Use `aspectRatio="A4"` or `aspectRatio="A4-landscape"` to create documents compatible with Microsoft Word standards.

| Property | A4 Portrait | A4 Landscape |
|----------|-------------|--------------|
| Size | 794x1123px | 1123x794px |
| Margins | 96px (25.4mm) | 96px (25.4mm) |
| Body font | 15px (11pt equivalent) | 15px (11pt equivalent) |
| Line-height | 1.15 (Word standard) | 1.15 (Word standard) |

```astro
<SlideLayout aspectRatio="A4">
  <h1>Chapter 1: Introduction</h1>
  <p>Body text at 15px (11pt equivalent) with 1.15 line spacing.</p>
  <h2>Section Heading</h2>
  <p>Subheadings are 21px (16pt equivalent) with consistent spacing.</p>
</SlideLayout>
```

---

## Component Design

### Principles

- Define prop types with `interface Props`.
- **Use CSS custom properties. Do not hardcode values.** Use `var(--color-primary)`, `var(--space-md)`, `var(--font-size-body)`, etc.
- Use slots for flexible child content.
- Keep one component per file.
- Scope styles inside Astro `<style>` tags.

### Example: Layout Component

```astro
---
interface Props {
  gap?: string;
  ratio?: string;
}
const { gap = 'var(--space-lg)', ratio = '1fr 1fr' } = Astro.props;
---
<div class="layout" style={`--gap: ${gap}; --ratio: ${ratio}`}>
  <div class="left"><slot name="left" /></div>
  <div class="right"><slot name="right" /></div>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: var(--ratio);
    gap: var(--gap);
    height: 100%;
  }
</style>
```

### Example: Data Display Component

```astro
---
interface Props {
  value: string;
  label: string;
  description?: string;
}
const { value, label, description } = Astro.props;
---
<div class="metric">
  <span class="value">{value}</span>
  <span class="label">{label}</span>
  {description && <span class="desc">{description}</span>}
</div>

<style>
  .metric {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-sm);
  }

  .value {
    font-size: var(--font-size-h1);
    font-weight: 800;
    color: var(--color-primary);
    line-height: 1;
    font-family: var(--font-family-mono);
  }

  .label {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
  }

  .desc {
    font-size: var(--font-size-small);
    color: var(--color-muted);
  }
</style>
```

### Prop Validation

- Always define `interface Props` at the top of the frontmatter.
- Use TypeScript union types for constrained values: `type?: 'default' | 'highlight' | 'muted'`.
- Provide sensible defaults with destructuring: `const { gap = 'var(--space-md)' } = Astro.props;`.
- Optional props should use `?` in the interface.

---

## Charts and Diagrams

### Prefer SVG

Write simple diagrams and icons directly in SVG. Use CSS custom properties for colors.

```astro
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="100" width="60" height="100" fill="var(--color-chart-1)" />
  <rect x="100" y="60" width="60" height="140" fill="var(--color-chart-2)" />
  <rect x="180" y="20" width="60" height="180" fill="var(--color-chart-3)" />
</svg>
```

### When to Use SVG vs Libraries

- 5 data points or fewer -> inline SVG
- Many data points, axes, or legends -> Chart.js or ECharts
- Flowcharts -> Mermaid or SVG
- Fully custom visuals -> D3.js

---

## Slide Structure Patterns

### Basic Structure

1. **Title slide** - title, subtitle, date, author
2. **Agenda** - useful for longer proposals or reports, optional for short decks
3. **Section divider** - opening slide for each section
4. **Content slides** - the main body
5. **Summary / Next Steps** - key takeaways and next actions
6. **Closing** - useful for presentation-style decks, optional for document-style

### Common Layouts

- **Key message + chart** - message on top, chart below
- **Two-column layout** - chart or diagram on the left, takeaways on the right
- **KPI dashboard** - 3 to 4 large numbers in a row
- **Before / after** - current state on the left, proposal on the right
- **Process flow** - steps connected horizontally with arrows
- **Matrix** - a 2x2 classification layout

---

## `index.astro` (Deck Entry Point)

```astro
---
import DeckLayout from '../../layouts/DeckLayout.astro';
import Title from './_slides/Title.astro';
import MarketOverview from './_slides/MarketOverview.astro';
import Summary from './_slides/Summary.astro';
---

<DeckLayout title="Presentation Title">
  <Title />
  <MarketOverview />
  <Summary />
</DeckLayout>
```

---

## Presenter

The output of `npm run build` already behaves like presentation software.
`DeckLayout.astro` provides the presenter viewport, runtime logic, progress bar, notes panel, and slide navigation behavior.

- Keyboard controls include left/right arrows, Space, `f` for fullscreen, and `p` for notes
- Click and touch-swipe interactions are supported
- `build:png` and `build:pdf` temporarily override the presenter layout so every slide becomes visible for export

---

## Assets

- Shared images and reusable assets: `src/assets/shared/`
- Deck-specific images: `src/pages/<deck-name>/_assets/`
- Do not add source assets directly to `dist/`. `dist/` is generated output only.

---

## Design Principles

1. **Fit inside the fixed frame.** Overflow gets clipped. This is the highest priority.
2. **One slide, one message.** The title should express the key message.
3. **Do not fear whitespace.** Keep 40-50% empty. Whitespace creates a premium feel.
4. **Respect the typography hierarchy.** h1 > h2 > h3 > p > small. Do not invent in-between sizes.
5. **Use no more than three accent colors.** Background and text do not count. Use `--color-chart-*` for charts.
6. **Left-align by default.** Center alignment is mainly for title slides and section dividers.
7. **Maximize the data-ink ratio.** Remove chart decoration. No 3D. Keep labels minimal.

---

## Prohibited

1. **Breaking the fixed frame.** Do not change the fixed-size slide frame structure.
2. **Leaving overflow unchecked.** Always verify with `build:png`.
3. **Hardcoded CSS.** No `style="color: #FF0000"`. No `font-size: 22px`. Use CSS custom properties only.
4. **Custom font sizes.** Only use the five sizes defined in the Typography section. No exceptions.
5. **Overloading slides with text.** Communicate with keywords and phrases, not paragraphs.
6. **Distorting image aspect ratios.** Use `object-fit: contain` or `object-fit: cover`.
7. **Using too many colors.** Keep each slide to five chromatic colors or fewer.
8. **Writing slide-side animations.** Presenter behavior belongs in `DeckLayout.astro`, not in slide components.

---

## Quality Checklist

After writing slides, confirm the following:

- [ ] Does it fit inside the fixed 1920x1080px frame?
- [ ] Does the slide communicate only one message?
- [ ] Is the title the key message?
- [ ] Is there enough whitespace, around 40-50%?
- [ ] Are ALL font sizes using CSS variables (`--font-size-h1`, `--font-size-h2`, `--font-size-h3`, `--font-size-body`, `--font-size-small`)?
- [ ] Are ALL colors using CSS variables (`--color-primary`, `--color-chart-*`, etc.)?
- [ ] Are ALL spacings using CSS variables (`--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl`)?
- [ ] Are sources written in `<small>` text?
- [ ] Are image aspect ratios preserved?

Run `npm run build:png -- --deck <deck-name>` and verify the result visually.

---

## Multi-Deck Setup

Each directory directly under `src/pages/` is one deck. Each deck uses its own `index.astro` as the source of truth for slide order.
