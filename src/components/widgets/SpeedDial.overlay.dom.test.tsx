// ─────────────────────────────────────────────────────────────
// src/components/widgets/SpeedDial.overlay.dom.test.tsx | valet
// OVERLAY S8 regression — SpeedDial dismissal on the registry-v2
// overlay stack (useOverlay(active, config) ref-callback). Proves:
//   • the dial registers on the open commit and deregisters on close
//     (disclosure semantics: no focus trap, no inert background)
//   • Escape closes the dial AND refocuses the main FAB
//   • outside-click (stack-aware) closes the dial WITHOUT yanking
//     focus back to the FAB (a click is not keyboard dismissal)
//   • close-on-action: invoking an action collapses the dial, returns
//     focus to the FAB, and still runs the caller's handler
//   • clicks on the FAB / action buttons count as INSIDE the layer
//   • no leftover self-managed Escape / onBlur handlers (R15: A11Y S4
//     dropped them; dismissal is OVERLAY S8's lane, on the stack)
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import SpeedDial, { type SpeedDialAction } from './SpeedDial';
import { overlayStackSize } from '../../system/overlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SPEEDDIAL_SRC = readFileSync(
  resolve(process.cwd(), 'src/components/widgets/SpeedDial.tsx'),
  'utf8',
);

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return { root, container };
}

const pressEscape = () =>
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
  });

const pointerDownOn = (target: Element) =>
  act(() => {
    target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
  });

const clickOn = (target: Element) =>
  act(() => {
    target.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  // Every test must leave the shared overlay stack empty.
  expect(overlayStackSize()).toBe(0);
});

const dot = (key: string) => <span data-icon={key}>•</span>;

const makeActions = (onShare = () => {}, onPrint = () => {}): SpeedDialAction[] => [
  { icon: dot('a'), label: 'Share', onClick: onShare },
  { icon: dot('b'), label: 'Print', onClick: onPrint },
];

const getFab = (container: HTMLElement) =>
  container.querySelector('button[aria-label="Speed dial"]')! as HTMLButtonElement;

const getActions = (container: HTMLElement) => {
  const id = getFab(container).getAttribute('aria-controls')!;
  return Array.from(document.getElementById(id)!.querySelectorAll('button'));
};

/* Suite ----------------------------------------------------------------- */
describe('SpeedDial overlay dismissal (jsdom)', () => {
  it('registers on the open commit and deregisters when closed', () => {
    const { container } = render(
      <SpeedDial
        icon={dot('main')}
        actions={makeActions()}
      />,
    );
    // Closed by default — nothing on the stack.
    expect(overlayStackSize()).toBe(0);

    act(() => getFab(container).click());
    expect(getFab(container).getAttribute('aria-expanded')).toBe('true');
    expect(overlayStackSize()).toBe(1); // opened → registered

    act(() => getFab(container).click());
    expect(getFab(container).getAttribute('aria-expanded')).toBe('false');
    expect(overlayStackSize()).toBe(0); // toggled closed → deregistered
  });

  it('Escape closes the dial AND refocuses the main FAB', () => {
    const { container } = render(
      <SpeedDial
        icon={dot('main')}
        actions={makeActions()}
      />,
    );
    const fab = getFab(container);
    act(() => fab.click());
    expect(overlayStackSize()).toBe(1);

    // Move focus off the FAB onto an open action, mimicking keyboard navigation
    // into the expanded dial, so the refocus assertion is meaningful.
    const [share] = getActions(container);
    act(() => share.focus());
    expect(document.activeElement).toBe(share);

    pressEscape();
    expect(fab.getAttribute('aria-expanded')).toBe('false');
    expect(overlayStackSize()).toBe(0);
    expect(document.activeElement).toBe(fab); // Escape returns focus to the trigger
  });

  it('outside pointer-down closes the dial but does NOT yank focus to the FAB', () => {
    // A separate page region that is outside the SpeedDial layer.
    const page = document.createElement('button');
    page.type = 'button';
    document.body.appendChild(page);
    roots.push({ root: { unmount() {} } as unknown as Root, container: page });

    const { container } = render(
      <SpeedDial
        icon={dot('main')}
        actions={makeActions()}
      />,
    );
    const fab = getFab(container);
    act(() => fab.click());
    expect(overlayStackSize()).toBe(1);

    // Focus the outside element first; an outside CLICK dismissal must not
    // steal that focus back to the FAB (only keyboard Escape refocuses).
    act(() => page.focus());
    pointerDownOn(page);
    expect(fab.getAttribute('aria-expanded')).toBe('false');
    expect(overlayStackSize()).toBe(0);
    expect(document.activeElement).toBe(page); // outside click leaves focus alone
  });

  it('clicking the FAB or an action button counts as INSIDE the layer (no outside-close race)', () => {
    const onShare = vi.fn();
    const { container } = render(
      <SpeedDial
        icon={dot('main')}
        actions={makeActions(onShare)}
      />,
    );
    const fab = getFab(container);
    act(() => fab.click());
    expect(overlayStackSize()).toBe(1);

    // A pointerdown on an action button is INSIDE the registered Container, so
    // the stack-aware outside-click resolver must not treat it as outside.
    const [share] = getActions(container);
    pointerDownOn(share);
    expect(fab.getAttribute('aria-expanded')).toBe('true'); // still open
    expect(overlayStackSize()).toBe(1);
  });

  it('close-on-action: invoking an action collapses the dial, refocuses the FAB, and runs the handler', () => {
    const onShare = vi.fn();
    const { container } = render(
      <SpeedDial
        icon={dot('main')}
        actions={makeActions(onShare)}
      />,
    );
    const fab = getFab(container);
    act(() => fab.click());
    expect(overlayStackSize()).toBe(1);

    const [share] = getActions(container);
    clickOn(share);

    expect(onShare).toHaveBeenCalledTimes(1); // caller handler still runs
    expect(fab.getAttribute('aria-expanded')).toBe('false'); // collapsed
    expect(overlayStackSize()).toBe(0); // deregistered
    expect(document.activeElement).toBe(fab); // focus returns to the trigger
  });

  it('reads the action handler LIVE across re-renders (no frozen v1 closure)', () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { container, root } = render(
      <SpeedDial
        icon={dot('main')}
        actions={makeActions(stale)}
      />,
    );
    act(() => getFab(container).click());

    // Swap the action handler while the dial stays open.
    act(() => {
      root.render(
        <SpeedDial
          icon={dot('main')}
          actions={makeActions(fresh)}
        />,
      );
    });
    expect(overlayStackSize()).toBe(1); // same layer, no re-registration

    const [share] = getActions(container);
    clickOn(share);
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled();
  });

  it('uses the registry-v2 hook and keeps no self-managed Escape/onBlur dismissal (R15)', () => {
    // Dismissal rides the shared stack via useOverlay(open, …) — not a local
    // keydown/Escape branch or an onBlur collapse left over from before A11Y S4.
    expect(SPEEDDIAL_SRC).toMatch(/useOverlay\(\s*open\s*,/);
    expect(SPEEDDIAL_SRC).not.toMatch(/onBlur/);
    expect(SPEEDDIAL_SRC).not.toMatch(/onKeyDown/);
    expect(SPEEDDIAL_SRC).not.toMatch(/key\s*===\s*['"]Escape['"]/);
  });
});
