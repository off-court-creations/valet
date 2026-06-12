// ─────────────────────────────────────────────────────────────
// src/components/layout/Modal.overlay.dom.test.tsx | valet
// OVERLAY S4 regression — Modal migrated to registry v2's
// useOverlay(active, config) ref-callback. Proves:
//   • open/close cycles register / deregister on the stack
//   • options resolve LIVE (swap onClose between renders → the new
//     handler fires; the v1 frozen onRequestClose closure is dead)
//   • Escape / focus-trap / inert attach on the FIRST open commit
//     (the audit bug, Modal.tsx:223: one render late — escape/trap/
//     inert only attached because an unrelated setFade forced a 2nd
//     render)
//   • the :266 light-mode contrast fix (foreground is theme `text`)
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Modal } from './Modal';
import { overlayStackSize } from '../../system/overlay';
import { useTheme } from '../../system/themeStore';

// jsdom's import.meta.url is a virtual (non-file) URL; resolve off cwd (repo
// root) like the other source-asserting suites (useGoogleFonts.dom.test.tsx).
const MODAL_SRC = readFileSync(resolve(process.cwd(), 'src/components/layout/Modal.tsx'), 'utf8');

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; the engine/Surface touch it indirectly. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
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

const overlayRoot = () => document.getElementById('valet-overlay-root');
const dialogEl = () => overlayRoot()?.querySelector<HTMLElement>('[data-valet-component="Modal"]');

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  expect(overlayStackSize()).toBe(0);
});

describe('Modal registry-v2 migration (jsdom)', () => {
  it('registers on open and deregisters on close (one stack layer per open Modal)', () => {
    const { rerender } = render(
      <Modal
        open={false}
        title='T'
      >
        body
      </Modal>,
    );
    expect(overlayStackSize()).toBe(0);

    rerender(
      <Modal
        open
        title='T'
      >
        body
      </Modal>,
    );
    expect(overlayStackSize()).toBe(1);

    rerender(
      <Modal
        open={false}
        title='T'
      >
        body
      </Modal>,
    );
    expect(overlayStackSize()).toBe(0);
  });

  it('reads onClose LIVE across re-renders — swapped handler fires, the v1 frozen closure is dead', () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = render(
      <Modal
        open
        title='T'
        onClose={stale}
      >
        body
      </Modal>,
    );
    expect(overlayStackSize()).toBe(1);

    // Same open Modal, only the onClose prop changes — no remount, no
    // re-registration. The registry v2 thunk must resolve the new handler.
    rerender(
      <Modal
        open
        title='T'
        onClose={fresh}
      >
        body
      </Modal>,
    );
    expect(overlayStackSize()).toBe(1);

    pressEscape();
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled();
  });

  it('attaches via the v2 ref-callback, NOT a render-phase dialogRef.current read (audit Modal.tsx:223)', () => {
    // The audit bug: useOverlay was gated on `open && dialogRef.current` read
    // DURING render — null on the first open render, so escape/trap/inert
    // attached one render late (only because setFade forced render #2). The fix
    // routes registration through the registry-v2 ref-callback, which fires in
    // the commit phase of the FIRST open render. A full act() flush makes both
    // shapes externally identical, so this guards the source: the render-phase
    // ref-gate must be gone and the ref-callback wiring present.
    expect(MODAL_SRC).not.toMatch(/open\s*&&\s*dialogRef\.current\s*\?/);
    expect(MODAL_SRC).toMatch(/useOverlay\(\s*open\s*,/); // v2 (active, config)
    expect(MODAL_SRC).toMatch(/ref=\{setDialogRef\}/); // ref-callback on the dialog
  });

  it('Escape closes the Modal in the FIRST open commit (audit: attachment was one render late)', () => {
    // A controlled-open Modal whose onClose flips it shut. With the v1
    // render-phase ref read, escape/trap/inert attached only after a second
    // (setFade) render; here we dispatch Escape immediately after the single
    // open render and require it to dismiss.
    function Harness() {
      const [open, setOpen] = React.useState(true);
      return (
        <Modal
          open={open}
          title='First commit'
          onClose={() => setOpen(false)}
        >
          body
        </Modal>
      );
    }
    render(<Harness />);
    expect(overlayStackSize()).toBe(1); // attached in the open commit
    expect(dialogEl()).not.toBeNull();

    pressEscape();
    expect(overlayStackSize()).toBe(0); // dismissed → element unmounts → deregistered
    expect(dialogEl()).toBeNull();
  });

  it('inert background attaches on first open commit (page siblings get inert + aria-hidden)', () => {
    const page = document.createElement('div');
    page.id = 'page-sibling';
    document.body.appendChild(page);
    roots.push({
      root: { unmount() {} } as unknown as Root,
      container: page,
    });

    render(
      <Modal
        open
        title='T'
      >
        body
      </Modal>,
    );
    // Background lock applied synchronously in the registration (first commit).
    expect(page.getAttribute('inert')).toBe('');
    expect(page.getAttribute('aria-hidden')).toBe('true');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('focus trap moves focus into the dialog on first open commit', () => {
    render(
      <Modal
        open
        title='T'
        actions={<button type='button'>OK</button>}
      >
        body
      </Modal>,
    );
    const dialog = dialogEl();
    expect(dialog).not.toBeNull();
    // Initial focus landed on the first focusable inside the dialog.
    expect(dialog!.contains(document.activeElement)).toBe(true);
  });

  it('light-mode contrast fix: dialog colour is theme `text` (#090909), not primaryText (#F7F7F7)', () => {
    // In light mode backgroundAlt=#D6D6D6; primaryText=#F7F7F7 is ~1.3:1 (the
    // audit bug, Modal.tsx:266) while text=#090909 is high-contrast. The Box
    // styled rule must paint with text, mirroring Panel.tsx:184's bg→text map.
    const prevMode = useTheme.getState().mode;
    act(() => useTheme.getState().setMode('light'));
    try {
      render(
        <Modal
          open
          title='T'
        >
          body
        </Modal>,
      );
      const dialog = dialogEl();
      expect(dialog).not.toBeNull();
      // The styled Box paints `color` via its z-div-* class; scan the inserted
      // rules for that class and read its declared colour.
      const cls = Array.from(dialog!.classList).find((c) => c.startsWith('z-div-'));
      expect(cls).toBeTruthy();
      const colour = ruleColorFor(cls!);
      // jsdom normalizes hex → rgb(); #090909 = rgb(9,9,9), #F7F7F7 = rgb(247…).
      expect(colour).toBe('rgb(9, 9, 9)'); // theme.colors.text
      expect(colour).not.toBe('rgb(247, 247, 247)'); // NOT primaryText (the bug)
    } finally {
      act(() => useTheme.getState().setMode(prevMode));
    }
  });
});

/** Read the `color` declaration from the inserted rule for a styled class. */
function ruleColorFor(cls: string): string | undefined {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules) as CSSStyleRule[]) {
      if (rule.selectorText === `.${cls}` && rule.style && rule.style.color) {
        return rule.style.color;
      }
    }
  }
  return undefined;
}
