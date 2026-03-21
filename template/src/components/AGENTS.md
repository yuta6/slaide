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

## Design Rules

1. Define prop types clearly.
2. **Use CSS custom properties. Do not hardcode values.** Use design tokens such as `var(--color-primary)` and `var(--space-md)`.
3. Use slots so the component can accept flexible child content.
4. Keep one component per file.
5. Scope styles inside Astro `<style>` tags.

## Good Example

```astro
---
interface Props {
  items: { icon?: string; text: string; highlight?: boolean }[];
}
const { items } = Astro.props;
---
<ul class="takeaways">
  {items.map(item => (
    <li class:list={["item", { highlight: item.highlight }]}>
      {item.icon && <span class="icon">{item.icon}</span>}
      <span>{item.text}</span>
    </li>
  ))}
</ul>

<style>
  .takeaways {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    list-style: none;
    padding: 0;
  }

  .item {
    font-size: var(--font-size-body);
    padding: var(--space-sm) var(--space-md);
    border-left: 3px solid var(--color-muted);
  }

  .item.highlight {
    border-left-color: var(--color-primary);
    font-weight: 700;
  }

  .icon {
    margin-right: var(--space-xs);
  }
</style>
```

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
