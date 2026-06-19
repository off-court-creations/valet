// ─────────────────────────────────────────────────────────────
// src/system/overlay.dom.test.ts  | valet
// TEST-CI S6 — comprehensive jsdom suite for the overlay registry
// v2 contract (plan §3.2 S6, ruling R28: ships PASSING; it.fails
// is reserved for deferred bugs — none here):
//   • stack push/pop ordering (LIFO top, mid-stack pop, idempotent
//     dispose, listener attach/detach with stack emptiness)
//   • Escape closes the top-most layer only (+ propagation contract)
//   • stack-aware outside-click (click on a LOWER layer closes the
//     layers above it, never the clicked layer itself)
//   • inert background application/removal (latched bookkeeping,
//     pre-existing attribute restoration)
//   • trapFocus initial focus-in + focus RESTORED to the trigger
//   • live options (registry v2): handlers resolve at EVENT time
//   • end-to-end Tab matrix through the public API (complements the
//     pure resolveTabAction matrix in resolveTabAction.test.ts)
//   • useOverlay(active, config) ref-callback attach/detach lifecycle
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  getOverlayRoot,
  overlayStackSize,
  registerOverlayV2,
  useOverlay,
  type OverlayConfig,
} from './overlay';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const h = React.createElement;
type CloseHandler = NonNullable<OverlayConfig['onRequestClose']>;

/* Per-test bookkeeping ---------------------------------------------------- */
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

const pressKey = (key: string, init: KeyboardEventInit = {}) => {
  const ev = new KeyboardEvent('keydown', { key, cancelable: true, ...init });
  document.dispatchEvent(ev);
  return ev;
};

const pressTab = (shiftKey = false) => pressKey('Tab', { shiftKey });

const renderHost = (ui: React.ReactElement) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  addedNodes.push(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(ui));
  return {
    container,
    root,
    rerender: (next: React.ReactElement) => act(() => root.render(next)),
  };
};

afterEach(() => {
  while (disposers.length) disposers.pop()?.();
  for (const root of roots.splice(0)) act(() => root.unmount());
  for (const node of addedNodes.splice(0)) node.remove();
  // Every test must leave the registry empty and the page unlocked
  expect(overlayStackSize()).toBe(0);
  expect(document.body.style.overflow).toBe('');
});

/* ── overlay root ───────────────────────────────────────────────────────── */
describe('getOverlayRoot()', () => {
  it('lazily creates a single #valet-overlay-root as the last body child and reuses it', () => {
    const root = getOverlayRoot();
    expect(root.id).toBe('valet-overlay-root');
    expect(root.getAttribute('data-valet-overlay-root')).toBe('true');
    expect(root.parentElement).toBe(document.body);
    expect(getOverlayRoot()).toBe(root); // singleton
    expect(document.querySelectorAll('#valet-overlay-root')).toHaveLength(1);
  });

  it('recreates the root if it was removed from the document', () => {
    const first = getOverlayRoot();
    first.remove();
    const second = getOverlayRoot();
    expect(second).not.toBe(first);
    expect(document.body.contains(second)).toBe(true);
  });
});

/* ── stack push/pop ordering ────────────────────────────────────────────── */
describe('stack push/pop ordering', () => {
  it('grows on register and shrinks on dispose, LIFO', () => {
    expect(overlayStackSize()).toBe(0);
    const a = track(registerOverlayV2(el(), () => ({})));
    expect(overlayStackSize()).toBe(1);
    const b = track(registerOverlayV2(el(), () => ({})));
    expect(overlayStackSize()).toBe(2);
    const c = track(registerOverlayV2(el(), () => ({})));
    expect(overlayStackSize()).toBe(3);
    c();
    expect(overlayStackSize()).toBe(2);
    b();
    expect(overlayStackSize()).toBe(1);
    a();
    expect(overlayStackSize()).toBe(0);
  });

  it('popping a MIDDLE entry keeps Escape targeting the true top', () => {
    const closeA = vi.fn();
    const closeB = vi.fn();
    const closeC = vi.fn();
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeA })));
    const disposeB = track(registerOverlayV2(el(), () => ({ onRequestClose: closeB })));
    const disposeC = track(registerOverlayV2(el(), () => ({ onRequestClose: closeC })));

    disposeB(); // out-of-order removal
    expect(overlayStackSize()).toBe(2);

    pressKey('Escape');
    expect(closeC).toHaveBeenCalledTimes(1); // C is still top
    expect(closeB).not.toHaveBeenCalled();
    expect(closeA).not.toHaveBeenCalled();

    disposeC();
    pressKey('Escape');
    expect(closeA).toHaveBeenCalledTimes(1); // A surfaced to top
  });

  it('dispose is idempotent — double-dispose never pops another entry', () => {
    const closeA = vi.fn();
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeA })));
    const disposeB = track(registerOverlayV2(el(), () => ({})));

    disposeB();
    disposeB(); // second call must be a no-op
    expect(overlayStackSize()).toBe(1);

    pressKey('Escape');
    expect(closeA).toHaveBeenCalledTimes(1); // A survived intact
  });

  it('document listeners live only while the stack is non-empty', () => {
    const page = el(document.body);
    const onRequestClose = vi.fn();
    const dispose = track(registerOverlayV2(el(), () => ({ onRequestClose })));

    pointerDownOn(page);
    expect(onRequestClose).toHaveBeenCalledTimes(1);

    dispose();
    pointerDownOn(page);
    pressKey('Escape');
    expect(onRequestClose).toHaveBeenCalledTimes(1); // detached with the last entry

    // listeners re-attach with the next registration
    track(registerOverlayV2(el(), () => ({ onRequestClose })));
    pointerDownOn(page);
    expect(onRequestClose).toHaveBeenCalledTimes(2);
  });
});

/* ── Escape semantics ───────────────────────────────────────────────────── */
describe('Escape closes the top-most layer only', () => {
  it('two stacked overlays: Escape hits the top, then the next-top after it closes', () => {
    const closeBottom = vi.fn();
    const closeTop = vi.fn();
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeBottom })));
    const disposeTop = track(registerOverlayV2(el(), () => ({ onRequestClose: closeTop })));

    pressKey('Escape');
    expect(closeTop).toHaveBeenCalledTimes(1);
    expect(closeTop).toHaveBeenCalledWith('escape', expect.any(Event));
    expect(closeBottom).not.toHaveBeenCalled();

    disposeTop();
    pressKey('Escape');
    expect(closeBottom).toHaveBeenCalledTimes(1);
    expect(closeBottom).toHaveBeenCalledWith('escape', expect.any(Event));
  });

  it('a top layer with disableEscapeKeyDown shields the layers beneath it', () => {
    const closeBottom = vi.fn();
    const closeTop = vi.fn();
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeBottom })));
    track(
      registerOverlayV2(el(), () => ({ onRequestClose: closeTop, disableEscapeKeyDown: true })),
    );

    pressKey('Escape');
    expect(closeTop).not.toHaveBeenCalled(); // top ignores Escape
    expect(closeBottom).not.toHaveBeenCalled(); // and it does NOT fall through
  });

  it('a handled Escape never reaches app-level bubble listeners; an ignored one does', () => {
    const appKeydown = vi.fn();
    document.addEventListener('keydown', appKeydown);
    disposers.push(() => document.removeEventListener('keydown', appKeydown));

    const overlay = el();
    const inner = overlay.querySelector('button') as HTMLButtonElement;
    let config: OverlayConfig = { onRequestClose: vi.fn() };
    track(registerOverlayV2(overlay, () => config));

    inner.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(appKeydown).not.toHaveBeenCalled(); // stopped in the capture phase

    config = { onRequestClose: vi.fn(), disableEscapeKeyDown: true };
    inner.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
    expect(appKeydown).toHaveBeenCalledTimes(1); // an Escape the overlay ignores propagates
  });
});

/* ── stack-aware outside-click ──────────────────────────────────────────── */
describe('stack-aware outside-click', () => {
  it('two stacked overlays: clicking the LOWER closes the upper, never the clicked layer', () => {
    const lower = el();
    const upper = el();
    const closeLower = vi.fn();
    const closeUpper = vi.fn();
    track(registerOverlayV2(lower, () => ({ onRequestClose: closeLower })));
    track(registerOverlayV2(upper, () => ({ onRequestClose: closeUpper })));

    pointerDownOn(lower.querySelector('button') as HTMLButtonElement);
    expect(closeUpper).toHaveBeenCalledTimes(1);
    expect(closeUpper).toHaveBeenCalledWith('outside', expect.any(Event));
    expect(closeLower).not.toHaveBeenCalled();
  });

  it('clicking inside the TOP layer closes nothing', () => {
    const lower = el();
    const upper = el();
    const closeLower = vi.fn();
    const closeUpper = vi.fn();
    track(registerOverlayV2(lower, () => ({ onRequestClose: closeLower })));
    track(registerOverlayV2(upper, () => ({ onRequestClose: closeUpper })));

    pointerDownOn(upper.querySelector('button') as HTMLButtonElement);
    expect(closeUpper).not.toHaveBeenCalled();
    expect(closeLower).not.toHaveBeenCalled();
  });

  it('clicking the page closes every dismissible layer, top-most first', () => {
    const page = el(document.body);
    const order: string[] = [];
    track(registerOverlayV2(el(), () => ({ onRequestClose: () => order.push('bottom') })));
    track(registerOverlayV2(el(), () => ({ onRequestClose: () => order.push('top') })));

    pointerDownOn(page);
    expect(order).toEqual(['top', 'bottom']);
  });

  it('disableOutsideClick keeps a layer open without shielding dismissible layers above it', () => {
    const page = el(document.body);
    const closeBottom = vi.fn();
    const closeTop = vi.fn();
    track(
      registerOverlayV2(el(), () => ({ onRequestClose: closeBottom, disableOutsideClick: true })),
    );
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeTop })));

    pointerDownOn(page);
    expect(closeBottom).not.toHaveBeenCalled();
    expect(closeTop).toHaveBeenCalledTimes(1);
  });

  it('anchors count as inside their layer (trigger click does not self-dismiss)', () => {
    const anchor = el(document.body);
    const closeAnchored = vi.fn();
    track(registerOverlayV2(el(), () => ({ onRequestClose: closeAnchored, anchors: [anchor] })));

    pointerDownOn(anchor);
    expect(closeAnchored).not.toHaveBeenCalled();

    pointerDownOn(el(document.body));
    expect(closeAnchored).toHaveBeenCalledTimes(1); // plain page click still dismisses
  });

  it('a close handler that unregisters layers mid-dispatch does not skip the rest of the batch', () => {
    const page = el(document.body);
    const closeBottom = vi.fn();
    const disposeBottom = track(registerOverlayV2(el(), () => ({ onRequestClose: closeBottom })));
    const closeTop = vi.fn(() => {
      disposeTop();
      disposeBottom(); // closes BOTH layers while the dispatch loop is running
    });
    const disposeTop: () => void = track(
      registerOverlayV2(el(), () => ({ onRequestClose: closeTop })),
    );

    pointerDownOn(page);
    expect(closeTop).toHaveBeenCalledTimes(1);
    expect(closeBottom).toHaveBeenCalledTimes(1); // still notified from the snapshot
    expect(overlayStackSize()).toBe(0);
  });
});

/* ── inert background ───────────────────────────────────────────────────── */
describe('inert background application/removal', () => {
  it('applies aria-hidden + inert to body children (overlay root exempt) and removes them on close', () => {
    const page = el(document.body);
    const dispose = track(registerOverlayV2(el(), () => ({ inertBackground: true })));

    expect(document.body.style.overflow).toBe('hidden');
    expect(page.getAttribute('aria-hidden')).toBe('true');
    expect(page.hasAttribute('inert')).toBe(true);
    expect(getOverlayRoot().hasAttribute('inert')).toBe(false);
    expect(getOverlayRoot().hasAttribute('aria-hidden')).toBe(false);

    dispose();
    expect(document.body.style.overflow).toBe('');
    expect(page.hasAttribute('aria-hidden')).toBe(false);
    expect(page.hasAttribute('inert')).toBe(false);
  });

  it('restores pre-existing aria-hidden/inert values instead of clobbering them', () => {
    const marked = el(document.body);
    marked.setAttribute('aria-hidden', 'false');
    const hardInert = el(document.body);
    hardInert.setAttribute('inert', '');

    const dispose = track(registerOverlayV2(el(), () => ({ inertBackground: true })));
    expect(marked.getAttribute('aria-hidden')).toBe('true');
    expect(hardInert.hasAttribute('inert')).toBe(true);

    dispose();
    expect(marked.getAttribute('aria-hidden')).toBe('false'); // restored, not removed
    expect(hardInert.hasAttribute('inert')).toBe(true); // pre-existing inert kept
    expect(hardInert.hasAttribute('aria-hidden')).toBe(false); // added attr removed
  });

  it('an overlay without inertBackground never locks the page', () => {
    const page = el(document.body);
    const dispose = track(registerOverlayV2(el(), () => ({})));
    expect(document.body.style.overflow).toBe('');
    expect(page.hasAttribute('inert')).toBe(false);
    dispose();
  });

  it('a non-inert overlay above an inert one neither applies nor releases the lock', () => {
    const page = el(document.body);
    const disposeInert = track(registerOverlayV2(el(), () => ({ inertBackground: true })));
    const disposePlain = track(registerOverlayV2(el(), () => ({})));

    expect(document.body.style.overflow).toBe('hidden');
    disposePlain();
    expect(document.body.style.overflow).toBe('hidden'); // lock owned by the inert entry
    expect(page.hasAttribute('inert')).toBe(true);
    disposeInert();
    expect(document.body.style.overflow).toBe('');
    expect(page.hasAttribute('inert')).toBe(false);
  });

  it('two nested inert overlays release the lock fully (registry-v1 under-release regression)', () => {
    const page = el(document.body);
    const a = track(registerOverlayV2(el(), () => ({ inertBackground: true })));
    const b = track(registerOverlayV2(el(), () => ({ inertBackground: true })));

    b();
    expect(document.body.style.overflow).toBe('hidden'); // one lock still held
    a();
    expect(document.body.style.overflow).toBe(''); // fully released
    expect(page.hasAttribute('aria-hidden')).toBe(false);
  });

  it('inertBackground is LATCHED at registration — live flips cannot leak or double-release', () => {
    const page = el(document.body);

    // applied at registration; flipping live to false must still release on close
    let lockedConfig: OverlayConfig = { inertBackground: true };
    const disposeLocked = track(registerOverlayV2(el(), () => lockedConfig));
    expect(document.body.style.overflow).toBe('hidden');
    lockedConfig = { inertBackground: false };
    disposeLocked();
    expect(document.body.style.overflow).toBe('');
    expect(page.hasAttribute('inert')).toBe(false);

    // not applied at registration; flipping live to true must not phantom-release
    let openConfig: OverlayConfig = { inertBackground: false };
    const disposeOpen = track(registerOverlayV2(el(), () => openConfig));
    openConfig = { inertBackground: true };
    disposeOpen();
    expect(document.body.style.overflow).toBe('');
  });
});

/* ── focus trap + focus restore ─────────────────────────────────────────── */
describe('trapFocus initial focus + restore-to-trigger', () => {
  it('trapFocus moves focus to the first focusable on registration', () => {
    const overlay = el(getOverlayRoot(), '<button>first</button><button>second</button>');
    track(registerOverlayV2(overlay, () => ({ trapFocus: true })));
    expect(document.activeElement).toBe(overlay.querySelector('button'));
  });

  it('trapFocus with nothing focusable focuses the container itself', () => {
    const overlay = el(getOverlayRoot(), '<p>static content</p>');
    overlay.setAttribute('tabindex', '-1');
    track(registerOverlayV2(overlay, () => ({ trapFocus: true })));
    expect(document.activeElement).toBe(overlay);
  });

  it('restoreFocusOnClose returns focus to the trigger focused before open', () => {
    const trigger = el(document.body).querySelector('button') as HTMLButtonElement;
    trigger.focus();

    const overlay = el();
    const dispose = track(
      registerOverlayV2(overlay, () => ({ trapFocus: true, restoreFocusOnClose: true })),
    );
    expect(document.activeElement).toBe(overlay.querySelector('button')); // moved in
    dispose();
    expect(document.activeElement).toBe(trigger); // RESTORED to the trigger
  });

  it('without restoreFocusOnClose, focus is left where it is on close', () => {
    const trigger = el(document.body).querySelector('button') as HTMLButtonElement;
    trigger.focus();

    const overlay = el();
    const inner = overlay.querySelector('button') as HTMLButtonElement;
    const dispose = track(registerOverlayV2(overlay, () => ({ trapFocus: true })));
    expect(document.activeElement).toBe(inner);
    dispose();
    expect(document.activeElement).not.toBe(trigger);
  });

  it('restore intent is read LIVE at close time (flip restoreFocusOnClose mid-open)', () => {
    const trigger = el(document.body).querySelector('button') as HTMLButtonElement;
    trigger.focus();

    let config: OverlayConfig = { trapFocus: true, restoreFocusOnClose: false };
    const dispose = track(registerOverlayV2(el(), () => config));
    config = { trapFocus: true, restoreFocusOnClose: true }; // close-time intent wins
    dispose();
    expect(document.activeElement).toBe(trigger);
  });
});

/* ── end-to-end Tab matrix through the public API ───────────────────────── */
describe('focus-trap Tab matrix (end-to-end, complements resolveTabAction unit matrix)', () => {
  /** Build a trapped 3-button overlay and return its buttons. */
  const trapped = () => {
    const overlay = el(getOverlayRoot(), '<button>a</button><button>b</button><button>c</button>');
    track(registerOverlayV2(overlay, () => ({ trapFocus: true })));
    return Array.from(overlay.querySelectorAll('button'));
  };

  // [label, startIndex (-1 = focus escaped to the page), shiftKey,
  //  expectDefaultPrevented, expectedFinalIndex]
  const matrix: Array<[string, number, boolean, boolean, number]> = [
    ['mid-list Tab reaches the browser default (never swallowed)', 1, false, false, 1],
    ['mid-list Shift+Tab reaches the browser default', 1, true, false, 1],
    ['first + Tab reaches the browser default', 0, false, false, 0],
    ['last + Tab wraps to first', 2, false, true, 0],
    ['first + Shift+Tab wraps to last', 0, true, true, 2],
    ['last + Shift+Tab reaches the browser default', 2, true, false, 2],
    ['escaped focus + Tab is pulled back to first', -1, false, true, 0],
    ['escaped focus + Shift+Tab is pulled back to first', -1, true, true, 0],
  ];

  it.each(matrix)('%s', (_label, startIndex, shiftKey, expectPrevented, finalIndex) => {
    const buttons = trapped();
    if (startIndex >= 0) {
      buttons[startIndex].focus();
    } else {
      const outside = el(document.body).querySelector('button') as HTMLButtonElement;
      outside.focus(); // focus escaped the dialog
    }

    const ev = pressTab(shiftKey);
    expect(ev.defaultPrevented).toBe(expectPrevented);
    if (expectPrevented) {
      expect(document.activeElement).toBe(buttons[finalIndex]); // trap moved focus
    } else if (startIndex >= 0) {
      expect(document.activeElement).toBe(buttons[startIndex]); // untouched, browser's turn
    }
  });

  it('a single focusable traps both Tab directions onto itself', () => {
    const overlay = el(getOverlayRoot(), '<button>only</button>');
    const only = overlay.querySelector('button') as HTMLButtonElement;
    track(registerOverlayV2(overlay, () => ({ trapFocus: true })));
    expect(document.activeElement).toBe(only);

    expect(pressTab(false).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(only);
    expect(pressTab(true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(only);
  });

  it('zero focusables: Tab refocuses the container', () => {
    const overlay = el(getOverlayRoot(), '<p>no controls</p>');
    overlay.setAttribute('tabindex', '-1');
    track(registerOverlayV2(overlay, () => ({ trapFocus: true })));

    (el(document.body).querySelector('button') as HTMLButtonElement).focus();
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(overlay);
  });

  it('disabled, aria-hidden, hidden-by-style, and tabindex=-1 nodes are excluded from the trap', () => {
    // Excluded nodes deliberately placed FIRST and LAST so a broken filter
    // changes both the initial-focus target and the wrap targets.
    const overlay = el(
      getOverlayRoot(),
      '<button disabled>skip-first</button>' +
        '<input type="hidden" />' +
        '<button>a</button>' +
        '<div tabindex="-1">skip</div>' +
        '<button>z</button>' +
        '<button aria-hidden="true">skip</button>' +
        '<button style="display:none">skip</button>' +
        '<button style="visibility:hidden">skip-last</button>',
    );
    const buttons = Array.from(overlay.querySelectorAll('button'));
    const a = buttons[1]; // first TABBABLE (index 0 is the disabled button)
    const z = buttons[2]; // last TABBABLE (aria-hidden/styled-out follow it)
    track(registerOverlayV2(overlay, () => ({ trapFocus: true })));
    expect(document.activeElement).toBe(a); // initial focus skips the disabled button

    z.focus(); // z is the LAST tabbable — Tab must wrap, not fall through
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(a); // wrap-to-first ignores excluded nodes

    a.focus(); // a is the FIRST tabbable — Shift+Tab must wrap to z
    expect(pressTab(true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(z); // wrap-to-last skips the hidden tail
  });

  it('only the TOP-MOST layer traps: a non-trapping top layer lets Tab through', () => {
    const lower = el(getOverlayRoot(), '<button>a</button><button>b</button>');
    track(registerOverlayV2(lower, () => ({ trapFocus: true })));
    track(registerOverlayV2(el(), () => ({})));

    const [, b] = Array.from(lower.querySelectorAll('button'));
    b.focus();
    expect(pressTab().defaultPrevented).toBe(false); // lower's trap is inactive
    expect(document.activeElement).toBe(b);
  });

  it('focus stranded in a lower layer is pulled into the top trap', () => {
    const lower = el();
    const top = el(getOverlayRoot(), '<button>top-first</button><button>top-last</button>');
    track(registerOverlayV2(lower, () => ({})));
    track(registerOverlayV2(top, () => ({ trapFocus: true })));

    (lower.querySelector('button') as HTMLButtonElement).focus(); // escaped the top dialog
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(top.querySelector('button')); // refocus-first
  });

  it('trapFocus is honored LIVE at event time (enabling mid-open arms the trap)', () => {
    const overlay = el(getOverlayRoot(), '<button>a</button><button>b</button>');
    const [a, b] = Array.from(overlay.querySelectorAll('button'));
    let config: OverlayConfig = {};
    track(registerOverlayV2(overlay, () => config));
    expect(document.activeElement).not.toBe(a); // no initial focus without trapFocus

    b.focus();
    expect(pressTab().defaultPrevented).toBe(false); // not trapping yet

    config = { trapFocus: true }; // no re-registration
    b.focus();
    expect(pressTab().defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(a); // edge Tab now wraps
  });
});

/* ── live-options swap through React renders ───────────────────────────── */
function EscapeHost({ open, onClose }: { open: boolean; onClose: CloseHandler }) {
  const ref = useOverlay(open, () => ({ onRequestClose: onClose }));
  return open ? h('div', { ref }, h('button', null, 'inside')) : null;
}

function ObjectConfigHost({ active, onClose }: { active: boolean; onClose: CloseHandler }) {
  const ref = useOverlay(active, { onRequestClose: onClose }); // object form, not thunk
  return h('div', { ref }, h('button', null, 'inside'));
}

describe('live-options swap across renders (registry v2 kills frozen closures)', () => {
  it('changing onRequestClose between renders makes Escape fire the NEW handler', () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = renderHost(h(EscapeHost, { open: true, onClose: stale }));
    rerender(h(EscapeHost, { open: true, onClose: fresh })); // same element, no remount
    expect(overlayStackSize()).toBe(1);

    pressKey('Escape');
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(fresh).toHaveBeenCalledWith('escape', expect.any(Event));
    expect(stale).not.toHaveBeenCalled();
  });

  it('changing onRequestClose between renders makes outside-click fire the NEW handler', () => {
    const page = el(document.body);
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = renderHost(h(EscapeHost, { open: true, onClose: stale }));
    rerender(h(EscapeHost, { open: true, onClose: fresh }));

    pointerDownOn(page);
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(fresh).toHaveBeenCalledWith('outside', expect.any(Event));
    expect(stale).not.toHaveBeenCalled();
  });

  it('the object (non-thunk) config form is re-read live as well', () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { rerender } = renderHost(h(ObjectConfigHost, { active: true, onClose: stale }));
    rerender(h(ObjectConfigHost, { active: true, onClose: fresh }));

    pressKey('Escape');
    expect(fresh).toHaveBeenCalledTimes(1);
    expect(stale).not.toHaveBeenCalled();
    rerender(h(ObjectConfigHost, { active: false, onClose: fresh }));
  });
});

/* ── useOverlay(active, config) ref-callback lifecycle ─────────────────── */
function KeyedHost({ open, k, onClose }: { open: boolean; k: string; onClose: CloseHandler }) {
  const ref = useOverlay(open, () => ({ onRequestClose: onClose }));
  return open ? h('div', { ref, key: k, 'data-overlay': k }, h('button', null, 'inside')) : null;
}

function TriggerHost({ open }: { open: boolean }) {
  const ref = useOverlay(open, { trapFocus: true, restoreFocusOnClose: true });
  return h(
    'div',
    null,
    h('button', { 'data-trigger': true }, 'open dialog'),
    open ? h('div', { ref }, h('button', { 'data-dialog': true }, 'inside dialog')) : null,
  );
}

function TwoLayerHost({ onLower, onUpper }: { onLower: CloseHandler; onUpper: CloseHandler }) {
  const lowerRef = useOverlay(true, () => ({ onRequestClose: onLower }));
  const upperRef = useOverlay(true, () => ({ onRequestClose: onUpper }));
  return h(
    'div',
    null,
    h('div', { ref: lowerRef }, h('button', { 'data-layer': 'lower' }, 'lower')),
    h('div', { ref: upperRef }, h('button', { 'data-layer': 'upper' }, 'upper')),
  );
}

describe('useOverlay(active, config) ref-callback attach/detach lifecycle', () => {
  it('registers on the first open commit, deregisters on close, no leaked listeners', () => {
    const onClose = vi.fn();
    const { rerender } = renderHost(h(EscapeHost, { open: false, onClose }));
    expect(overlayStackSize()).toBe(0);

    rerender(h(EscapeHost, { open: true, onClose }));
    expect(overlayStackSize()).toBe(1);
    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(h(EscapeHost, { open: false, onClose }));
    expect(overlayStackSize()).toBe(0);
    pressKey('Escape');
    pointerDownOn(document);
    expect(onClose).toHaveBeenCalledTimes(1); // nothing leaked after detach
  });

  it('returns a STABLE callback ref across renders (no ref churn / remount loops)', () => {
    const seen: Array<(node: HTMLElement | null) => void> = [];
    function RefProbe({ tick }: { tick: number }) {
      const ref = useOverlay(false, {});
      seen.push(ref);
      return h('span', null, String(tick));
    }
    const { rerender } = renderHost(h(RefProbe, { tick: 1 }));
    rerender(h(RefProbe, { tick: 2 }));
    expect(seen).toHaveLength(2);
    expect(seen[0]).toBe(seen[1]);
  });

  it('re-registers onto the NEW element when the overlay node is swapped while open', () => {
    const onClose = vi.fn();
    const { container, rerender } = renderHost(h(KeyedHost, { open: true, k: 'a', onClose }));
    expect(overlayStackSize()).toBe(1);

    rerender(h(KeyedHost, { open: true, k: 'b', onClose })); // key change = new DOM node
    expect(overlayStackSize()).toBe(1); // swapped, not stacked

    const swapped = container.querySelector('[data-overlay="b"] button') as HTMLButtonElement;
    pointerDownOn(swapped);
    expect(onClose).not.toHaveBeenCalled(); // the NEW node counts as inside

    pointerDownOn(el(document.body));
    expect(onClose).toHaveBeenCalledTimes(1); // page click is still outside

    rerender(h(KeyedHost, { open: false, k: 'b', onClose }));
    expect(overlayStackSize()).toBe(0);
  });

  it('deregisters when active flips false while the element stays mounted, re-registers on re-activate', () => {
    const onClose = vi.fn();
    const { rerender } = renderHost(h(ObjectConfigHost, { active: true, onClose }));
    expect(overlayStackSize()).toBe(1);

    rerender(h(ObjectConfigHost, { active: false, onClose }));
    expect(overlayStackSize()).toBe(0);
    pressKey('Escape');
    expect(onClose).not.toHaveBeenCalled();

    rerender(h(ObjectConfigHost, { active: true, onClose }));
    expect(overlayStackSize()).toBe(1);
    rerender(h(ObjectConfigHost, { active: false, onClose }));
  });

  it('deregisters on unmount while open', () => {
    const onClose = vi.fn();
    const { root } = renderHost(h(EscapeHost, { open: true, onClose }));
    expect(overlayStackSize()).toBe(1);
    act(() => root.unmount());
    expect(overlayStackSize()).toBe(0);
  });

  it('StrictMode double-invocation stays balanced: one registration open, zero closed', () => {
    const onClose = vi.fn();
    const { rerender } = renderHost(
      h(React.StrictMode, null, h(EscapeHost, { open: true, onClose })),
    );
    expect(overlayStackSize()).toBe(1);
    pressKey('Escape');
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(h(React.StrictMode, null, h(EscapeHost, { open: false, onClose })));
    expect(overlayStackSize()).toBe(0);
  });

  it('end-to-end: focus moves into the dialog on open and is RESTORED to the trigger on close', () => {
    const { container, rerender } = renderHost(h(TriggerHost, { open: false }));
    const trigger = container.querySelector('[data-trigger]') as HTMLButtonElement;
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    rerender(h(TriggerHost, { open: true }));
    const dialogButton = container.querySelector('[data-dialog]') as HTMLButtonElement;
    expect(document.activeElement).toBe(dialogButton); // trapFocus moved focus in

    rerender(h(TriggerHost, { open: false }));
    expect(document.activeElement).toBe(trigger); // restored to the trigger
    expect(overlayStackSize()).toBe(0);
  });

  it('two hook-driven layers in one tree stack in commit order; clicking the lower closes the upper', () => {
    const onLower = vi.fn();
    const onUpper = vi.fn();
    const { container, root } = renderHost(h(TwoLayerHost, { onLower, onUpper }));
    expect(overlayStackSize()).toBe(2);

    pointerDownOn(container.querySelector('[data-layer="lower"]') as HTMLButtonElement);
    expect(onUpper).toHaveBeenCalledTimes(1);
    expect(onUpper).toHaveBeenCalledWith('outside', expect.any(Event));
    expect(onLower).not.toHaveBeenCalled();

    pressKey('Escape');
    expect(onUpper).toHaveBeenCalledTimes(2); // upper is the top layer
    expect(onLower).not.toHaveBeenCalled();

    act(() => root.unmount());
    expect(overlayStackSize()).toBe(0);
  });
});

describe('non-Escape / non-Tab keys pass through untouched', () => {
  it('does not preventDefault or close on an arbitrary printable / arrow key', () => {
    const close = vi.fn();
    track(registerOverlayV2(el(), () => ({ onRequestClose: close })));

    const a = pressKey('a');
    expect(close).not.toHaveBeenCalled();
    expect(a.defaultPrevented).toBe(false);

    const down = pressKey('ArrowDown');
    expect(close).not.toHaveBeenCalled();
    expect(down.defaultPrevented).toBe(false);
  });
});
