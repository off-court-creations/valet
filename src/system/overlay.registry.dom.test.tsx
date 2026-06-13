// ─────────────────────────────────────────────────────────────
// src/system/overlay.registry.dom.test.tsx  | valet
// OVERLAY S3 regressions — registry v2:
//   • live getOptions(): handlers resolve options at EVENT time
//     (kills the registry-v1 frozen-options stale closures)
//   • useOverlay(active, config) ref-callback hook lifecycle
//   • stack-aware outside-click through real DOM dispatch
//   • Escape-top-most / focus trap / inert / restore-focus kept
//     working through the new entry shape
// (TEST-CI S6's overlay.dom.test.ts owns the broader suite.)
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  getOverlayRoot,
  overlayStackSize,
  registerOverlay,
  registerOverlayV2,
  useOverlay,
  type OverlayConfig,
} from './overlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Per-test bookkeeping --------------------------------------------------- */
const disposers: Array<() => void> = [];
const addedNodes: Element[] = [];
const roots: Root[] = [];

const track = (dispose: () => void) => {
  disposers.push(dispose);
  return dispose;
};

const el = (parent: Element = getOverlayRoot(), html = '<button>ok</button>') => {
  const node = document.createElement('div');
  node.innerHTML = html;
  parent.appendChild(node);
  addedNodes.push(node);
  return node;
};

const pointerDownOn = (target: Element | Document) =>
  target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));

const pressKey = (key: string, init: KeyboardEventInit = {}) =>
  document.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true, ...init }));

afterEach(() => {
  while (disposers.length) disposers.pop()?.();
  for (const root of roots.splice(0)) act(() => root.unmount());
  for (const node of addedNodes.splice(0)) node.remove();
  expect(overlayStackSize()).toBe(0);
});

const renderHost = (ui: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  addedNodes.push(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(ui));
  return { root, rerender: (next: React.ReactElement) => act(() => root.render(next)) };
};

/* ── live getOptions() ─────────────────────────────────────────────────── */
describe('registry v2 — live getOptions()', () => {
  it('outside-click handlers read options at event time, not registration time', () => {
    const overlay = el();
    const page = el(document.body);
    const stale = vi.fn();
    const fresh = vi.fn();
    let config: OverlayConfig = { onRequestClose: stale, disableOutsideClick: true };
    track(registerOverlayV2(overlay, () => config));

    pointerDownOn(page);
    expect(stale).not.toHaveBeenCalled(); // disableOutsideClick honored live

    config = { onRequestClose: fresh, disableOutsideClick: false }; // no re-registration
    pointerDownOn(page);
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(fresh).toHaveBeenCalledWith('outside', expect.any(Event));
    expect(stale).not.toHaveBeenCalled(); // the frozen v1 closure is dead
  });

  it('Escape reads the top entry options at event time', () => {
    const overlay = el();
    const stale = vi.fn();
    const fresh = vi.fn();
    let config: OverlayConfig = { onRequestClose: stale, disableEscapeKeyDown: true };
    track(registerOverlayV2(overlay, () => config));

    pressKey('Escape');
    expect(stale).not.toHaveBeenCalled();

    config = { onRequestClose: fresh, disableEscapeKeyDown: false };
    pressKey('Escape');
    expect(fresh).toHaveBeenCalledWith('escape', expect.any(Event));
    expect(stale).not.toHaveBeenCalled();
  });
});

/* ── legacy API compat ─────────────────────────────────────────────────── */
describe('legacy registerOverlay(opts) keeps working (deprecated-internal)', () => {
  it('still registers, dismisses on outside click, and disposes cleanly', () => {
    const overlay = el();
    const page = el(document.body);
    const onRequestClose = vi.fn();
    const dispose = track(registerOverlay({ element: overlay, onRequestClose, label: 'legacy' }));
    expect(overlayStackSize()).toBe(1);

    pointerDownOn(overlay.querySelector('button')!);
    expect(onRequestClose).not.toHaveBeenCalled(); // inside click

    pointerDownOn(page);
    expect(onRequestClose).toHaveBeenCalledWith('outside', expect.any(Event));

    dispose();
    expect(overlayStackSize()).toBe(0);
    pointerDownOn(page);
    pressKey('Escape');
    expect(onRequestClose).toHaveBeenCalledTimes(1); // listeners detached
  });

  it('restores focus to the previously focused element on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    addedNodes.push(trigger);
    trigger.focus();

    const overlay = el();
    const dispose = track(
      registerOverlay({ element: overlay, trapFocus: true, restoreFocusOnClose: true }),
    );
    expect(document.activeElement).toBe(overlay.querySelector('button')); // moved in
    dispose();
    expect(document.activeElement).toBe(trigger); // restored
  });
});

/* ── stack-aware outside click ─────────────────────────────────────────── */
describe('stack-aware outside click (one module-owned document listener)', () => {
  it('clicking a LOWER layer closes every dismissible layer above it, not the layer itself', () => {
    const lower = el();
    const upper = el();
    const closeLower = vi.fn();
    const closeUpper = vi.fn();
    track(registerOverlayV2(lower, () => ({ onRequestClose: closeLower })));
    track(registerOverlayV2(upper, () => ({ onRequestClose: closeUpper })));

    pointerDownOn(lower.querySelector('button')!);
    expect(closeUpper).toHaveBeenCalledWith('outside', expect.any(Event));
    expect(closeLower).not.toHaveBeenCalled();
  });

  it('clicking the page closes every dismissible layer, top-most first', () => {
    const page = el(document.body);
    const order: string[] = [];
    track(registerOverlayV2(el(), () => ({ onRequestClose: () => order.push('bottom') })));
    track(registerOverlayV2(el(), () => ({ onRequestClose: () => order.push('middle') })));
    track(registerOverlayV2(el(), () => ({ onRequestClose: () => order.push('top') })));

    pointerDownOn(page);
    expect(order).toEqual(['top', 'middle', 'bottom']);
  });

  it('non-dismissible layers stay open but do not shield dismissible layers above', () => {
    const page = el(document.body);
    const closeBottom = vi.fn();
    const closeMiddle = vi.fn();
    const closeTop = vi.fn();
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeBottom })));
    track(
      registerOverlayV2(el(), () => ({ onRequestClose: closeMiddle, disableOutsideClick: true })),
    );
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeTop })));

    pointerDownOn(page);
    expect(closeTop).toHaveBeenCalledTimes(1);
    expect(closeMiddle).not.toHaveBeenCalled();
    expect(closeBottom).toHaveBeenCalledTimes(1);
  });

  it('anchors count as inside their layer', () => {
    const anchor = el(document.body);
    const overlay = el();
    const closeAnchored = vi.fn();
    const closeAbove = vi.fn();
    track(registerOverlayV2(overlay, () => ({ onRequestClose: closeAnchored, anchors: [anchor] })));
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeAbove })));

    pointerDownOn(anchor);
    expect(closeAnchored).not.toHaveBeenCalled(); // anchor is inside its layer
    expect(closeAbove).toHaveBeenCalledTimes(1); // but outside the layer above
  });
});

/* ── Escape / trap / inert / restore through the v2 shape ──────────────── */
describe('Escape, focus trap, and inert semantics survive registry v2', () => {
  it('Escape closes only the top-most layer', () => {
    const closeBottom = vi.fn();
    const closeTop = vi.fn();
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeBottom })));
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeTop })));

    pressKey('Escape');
    expect(closeTop).toHaveBeenCalledWith('escape', expect.any(Event));
    expect(closeBottom).not.toHaveBeenCalled();
  });

  it('trapFocus: initial focus moves in; Tab wraps at the last node; mid-list Tab falls through', () => {
    const overlay = el(getOverlayRoot(), '<button>a</button><button>b</button><button>c</button>');
    track(registerOverlayV2(overlay, () => ({ trapFocus: true })));
    const [a, b, c] = Array.from(overlay.querySelectorAll('button'));
    expect(document.activeElement).toBe(a);

    c.focus();
    pressKey('Tab');
    expect(document.activeElement).toBe(a); // wrap-to-first

    b.focus();
    const ev = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    document.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false); // allow-default (resolveTabAction)
    expect(document.activeElement).toBe(b);
  });

  it('regression: two nested inert overlays release the background lock fully (v1 under-released)', () => {
    const page = el(document.body);
    const a = track(registerOverlayV2(el(), () => ({ inertBackground: true })));
    const b = track(registerOverlayV2(el(), () => ({ inertBackground: true })));

    expect(document.body.style.overflow).toBe('hidden');
    expect(page.getAttribute('aria-hidden')).toBe('true');
    expect(page.hasAttribute('inert')).toBe(true);
    expect(getOverlayRoot().hasAttribute('inert')).toBe(false); // overlay root exempt

    b();
    expect(document.body.style.overflow).toBe('hidden'); // one lock still held

    a();
    expect(document.body.style.overflow).toBe(''); // v1 left this 'hidden' forever
    expect(page.hasAttribute('aria-hidden')).toBe(false);
    expect(page.hasAttribute('inert')).toBe(false);
  });
});

/* ── useOverlay(active, config) ref-callback hook ──────────────────────── */
type CloseHandler = NonNullable<OverlayConfig['onRequestClose']>;

function V2Host({ open, onClose }: { open: boolean; onClose: CloseHandler }) {
  const overlayRef = useOverlay(open, () => ({ onRequestClose: onClose }));
  return open ? (
    <div ref={overlayRef}>
      <button>inside</button>
    </div>
  ) : null;
}

function V2AlwaysMounted({ active, onClose }: { active: boolean; onClose: CloseHandler }) {
  const overlayRef = useOverlay(active, { onRequestClose: onClose });
  return (
    <div ref={overlayRef}>
      <button>inside</button>
    </div>
  );
}

function LegacyHost({ open, onClose }: { open: boolean; onClose: CloseHandler }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [, force] = React.useReducer((x: number) => x + 1, 0);
  // Modal-style v1 usage: render-phase ref read, null until the 2nd render
  useOverlay(open && ref.current ? { element: ref.current, onRequestClose: onClose } : null);
  React.useEffect(() => {
    if (open) force();
  }, [open]);
  return open ? (
    <div ref={ref}>
      <button>inside</button>
    </div>
  ) : null;
}

describe('useOverlay(active, config) ref-callback hook (registry v2)', () => {
  it('registers on the first open commit and deregisters when closed', () => {
    const onClose = vi.fn();
    const { rerender } = renderHost(
      <V2Host
        open={false}
        onClose={onClose}
      />,
    );
    expect(overlayStackSize()).toBe(0);

    rerender(
      <V2Host
        open
        onClose={onClose}
      />,
    );
    expect(overlayStackSize()).toBe(1); // registered in the open commit

    pressKey('Escape');
    expect(onClose).toHaveBeenCalledWith('escape', expect.any(Event));

    rerender(
      <V2Host
        open={false}
        onClose={onClose}
      />,
    );
    expect(overlayStackSize()).toBe(0); // deregistered on detach
    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1); // no leaked document listener
  });

  it('reads config live across re-renders without re-registering (stale-closure regression)', () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = renderHost(
      <V2Host
        open
        onClose={stale}
      />,
    );
    rerender(
      <V2Host
        open
        onClose={fresh}
      />,
    ); // same element, no remount
    expect(overlayStackSize()).toBe(1);

    pressKey('Escape');
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled(); // v1 would have called the frozen handler
  });

  it('deregisters when active flips false while the element stays mounted', () => {
    const onClose = vi.fn();
    const { rerender } = renderHost(
      <V2AlwaysMounted
        active
        onClose={onClose}
      />,
    );
    expect(overlayStackSize()).toBe(1);

    rerender(
      <V2AlwaysMounted
        active={false}
        onClose={onClose}
      />,
    );
    expect(overlayStackSize()).toBe(0);

    rerender(
      <V2AlwaysMounted
        active
        onClose={onClose}
      />,
    );
    expect(overlayStackSize()).toBe(1); // re-registers on re-activate
  });

  it('deregisters on unmount while open', () => {
    const onClose = vi.fn();
    const { root } = renderHost(
      <V2Host
        open
        onClose={onClose}
      />,
    );
    expect(overlayStackSize()).toBe(1);
    act(() => root.unmount());
    expect(overlayStackSize()).toBe(0);
  });

  it('legacy useOverlay(opts | null) signature keeps working with live options', () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = renderHost(
      <LegacyHost
        open={false}
        onClose={stale}
      />,
    );
    expect(overlayStackSize()).toBe(0);

    rerender(
      <LegacyHost
        open
        onClose={stale}
      />,
    );
    expect(overlayStackSize()).toBe(1);

    rerender(
      <LegacyHost
        open
        onClose={fresh}
      />,
    ); // prop swap, still open
    pressKey('Escape');
    expect(fresh).toHaveBeenCalledWith('escape', expect.any(Event));
    expect(stale).not.toHaveBeenCalled(); // Modal.tsx onRequestClose staleness (audit) fixed

    rerender(
      <LegacyHost
        open={false}
        onClose={fresh}
      />,
    );
    expect(overlayStackSize()).toBe(0);
  });
});
