# How to Write Slides

## Important: The `sample/` Deck Is Read-Only

The `sample/` deck is a reference implementation that demonstrates slide patterns and layout techniques. **Do not edit, rename, or delete any files under `src/pages/sample/`.** When creating a presentation, always create a new deck directory such as `src/pages/my-deck/`. Use `sample/` only as a reference.

## File Structure

Create each deck under `src/pages/<deck-name>/`.

```
src/pages/pitch-deck/
├── index.astro             <- Defines slide order and wraps the deck in DeckLayout
├── _assets/                <- Optional deck-specific images and other assets
└── _slides/                <- `_` prefix excludes it from Astro routing
    ├── Title.astro
    ├── MarketOverview.astro
    └── Summary.astro
```

- Order is determined by the order of components in `index.astro`
- You do not need to rename files when inserting slides in the middle
- Give components under `_slides/` names that clearly describe their contents
- The `_` prefix keeps `_slides/` and `_assets/` out of Astro routing

For assets:

- Put deck-specific images in `src/pages/<deck-name>/_assets/`
- Put shared images in `src/assets/shared/`
- Do not store source assets in `dist/`

## `index.astro`

`index.astro` is the single source of truth for the deck.

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

`src/pages/index.astro` automatically discovers deck routes, so each deck should live in its own directory and expose `index.astro`.

### Override the Visual Direction

If you want to change the default colors or fonts, override CSS custom properties in `<style is:global>` inside the deck's `index.astro`.

```astro
<DeckLayout title="Presentation Title">
  <Title />
  <MarketOverview />
  <Summary />
</DeckLayout>

<style is:global>
  .slide-frame {
    --color-primary: #e11d48;
    --color-secondary: #0ea5e9;
    --font-family-sans: 'Inter', sans-serif;
  }
</style>
```

## Individual Slide Components

Each slide component should render one fixed slide frame using `SlideLayout.astro`.

```astro
---
import SlideLayout from '../../../components/SlideLayout.astro';
---

<SlideLayout
  title="Slide Title"
  transition="fade"
  theme="dark"
  showHeader={true}
  showFooter={true}
  notes="Speaker notes"
>
  <!-- Slide content goes here -->
</SlideLayout>
```

### `SlideLayout` Props

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

## Slide Structure Patterns

The structures and layouts below are optional examples, not required defaults.

### Basic Structure

1. **Title slide** - title, subtitle, date, author
2. **Agenda** - useful for longer proposals or reports, optional for short decks
3. **Section divider** - opening slide for each section when the deck has multiple parts
4. **Content slides** - the main body
5. **Summary / Next Steps** - key takeaways and next actions
6. **Closing** - useful for presentation-style decks, optional for document-style decks

### Common Layouts

- **Key message + chart** - message on top, chart below
- **Two-column layout** - chart or diagram on the left, takeaways on the right
- **KPI dashboard** - 3 to 4 large numbers in a row
- **Before / after** - current state on the left, proposal on the right
- **Process flow** - steps connected horizontally with arrows
- **Matrix** - a 2x2 classification layout

## Quality Checklist

After writing slides, confirm the following:

- [ ] Does it fit inside the fixed 1920x1080px frame?
- [ ] Does the slide communicate only one message?
- [ ] Is the title the key message?
- [ ] Is there enough whitespace, around 40-50%?
- [ ] Are you using CSS custom properties instead of hardcoded values?
- [ ] Are font sizes limited to the design tokens: `--font-size-title`, `--font-size-heading`, `--font-size-body`, `--font-size-caption`?
- [ ] Are colors limited to the design tokens such as `--color-primary`?
- [ ] Are sources written in caption-sized text?
- [ ] Are image aspect ratios preserved?

Run `npm run build:png -- --deck <deck-name>` and verify the result visually.
