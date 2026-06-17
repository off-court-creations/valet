// ─────────────────────────────────────────────────────────────
// src/components/layout/Stack.improve.dom.test.tsx | valet
// W1 additive improve coverage:
//   • align/justify token maps + the preserved direction-derived align default
//   • per-axis gapX/gapY
//   • responsive props compile to nested @media (NO <Surface> required)
//   • grow factor + public scroll modes
//   • divider interleaving (n-1, correct edges)
//   • polymorphic `as`
//   • sugar: HStack / VStack / Center / Cluster / Spacer (own markers)
// Companion to Stack.dom.test.tsx (the legacy non-breaking regression guard).
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Stack, HStack, VStack, Center, Cluster, Spacer } from './Stack';
import * as sheet from '../../css/sheet';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];
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

const elFor = (c: HTMLElement, name = 'Stack') =>
  c.querySelector(`[data-valet-component="${name}"]`) as HTMLElement;

/** The CSS rule text (incl. nested @media) for the element's styled class. */
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
describe('Stack — align / justify', () => {
  it('maps align tokens to align-items values', () => {
    expect(ruleFor(elFor(render(<Stack align='center' />)))).toContain('align-items: center');
    expect(ruleFor(elFor(render(<Stack align='start' />)))).toContain('align-items: flex-start');
    expect(ruleFor(elFor(render(<Stack align='baseline' />)))).toContain('align-items: baseline');
  });

  it('preserves the direction-derived align default (column→stretch, row→center)', () => {
    expect(ruleFor(elFor(render(<Stack />)))).toContain('align-items: stretch');
    expect(ruleFor(elFor(render(<Stack direction='row' />)))).toContain('align-items: center');
  });

  it('maps justify tokens, and emits none by default', () => {
    expect(ruleFor(elFor(render(<Stack justify='between' />)))).toContain(
      'justify-content: space-between',
    );
    expect(ruleFor(elFor(render(<Stack justify='evenly' />)))).toContain(
      'justify-content: space-evenly',
    );
    expect(ruleFor(elFor(render(<Stack />)))).not.toContain('justify-content');
  });
});

describe('Stack — per-axis gap', () => {
  it('emits column-gap / row-gap that override gap on their axis', () => {
    const rule = ruleFor(
      elFor(
        render(
          <Stack
            gapX={2}
            gapY={1}
          />,
        ),
      ),
    );
    expect(rule).toContain('column-gap');
    expect(rule).toContain('row-gap');
  });
});

describe('Stack — responsive props compile to @media (no Surface)', () => {
  it('responsive direction emits a base + @media block and never throws without a Surface', () => {
    // Rendered with NO SurfaceCtx provider — responsive is pure CSS, no useSurface.
    const rule = ruleFor(elFor(render(<Stack direction={{ xs: 'column', md: 'row' }} />)));
    expect(rule).toContain('flex-direction: column'); // base
    expect(rule).toContain('@media');
    expect(rule).toMatch(/min-width:\s*960px/); // md breakpoint
    expect(rule).toContain('flex-direction: row'); // inside the @media block
  });

  it('a map omitting xs keeps the default below the smallest breakpoint', () => {
    const rule = ruleFor(elFor(render(<Stack direction={{ md: 'row' }} />)));
    expect(rule).toContain('flex-direction: column'); // fallback base
    expect(rule).toMatch(/min-width:\s*960px/);
  });

  it('responsive gap emits @media', () => {
    const rule = ruleFor(elFor(render(<Stack gap={{ xs: 1, md: 2 }} />)));
    expect(rule).toContain('@media');
    expect(rule).toMatch(/min-width:\s*960px/);
  });
});

describe('Stack — grow / scroll', () => {
  it('grow maps to flex-grow', () => {
    expect(ruleFor(elFor(render(<Stack grow />)))).toContain('flex-grow: 1');
    expect(ruleFor(elFor(render(<Stack grow={2} />)))).toContain('flex-grow: 2');
    expect(ruleFor(elFor(render(<Stack />)))).not.toContain('flex-grow');
  });

  it('scroll modes drive overflow; default keeps the --valet-stack-ov-y hook', () => {
    expect(ruleFor(elFor(render(<Stack />)))).toContain('var(--valet-stack-ov-y');
    expect(ruleFor(elFor(render(<Stack scroll='x' />)))).toContain('overflow-x: auto');
    expect(ruleFor(elFor(render(<Stack scroll='visible' />)))).toContain('overflow-x: visible');
  });
});

describe('Stack — divider', () => {
  it('interleaves n-1 dividers between children (correct edges)', () => {
    const c = render(
      <Stack divider={<hr data-divider />}>
        <span data-item>a</span>
        <span data-item>b</span>
        <span data-item>c</span>
      </Stack>,
    );
    expect(c.querySelectorAll('[data-item]')).toHaveLength(3);
    expect(c.querySelectorAll('[data-divider]')).toHaveLength(2);
  });

  it('emits no divider for a single child', () => {
    const c = render(
      <Stack divider={<hr data-divider />}>
        <span data-item>only</span>
      </Stack>,
    );
    expect(c.querySelectorAll('[data-divider]')).toHaveLength(0);
  });
});

describe('Stack — polymorphic as', () => {
  it('renders the requested element while keeping the marker + styled class', () => {
    const c = render(<Stack as='nav' />);
    const nav = c.querySelector('nav[data-valet-component="Stack"]') as HTMLElement;
    expect(nav).not.toBeNull();
    expect(nav.className).toMatch(/\bz-/);
  });
});

/*───────────────────────────────────────────────────────────*/
describe('Stack sugar', () => {
  it('HStack is a centered row that self-identifies', () => {
    const el = elFor(render(<HStack />), 'HStack');
    expect(el).not.toBeNull();
    const rule = ruleFor(el);
    expect(rule).toContain('flex-direction: row');
    expect(rule).toContain('align-items: center');
  });

  it('VStack is a column that self-identifies', () => {
    const el = elFor(render(<VStack />), 'VStack');
    expect(el).not.toBeNull();
    expect(ruleFor(el)).toContain('flex-direction: column');
  });

  it('Center centers on both axes', () => {
    const rule = ruleFor(elFor(render(<Center />), 'Center'));
    expect(rule).toContain('align-items: center');
    expect(rule).toContain('justify-content: center');
  });

  it('Cluster is a wrapping centered row', () => {
    const rule = ruleFor(elFor(render(<Cluster />), 'Cluster'));
    expect(rule).toContain('flex-direction: row');
    expect(rule).toContain('flex-wrap: wrap');
    expect(rule).toContain('align-items: center');
  });

  it('HStack forwards as and overridable props', () => {
    const c = render(
      <HStack
        as='nav'
        justify='between'
      />,
    );
    const nav = c.querySelector('nav[data-valet-component="HStack"]') as HTMLElement;
    expect(nav).not.toBeNull();
    expect(ruleFor(nav)).toContain('justify-content: space-between');
  });

  it('Spacer renders a flex-grow filler that self-identifies', () => {
    const c = render(<Spacer />);
    const sp = c.querySelector('[data-valet-component="Spacer"]') as HTMLElement;
    expect(sp).not.toBeNull();
    expect(sp.getAttribute('aria-hidden')).toBe('true');
    expect(sp.style.flex).toBe('1 1 0%');
    const c2 = render(<Spacer grow={3} />);
    expect((c2.querySelector('[data-valet-component="Spacer"]') as HTMLElement).style.flex).toBe(
      '3 1 0%',
    );
  });
});
