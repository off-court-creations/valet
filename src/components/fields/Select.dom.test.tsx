// ─────────────────────────────────────────────────────────────
// src/components/fields/Select.dom.test.tsx | valet
// OVERLAY S6 — the Select menu is now a REAL portal into
// #valet-overlay-root, registered on the shared overlay stack via
// useOverlay(). Proves:
//   • the menu renders into the overlay root (not the local subtree)
//     and is `position: fixed` (escapes transform/overflow ancestors)
//   • PortalWrap (the Wave-0.3/OVERLAY-S2 fake full-viewport div) and
//     its pointer-events interim fix are gone
//   • opening registers exactly one stack layer; closing deregisters
//   • outside-click (via the shared stack) closes the menu
//   • option click commits and closes; the menu keeps its own clicks
//   • HEADLINE regression (audit Select.tsx:286 / overlay.ts:169):
//     a Select opened inside a Modal — Escape closes the MENU ONLY,
//     the Modal stays open
//   • no hand-rolled document listeners leak after close
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Select } from './Select';
import { Modal } from '../layout/Modal';
import { FormControl } from './FormControl';
import { createFormStore } from '../../system/createFormStore';
import { overlayStackSize } from '../../system/overlay';
import * as sheet from '../../css/sheet';

const SELECT_SRC = readFileSync(resolve(process.cwd(), 'src/components/fields/Select.tsx'), 'utf8');

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface/engine touch it indirectly. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

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

/** Dispatch a bubbling MouseEvent inside act (reaches React's root listener). */
const fire = (el: Element, type: 'mousedown' | 'click' | 'pointerdown') =>
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
  });

const overlayRoot = () => document.getElementById('valet-overlay-root');

/** The live listbox — queried from the overlay root (it is portalled there). */
const liveMenu = () => overlayRoot()?.querySelector<HTMLUListElement>('ul[role="listbox"]') ?? null;

/** Open a Select menu via its trigger (looked up within `scope`). */
function openMenu(scope: HTMLElement) {
  const trigger = scope.querySelector('[data-valet-component="Select"]')!;
  fire(trigger, 'click');
  const menu = liveMenu();
  expect(menu).not.toBeNull();
  return menu as HTMLUListElement;
}

/** Full text of the injected rule for `.cls` from the live global sheet. */
function ruleTextFor(cls: string) {
  const rules = Array.from(sheet.getGlobalSheet()!.cssRules, (r) => r.cssText);
  return rules.find((t) => t.startsWith(`.${cls}`)) ?? '';
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  // Every overlay deregistered on unmount — nothing leaks across tests.
  expect(overlayStackSize()).toBe(0);
});

const fixture = (extra: { onOutside?: () => void; onValueChange?: (v: unknown) => void } = {}) => (
  <>
    <Select
      placeholder='Pick…'
      onValueChange={(v) => extra.onValueChange?.(v)}
    >
      <Select.Option value='a'>Alpha</Select.Option>
      <Select.Option value='b'>Beta</Select.Option>
    </Select>
    <button
      type='button'
      data-testid='outside'
      onClick={() => extra.onOutside?.()}
    >
      outside
    </button>
  </>
);

/* Suite ----------------------------------------------------------------- */
describe('Select real portal (OVERLAY S6, jsdom)', () => {
  it('menu portals into #valet-overlay-root, NOT the local component subtree', () => {
    const { container } = renderStrict(fixture());
    const menu = openMenu(container);
    // It lives under the overlay root…
    expect(overlayRoot()!.contains(menu)).toBe(true);
    // …and NOT inside the rendered component subtree.
    expect(container.contains(menu)).toBe(false);
  });

  it('the menu rule is `position: fixed` (escapes transform/overflow ancestors), on the dropdown z-scale', () => {
    const { container } = renderStrict(fixture());
    const menu = openMenu(container);
    const rule = ruleTextFor(menu.className);
    expect(rule).toMatch(/position:\s*fixed/);
    // No leftover `position: absolute` (the pre-S6 absolutely-positioned menu).
    expect(rule).not.toMatch(/position:\s*absolute/);
    expect(rule).toMatch(/z-index:\s*var\(--valet-zindex-dropdown/);
  });

  it('PortalWrap (definition + JSX) and its pointer-events interim fix are deleted from source', () => {
    // The styled PortalWrap component no longer exists, nor is it rendered.
    expect(SELECT_SRC).not.toMatch(/const\s+PortalWrap\s*=/);
    expect(SELECT_SRC).not.toMatch(/<PortalWrap\b/);
    // The S2 interim `pointer-events:none/auto` insurance is gone.
    expect(SELECT_SRC).not.toMatch(/pointer-events/);
    // No hand-rolled document listeners remain (overlay.ts owns them now).
    expect(SELECT_SRC).not.toMatch(/document\.addEventListener/);
    expect(SELECT_SRC).not.toMatch(/document\.removeEventListener/);
    // It routes through the shared stack + a real portal instead.
    expect(SELECT_SRC).toMatch(/useOverlay\(\s*open\s*,/);
    expect(SELECT_SRC).toMatch(/createPortal\(/);
  });

  it('opening registers exactly one stack layer; closing deregisters it', () => {
    const { container } = renderStrict(fixture());
    expect(overlayStackSize()).toBe(0);
    openMenu(container);
    expect(overlayStackSize()).toBe(1);

    // Select an option → menu closes → layer pops.
    const option = liveMenu()!.querySelectorAll('li[role="option"]')[0];
    fire(option, 'click');
    expect(liveMenu()).toBeNull();
    expect(overlayStackSize()).toBe(0);
  });

  it('an outside click (via the shared overlay stack) closes the menu and reaches the sibling handler', () => {
    let outsideClicks = 0;
    const { container } = renderStrict(fixture({ onOutside: () => outsideClicks++ }));
    openMenu(container);

    const sibling = container.querySelector('[data-testid="outside"]')!;
    // The stack listens on capture-phase pointerdown; then click reaches the handler.
    fire(sibling, 'pointerdown');
    fire(sibling, 'click');

    expect(outsideClicks).toBe(1);
    expect(liveMenu()).toBeNull();
    expect(overlayStackSize()).toBe(0);
  });

  it('the menu still receives its own clicks (option click commits and closes)', () => {
    const seen: unknown[] = [];
    const { container } = renderStrict(fixture({ onValueChange: (v) => seen.push(v) }));
    const menu = openMenu(container);

    const option = menu.querySelectorAll('li[role="option"]')[1];
    // pointerdown inside the menu must NOT trigger the outside-click close …
    fire(option, 'pointerdown');
    expect(liveMenu()).not.toBeNull();
    // … and the click selects the option, then closes (single select).
    fire(option, 'click');

    expect(seen).toEqual(['b']);
    expect(liveMenu()).toBeNull();
  });

  it('clicking the trigger again does NOT outside-close (the trigger is a registered anchor)', () => {
    const { container } = renderStrict(fixture());
    const trigger = container.querySelector<HTMLElement>('[data-valet-component="Select"]')!;
    fire(trigger, 'click');
    expect(liveMenu()).not.toBeNull();
    expect(overlayStackSize()).toBe(1);

    // A pointerdown on the trigger is "inside" the overlay (anchor) → no stack close.
    fire(trigger, 'pointerdown');
    expect(liveMenu()).not.toBeNull();
    expect(overlayStackSize()).toBe(1);
  });
});

/* HEADLINE regression — the exact audit scenario --------------------- */
describe('Select inside Modal — Escape closes the menu ONLY (audit Select.tsx:286)', () => {
  const pressEscape = (target: EventTarget = document) =>
    act(() => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    });

  it('Escape with the Select open closes the dropdown but leaves the Modal open', () => {
    function Harness() {
      const [modalOpen, setModalOpen] = React.useState(true);
      return (
        <Modal
          open={modalOpen}
          title='Host dialog'
          onClose={() => setModalOpen(false)}
        >
          <Select placeholder='Pick…'>
            <Select.Option value='a'>Alpha</Select.Option>
            <Select.Option value='b'>Beta</Select.Option>
          </Select>
        </Modal>
      );
    }
    renderStrict(<Harness />);

    // Modal is the only layer until the Select opens.
    expect(overlayStackSize()).toBe(1);
    const dialog = overlayRoot()!.querySelector('[data-valet-component="Modal"]');
    expect(dialog).not.toBeNull();

    const trigger = overlayRoot()!.querySelector<HTMLElement>('[data-valet-component="Select"]')!;
    fire(trigger, 'click');
    expect(liveMenu()).not.toBeNull();
    expect(overlayStackSize()).toBe(2); // Modal + Select menu

    // Escape closes the TOP layer only: the Select menu.
    pressEscape();
    expect(liveMenu()).toBeNull();
    expect(overlayStackSize()).toBe(1); // Modal survives
    expect(overlayRoot()!.querySelector('[data-valet-component="Modal"]')).not.toBeNull();

    // A second Escape now closes the Modal itself.
    pressEscape();
    expect(overlayStackSize()).toBe(0);
    expect(overlayRoot()!.querySelector('[data-valet-component="Modal"]')).toBeNull();
  });
});

/*───────────────────────────────────────────────────────────────*/
/* 1.0 verify — width model / mobile / FormConfig                 */

const triggerEl = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="Select"]') as HTMLElement;
const selectRoot = (c: HTMLElement) => triggerEl(c).parentElement as HTMLElement;
const vOpts = (
  <>
    <Select.Option value='a'>A</Select.Option>
    <Select.Option value='b'>B</Select.Option>
  </>
);

describe('Select — 1.0 verify (width / mobile / FormConfig)', () => {
  it('fills its container by default (width:100% flex column, not inline-block)', () => {
    const { container } = renderStrict(<Select aria-label='s'>{vOpts}</Select>);
    const root = selectRoot(container);
    expect(root.style.width).toBe('100%');
    expect(root.style.display).toBe('flex');
  });

  it('width prop sets an explicit root width; fullWidth sets flex', () => {
    const { container } = renderStrict(
      <Select
        aria-label='s'
        width='12rem'
      >
        {vOpts}
      </Select>,
    );
    expect(selectRoot(container).style.width).toBe('12rem');
    const { container: c2 } = renderStrict(
      <Select
        aria-label='s'
        fullWidth
      >
        {vOpts}
      </Select>,
    );
    expect(selectRoot(c2).style.flexGrow).toBe('1');
  });

  it('exposes a >=44px coarse-pointer hit-size var on the trigger', () => {
    const { container } = renderStrict(<Select aria-label='s'>{vOpts}</Select>);
    expect(triggerEl(container).style.getPropertyValue('--valet-select-hit')).toBe('44px');
  });

  it('respects FormControl form-wide disabled + a name-keyed error', () => {
    const useStore = createFormStore({ pick: '' });
    const { container } = renderStrict(
      <FormControl
        useStore={useStore}
        disabled
        errors={{ pick: 'Required' }}
      >
        <Select
          name='pick'
          aria-label='s'
        >
          {vOpts}
        </Select>
      </FormControl>,
    );
    const trig = triggerEl(container) as HTMLButtonElement;
    expect(trig.disabled).toBe(true);
    expect(trig.getAttribute('aria-invalid')).toBe('true');
  });

  it('paints a deterministic control surface — no inherited --valet-bg/-text-color/-border vars', () => {
    const { container } = renderStrict(<Select aria-label='s'>{vOpts}</Select>);
    const cls = triggerEl(container).className.split(/\s+/).find(Boolean)!;
    const rule = Array.from(sheet.getGlobalSheet()!.cssRules, (r) => r.cssText).find((t) =>
      t.startsWith(`.${cls}`),
    )!;
    // The pre-fix trigger blended into the page via inherited Surface vars.
    expect(rule).not.toMatch(/var\(--valet-bg/);
    expect(rule).not.toMatch(/var\(--valet-text-color/);
    expect(rule).not.toMatch(/var\(--valet-border[,)]/);
  });
});
