// ─────────────────────────────────────────────────────────────
// src/components/widgets/LoadingBackdrop.dom.test.tsx | valet
// LoadingBackdrop — the fade/visibility contract (aria-hidden +
// pointer-events + opacity track `fading`, data-state flips), the
// spinner's show/hide opacity, and the labelled ProgressRing inside.
//
// LoadingBackdrop reads only the global theme + locale strings (its
// ProgressRing uses useTheme, not useSurface), so no Surface wrapper is
// required.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LoadingBackdrop } from './LoadingBackdrop';

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

const backdrop = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="LoadingBackdrop"]') as HTMLElement;

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('LoadingBackdrop (jsdom)', () => {
  it('shown (not fading): visible, interactive, and not aria-hidden', () => {
    const el = backdrop(render(<LoadingBackdrop />));
    expect(el).not.toBeNull();
    expect(el.getAttribute('aria-hidden')).toBe('false');
    expect(el.getAttribute('data-state')).toBe('open');
    expect(el.style.opacity).toBe('1');
    expect(el.style.pointerEvents).toBe('auto');
  });

  it('fading: hidden from a11y tree, non-interactive, opacity 0', () => {
    const el = backdrop(render(<LoadingBackdrop fading />));
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('data-state')).toBe('closed');
    expect(el.style.opacity).toBe('0');
    expect(el.style.pointerEvents).toBe('none');
  });

  it('renders the spinner ring with the localized loading label', () => {
    const el = backdrop(render(<LoadingBackdrop showSpinner />));
    const ring = el.querySelector('[data-valet-component="ProgressRing"]');
    expect(ring).not.toBeNull();
    // No-provider default → English "Loading" copy.
    expect(ring!.getAttribute('aria-label')).toBe('Loading');
  });

  it('toggles the spinner wrapper opacity on showSpinner', () => {
    const hidden = backdrop(render(<LoadingBackdrop showSpinner={false} />));
    const hiddenWrap = hidden.querySelector('[data-valet-component="ProgressRing"]')!
      .parentElement as HTMLElement;
    expect(hiddenWrap.style.opacity).toBe('0');

    const shown = backdrop(render(<LoadingBackdrop showSpinner />));
    const shownWrap = shown.querySelector('[data-valet-component="ProgressRing"]')!
      .parentElement as HTMLElement;
    expect(shownWrap.style.opacity).toBe('1');
  });

  it('overrides the loading label via the labels prop', () => {
    const el = backdrop(
      render(
        <LoadingBackdrop
          showSpinner
          labels={{ loading: 'Chargement' }}
        />,
      ),
    );
    const ring = el.querySelector('[data-valet-component="ProgressRing"]')!;
    expect(ring.getAttribute('aria-label')).toBe('Chargement');
  });
});
