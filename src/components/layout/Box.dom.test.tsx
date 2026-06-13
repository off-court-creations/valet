// ─────────────────────────────────────────────────────────────
// src/components/layout/Box.dom.test.tsx | valet
// caller style / sx merge — caller style survives, sx wins on
// conflicts, background promotion never clobbers sx (API-TYPES S2)
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Box } from './Box';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode into a fresh container; tracked for cleanup. */
function renderStrict(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return { root, container };
}

const boxEl = (container: HTMLElement) =>
  container.querySelector('[data-valet-component="Box"]') as HTMLElement;

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('Box style/sx merge (jsdom)', () => {
  it('forwards a caller style prop when no sx is given (was dropped before)', () => {
    const { container } = renderStrict(<Box style={{ marginTop: '7px' }} />);
    expect(boxEl(container).style.marginTop).toBe('7px');
  });

  it('keeps caller style alongside sx when keys do not conflict', () => {
    const { container } = renderStrict(
      <Box
        style={{ marginTop: '7px' }}
        sx={{ paddingBottom: '3px' }}
      />,
    );
    const el = boxEl(container);
    expect(el.style.marginTop).toBe('7px');
    expect(el.style.paddingBottom).toBe('3px');
  });

  it('sx wins over caller style on conflicting keys', () => {
    const { container } = renderStrict(
      <Box
        style={{ color: 'rgb(1, 2, 3)', marginTop: '7px' }}
        sx={{ color: 'rgb(4, 5, 6)' }}
      />,
    );
    const el = boxEl(container);
    expect(el.style.color).toBe('rgb(4, 5, 6)');
    /* non-conflicting caller keys still survive */
    expect(el.style.marginTop).toBe('7px');
  });

  it('background prop promotion overrides caller style but never clobbers sx', () => {
    const promoted = renderStrict(
      <Box
        background='rgb(10, 20, 30)'
        style={{ background: 'rgb(1, 1, 1)' }}
      />,
    );
    const promotedEl = boxEl(promoted.container);
    expect(promotedEl.style.background).toBe('rgb(10, 20, 30)');
    expect(promotedEl.style.getPropertyValue('--valet-bg')).toBe('rgb(10, 20, 30)');

    const vetoed = renderStrict(
      <Box
        background='rgb(10, 20, 30)'
        sx={{ background: 'rgb(2, 2, 2)' }}
      />,
    );
    expect(boxEl(vetoed.container).style.background).toBe('rgb(2, 2, 2)');
  });
});
