// ─────────────────────────────────────────────────────────────
// src/components/fields/MetroSelect.dom.test.tsx | valet
// FIELDS S8 (rulings R9/R10) — regression suite for the MetroSelect
// migration onto the shared `useFieldState` hook. Pins:
//   • form binding reads `form.values` (precedence prop > form >
//     internal): a seeded value drives the initial selection and a
//     pointer toggle writes through to the store.
//   • precedence: an explicit `value` prop wins over a form binding and
//     dev-warns once.
//   • ChangeInfo.source honesty: a tile chosen by pointer click reports
//     'pointer'; a tile chosen via keyboard (Enter on the listbox)
//     reports 'keyboard' — the old code hardcoded 'programmatic'.
//   • standalone uncontrolled selection still works (single + multiple).
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MetroSelect } from './MetroSelect';
import { FormControl } from './FormControl';
import { createFormStore } from '../../system/createFormStore';
import { resetWarnOnce } from '../../system/devErrors';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import * as sheet from '../../css/sheet';
import type { ChangeInfo } from '../../system/events';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver; the Option's Typography reads the surface store. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
beforeAll(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

/*───────────────────────────────────────────────────────────────*/
/* Harness                                                       */

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode inside a Surface store provider — MetroSelect's
 *  Option renders <Typography>, which requires a Surface ancestor. */
function mount(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  const render = (next: React.ReactElement) =>
    act(() => {
      root.render(
        <React.StrictMode>
          <SurfaceCtx.Provider value={store}>{next}</SurfaceCtx.Provider>
        </React.StrictMode>,
      );
    });
  render(node);
  return { container, render };
}

const listbox = (c: HTMLElement) => c.querySelector('[role="listbox"]') as HTMLElement;
const tiles = (c: HTMLElement) => Array.from(c.querySelectorAll<HTMLElement>('[role="option"]'));
const tileFor = (c: HTMLElement, index: number) => tiles(c)[index];
const isSelected = (el: HTMLElement) => el.getAttribute('aria-selected') === 'true';

const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 1 }));
  });

const pressKey = (el: Element, key: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });

const last = <T,>(arr: T[]): T | undefined => arr[arr.length - 1];

let warnSpy: ReturnType<typeof vi.spyOn>;
const valetWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.startsWith('valet:'));

beforeEach(() => {
  resetWarnOnce();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  warnSpy.mockRestore();
});

/** Fresh option elements per render, returned as an ARRAY (not a fragment) so
 *  MetroSelect's `React.Children.toArray` sees the options directly — a `<>`
 *  fragment wrapper would be the single child and get filtered out. */
const opts = () => [
  <MetroSelect.Option
    key='home'
    icon='mdi:home'
    value='home'
    label='Home'
  />,
  <MetroSelect.Option
    key='work'
    icon='mdi:briefcase'
    value='work'
    label='Work'
  />,
  <MetroSelect.Option
    key='travel'
    icon='mdi:airplane'
    value='travel'
    label='Travel'
  />,
];

/*───────────────────────────────────────────────────────────────*/
/* Form binding now reads + writes (ruling R9)                    */

describe('MetroSelect — form binding reads values (ruling R9)', () => {
  it('a seeded form value drives the initial selection', () => {
    const useStore = createFormStore<{ place: string }>({ place: 'work' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <MetroSelect name='place'>{opts()}</MetroSelect>
      </FormControl>,
    );
    expect(isSelected(tileFor(container, 1))).toBe(true); // 'work'
    expect(isSelected(tileFor(container, 0))).toBe(false);
  });

  it('a pointer toggle writes through to the store', () => {
    const useStore = createFormStore<{ place: string }>({ place: 'home' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <MetroSelect name='place'>{opts()}</MetroSelect>
      </FormControl>,
    );
    click(tileFor(container, 2)); // 'travel'
    expect(useStore.getState().values.place).toBe('travel');
    expect(isSelected(tileFor(container, 2))).toBe(true);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Precedence + standalone modes                                  */

describe('MetroSelect — control modes (ruling R9)', () => {
  it('explicit `value` prop wins over a form binding and dev-warns once', () => {
    const useStore = createFormStore<{ place: string }>({ place: 'home' });
    const { container } = mount(
      <FormControl useStore={useStore}>
        <MetroSelect
          name='place'
          value='travel'
        >
          {opts()}
        </MetroSelect>
      </FormControl>,
    );
    expect(isSelected(tileFor(container, 2))).toBe(true); // 'travel' (prop)
    expect(isSelected(tileFor(container, 0))).toBe(false); // not 'home' (store)
    expect(valetWarns()).toEqual([
      expect.stringContaining('both an explicit `value` prop and a FormControl binding'),
    ]);
  });

  it('uncontrolled standalone single-select toggles its own state', () => {
    const onValueChange = vi.fn();
    const { container } = mount(
      <MetroSelect
        defaultValue='home'
        onValueChange={onValueChange}
      >
        {opts()}
      </MetroSelect>,
    );
    expect(isSelected(tileFor(container, 0))).toBe(true);
    click(tileFor(container, 1));
    expect(isSelected(tileFor(container, 1))).toBe(true);
    expect(onValueChange.mock.calls[0][0]).toBe('work');
  });

  it('uncontrolled multiple-select accumulates selections', () => {
    const { container } = mount(
      <MetroSelect
        multiple
        defaultValue={['home']}
      >
        {opts()}
      </MetroSelect>,
    );
    click(tileFor(container, 2)); // add 'travel'
    expect(isSelected(tileFor(container, 0))).toBe(true); // 'home' kept
    expect(isSelected(tileFor(container, 2))).toBe(true); // 'travel' added
  });
});

/*───────────────────────────────────────────────────────────────*/
/* ChangeInfo.source honesty (ruling R10)                         */

describe('MetroSelect — ChangeInfo.source classification (ruling R10)', () => {
  it("a pointer click reports 'pointer'", () => {
    const infos: ChangeInfo<string | number | (string | number)[]>[] = [];
    const { container } = mount(
      <MetroSelect
        defaultValue='home'
        onValueCommit={(_v, info) => infos.push(info)}
      >
        {opts()}
      </MetroSelect>,
    );
    click(tileFor(container, 1));
    expect(last(infos)?.source).toBe('pointer');
    expect(last(infos)?.previousValue).toBe('home');
  });

  it("keyboard activation (Enter on the listbox) reports 'keyboard'", () => {
    const infos: ChangeInfo<string | number | (string | number)[]>[] = [];
    const { container } = mount(
      <MetroSelect
        defaultValue='home'
        onValueCommit={(_v, info) => infos.push(info)}
      >
        {opts()}
      </MetroSelect>,
    );
    const lb = listbox(container);
    // Rove to the next tile, then activate it with Enter.
    pressKey(lb, 'ArrowRight'); // active → 'work'
    pressKey(lb, 'Enter');
    expect(last(infos)?.source).toBe('keyboard');
    expect(isSelected(tileFor(container, 1))).toBe(true);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* FormControl form-wide config merge (Wave C deferral)           */

describe('MetroSelect — FormControl form-wide config (1.0)', () => {
  it('a form-wide `disabled` disables the field and blocks tile interaction', () => {
    const useStore = createFormStore<{ place: string }>({ place: 'home' });
    const onValueChange = vi.fn();
    const { container } = mount(
      <FormControl
        useStore={useStore}
        disabled
      >
        <MetroSelect
          name='place'
          onValueChange={onValueChange}
        >
          {opts()}
        </MetroSelect>
      </FormControl>,
    );
    const lb = listbox(container);
    expect(lb.getAttribute('aria-disabled')).toBe('true');
    expect(lb.getAttribute('data-disabled')).toBe('true');
    // Form-wide disable must block interaction, not merely styling.
    click(tileFor(container, 2)); // attempt to select 'travel'
    expect(useStore.getState().values.place).toBe('home');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('a name-keyed `errors` entry marks the field aria-invalid', () => {
    const useStore = createFormStore<{ place: string }>({ place: 'home' });
    const { container } = mount(
      <FormControl
        useStore={useStore}
        errors={{ place: 'Pick a destination' }}
      >
        <MetroSelect name='place'>{opts()}</MetroSelect>
      </FormControl>,
    );
    expect(listbox(container).getAttribute('aria-invalid')).toBe('true');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Mobile: coarse-pointer hit floor + chrome kit                  */

describe('MetroSelect — touch target + chrome kit (1.0)', () => {
  it('wires a >=44px coarse-pointer hit var on the listbox root', () => {
    const { container } = mount(<MetroSelect defaultValue='home'>{opts()}</MetroSelect>);
    expect(listbox(container).style.getPropertyValue('--valet-metro-hit')).toBe('44px');
  });

  it('compact tightens the coarse-pointer hit var to 40px', () => {
    const { container } = mount(
      <MetroSelect
        compact
        defaultValue='home'
      >
        {opts()}
      </MetroSelect>,
    );
    expect(listbox(container).style.getPropertyValue('--valet-metro-hit')).toBe('40px');
  });

  it('emits the chrome kit + coarse-pointer floor in the tile rule', () => {
    mount(<MetroSelect defaultValue='home'>{opts()}</MetroSelect>);
    const rules = Array.from(sheet.getGlobalSheet()!.cssRules, (r) => r.cssText).join('\n');
    expect(rules).toMatch(/touch-action:\s*manipulation/);
    expect(rules).toMatch(/pointer:\s*coarse/);
    expect(rules).toMatch(/var\(--valet-metro-hit/);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Metro restyle — grid, flat sharp tiles, press tilt, color/wide  */

describe('MetroSelect — Metro restyle', () => {
  const ruleFor = (el: Element) => {
    const cls = el.className.split(/\s+/).find(Boolean)!;
    return (
      Array.from(sheet.getGlobalSheet()!.cssRules, (r) => r.cssText).find((t) =>
        t.startsWith(`.${cls}`),
      ) ?? ''
    );
  };

  it('lays tiles out in a snapped CSS grid with a tight gutter var', () => {
    const { container } = mount(
      <MetroSelect aria-label='g'>
        <MetroSelect.Option
          value='a'
          icon='mdi:home'
          label='A'
        />
        <MetroSelect.Option
          value='b'
          icon='mdi:cog'
          label='B'
        />
      </MetroSelect>,
    );
    const lb = listbox(container);
    expect(ruleFor(lb)).toContain('display: grid');
    expect(lb.style.getPropertyValue('--valet-metro-gap')).not.toBe('');
  });

  it('renders flat sharp tiles (radius 0) with the press-tilt rule', () => {
    const { container } = mount(
      <MetroSelect aria-label='g'>
        <MetroSelect.Option
          value='a'
          icon='mdi:home'
          label='A'
        />
      </MetroSelect>,
    );
    const rule = ruleFor(tiles(container)[0]);
    expect(rule).toMatch(/border-radius:\s*0/);
    expect(rule).toContain('@media (prefers-reduced-motion: no-preference)');
    expect(rule).toContain('--valet-metro-tilt-x'); // tilt transform reads the inline var
  });

  it('press tilts the tile (data-pressed + tilt var); release clears', () => {
    const { container } = mount(
      <MetroSelect aria-label='g'>
        <MetroSelect.Option
          value='a'
          icon='mdi:home'
          label='A'
        />
      </MetroSelect>,
    );
    const tile = tiles(container)[0];
    // jsdom has zero-rects; provide one so the press point can be normalized.
    tile.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        width: 100,
        height: 100,
        right: 100,
        bottom: 100,
        x: 0,
        y: 0,
      }) as DOMRect;
    act(() =>
      tile.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, clientX: 75, clientY: 25 }),
      ),
    );
    expect(tile.hasAttribute('data-pressed')).toBe(true);
    expect(tile.style.getPropertyValue('--valet-metro-tilt-x')).toBe('0.25');
    act(() => tile.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    expect(tile.hasAttribute('data-pressed')).toBe(false);
  });

  it('per-option color yields a distinct fill; wide spans two columns', () => {
    const { container } = mount(
      <MetroSelect aria-label='g'>
        <MetroSelect.Option
          value='a'
          icon='mdi:home'
          label='A'
        />
        <MetroSelect.Option
          value='b'
          icon='mdi:cog'
          label='B'
          color='#e91e63'
          wide
        />
      </MetroSelect>,
    );
    const [neutral, colored] = tiles(container);
    const cls = (el: Element) => el.className.split(/\s+/).find(Boolean);
    expect(cls(neutral)).not.toBe(cls(colored)); // different $fill → different styled class
    expect(colored.style.gridColumn).toBe('span 2');
  });
});
