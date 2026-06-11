// ─────────────────────────────────────────────────────────────
// src/components/primitives/Typography.dom.test.tsx | valet
// caller style / sx merge — caller style survives, sx wins on
// conflicts, no style attribute when neither given (API-TYPES S2)
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Typography } from './Typography';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; createSurfaceStore constructs one ----- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode inside a Surface context; tracked for cleanup. */
function renderWithSurface(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  act(() => {
    root.render(
      <React.StrictMode>
        <SurfaceCtx.Provider value={store}>{node}</SurfaceCtx.Provider>
      </React.StrictMode>,
    );
  });
  return { root, container };
}

const typoEl = (container: HTMLElement) =>
  container.querySelector('[data-valet-component="Typography"]') as HTMLElement;

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('Typography style/sx merge (jsdom)', () => {
  it('forwards a caller style prop when no sx is given (was clobbered before)', () => {
    const { container } = renderWithSurface(
      <Typography style={{ marginTop: '7px' }}>hi</Typography>,
    );
    expect(typoEl(container).style.marginTop).toBe('7px');
  });

  it('keeps caller style alongside sx when keys do not conflict', () => {
    const { container } = renderWithSurface(
      <Typography
        style={{ marginTop: '7px' }}
        sx={{ paddingBottom: '3px' }}
      >
        hi
      </Typography>,
    );
    const el = typoEl(container);
    expect(el.style.marginTop).toBe('7px');
    expect(el.style.paddingBottom).toBe('3px');
  });

  it('sx wins over caller style on conflicting keys', () => {
    const { container } = renderWithSurface(
      <Typography
        style={{ color: 'rgb(1, 2, 3)', marginTop: '7px' }}
        sx={{ color: 'rgb(4, 5, 6)' }}
      >
        hi
      </Typography>,
    );
    const el = typoEl(container);
    expect(el.style.color).toBe('rgb(4, 5, 6)');
    /* non-conflicting caller keys still survive */
    expect(el.style.marginTop).toBe('7px');
  });

  it('renders no style attribute when neither style nor sx is given', () => {
    const { container } = renderWithSurface(<Typography>hi</Typography>);
    expect(typoEl(container).getAttribute('style')).toBeNull();
  });
});
