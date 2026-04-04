# Component Design Guide

## Principles

**Components are not predefined. Create them freely based on the needs of the deck.**

Extract reusable patterns into components. If something is used only once, it does not need to become a component.

## Example Components to Create

These are optional examples, not a required starter set.

**Layout patterns:**
- `TwoColumn.astro` - Two columns with `slot="left"` and `slot="right"`
- `ThreeColumn.astro` - Three-column layout
- `FullBleed.astro` - Edge-to-edge display with no padding
- `CenterContent.astro` - Centered content

**Slide types:**
- `TitleSlide.astro` - For title slides
- `SectionDivider.astro` - Optional example for section breaks
- `AgendaSlide.astro` - Optional example for agenda and outline slides

**Data display:**
- `DataTable.astro` - Tables
- `KeyMetric.astro` - KPI highlight with a large number and label
- `Takeaways.astro` - Key-point list with icons and text

## Component Templates

### Layout Component Template

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

### Data Display Component Template

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
    font-size: 72px;
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
    font-size: var(--font-size-caption);
    color: var(--color-muted);
  }
</style>
```

### Process Flow Component Template

```astro
---
interface Props {
  steps: { number: string; title: string; description: string }[];
}
const { steps } = Astro.props;
---
<div class="flow">
  {steps.map((step, i) => (
    <Fragment>
      <div class="step">
        <span class="step-num">{step.number}</span>
        <span class="step-title">{step.title}</span>
        <span class="step-desc">{step.description}</span>
      </div>
      {i < steps.length - 1 && <div class="arrow">→</div>}
    </Fragment>
  ))}
</div>

<style>
  .flow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    height: 100%;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-xs);
    padding: var(--space-lg);
    background: var(--color-bg);
    border: 2px solid var(--color-border);
    border-radius: 16px;
    flex: 1;
    max-width: 300px;
  }

  .step-num {
    font-size: var(--font-size-heading);
    font-weight: 800;
    color: var(--color-primary);
  }

  .step-title {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--color-text);
  }

  .step-desc {
    font-size: var(--font-size-caption);
    color: var(--color-muted);
  }

  .arrow {
    font-size: var(--font-size-heading);
    color: var(--color-muted);
  }
</style>
```

## Design Rules

1. Define prop types clearly with `interface Props`.
2. **Use CSS custom properties. Do not hardcode values.** Use design tokens such as `var(--color-primary)` and `var(--space-md)`.
3. Use slots so the component can accept flexible child content.
4. Keep one component per file.
5. Scope styles inside Astro `<style>` tags.

## Prop Validation

- Always define `interface Props` at the top of the frontmatter.
- Use TypeScript union types for constrained values: `type?: 'default' | 'highlight' | 'muted'`.
- Provide sensible defaults with destructuring: `const { gap = 'var(--space-md)' } = Astro.props;`.
- Optional props should use `?` in the interface.

## Assets

Put shared images and reusable visual assets in `src/assets/shared/`.

If an image is only used by one deck, put it next to that deck under `src/pages/<deck-name>/_assets/`.

Do not add source assets directly to `dist/`. `dist/` is generated output only.

## Charts and Diagrams

### Prefer SVG

Write simple diagrams and icons directly in SVG.

```astro
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <rect x="20" y="100" width="60" height="100" fill="var(--color-chart-1)" />
  <rect x="100" y="60" width="60" height="140" fill="var(--color-chart-2)" />
  <rect x="180" y="20" width="60" height="180" fill="var(--color-chart-3)" />
</svg>
```

Use CSS custom properties for colors inside SVG as well.

### Good Use Cases for SVG

- Flowcharts, process diagrams, and org charts
- Simple bar charts and pie charts with five data points or fewer
- Icons and pictograms
- Concept diagrams, schematic illustrations, and timelines
- Matrices such as 2x2 charts

### When You Need a Library

If the data is dense or you need axes, labels, or legends:

1. Install a library such as `chart.js`
2. Wrap it in a component
3. Render it client-side with `client:load`

Rule of thumb:
- Five data points or fewer -> inline SVG
- Many data points, axes, or legends -> Chart.js or ECharts
- Flowcharts -> Mermaid or SVG
- Fully custom visuals -> D3.js
