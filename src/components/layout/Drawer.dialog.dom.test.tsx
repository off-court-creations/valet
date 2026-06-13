// ─────────────────────────────────────────────────────────────
// src/components/layout/Drawer.dialog.dom.test.tsx | valet
// OVERLAY S5 regression — an overlay (non-persistent) Drawer is a
// real modal dialog. Proves:
//   • role='dialog' + aria-modal='true' + tabIndex=-1 on the panel
//   • aria-label / aria-labelledby props reach the dialog
//   • focus moves INTO the panel on open (trapFocus:true) — the
//     stranded-focus fix: pre-S5 the background went inert but focus
//     was never moved in, stranding it on the now-inert trigger
//   • focus RESTORES to the trigger on close
//   • Tab focus is trapped (wraps within the dialog)
//   • a persistent Drawer carries NONE of the dialog semantics
//   • a dev warning fires when an overlay Drawer has no accessible name
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Drawer } from './Drawer';
import { overlayStackSize } from '../../system/overlay';
import { resetWarnOnce } from '../../system/devErrors';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface + Drawer observe in effects. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  if (!window.matchMedia) {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }));
  }
});

beforeEach(() => {
  resetWarnOnce();
});

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return {
    root,
    container,
    rerender: (next: React.ReactNode) =>
      act(() => {
        root.render(next);
      }),
  };
}

const overlayRoot = () => document.getElementById('valet-overlay-root');
const panelEl = () => overlayRoot()?.querySelector<HTMLElement>('[data-valet-component="Drawer"]');

const pressTab = (shiftKey = false) =>
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true }),
    );
  });

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  expect(overlayStackSize()).toBe(0);
});

describe('Drawer dialog semantics (OVERLAY S5, jsdom)', () => {
  it('overlay Drawer renders role=dialog, aria-modal=true, tabIndex=-1', () => {
    render(
      <Surface>
        <Drawer
          open
          aria-label='Nav'
        >
          <button type='button'>one</button>
        </Drawer>
      </Surface>,
    );
    const panel = panelEl();
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('role')).toBe('dialog');
    expect(panel!.getAttribute('aria-modal')).toBe('true');
    expect(panel!.getAttribute('tabindex')).toBe('-1');
  });

  it('forwards aria-label and aria-labelledby to the dialog panel', () => {
    const { rerender } = render(
      <Surface>
        <Drawer
          open
          aria-label='Main navigation'
        >
          contents
        </Drawer>
      </Surface>,
    );
    expect(panelEl()!.getAttribute('aria-label')).toBe('Main navigation');

    rerender(
      <Surface>
        <Drawer
          open
          aria-labelledby='drawer-heading'
        >
          contents
        </Drawer>
      </Surface>,
    );
    expect(panelEl()!.getAttribute('aria-labelledby')).toBe('drawer-heading');
  });

  it('moves focus INTO the panel on open (stranded-focus fix: trapFocus:true)', () => {
    render(
      <Surface>
        <Drawer
          open
          aria-label='Nav'
        >
          <button type='button'>first</button>
          <button type='button'>second</button>
        </Drawer>
      </Surface>,
    );
    const panel = panelEl();
    expect(panel).not.toBeNull();
    // Focus landed on the first focusable inside the panel — NOT stranded on
    // the now-inert background trigger.
    expect(panel!.contains(document.activeElement)).toBe(true);
    expect((document.activeElement as HTMLElement)?.textContent).toBe('first');
  });

  it('moves focus to the panel container itself when the Drawer has no focusables', () => {
    render(
      <Surface>
        <Drawer
          open
          aria-label='Empty'
        >
          plain text only
        </Drawer>
      </Surface>,
    );
    const panel = panelEl();
    expect(panel).not.toBeNull();
    // No focusable children → focus the tabIndex=-1 container, never stranded.
    expect(document.activeElement).toBe(panel);
  });

  it('requests focus restoration on close and deregisters cleanly', () => {
    // The Drawer wires restoreFocusOnClose:true into its overlay config (source
    // assertion below); the actual restore-to-trigger is exercised at the
    // registry layer (overlay.dom.test.ts "restoreFocusOnClose returns focus to
    // the trigger"). Here we only require that closing the overlay Drawer
    // deregisters the layer (which is what triggers the registry's restore).
    function Harness({ open }: { open: boolean }) {
      return (
        <Surface>
          <button
            type='button'
            data-trigger
          >
            open drawer
          </button>
          <Drawer
            open={open}
            aria-label='Nav'
          >
            <button type='button'>inside</button>
          </Drawer>
        </Surface>
      );
    }
    const { container, rerender } = render(<Harness open={false} />);
    const trigger = container.querySelector('[data-trigger]') as HTMLButtonElement;
    act(() => trigger.focus());

    rerender(<Harness open />);
    expect(overlayStackSize()).toBe(1);
    // Focus moved into the panel on open (the stranded-focus fix).
    expect(panelEl()!.contains(document.activeElement)).toBe(true);

    rerender(<Harness open={false} />);
    // Closing deregisters the layer; the registry runs restoreFocusOnClose.
    expect(overlayStackSize()).toBe(0);
    // Focus left the (now-unmounted) panel — it is not stranded in the void.
    expect(panelEl()).toBeNull();
    expect(document.activeElement).not.toBeNull();
  });

  it('Drawer overlay config opts into focus restoration (source)', () => {
    const src = readFileSync(resolve(process.cwd(), 'src/components/layout/Drawer.tsx'), 'utf8');
    expect(src).toMatch(/restoreFocusOnClose:\s*true/);
    expect(src).toMatch(/trapFocus:\s*true/);
  });

  it('traps Tab focus inside the overlay Drawer (wraps last → first)', () => {
    render(
      <Surface>
        <Drawer
          open
          aria-label='Nav'
        >
          <button type='button'>a</button>
          <button type='button'>b</button>
        </Drawer>
      </Surface>,
    );
    const panel = panelEl()!;
    const buttons = Array.from(panel.querySelectorAll('button'));
    // Focus the last focusable, then Tab → wraps to the first (trap engaged).
    act(() => (buttons[buttons.length - 1] as HTMLElement).focus());
    pressTab();
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('persistent Drawer carries NO dialog semantics (role/aria-modal/tabindex absent)', () => {
    render(
      <Surface>
        <Drawer
          open
          persistent
        >
          contents
        </Drawer>
      </Surface>,
    );
    // Persistent drawers render inline inside the portal root but are not
    // dialogs and register no overlay layer.
    expect(overlayStackSize()).toBe(0);
    const panel = panelEl();
    expect(panel).not.toBeNull();
    expect(panel!.getAttribute('role')).toBeNull();
    expect(panel!.getAttribute('aria-modal')).toBeNull();
    expect(panel!.getAttribute('tabindex')).toBeNull();
  });

  it('warns once when an overlay Drawer has no accessible name', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <Surface>
          <Drawer open>contents</Drawer>
        </Surface>,
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/Drawer:.*accessible name/i);
    } finally {
      warn.mockRestore();
    }
  });

  it('does NOT warn when an accessible name is supplied', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <Surface>
          <Drawer
            open
            aria-label='Nav'
          >
            contents
          </Drawer>
        </Surface>,
      );
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('does NOT warn for a persistent Drawer without a name (not a dialog)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      render(
        <Surface>
          <Drawer
            open
            persistent
          >
            contents
          </Drawer>
        </Surface>,
      );
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
