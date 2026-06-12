// ─────────────────────────────────────────────────────────────
// src/components/fields/Select.dom.test.tsx | valet
// OVERLAY S2 — the open menu's full-viewport PortalWrap must not
// swallow page-wide pointer events: pointer-events:none on the wrap,
// pointer-events:auto on the Menu (interim until OVERLAY S6 replaces
// PortalWrap with a real portal).
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Select } from './Select';
import * as sheet from '../../css/sheet';

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

/** Dispatch a bubbling MouseEvent inside act (reaches React's root listener). */
const fire = (el: Element, type: 'mousedown' | 'click') =>
  act(() => {
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
  });

/** Open the Select menu via its trigger; returns the live listbox. */
function openMenu(container: HTMLElement) {
  const trigger = container.querySelector('[data-valet-component="Select"]')!;
  fire(trigger, 'click');
  const menu = container.querySelector('ul[role="listbox"]');
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
describe('Select PortalWrap pointer-events (jsdom)', () => {
  it('wrap rule is pointer-events:none; menu rule is pointer-events:auto', () => {
    /* jsdom has no hit-testing, so a dispatched click would "reach" an
       occluded element regardless — assert the injected CSS directly. */
    const { container } = renderStrict(fixture());
    const menu = openMenu(container);
    const wrap = menu.parentElement as HTMLElement;
    expect(wrap).not.toBeNull();
    /* PortalWrap is the full-viewport fixed layer hosting the menu. */
    expect(ruleTextFor(wrap.className)).toMatch(/pointer-events:\s*none/);
    expect(ruleTextFor(wrap.className)).toMatch(/position:\s*fixed/);
    expect(ruleTextFor(menu.className)).toMatch(/pointer-events:\s*auto/);
  });

  it('with the menu open, a click on a sibling button reaches its handler and closes the menu', () => {
    let outsideClicks = 0;
    const { container } = renderStrict(fixture({ onOutside: () => outsideClicks++ }));
    openMenu(container);

    const sibling = container.querySelector('[data-testid="outside"]')!;
    /* Real pointer interaction: mousedown (click-away listener) then click. */
    fire(sibling, 'mousedown');
    fire(sibling, 'click');

    expect(outsideClicks).toBe(1);
    expect(container.querySelector('ul[role="listbox"]')).toBeNull();
  });

  it('the menu still receives its own clicks (option click commits and closes)', () => {
    const seen: unknown[] = [];
    const { container } = renderStrict(fixture({ onValueChange: (v) => seen.push(v) }));
    const menu = openMenu(container);

    const option = menu.querySelectorAll('li[role="option"]')[1];
    /* mousedown inside the menu must NOT trigger the click-away close … */
    fire(option, 'mousedown');
    expect(container.querySelector('ul[role="listbox"]')).not.toBeNull();
    /* … and the click selects the option, then closes (single select). */
    fire(option, 'click');

    expect(seen).toEqual(['b']);
    expect(container.querySelector('ul[role="listbox"]')).toBeNull();
  });
});
