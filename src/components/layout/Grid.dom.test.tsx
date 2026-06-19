// ─────────────────────────────────────────────────────────────
// src/components/layout/Grid.dom.test.tsx | valet
// Grid (W2 rewrite): real display:grid. columns drives the track count,
// minColWidth switches to auto-fit/fill (via the --valet-grid-min var),
// responsive columns compile to @media, equalize stretches children,
// density rides --valet-space, and single-column grids relax overflow.
// GridItem carries per-cell placement. NO <Surface> needed (decoupled).
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Grid, GridItem } from './Grid';
import * as sheet from '../../css/sheet';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];
/** Rendered with NO SurfaceCtx — the rewrite removed Grid's useSurface. */
function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return container;
}

const elFor = (c: HTMLElement, name = 'Grid') =>
  c.querySelector(`[data-valet-component="${name}"]`) as HTMLElement;

const ruleFor = (el: Element) => {
  const cls = el.className.split(' ').find(Boolean) ?? '';
  const rules = Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText);
  return rules.find((t) => t.startsWith(`.${cls}`)) ?? '';
};

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/*───────────────────────────────────────────────────────────*/
describe('Grid — columns', () => {
  it('defaults to two equal columns and never throws without a Surface', () => {
    expect(ruleFor(elFor(render(<Grid />)))).toContain('repeat(2, minmax(0, 1fr))');
  });

  it('applies the columns prop', () => {
    expect(ruleFor(elFor(render(<Grid columns={4} />)))).toContain('repeat(4, minmax(0, 1fr))');
  });

  it('defaults the gutter to 2 spacing units (card-grid default)', () => {
    expect(ruleFor(elFor(render(<Grid />)))).toMatch(
      /gap:\s*calc\(var\(--valet-space[^)]*\)\s*\*\s*2\)/,
    );
  });

  it('responsive columns compile to @media (no Surface)', () => {
    const rule = ruleFor(elFor(render(<Grid columns={{ xs: 1, md: 3 }} />)));
    expect(rule).toContain('repeat(1, minmax(0, 1fr))');
    expect(rule).toMatch(/min-width:\s*960px/);
    expect(rule).toContain('repeat(3, minmax(0, 1fr))');
  });
});

describe('Grid — minColWidth auto-fit/fill', () => {
  it('switches to repeat(auto-fill, …) and sets --valet-grid-min (default fill)', () => {
    const el = elFor(render(<Grid minColWidth={200} />));
    expect(ruleFor(el)).toContain('repeat(auto-fill');
    expect(ruleFor(el)).toContain('minmax(min(var(--valet-grid-min');
    expect(el.style.getPropertyValue('--valet-grid-min')).toBe('200px');
  });

  it('autoFlow=fit uses repeat(auto-fit, …)', () => {
    expect(
      ruleFor(
        elFor(
          render(
            <Grid
              minColWidth={200}
              autoFlow='fit'
            />,
          ),
        ),
      ),
    ).toContain('repeat(auto-fit');
  });

  it('accepts a string minColWidth verbatim', () => {
    expect(
      (elFor(render(<Grid minColWidth='16rem' />)) as HTMLElement).style.getPropertyValue(
        '--valet-grid-min',
      ),
    ).toBe('16rem');
  });

  it('minColWidth overrides columns (no fixed-track template)', () => {
    expect(
      ruleFor(
        elFor(
          render(
            <Grid
              columns={5}
              minColWidth={200}
            />,
          ),
        ),
      ),
    ).not.toContain('repeat(5,');
  });
});

describe('Grid — alignment / gap / equalize', () => {
  it('maps align / justifyItems (grid box-alignment keywords)', () => {
    const rule = ruleFor(
      elFor(
        render(
          <Grid
            align='center'
            justifyItems='start'
          />,
        ),
      ),
    );
    expect(rule).toContain('align-items: center');
    expect(rule).toContain('justify-items: start');
  });

  it('defaults to stretch on both axes', () => {
    const rule = ruleFor(elFor(render(<Grid />)));
    expect(rule).toContain('align-items: stretch');
    expect(rule).toContain('justify-items: stretch');
  });

  it('per-axis gapX / gapY', () => {
    const rule = ruleFor(
      elFor(
        render(
          <Grid
            gapX={2}
            gapY={1}
          />,
        ),
      ),
    );
    expect(rule).toContain('column-gap');
    expect(rule).toContain('row-gap');
  });

  it('equalize (default true) asks children to fill their cell; off opts out', () => {
    expect(ruleFor(elFor(render(<Grid />)))).toContain('--valet-panel-width: 100%');
    expect(ruleFor(elFor(render(<Grid equalize={false} />)))).not.toContain(
      '--valet-panel-width: 100%',
    );
  });
});

describe('Grid — single-column relax + density + polymorphic', () => {
  it('relaxes child overflow only for an explicit single column', () => {
    expect(ruleFor(elFor(render(<Grid columns={1} />)))).toContain('--valet-stack-ov-y: visible');
    expect(ruleFor(elFor(render(<Grid columns={2} />)))).not.toContain(
      '--valet-stack-ov-y: visible',
    );
  });

  it('density sets the --valet-space inline custom property', () => {
    expect(
      (elFor(render(<Grid density='comfortable' />)) as HTMLElement).style.getPropertyValue(
        '--valet-space',
      ),
    ).toContain('* 1)');
  });

  it('renders its children and supports polymorphic as', () => {
    const c = render(
      <Grid
        as='section'
        columns={3}
      >
        <span data-cell>a</span>
        <span data-cell>b</span>
      </Grid>,
    );
    expect(c.querySelector('section[data-valet-component="Grid"]')).not.toBeNull();
    expect(c.querySelectorAll('[data-cell]')).toHaveLength(2);
  });
});

/*───────────────────────────────────────────────────────────*/
describe('GridItem', () => {
  it('maps span / rowSpan / colStart', () => {
    expect(ruleFor(elFor(render(<GridItem span={2} />), 'GridItem'))).toContain(
      'grid-column: span 2',
    );
    expect(ruleFor(elFor(render(<GridItem rowSpan={3} />), 'GridItem'))).toContain(
      'grid-row: span 3',
    );
    expect(ruleFor(elFor(render(<GridItem colStart={2} />), 'GridItem'))).toContain(
      'grid-column-start: 2',
    );
  });

  it('responsive span compiles to @media', () => {
    const rule = ruleFor(elFor(render(<GridItem span={{ xs: 12, md: 8 }} />), 'GridItem'));
    expect(rule).toContain('grid-column: span 12');
    expect(rule).toMatch(/min-width:\s*960px/);
    expect(rule).toContain('grid-column: span 8');
  });

  it('a bare GridItem renders its child (valid 1x1 cell)', () => {
    const c = render(
      <GridItem>
        <span data-x>x</span>
      </GridItem>,
    );
    expect(c.querySelector('[data-valet-component="GridItem"] [data-x]')).not.toBeNull();
  });
});
