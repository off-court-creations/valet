// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tooltip.overlay.dom.test.tsx | valet
// OVERLAY S4 regression — Tooltip migrated to registry v2's
// useOverlay(active, config) ref-callback. Proves:
//   • show/hide cycles register / deregister on the stack — the
//     bubble node is ALWAYS mounted (only $show toggles opacity),
//     so this exercises the "active flips false, element stays
//     mounted" deregistration path
//   • options resolve LIVE (swap onClose between renders → the new
//     handler fires; the v1 frozen onRequestClose closure is dead)
//   • outside-click / Escape dismissal attaches on the FIRST shown
//     commit (the audit bug shape: render-phase ref read attached
//     one render late)
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Tooltip } from './Tooltip';
import { overlayStackSize } from '../../system/overlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TOOLTIP_SRC = readFileSync(
  resolve(process.cwd(), 'src/components/widgets/Tooltip.tsx'),
  'utf8',
);

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

const pointerDownOn = (target: Element) =>
  act(() => {
    target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
  });

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  expect(overlayStackSize()).toBe(0);
});

describe('Tooltip registry-v2 migration (jsdom)', () => {
  it('registers when shown and deregisters when hidden — bubble stays mounted throughout', () => {
    const { rerender } = render(
      <Tooltip
        open={false}
        title='hi'
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    // The bubble node is always portalled; only registration is conditional.
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
    expect(overlayStackSize()).toBe(0);

    rerender(
      <Tooltip
        open
        title='hi'
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    expect(overlayStackSize()).toBe(1); // shown → registered

    rerender(
      <Tooltip
        open={false}
        title='hi'
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    expect(overlayStackSize()).toBe(0); // hidden → deregistered (element still mounted)
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();
  });

  it('reads onClose LIVE across re-renders — swapped handler fires on Escape (v1 frozen closure dead)', () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = render(
      <Tooltip
        open
        title='hi'
        onClose={stale}
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    expect(overlayStackSize()).toBe(1);

    rerender(
      <Tooltip
        open
        title='hi'
        onClose={fresh}
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    ); // same bubble, only onClose changed — no re-registration
    expect(overlayStackSize()).toBe(1);

    pressEscape();
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled();
  });

  it('outside pointerdown dismisses; disableOutsideClick is honoured LIVE', () => {
    const onClose = vi.fn();
    const page = document.createElement('div');
    document.body.appendChild(page);
    roots.push({ root: { unmount() {} } as unknown as Root, container: page });

    const { rerender } = render(
      <Tooltip
        open
        title='hi'
        disableOutsideClick
        onClose={onClose}
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    pointerDownOn(page);
    expect(onClose).not.toHaveBeenCalled(); // disableOutsideClick honoured live

    rerender(
      <Tooltip
        open
        title='hi'
        disableOutsideClick={false}
        onClose={onClose}
      >
        <button type='button'>trigger</button>
      </Tooltip>,
    );
    pointerDownOn(page);
    expect(onClose).toHaveBeenCalledTimes(1); // now dismissible — read live
  });

  it('attaches via the v2 ref-callback, NOT a render-phase bubbleRef.current read (audit shape)', () => {
    // Same audit shape as Modal.tsx:223: the v1 gate read `bubbleRef.current`
    // during render (null on the first shown render), so outside-click/Escape
    // dismissal attached one render late. The v2 ref-callback registers in the
    // first shown commit.
    expect(TOOLTIP_SRC).not.toMatch(/show\s*&&\s*bubbleRef\.current\s*\?/);
    expect(TOOLTIP_SRC).toMatch(/useOverlay\(\s*show\s*,/); // v2 (active, config)
    expect(TOOLTIP_SRC).toMatch(/ref=\{setBubbleRef\}/); // ref-callback on the bubble
  });
});
