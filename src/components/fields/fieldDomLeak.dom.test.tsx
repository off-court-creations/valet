// ─────────────────────────────────────────────────────────────
// src/components/fields/fieldDomLeak.dom.test.tsx | valet
// API-TYPES S6 (stage A) + S7 — regression suite.
//
// S6 (FieldBaseProps DOM-leak fix): seven field components extend
// FieldBaseProps (name/label/helperText/error/fullWidth) but rendered
// only a subset, leaking the rest onto their DOM element through a
// rest-spread as invalid attributes (audit Switch.tsx:126 et al.). This
// suite snapshots the rendered element's attribute NAMES and asserts the
// FieldBaseProps members never appear there. `error` is the one member
// now wired to `aria-invalid` (the rest are swallowed pending FieldShell,
// Phase 2 / Q10).
//
// S7 (Select.Option applies its props): OptionProps declared full
// LiHTMLAttributes but the parent rendered `<>{children}</>` and ignored
// className/style/id/data-* (audit Select.tsx:179). This suite proves
// those props — plus the new sx/preset — reach the rendered <li>.
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Checkbox } from './Checkbox';
import { Switch } from './Switch';
import { Slider } from './Slider';
import { Iterator } from './Iterator';
import { MetroSelect } from './MetroSelect';
import { RadioGroup, Radio } from './RadioGroup';
import { Select } from './Select';
import { Surface } from '../layout/Surface';
import { definePreset } from '../../css/stylePresets';

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

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function mount(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return container;
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/** The FieldBaseProps members that previously leaked onto the DOM. React
    lowercases unknown attribute names, so we compare case-insensitively. */
const LEAK_NAMES = ['label', 'helpertext', 'error', 'fullwidth'];

/** Lower-cased attribute-name set of an element. */
const attrNames = (el: Element) => new Set(Array.from(el.attributes, (a) => a.name.toLowerCase()));

/** Assert none of the leak-prone FieldBaseProps names appear on `el`. */
function expectNoLeak(el: Element) {
  const names = attrNames(el);
  for (const leaked of LEAK_NAMES) {
    expect(
      names.has(leaked),
      `expected no "${leaked}" attribute on <${el.tagName.toLowerCase()}>`,
    ).toBe(false);
  }
}

/** Props that any field can be handed to exercise every leak path at once. */
const leakProps = {
  label: 'A label',
  helperText: 'A hint',
  error: true,
  fullWidth: true,
} as const;

/*───────────────────────────────────────────────────────────────*/
/* S6 — no FieldBaseProps leak onto the rendered element          */

describe('API-TYPES S6 (stage A): FieldBaseProps stop leaking to the DOM', () => {
  it('Checkbox does not leak helperText/fullWidth onto the <input>', () => {
    const c = mount(
      <Checkbox
        name='cb'
        {...leakProps}
      />,
    );
    const input = c.querySelector('input[type="checkbox"]')!;
    expectNoLeak(input);
    // `error` is honestly surfaced as aria-invalid (it was already wired).
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('Switch does not leak the field cluster onto the <button> track', () => {
    const c = mount(
      <Switch
        name='sw'
        {...leakProps}
      />,
    );
    const track = c.querySelector('button[role="switch"]')!;
    expectNoLeak(track);
    expect(track.getAttribute('aria-invalid')).toBe('true');
  });

  it('Slider does not leak the field cluster onto the wrapper; error reaches the thumb', () => {
    const c = mount(
      <Slider
        name='sl'
        {...leakProps}
      />,
    );
    const wrapper = c.querySelector('[data-valet-component="Slider"]')!;
    expectNoLeak(wrapper);
    const thumb = c.querySelector('[role="slider"]')!;
    expect(thumb.getAttribute('aria-invalid')).toBe('true');
  });

  it('Iterator does not leak the field cluster onto the <input>', () => {
    const c = mount(
      <Iterator
        name='it'
        {...leakProps}
      />,
    );
    const input = c.querySelector('input')!;
    expectNoLeak(input);
    expect(input.getAttribute('aria-invalid')).toBe('true');
  });

  it('MetroSelect does not leak error/fullWidth onto the root listbox', () => {
    // MetroSelect renders its label via Typography, which requires a Surface.
    const c = mount(
      <Surface>
        <MetroSelect
          name='ms'
          {...leakProps}
        >
          <MetroSelect.Option
            value='a'
            icon='mdi:numeric-1'
            label='One'
          />
        </MetroSelect>
      </Surface>,
    );
    // The MetroSelect root is the role=listbox element (it composes Stack).
    const root = c.querySelector('[role="listbox"]')!;
    expectNoLeak(root);
    expect(root.getAttribute('aria-invalid')).toBe('true');
  });

  it('RadioGroup does not leak fullWidth onto the root radiogroup', () => {
    const c = mount(
      <RadioGroup
        name='rg'
        {...leakProps}
      >
        <Radio value='a'>A</Radio>
      </RadioGroup>,
    );
    const root = c.querySelector('[role="radiogroup"]')!;
    expectNoLeak(root);
    expect(root.getAttribute('aria-invalid')).toBe('true');
  });

  it('Select does not leak the field cluster onto the trigger <button>', () => {
    const c = mount(
      <Select
        name='se'
        {...leakProps}
      >
        <Select.Option value='a'>Alpha</Select.Option>
      </Select>,
    );
    const trigger = c.querySelector('[data-valet-component="Select"]')!;
    expectNoLeak(trigger);
    expect(trigger.getAttribute('aria-invalid')).toBe('true');
  });
});

/*───────────────────────────────────────────────────────────────*/
/* S7 — Select.Option applies its props onto the rendered <li>    */

describe('API-TYPES S7: Select.Option props reach the rendered <li>', () => {
  const overlayRoot = () => document.getElementById('valet-overlay-root');
  const fire = (el: Element, type: 'click') =>
    act(() => {
      el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true }));
    });

  /** Open the menu and return the rendered option <li> elements. */
  function openOptions(container: HTMLElement) {
    const trigger = container.querySelector('[data-valet-component="Select"]')!;
    fire(trigger, 'click');
    const menu = overlayRoot()!.querySelector('ul[role="listbox"]')!;
    return Array.from(menu.querySelectorAll<HTMLLIElement>('li[role="option"]'));
  }

  it('forwards className, style, id and data-* attributes onto the <li>', () => {
    const c = mount(
      <Select placeholder='Pick…'>
        <Select.Option
          value='a'
          id='opt-alpha'
          className='my-option'
          style={{ color: 'rgb(1, 2, 3)' }}
          data-kind='alpha'
          title='Alpha tooltip'
        >
          Alpha
        </Select.Option>
        <Select.Option value='b'>Beta</Select.Option>
      </Select>,
    );
    const [first] = openOptions(c);
    // id: caller-supplied id wins over the generated activedescendant id.
    expect(first.id).toBe('opt-alpha');
    // className: caller class is present alongside the styled base class.
    expect(first.classList.contains('my-option')).toBe(true);
    // style: caller inline style reaches the element.
    expect(first.style.color).toBe('rgb(1, 2, 3)');
    // data-* and arbitrary LiHTMLAttributes pass through.
    expect(first.getAttribute('data-kind')).toBe('alpha');
    expect(first.getAttribute('title')).toBe('Alpha tooltip');
    // Internal listbox semantics still win on the same element.
    expect(first.getAttribute('role')).toBe('option');
    expect(first.getAttribute('aria-selected')).toBe('false');
  });

  it('caller-supplied id on the active option keeps aria-activedescendant in sync', () => {
    const c = mount(
      <Select placeholder='Pick…'>
        <Select.Option
          value='a'
          id='opt-alpha'
        >
          Alpha
        </Select.Option>
      </Select>,
    );
    openOptions(c);
    const menu = overlayRoot()!.querySelector('ul[role="listbox"]')!;
    // The menu's active descendant points at the SAME id the <li> rendered.
    expect(menu.getAttribute('aria-activedescendant')).toBe('opt-alpha');
  });

  it('sx wins over caller style on the <li> (uniform precedence, S8)', () => {
    const c = mount(
      <Select placeholder='Pick…'>
        <Select.Option
          value='a'
          style={{ color: 'rgb(10, 10, 10)' }}
          sx={{ color: 'rgb(20, 20, 20)' }}
        >
          Alpha
        </Select.Option>
      </Select>,
    );
    const [first] = openOptions(c);
    expect(first.style.color).toBe('rgb(20, 20, 20)');
  });

  it('preset on an Option adds the registered preset class to the <li>', () => {
    definePreset('optionDanger', () => 'color: red;');
    const c = mount(
      <Select placeholder='Pick…'>
        <Select.Option
          value='a'
          preset='optionDanger'
        >
          Alpha
        </Select.Option>
      </Select>,
    );
    const [first] = openOptions(c);
    // The preset compiles to a class; assert at least one class beyond the
    // styled base is present (the preset class name is hash-derived).
    expect(first.className.split(/\s+/).length).toBeGreaterThan(1);
  });
});
