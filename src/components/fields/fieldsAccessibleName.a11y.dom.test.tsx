// ─────────────────────────────────────────────────────────────
// src/components/fields/fieldsAccessibleName.a11y.dom.test.tsx | valet
// W2 (1.0 prep) — WCAG 4.1.2 (Name, Role, Value) regression suite for
// the four field controls that previously DISCARDED the documented
// `FieldBaseProps.label` (`void _label`) and so rendered with NO
// accessible name: Switch, Slider, Select, Iterator.
//
// For each control this pins:
//   • with `label='X'`, the control node (role=switch/slider/combobox,
//     or the number input) resolves an accessible name of "X" — via
//     aria-labelledby → target text, or htmlFor → <label> text.
//   • the visible label text renders in the DOM.
//   • helperText renders and is wired via aria-describedby.
//   • the dev-time accessible-name guard warns ONCE when NO name source
//     is present, and is silent when label / aria-label / aria-labelledby
//     is supplied (external labelling is valid).
//
// House style: createRoot + act, StrictMode, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Switch } from './Switch';
import { Slider } from './Slider';
import { Select } from './Select';
import { Iterator } from './Iterator';
import { resetWarnOnce } from '../../system/devErrors';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Select/overlay engine touch it indirectly. */
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

function mount(node: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return { container };
}

let warnSpy: ReturnType<typeof vi.spyOn>;
const nameWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.includes('provide an accessible name'));

beforeEach(() => {
  resetWarnOnce();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  document.getElementById('valet-overlay-root')?.replaceChildren();
  warnSpy.mockRestore();
});

/** Resolve the accessible name of `el` from its aria-labelledby target text. */
function nameFromLabelledBy(el: Element | null): string | null {
  const ids = el?.getAttribute('aria-labelledby');
  if (!ids) return null;
  return ids
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ')
    .trim();
}

/*───────────────────────────────────────────────────────────────*/
/* Switch — role=switch button, name via aria-labelledby          */

describe('Switch — accessible name (WCAG 4.1.2)', () => {
  it("label='X' wires the switch button's accessible name and renders the text", () => {
    const { container } = mount(<Switch label='Wireless' />);
    const btn = container.querySelector('button[role="switch"]')!;
    // The visible label text is in the DOM.
    expect(container.textContent).toContain('Wireless');
    // The accessible name resolves to the label text via aria-labelledby.
    expect(nameFromLabelledBy(btn)).toBe('Wireless');
    expect(nameWarns()).toEqual([]);
  });

  it('helperText renders and is wired via aria-describedby', () => {
    const { container } = mount(
      <Switch
        label='Wireless'
        helperText='Toggles the radio'
      />,
    );
    const btn = container.querySelector('button[role="switch"]')!;
    const describedBy = btn.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('Toggles the radio');
  });

  it('the bare switch (no label/helper) keeps its structure: button[role=switch] is queryable', () => {
    const { container } = mount(<Switch aria-label='Mute' />);
    // No wrapper structural change — the button is a direct match.
    const btn = container.querySelector('button[role="switch"]');
    expect(btn).toBeTruthy();
    expect(btn!.getAttribute('aria-labelledby')).toBeNull();
    // External aria-label silences the dev guard.
    expect(nameWarns()).toEqual([]);
  });

  it('dev guard warns ONCE when no name source is present', () => {
    mount(<Switch />);
    expect(nameWarns()).toHaveLength(1);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Slider — role=slider thumb, name via aria-labelledby           */

describe('Slider — accessible name (WCAG 4.1.2)', () => {
  it("label='X' wires the thumb's accessible name and renders the text", () => {
    const { container } = mount(
      <Slider
        label='Volume'
        defaultValue={5}
        min={0}
        max={10}
      />,
    );
    const thumb = container.querySelector('[role="slider"]')!;
    expect(container.textContent).toContain('Volume');
    expect(nameFromLabelledBy(thumb)).toBe('Volume');
    expect(nameWarns()).toEqual([]);
  });

  it('helperText renders and is wired via aria-describedby on the thumb', () => {
    const { container } = mount(
      <Slider
        label='Volume'
        helperText='0 to 10'
        defaultValue={5}
        min={0}
        max={10}
      />,
    );
    const thumb = container.querySelector('[role="slider"]')!;
    const describedBy = thumb.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('0 to 10');
  });

  it('dev guard warns ONCE when no name source is present, silent with aria-label', () => {
    mount(
      <Slider
        defaultValue={5}
        min={0}
        max={10}
      />,
    );
    expect(nameWarns()).toHaveLength(1);
    // Reset both the warnOnce memo AND the spy's recorded calls so the second
    // mount's silence can be asserted independently of the first.
    resetWarnOnce();
    warnSpy.mockClear();
    mount(
      <Slider
        aria-label='Gain'
        defaultValue={5}
        min={0}
        max={10}
      />,
    );
    expect(nameWarns()).toEqual([]);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Select — role=combobox trigger, name via aria-labelledby       */

describe('Select — accessible name (WCAG 4.1.2)', () => {
  const opts = () => (
    <>
      <Select.Option value='a'>Alpha</Select.Option>
      <Select.Option value='b'>Beta</Select.Option>
    </>
  );

  it("label='X' wires the combobox's accessible name and renders the text", () => {
    const { container } = mount(<Select label='Letter'>{opts()}</Select>);
    const combobox = container.querySelector('[role="combobox"]')!;
    expect(container.textContent).toContain('Letter');
    expect(nameFromLabelledBy(combobox)).toBe('Letter');
    expect(nameWarns()).toEqual([]);
  });

  it('a caller aria-labelledby is preserved AND the rendered label id is prepended', () => {
    const { container } = mount(
      <>
        <span id='ext'>External</span>
        <Select
          label='Letter'
          aria-labelledby='ext'
        >
          {opts()}
        </Select>
      </>,
    );
    const combobox = container.querySelector('[role="combobox"]')!;
    const ids = combobox.getAttribute('aria-labelledby')!.split(/\s+/);
    // Both the rendered label id and the caller id are present.
    expect(ids).toContain('ext');
    expect(nameFromLabelledBy(combobox)).toBe('Letter External');
    expect(nameWarns()).toEqual([]);
  });

  it('helperText renders and is wired via aria-describedby on the combobox', () => {
    const { container } = mount(
      <Select
        label='Letter'
        helperText='Choose one'
      >
        {opts()}
      </Select>,
    );
    const combobox = container.querySelector('[role="combobox"]')!;
    const describedBy = combobox.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('Choose one');
  });

  it('dev guard warns ONCE when no name source is present', () => {
    mount(<Select>{opts()}</Select>);
    expect(nameWarns()).toHaveLength(1);
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Iterator — native number input, name via <label htmlFor>       */

describe('Iterator — accessible name (WCAG 4.1.2)', () => {
  it("label='X' associates a native <label htmlFor> with the number input", () => {
    const { container } = mount(
      <Iterator
        label='Quantity'
        defaultValue={1}
      />,
    );
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    expect(container.textContent).toContain('Quantity');
    // The accessible name comes from the native <label htmlFor={input.id}>.
    const lbl = container.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
    expect(lbl).toBeTruthy();
    expect(lbl!.textContent).toBe('Quantity');
  });

  it('helperText renders and is wired via aria-describedby on the input', () => {
    const { container } = mount(
      <Iterator
        label='Quantity'
        helperText='Whole numbers only'
        defaultValue={1}
      />,
    );
    const input = container.querySelector('input[type="number"]') as HTMLInputElement;
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe('Whole numbers only');
  });

  it('the bare iterator (no label/helper) still exposes input[type=number]', () => {
    const { container } = mount(
      <Iterator
        aria-label='Count'
        defaultValue={1}
      />,
    );
    const input = container.querySelector('input[type="number"]');
    expect(input).toBeTruthy();
    // External aria-label silences the dev guard.
    expect(nameWarns()).toEqual([]);
  });

  it('dev guard warns ONCE when no name source is present', () => {
    mount(<Iterator defaultValue={1} />);
    expect(nameWarns()).toHaveLength(1);
  });
});
