// ─────────────────────────────────────────────────────────────
// src/components/primitives/Progress.dom.test.tsx | valet
// ProgressBar + ProgressRing — determinate value/aria, indeterminate
// state, and the data-state contract. The 1.0 `Progress` wrapper was
// removed; only the two primitives are exercised here.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ProgressBar, ProgressRing } from './Progress';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode into a fresh container; tracked for cleanup.
    ProgressBar/Ring read only the global theme store, so no Surface. */
function renderStrict(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return container;
}

const barEl = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="ProgressBar"]') as HTMLElement;
const ringEl = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="ProgressRing"]') as HTMLElement;

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* ── ProgressBar ─────────────────────────────────────────────────────── */
describe('ProgressBar (jsdom)', () => {
  it('determinate: sets role + aria-valuenow (clamped, rounded) and data-state', () => {
    const el = barEl(renderStrict(<ProgressBar value={42.6} />));
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('43'); // rounded
    expect(el.getAttribute('data-state')).toBe('determinate');
  });

  it('determinate: clamps an out-of-range value to 100', () => {
    const el = barEl(renderStrict(<ProgressBar value={150} />));
    expect(el.getAttribute('aria-valuenow')).toBe('100');
  });

  it('indeterminate (value omitted): no aria-valuenow + busy data-state + two sweep bars', () => {
    const el = barEl(renderStrict(<ProgressBar />));
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuenow')).toBeNull();
    expect(el.getAttribute('data-state')).toBe('indeterminate');
    // determinate renders one fill bar; indeterminate renders the two-lane sweep
    expect(el.querySelectorAll('div > div').length).toBeGreaterThanOrEqual(2);
  });

  it('forwards the sx object as inline style', () => {
    const el = barEl(
      renderStrict(
        <ProgressBar
          value={10}
          sx={{ marginTop: '5px' }}
        />,
      ),
    );
    expect(el.style.marginTop).toBe('5px');
  });
});

/* ── ProgressRing ────────────────────────────────────────────────────── */
describe('ProgressRing (jsdom)', () => {
  it('determinate: role + aria-valuenow + data-state, and renders an <svg>', () => {
    const el = ringEl(renderStrict(<ProgressRing value={75} />));
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuenow')).toBe('75');
    expect(el.getAttribute('data-state')).toBe('determinate');
    expect(el.querySelector('svg')).not.toBeNull();
    // track circle + progress circle
    expect(el.querySelectorAll('circle').length).toBe(2);
  });

  it('indeterminate (value omitted): no aria-valuenow + busy data-state', () => {
    const el = ringEl(renderStrict(<ProgressRing />));
    expect(el.getAttribute('aria-valuenow')).toBeNull();
    expect(el.getAttribute('data-state')).toBe('indeterminate');
  });

  it('renders a percent label when label is true', () => {
    const el = ringEl(
      renderStrict(
        <ProgressRing
          value={37}
          label
        />,
      ),
    );
    expect(el.textContent).toContain('37%');
  });

  it('formats the label via a function', () => {
    const el = ringEl(
      renderStrict(
        <ProgressRing
          value={50}
          label={(v) => `${v} pts`}
        />,
      ),
    );
    expect(el.textContent).toContain('50 pts');
  });

  it('forwards arbitrary aria-* attributes (e.g. aria-label for spinners)', () => {
    const el = ringEl(renderStrict(<ProgressRing aria-label='Loading' />));
    expect(el.getAttribute('aria-label')).toBe('Loading');
  });
});
