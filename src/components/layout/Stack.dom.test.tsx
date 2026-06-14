// ─────────────────────────────────────────────────────────────
// src/components/layout/Stack.dom.test.tsx | valet
// Stack — direction drives flex-direction, rows wrap by default while
// columns do not, density rides on the --valet-space inline var, and
// children render. Direction/wrap live in the injected styled rule, so
// they are read from the global stylesheet.
//
// Stack reads only the global theme + compact context (no Typography /
// useSurface), so no Surface wrapper is required.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Stack } from './Stack';
import * as sheet from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
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

const stackEl = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="Stack"]') as HTMLElement;

/** The CSS rule text for the element's first (styled) class. */
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

/* Suite ----------------------------------------------------------------- */
describe('Stack (jsdom)', () => {
  it('defaults to a column flex direction', () => {
    const el = stackEl(render(<Stack />));
    expect(ruleFor(el)).toContain('flex-direction: column');
  });

  it('applies direction=row', () => {
    const el = stackEl(render(<Stack direction='row' />));
    expect(ruleFor(el)).toContain('flex-direction: row');
  });

  it('rows wrap by default', () => {
    const el = stackEl(render(<Stack direction='row' />));
    expect(ruleFor(el)).toContain('flex-wrap: wrap');
  });

  it('columns do not wrap by default', () => {
    const el = stackEl(render(<Stack direction='column' />));
    expect(ruleFor(el)).not.toContain('flex-wrap: wrap');
  });

  it('respects an explicit wrap override on a column', () => {
    const el = stackEl(
      render(
        <Stack
          direction='column'
          wrap
        />,
      ),
    );
    expect(ruleFor(el)).toContain('flex-wrap: wrap');
  });

  it('renders its children', () => {
    const c = render(
      <Stack>
        <span data-item>a</span>
        <span data-item>b</span>
        <span data-item>c</span>
      </Stack>,
    );
    expect(c.querySelectorAll('[data-item]')).toHaveLength(3);
  });

  it('density sets the --valet-space inline custom property', () => {
    const el = stackEl(render(<Stack density='tight' />));
    expect(el.style.getPropertyValue('--valet-space')).toContain('* 0.8'); // tight (0.8)
  });
});
