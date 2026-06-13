// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tooltip.a11y.dom.test.tsx | valet
// A11Y S6 (plan §3.6 / audit Tooltip.tsx:347) — `aria-describedby`
// must sit on the FOCUSABLE child control, not the non-focusable
// wrapper span, or screen readers never announce the tooltip on
// keyboard focus. Proves:
//   • when shown, the child carries aria-describedby pointing at the
//     bubble's id, and the wrapper span does NOT;
//   • the id resolves to the role='tooltip' bubble;
//   • a consumer-set aria-describedby on the child is preserved and
//     the bubble id is appended (deduped, space-joined);
//   • when hidden, the child drops the bubble id (restoring any
//     consumer value).
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Tooltip } from './Tooltip';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

const trigger = (c: HTMLElement) => c.querySelector('button')!;
const wrapper = (c: HTMLElement) => c.querySelector('[data-valet-component="Tooltip"]')!;
const bubble = () => document.querySelector('[role="tooltip"]')!;

describe('Tooltip aria-describedby on the focusable child (A11Y S6, jsdom)', () => {
  it('points the child (not the wrapper) at the bubble id when shown', () => {
    const { container } = render(
      <Tooltip
        open
        title='Helpful'
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    const describedBy = trigger(container).getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    // resolves to the role='tooltip' bubble
    expect(describedBy).toBe(bubble().getAttribute('id'));
    // the non-focusable wrapper span must NOT carry it
    expect(wrapper(container).getAttribute('aria-describedby')).toBeNull();
  });

  it('omits aria-describedby on the child while closed', () => {
    const { container } = render(
      <Tooltip
        open={false}
        title='Helpful'
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    expect(trigger(container).getAttribute('aria-describedby')).toBeNull();
  });

  it('preserves a consumer aria-describedby and appends the bubble id (deduped)', () => {
    const { container } = render(
      <Tooltip
        open
        title='Helpful'
      >
        <button
          type='button'
          aria-describedby='caller-hint'
        >
          trigger
        </button>
      </Tooltip>,
    );
    const describedBy = trigger(container).getAttribute('aria-describedby')!;
    const ids = describedBy.split(/\s+/);
    expect(ids).toContain('caller-hint');
    expect(ids).toContain(bubble().getAttribute('id'));
    // no duplicates / empty tokens
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(Boolean)).toBe(true);
  });

  it('restores only the consumer value when toggled back to closed', () => {
    const ui = (open: boolean) => (
      <Tooltip
        open={open}
        title='Helpful'
      >
        <button
          type='button'
          aria-describedby='caller-hint'
        >
          trigger
        </button>
      </Tooltip>
    );
    const { container, rerender } = render(ui(true));
    expect(trigger(container).getAttribute('aria-describedby')).toContain(
      bubble().getAttribute('id'),
    );
    rerender(ui(false));
    expect(trigger(container).getAttribute('aria-describedby')).toBe('caller-hint');
  });
});
