// ─────────────────────────────────────────────────────────────
// src/components/layout/Grid.dom.test.tsx | valet
// Grid — the column count drives grid-template-columns, `adaptive`
// collapses to a single column in portrait, and `density` rides on the
// --valet-space inline var. The track count lives in the injected CSS
// rule (styled prop), so we read it from the global stylesheet.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Grid } from './Grid';
import { SurfaceCtx, createSurfaceStore, type SurfaceStore } from '../../system/surfaceStore';
import * as sheet from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; createSurfaceStore constructs one ----- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode, store: SurfaceStore = createSurfaceStore()) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(
      <React.StrictMode>
        <SurfaceCtx.Provider value={store}>{node}</SurfaceCtx.Provider>
      </React.StrictMode>,
    );
  });
  return container;
}

const gridEl = (c: HTMLElement) => c.querySelector('[data-valet-component="Grid"]') as HTMLElement;

/** The CSS rule text for the element's first (styled) class. */
const ruleFor = (el: Element) => {
  const cls = el.className.split(' ').find(Boolean) ?? '';
  const rules = Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText);
  return rules.find((t) => t.startsWith(`.${cls}`)) ?? '';
};

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.unstubAllGlobals();
});

/* Suite ----------------------------------------------------------------- */
describe('Grid (jsdom)', () => {
  it('defaults to two columns', () => {
    const el = gridEl(render(<Grid />));
    expect(ruleFor(el)).toContain('repeat(2, minmax(0, 1fr))');
  });

  it('applies the columns prop to grid-template-columns', () => {
    const el = gridEl(render(<Grid columns={4} />));
    expect(ruleFor(el)).toContain('repeat(4, minmax(0, 1fr))');
  });

  it('defaults the gutter to 2 spacing units (~16px) — role-aware card-grid default (1.0)', () => {
    // "Beautiful by default": a Grid lays out cards/regions, so its default gap
    // is 2× the spacing unit (was 1×). Pinned so the default can't silently drift.
    const el = gridEl(render(<Grid />));
    expect(ruleFor(el)).toMatch(/gap:\s*calc\(var\(--valet-space[^)]*\)\s*\*\s*2\)/);
  });

  it('an explicit gap overrides the default (dense opt-down)', () => {
    const el = gridEl(render(<Grid gap={1} />));
    expect(ruleFor(el)).toMatch(/gap:\s*calc\(var\(--valet-space[^)]*\)\s*\*\s*1\)/);
  });

  it('renders its children', () => {
    const c = render(
      <Grid columns={3}>
        <span data-cell>a</span>
        <span data-cell>b</span>
      </Grid>,
    );
    expect(c.querySelectorAll('[data-cell]')).toHaveLength(2);
  });

  it('adaptive: collapses to a single column when the surface is portrait', () => {
    const store = createSurfaceStore();
    // Portrait: height > width.
    act(() => store.setState({ width: 400, height: 900 }));
    const el = gridEl(
      render(
        <Grid
          columns={3}
          adaptive
        />,
        store,
      ),
    );
    expect(ruleFor(el)).toContain('repeat(1, minmax(0, 1fr))');
  });

  it('adaptive: keeps the requested columns in landscape', () => {
    const store = createSurfaceStore();
    act(() => store.setState({ width: 900, height: 400 }));
    const el = gridEl(
      render(
        <Grid
          columns={3}
          adaptive
        />,
        store,
      ),
    );
    expect(ruleFor(el)).toContain('repeat(3, minmax(0, 1fr))');
  });

  it('density sets the --valet-space inline custom property', () => {
    const el = gridEl(render(<Grid density='comfortable' />));
    expect(el.style.getPropertyValue('--valet-space')).toContain('* 1.15');
  });
});
