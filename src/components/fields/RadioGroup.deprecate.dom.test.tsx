// ─────────────────────────────────────────────────────────────
// src/components/fields/RadioGroup.deprecate.dom.test.tsx | valet
// API-TYPES S12 (Q12, ruling R30) — RadioGroup's `spacing` prop was
// renamed to `gap` (aligning with the shared SpacingProps vocabulary).
// The old name ships as an additive alias through 0.x: it keeps driving
// the inter-option gap but dev-warns once, and the canonical `gap` wins
// when both are supplied. Removed at 1.0.
//
// House style: createRoot + act, no @testing-library. The gap resolves to
// an inline `style.gap` on the role=radiogroup element, so behaviour is
// asserted directly off the DOM.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Surface } from '../layout/Surface';
import { RadioGroup, Radio } from './RadioGroup';
import { resetWarnOnce } from '../../system/devErrors';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface + surfaceStore observe in effects. */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const g = globalThis as { ResizeObserver?: unknown };
if (!g.ResizeObserver) g.ResizeObserver = ResizeObserverStub;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return { root, container };
}

const groupOf = (container: HTMLElement) =>
  container.querySelector<HTMLDivElement>('[role="radiogroup"]')!;

let warnSpy: ReturnType<typeof vi.spyOn>;
const deprecationWarns = () =>
  (warnSpy.mock.calls as unknown[][])
    .map((c) => String(c[0]))
    .filter((m) => m.includes('is deprecated'));

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

const options = (
  <>
    <Radio
      value='a'
      label='A'
    />
    <Radio
      value='b'
      label='B'
    />
  </>
);

/* ─────────────────────────────────────────────────────────────
   Canonical `gap` — works silently
   ───────────────────────────────────────────────────────────── */
describe('RadioGroup canonical `gap` (jsdom)', () => {
  it('a string `gap` drives the inline gap and emits no deprecation warning', () => {
    const { container } = render(
      <Surface>
        <RadioGroup
          name='g'
          gap='13px'
        >
          {options}
        </RadioGroup>
      </Surface>,
    );
    expect(groupOf(container).style.gap).toBe('13px');
    expect(deprecationWarns()).toEqual([]);
  });

  it('a numeric `gap` maps through theme.spacing without warning', () => {
    const { container } = render(
      <Surface>
        <RadioGroup
          name='g'
          gap={2}
        >
          {options}
        </RadioGroup>
      </Surface>,
    );
    // theme.spacing(2) is a non-empty length; the exact value is theme-driven.
    expect(groupOf(container).style.gap).not.toBe('');
    expect(deprecationWarns()).toEqual([]);
  });
});

/* ─────────────────────────────────────────────────────────────
   Deprecated `spacing` alias — works, but warns once
   ───────────────────────────────────────────────────────────── */
describe('RadioGroup deprecated `spacing` alias (jsdom)', () => {
  it('`spacing` still drives the gap and warns once across re-renders', () => {
    const ui = (sp: string) => (
      <Surface>
        <RadioGroup
          name='g'
          spacing={sp}
        >
          {options}
        </RadioGroup>
      </Surface>
    );
    const { root, container } = render(ui('11px'));
    expect(groupOf(container).style.gap).toBe('11px');

    // The alias drives behaviour exactly like `gap`.
    act(() => root.render(ui('17px')));
    expect(groupOf(container).style.gap).toBe('17px');

    // …and warns exactly once despite two renders.
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`spacing`');
    expect(warns[0]).toContain('`gap`');
  });
});

/* ─────────────────────────────────────────────────────────────
   Both given — canonical wins, alias still warns
   ───────────────────────────────────────────────────────────── */
describe('RadioGroup `gap` + `spacing` together (jsdom)', () => {
  it('`gap` wins over `spacing`, and `spacing` still warns once', () => {
    const { container } = render(
      <Surface>
        {/* gap selects 5px; the stale spacing='99px' is ignored. */}
        <RadioGroup
          name='g'
          gap='5px'
          spacing='99px'
        >
          {options}
        </RadioGroup>
      </Surface>,
    );
    expect(groupOf(container).style.gap).toBe('5px');
    const warns = deprecationWarns();
    expect(warns).toHaveLength(1);
    expect(warns[0]).toContain('`spacing`');
  });
});
