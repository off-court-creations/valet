// ─────────────────────────────────────────────────────────────
// src/hooks/useDirectionalNavigation.dom.test.tsx  | valet
// React ref replacement, StrictMode, and valet-control activation
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Button } from '../components/fields/Button';
import { IconButton } from '../components/fields/IconButton';
import { type DirectionalNavigation } from '../system/directionalNavigation';
import { useDirectionalNavigation } from './useDirectionalNavigation';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

interface MountedRoot {
  container: HTMLDivElement;
  root: Root;
}

const roots: MountedRoot[] = [];
let navigation: DirectionalNavigation | null = null;

const ICON_PATH = 'M4 12h16M12 4v16';

const makeRect = (left: number, top: number): DOMRect =>
  ({
    x: left,
    y: top,
    left,
    top,
    right: left + 20,
    bottom: top + 20,
    width: 20,
    height: 20,
    toJSON: () => ({}),
  }) as DOMRect;

function setRect(element: HTMLElement, left: number, top: number): void {
  const value = makeRect(left, top);
  element.getBoundingClientRect = () => value;
  element.getClientRects = () =>
    ({
      0: value,
      length: 1,
      item: (index: number) => (index === 0 ? value : null),
      [Symbol.iterator]: function* () {
        yield value;
      },
    }) as DOMRectList;
}

function Harness({
  activeScope = 'first',
  onButton,
  onIconButton,
}: {
  activeScope?: 'first' | 'second';
  onButton?: () => void;
  onIconButton?: () => void;
}) {
  const scopeRef = useRef<HTMLDivElement>(null);
  navigation = useDirectionalNavigation({ scope: scopeRef });

  return (
    <>
      <div
        data-scope='first'
        ref={activeScope === 'first' ? scopeRef : undefined}
      >
        <Button onClick={onButton}>
          <span>Play</span>
        </Button>
        <IconButton
          aria-label='Settings'
          svg={ICON_PATH}
          onClick={onIconButton}
        />
      </div>
      <div
        data-scope='second'
        ref={activeScope === 'second' ? scopeRef : undefined}
      >
        <Button>
          <span>Resume</span>
        </Button>
      </div>
    </>
  );
}

function mount(node: React.ReactElement, strict = false) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const record = { container, root };
  roots.push(record);
  const wrap = (value: React.ReactElement) =>
    strict ? <React.StrictMode>{value}</React.StrictMode> : value;
  const render = (value: React.ReactElement) => act(() => root.render(wrap(value)));
  const unmount = () => {
    act(() => root.unmount());
    const index = roots.indexOf(record);
    if (index >= 0) roots.splice(index, 1);
    container.remove();
  };
  render(node);
  return { container, render, unmount };
}

function layoutControls(container: HTMLElement): HTMLElement[] {
  const controls = Array.from(container.querySelectorAll<HTMLElement>('button'));
  controls.forEach((control, index) => setRect(control, index * 30, 0));
  return controls;
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  navigation = null;
  vi.restoreAllMocks();
});

describe('useDirectionalNavigation', () => {
  it('activates polymorphic-ready Button and IconButton through their React handlers', () => {
    const onButton = vi.fn();
    const onIconButton = vi.fn();
    const { container } = mount(
      <Harness
        onButton={onButton}
        onIconButton={onIconButton}
      />,
    );
    layoutControls(container);

    expect(navigation).not.toBeNull();
    act(() => {
      expect(navigation?.move('next')).toBe(true);
      expect(navigation?.activate()).toBe(true);
    });
    expect(onButton).toHaveBeenCalledTimes(1);

    act(() => {
      expect(navigation?.move('next')).toBe(true);
      expect(navigation?.activate()).toBe(true);
    });
    expect(onIconButton).toHaveBeenCalledTimes(1);
  });

  it('keeps a stable facade while a ref moves to a replacement scope', () => {
    const { container, render } = mount(<Harness />);
    const controls = layoutControls(container);
    const firstNavigation = navigation;

    act(() => {
      expect(navigation?.move('next')).toBe(true);
    });
    expect(document.activeElement).toBe(controls[0]);
    expect(controls[0].getAttribute('data-valet-navigation-focus')).toBe('true');

    render(<Harness activeScope='second' />);
    layoutControls(container);
    expect(navigation).toBe(firstNavigation);
    expect(controls[0].hasAttribute('data-valet-navigation-focus')).toBe(false);

    const secondScopeButton = container.querySelector<HTMLElement>('[data-scope="second"] button');
    act(() => {
      expect(navigation?.move('next')).toBe(true);
    });
    expect(document.activeElement).toBe(secondScopeButton);
  });

  it('balances marker and document-listener cleanup under StrictMode replay and unmount', () => {
    const addListener = vi.spyOn(document, 'addEventListener');
    const removeListener = vi.spyOn(document, 'removeEventListener');
    const { container, unmount } = mount(<Harness />, true);
    const [button] = layoutControls(container);

    act(() => {
      expect(navigation?.move('next')).toBe(true);
    });
    expect(button.getAttribute('data-valet-navigation-focus')).toBe('true');
    expect(
      addListener.mock.calls.some(
        ([type, , capture]) => type === 'pointerdown' && capture === true,
      ),
    ).toBe(true);
    expect(
      addListener.mock.calls.some(([type, , capture]) => type === 'keydown' && capture === true),
    ).toBe(true);

    unmount();
    expect(button.hasAttribute('data-valet-navigation-focus')).toBe(false);
    expect(
      removeListener.mock.calls.some(
        ([type, , capture]) => type === 'pointerdown' && capture === true,
      ),
    ).toBe(true);
    expect(
      removeListener.mock.calls.some(([type, , capture]) => type === 'keydown' && capture === true),
    ).toBe(true);
  });
});
