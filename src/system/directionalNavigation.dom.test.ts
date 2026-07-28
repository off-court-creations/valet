// ─────────────────────────────────────────────────────────────
// src/system/directionalNavigation.dom.test.ts  | valet
// DOM eligibility, ownership, activation, and lifecycle regressions
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDirectionalNavigation,
  type DirectionalNavigationController,
  type DirectionalNavigationScopeRef,
} from './directionalNavigation';
import { getGlobalSheet } from '../css/sheet';

const controllers: DirectionalNavigationController[] = [];
const mounted: HTMLElement[] = [];

const makeRect = (left: number, top: number, width = 20, height = 20): DOMRect =>
  ({
    x: left,
    y: top,
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    toJSON: () => ({}),
  }) as DOMRect;

function setRect(
  element: HTMLElement,
  left: number,
  top: number,
  width = 20,
  height = 20,
  hasClientRect = true,
): void {
  const value = makeRect(left, top, width, height);
  element.getBoundingClientRect = () => value;
  element.getClientRects = () =>
    ({
      0: hasClientRect ? value : undefined,
      length: hasClientRect ? 1 : 0,
      item: (index: number) => (hasClientRect && index === 0 ? value : null),
      [Symbol.iterator]: function* () {
        if (hasClientRect) yield value;
      },
    }) as DOMRectList;
}

function mountScope(): HTMLDivElement {
  const scope = document.createElement('div');
  document.body.appendChild(scope);
  mounted.push(scope);
  return scope;
}

function addButton(scope: HTMLElement, name: string, left = 0, top = 0): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = name;
  scope.appendChild(button);
  setRect(button, left, top);
  return button;
}

function create(
  scope: HTMLElement | DirectionalNavigationScopeRef | (() => HTMLElement | null) | null,
): DirectionalNavigationController {
  const controller = createDirectionalNavigation({ scope });
  controllers.push(controller);
  return controller;
}

afterEach(() => {
  for (const controller of controllers.splice(0)) controller.dispose();
  for (const element of mounted.splice(0)) element.remove();
  document.body.focus();
  vi.restoreAllMocks();
});

describe('createDirectionalNavigation — sequential movement', () => {
  it('moves next/previous in deterministic tabindex order without implicit wrapping', () => {
    const scope = mountScope();
    const zero = addButton(scope, 'zero');
    const two = addButton(scope, 'two');
    const one = addButton(scope, 'one');
    two.tabIndex = 2;
    one.tabIndex = 1;
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(one);
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(two);
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(zero);
    expect(navigation.move('next')).toBe(false);
    expect(document.activeElement).toBe(zero);
    expect(navigation.move('previous')).toBe(true);
    expect(document.activeElement).toBe(two);
  });

  it('uses the first target for initial next and the last target for initial previous', () => {
    const scope = mountScope();
    const first = addButton(scope, 'first');
    const last = addButton(scope, 'last');
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(first);
    navigation.clear();
    expect(navigation.move('previous')).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it('represents a named radio group once, preferring its checked eligible member', () => {
    const scope = mountScope();
    const before = addButton(scope, 'before');
    const first = document.createElement('input');
    first.type = 'radio';
    first.name = 'difficulty';
    scope.appendChild(first);
    setRect(first, 0, 30);
    const checked = document.createElement('input');
    checked.type = 'radio';
    checked.name = 'difficulty';
    checked.checked = true;
    scope.appendChild(checked);
    setRect(checked, 0, 60);
    const after = addButton(scope, 'after', 0, 90);
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(before);
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(checked);
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(after);
    expect(navigation.move('previous')).toBe(true);
    expect(document.activeElement).toBe(checked);

    first.focus();
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(after);

    navigation.clear();
    checked.checked = false;
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(before);
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('returns false when the scope has no eligible candidates', () => {
    const scope = mountScope();
    scope.appendChild(document.createElement('div'));
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(false);
    expect(navigation.move('right')).toBe(false);
    expect(navigation.activate()).toBe(false);
  });
});

describe('createDirectionalNavigation — spatial movement', () => {
  it('enters an unfocused scope from the edge opposite each requested direction', () => {
    const scope = mountScope();
    const top = addButton(scope, 'top', 50, 0);
    const left = addButton(scope, 'left', 0, 50);
    const right = addButton(scope, 'right', 100, 50);
    const bottom = addButton(scope, 'bottom', 50, 100);
    const navigation = create(scope);

    expect(navigation.move('down')).toBe(true);
    expect(document.activeElement).toBe(top);
    navigation.clear();
    expect(navigation.move('up')).toBe(true);
    expect(document.activeElement).toBe(bottom);
    navigation.clear();
    expect(navigation.move('right')).toBe(true);
    expect(document.activeElement).toBe(left);
    navigation.clear();
    expect(navigation.move('left')).toBe(true);
    expect(document.activeElement).toBe(right);
  });

  it('returns false and retains focus when no target exists in that direction', () => {
    const scope = mountScope();
    const only = addButton(scope, 'only', 0, 0);
    const navigation = create(scope);
    only.focus();

    expect(navigation.move('right')).toBe(false);
    expect(document.activeElement).toBe(only);
  });
});

describe('createDirectionalNavigation — candidate eligibility and scope', () => {
  it('never crosses its explicit DOM scope', () => {
    const firstScope = mountScope();
    const secondScope = mountScope();
    const inside = addButton(firstScope, 'inside');
    addButton(secondScope, 'outside', -100, 0);
    const navigation = create(firstScope);

    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(inside);
  });

  it('discovers native links and form controls plus deliberately focusable interactive roles', () => {
    const scope = mountScope();
    const anchor = document.createElement('a');
    anchor.href = '#target';
    scope.appendChild(anchor);
    const input = document.createElement('input');
    scope.appendChild(input);
    const select = document.createElement('select');
    select.appendChild(document.createElement('option'));
    scope.appendChild(select);
    const textarea = document.createElement('textarea');
    scope.appendChild(textarea);
    const roleButton = document.createElement('div');
    roleButton.setAttribute('role', 'button');
    roleButton.tabIndex = 0;
    scope.appendChild(roleButton);
    const genericFocusable = document.createElement('div');
    genericFocusable.tabIndex = 0;
    scope.appendChild(genericFocusable);
    const roleOnly = document.createElement('div');
    roleOnly.setAttribute('role', 'button');
    scope.appendChild(roleOnly);

    const expected = [anchor, input, select, textarea, roleButton, genericFocusable];
    expected.forEach((element, index) => setRect(element, 0, index * 30));
    setRect(roleOnly, 0, expected.length * 30);
    const navigation = create(scope);

    for (const element of expected) {
      expect(navigation.move('next')).toBe(true);
      expect(document.activeElement).toBe(element);
    }
    expect(navigation.move('next')).toBe(false);
    expect(document.activeElement).toBe(genericFocusable);
  });

  it('excludes hidden, disabled, inert, aria-disabled, disconnected, and negative-tabindex nodes', () => {
    const scope = mountScope();

    const hidden = addButton(scope, 'hidden');
    hidden.hidden = true;
    const disabled = addButton(scope, 'disabled');
    disabled.disabled = true;
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.tabIndex = 0;
    scope.appendChild(hiddenInput);
    setRect(hiddenInput, 0, 0);
    const ariaDisabled = addButton(scope, 'aria-disabled');
    ariaDisabled.setAttribute('aria-disabled', 'true');
    const negative = addButton(scope, 'negative');
    negative.tabIndex = -1;
    const visibilityHidden = addButton(scope, 'visibility-hidden');
    visibilityHidden.style.visibility = 'hidden';
    const nonRendered = addButton(scope, 'non-rendered');
    setRect(nonRendered, 0, 0, 0, 0, false);
    const excluded = addButton(scope, 'excluded');
    excluded.setAttribute('data-valet-navigation-exclude', 'true');

    const inertWrapper = document.createElement('div');
    inertWrapper.setAttribute('inert', '');
    scope.appendChild(inertWrapper);
    addButton(inertWrapper, 'inert');
    const ariaHiddenWrapper = document.createElement('div');
    ariaHiddenWrapper.setAttribute('aria-hidden', 'true');
    scope.appendChild(ariaHiddenWrapper);
    addButton(ariaHiddenWrapper, 'aria-hidden');
    const ariaDisabledWrapper = document.createElement('div');
    ariaDisabledWrapper.setAttribute('aria-disabled', 'true');
    scope.appendChild(ariaDisabledWrapper);
    addButton(ariaDisabledWrapper, 'aria-disabled-ancestor');
    const displayNoneWrapper = document.createElement('div');
    displayNoneWrapper.style.display = 'none';
    scope.appendChild(displayNoneWrapper);
    addButton(displayNoneWrapper, 'display-none');

    const disconnected = addButton(scope, 'disconnected');
    disconnected.remove();
    const eligible = addButton(scope, 'eligible');
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(eligible);
  });

  it('uses only the first implicit summary in a details element unless tabindex is explicit', () => {
    const scope = mountScope();
    const details = document.createElement('details');
    details.open = true;
    scope.appendChild(details);
    const first = document.createElement('summary');
    first.textContent = 'first';
    details.appendChild(first);
    setRect(first, 0, 0);
    const second = document.createElement('summary');
    second.textContent = 'second';
    details.appendChild(second);
    setRect(second, 0, 30);
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(first);
    expect(navigation.move('next')).toBe(false);

    second.tabIndex = 0;
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(second);
  });

  it('keeps a rendered zero-size proxy input reachable but rejects a non-rendered zero box', () => {
    const scope = mountScope();
    const proxy = document.createElement('input');
    proxy.type = 'checkbox';
    scope.appendChild(proxy);
    setRect(proxy, 10, 10, 0, 0, true);
    const nonRendered = document.createElement('button');
    scope.appendChild(nonRendered);
    setRect(nonRendered, 20, 20, 0, 0, false);
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(proxy);
    expect(navigation.move('next')).toBe(false);
  });

  it('uses an adjacent visual indicator for spatial geometry while focusing the real input', () => {
    const scope = mountScope();
    const origin = addButton(scope, 'origin', 0, 0);
    const proxy = document.createElement('input');
    proxy.type = 'checkbox';
    scope.appendChild(proxy);
    setRect(proxy, 0, 0, 0, 0, true);
    const indicator = document.createElement('span');
    indicator.setAttribute('data-indicator', '');
    scope.appendChild(indicator);
    setRect(indicator, 40, 0);
    const navigation = create(scope);
    origin.focus();

    expect(navigation.move('right')).toBe(true);
    expect(document.activeElement).toBe(proxy);
  });

  it('resolves absent, mounted, replaced, and disconnected ref scopes on every call', () => {
    const firstScope = mountScope();
    const first = addButton(firstScope, 'first');
    const secondScope = mountScope();
    const second = addButton(secondScope, 'second');
    const ref: DirectionalNavigationScopeRef = { current: null };
    const navigation = create(ref);

    expect(navigation.move('next')).toBe(false);
    (ref as { current: HTMLElement | null }).current = firstScope;
    expect(navigation.move('next')).toBe(true);
    expect(first.getAttribute('data-valet-navigation-focus')).toBe('true');

    (ref as { current: HTMLElement | null }).current = secondScope;
    expect(navigation.move('next')).toBe(true);
    expect(first.hasAttribute('data-valet-navigation-focus')).toBe(false);
    expect(document.activeElement).toBe(second);

    (ref as { current: HTMLElement | null }).current = null;
    expect(navigation.move('next')).toBe(false);
    expect(second.hasAttribute('data-valet-navigation-focus')).toBe(false);

    (ref as { current: HTMLElement | null }).current = secondScope;
    secondScope.remove();
    expect(navigation.move('next')).toBe(false);
  });

  it('keeps nested navigators independent and supports an explicit outer-scope boundary', () => {
    const outer = mountScope();
    const outerButton = addButton(outer, 'outer');
    const inner = document.createElement('div');
    outer.appendChild(inner);
    const innerButton = addButton(inner, 'inner');
    const outerNavigation = create(outer);
    const innerNavigation = create(inner);

    expect(outerNavigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(outerButton);
    expect(outerNavigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(innerButton);

    outerNavigation.clear();
    inner.setAttribute('data-valet-navigation-exclude', 'true');
    expect(outerNavigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(outerButton);
    expect(outerNavigation.move('next')).toBe(false);

    expect(innerNavigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(innerButton);
  });

  it('lets multiple navigators share a scope without one clearing another navigator focus', () => {
    const scope = mountScope();
    const first = addButton(scope, 'first');
    const second = addButton(scope, 'second');
    const firstNavigation = create(scope);
    const secondNavigation = create(scope);

    expect(firstNavigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(first);
    expect(secondNavigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(second);
    expect(first.hasAttribute('data-valet-navigation-focus')).toBe(false);

    firstNavigation.clear();
    expect(document.activeElement).toBe(second);
    expect(second.getAttribute('data-valet-navigation-focus')).toBe('true');
    secondNavigation.clear();
    expect(document.activeElement).not.toBe(second);
  });
});

describe('createDirectionalNavigation — activation', () => {
  it('uses native untrusted click activation for the focused eligible target', () => {
    const scope = mountScope();
    const button = addButton(scope, 'activate');
    const click = vi.fn<(trusted: boolean) => void>();
    button.addEventListener('click', (event) => click(event.isTrusted));
    const navigation = create(scope);
    button.focus();

    expect(navigation.activate()).toBe(true);
    expect(click).toHaveBeenCalledWith(false);
  });

  it('preserves native checkbox activation semantics', () => {
    const scope = mountScope();
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    scope.appendChild(checkbox);
    setRect(checkbox, 0, 0);
    const navigation = create(scope);
    checkbox.focus();

    expect(checkbox.checked).toBe(false);
    expect(navigation.activate()).toBe(true);
    expect(checkbox.checked).toBe(true);
  });

  it('rejects focus outside the scope or targets that become ineligible', () => {
    const scope = mountScope();
    const button = addButton(scope, 'inside');
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    mounted.push(outside);
    setRect(outside, 0, 0);
    const click = vi.fn();
    button.addEventListener('click', click);
    const navigation = create(scope);

    outside.focus();
    expect(navigation.activate()).toBe(false);
    button.focus();
    button.setAttribute('aria-disabled', 'true');
    expect(navigation.activate()).toBe(false);
    button.removeAttribute('aria-disabled');
    button.setAttribute('inert', '');
    expect(navigation.activate()).toBe(false);
    button.removeAttribute('inert');
    button.style.display = 'none';
    expect(navigation.activate()).toBe(false);
    button.style.display = '';
    button.disabled = true;
    expect(navigation.activate()).toBe(false);
    button.remove();
    expect(navigation.activate()).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });

  it('requires action semantics or opt-in for generic and structural-role containers', () => {
    const scope = mountScope();
    const target = document.createElement('div');
    target.tabIndex = 0;
    scope.appendChild(target);
    setRect(target, 0, 0);
    const click = vi.fn();
    target.addEventListener('click', click);
    const navigation = create(scope);
    target.focus();

    expect(navigation.activate()).toBe(false);
    target.setAttribute('role', 'button');
    expect(navigation.activate()).toBe(true);
    target.setAttribute('role', 'row');
    expect(navigation.activate()).toBe(false);
    target.setAttribute('data-valet-navigation-activate', 'true');
    expect(navigation.activate()).toBe(true);
    target.setAttribute('data-valet-navigation-activate', 'false');
    expect(navigation.activate()).toBe(false);
    expect(click).toHaveBeenCalledTimes(2);
  });
});

describe('createDirectionalNavigation — dynamic focus and cleanup', () => {
  it('honors dispose called synchronously from a focus handler without leaking ownership', () => {
    const scope = mountScope();
    const button = addButton(scope, 'target');
    const navigation = create(scope);
    const addListener = vi.spyOn(document, 'addEventListener');
    button.addEventListener('focus', () => navigation.dispose(), { once: true });

    expect(navigation.move('next')).toBe(false);
    expect(document.activeElement).toBe(button);
    expect(button.hasAttribute('data-valet-navigation-focus')).toBe(false);
    expect(
      addListener.mock.calls.filter(
        ([type, , capture]) => (type === 'pointerdown' || type === 'keydown') && capture === true,
      ),
    ).toHaveLength(0);
    expect(navigation.move('next')).toBe(false);
  });

  it('honors clear called synchronously from a focus handler', () => {
    const scope = mountScope();
    const button = addButton(scope, 'target');
    const navigation = create(scope);
    button.addEventListener('focus', () => navigation.clear(), { once: true });

    expect(navigation.move('next')).toBe(false);
    expect(document.activeElement).not.toBe(button);
    expect(button.hasAttribute('data-valet-navigation-focus')).toBe(false);
  });

  it('continues sequentially when the current target becomes disabled, then re-enters after removal', () => {
    const scope = mountScope();
    const before = addButton(scope, 'before');
    const current = addButton(scope, 'current');
    const after = addButton(scope, 'after');
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(current);
    current.disabled = true;
    expect(navigation.move('next')).toBe(true);
    expect(document.activeElement).toBe(after);
    expect(current.hasAttribute('data-valet-navigation-focus')).toBe(false);

    after.remove();
    expect(navigation.move('previous')).toBe(true);
    expect(document.activeElement).toBe(before);
  });

  it('clear blurs only focus still owned by that navigator', () => {
    const scope = mountScope();
    const button = addButton(scope, 'target');
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    expect(button.getAttribute('data-valet-navigation-focus')).toBe('true');
    navigation.clear();
    expect(button.hasAttribute('data-valet-navigation-focus')).toBe(false);
    expect(document.activeElement).not.toBe(button);

    button.focus();
    navigation.clear();
    expect(document.activeElement).toBe(button);
  });

  it('removes the marker on blur without disturbing the new focus target', () => {
    const scope = mountScope();
    const button = addButton(scope, 'target');
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    mounted.push(outside);
    setRect(outside, 0, 0);
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    outside.focus();
    expect(button.hasAttribute('data-valet-navigation-focus')).toBe(false);
    expect(document.activeElement).toBe(outside);
  });

  it('removes only the navigation marker on pointer and keyboard modality changes', () => {
    const scope = mountScope();
    const button = addButton(scope, 'target');
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(button.hasAttribute('data-valet-navigation-focus')).toBe(false);
    expect(document.activeElement).toBe(button);

    button.blur();
    expect(navigation.move('next')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(button.hasAttribute('data-valet-navigation-focus')).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('installs the shared tokenized fallback ring exactly as static CSS', () => {
    const scope = mountScope();
    addButton(scope, 'target');
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    const rules = Array.from(getGlobalSheet()?.cssRules ?? []).filter((candidate) =>
      candidate.cssText.includes("[data-valet-navigation-focus='true']:focus:where"),
    );
    expect(rules).toHaveLength(1);
    const [rule] = rules;
    expect(rule?.cssText).toContain('var(--valet-focus-width,2px)');
    expect(rule?.cssText).toContain(
      'var(--valet-focus-ring-color,var(--valet-intent-focus,currentColor))',
    );
    expect(rule?.cssText).toContain('var(--valet-focus-offset,2px)');
  });

  it('dispose removes marker/listeners without blurring and rejects later intents', () => {
    const scope = mountScope();
    const button = addButton(scope, 'target');
    const navigation = create(scope);

    expect(navigation.move('next')).toBe(true);
    navigation.dispose();
    expect(button.hasAttribute('data-valet-navigation-focus')).toBe(false);
    expect(document.activeElement).toBe(button);
    expect(navigation.move('next')).toBe(false);
    expect(navigation.activate()).toBe(false);
  });
});
