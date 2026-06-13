// ─────────────────────────────────────────────────────────────
// src/components/layout/Drawer.overlay.dom.test.tsx | valet
// OVERLAY S4 regression — Drawer migrated to registry v2's
// useOverlay(active, config) ref-callback. Proves:
//   • open/close cycles register / deregister on the stack
//   • options resolve LIVE (swap onClose between renders → the new
//     handler fires; the v1 frozen onRequestClose closure is dead)
//   • Escape / inert attach on the FIRST open commit (the audit
//     bug shape: render-phase ref read attached one render late)
//   • persistent Drawer never registers an overlay layer
// Dialog semantics (role/aria-modal/trapFocus) are OVERLAY S5, not
// migrated here. House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from './Surface';
import { Drawer } from './Drawer';
import { overlayStackSize } from '../../system/overlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const DRAWER_SRC = readFileSync(resolve(process.cwd(), 'src/components/layout/Drawer.tsx'), 'utf8');

/* jsdom ships no ResizeObserver; Surface + Drawer observe in effects. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  // matchMedia is read by adaptive Drawers; provide a benign stub.
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

const pressEscape = () =>
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
  });

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  expect(overlayStackSize()).toBe(0);
});

describe('Drawer registry-v2 migration (jsdom)', () => {
  it('registers on open and deregisters on close', () => {
    const { rerender } = render(
      <Surface>
        <Drawer open={false}>contents</Drawer>
      </Surface>,
    );
    expect(overlayStackSize()).toBe(0);

    rerender(
      <Surface>
        <Drawer open>contents</Drawer>
      </Surface>,
    );
    expect(overlayStackSize()).toBe(1);

    rerender(
      <Surface>
        <Drawer open={false}>contents</Drawer>
      </Surface>,
    );
    expect(overlayStackSize()).toBe(0);
  });

  it('persistent Drawer registers NO overlay layer (no backdrop/Escape/inert)', () => {
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
    expect(overlayStackSize()).toBe(0);
  });

  it('reads onClose LIVE across re-renders — swapped handler fires on Escape (v1 frozen closure dead)', () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = render(
      <Surface>
        <Drawer
          open
          onClose={stale}
        >
          contents
        </Drawer>
      </Surface>,
    );
    expect(overlayStackSize()).toBe(1);

    rerender(
      <Surface>
        <Drawer
          open
          onClose={fresh}
        >
          contents
        </Drawer>
      </Surface>,
    );
    expect(overlayStackSize()).toBe(1); // same panel, no re-registration

    pressEscape();
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled();
  });

  it('Escape dismisses an uncontrolled Drawer opened in a single commit', () => {
    function Harness() {
      const [open, setOpen] = React.useState(true);
      return (
        <Surface>
          <Drawer
            open={open}
            onClose={() => setOpen(false)}
          >
            contents
          </Drawer>
        </Surface>
      );
    }
    render(<Harness />);
    expect(overlayStackSize()).toBe(1);

    pressEscape();
    expect(overlayStackSize()).toBe(0); // closed → panel unmounts → deregistered
  });

  it('inert background attaches on first open commit (page siblings get inert + aria-hidden)', () => {
    const page = document.createElement('div');
    page.id = 'drawer-page-sibling';
    document.body.appendChild(page);
    roots.push({ root: { unmount() {} } as unknown as Root, container: page });

    render(
      <Surface>
        <Drawer open>contents</Drawer>
      </Surface>,
    );
    expect(page.getAttribute('inert')).toBe('');
    expect(page.getAttribute('aria-hidden')).toBe('true');
  });

  it('attaches via the v2 ref-callback, NOT a render-phase panelRef.current read (audit shape)', () => {
    // Same audit shape as Modal.tsx:223: the v1 gate read `panelRef.current`
    // during render (null on the first open render), so Escape/inert attached
    // one render late. The v2 ref-callback registers in the first open commit.
    expect(DRAWER_SRC).not.toMatch(/panelRef\.current\s*$/m);
    expect(DRAWER_SRC).not.toMatch(/!persistentEffective\s*&&\s*panelRef\.current\s*\?/);
    expect(DRAWER_SRC).toMatch(/useOverlay\(\s*overlayActive\s*,/); // v2 shape
    expect(DRAWER_SRC).toMatch(/ref=\{setPanelRef\}/); // ref-callback on the panel
  });
});
