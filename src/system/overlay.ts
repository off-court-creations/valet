// ─────────────────────────────────────────────────────────────
// src/system/overlay.ts  | valet
// Shared overlay primitives: portal root, background lock/inert,
// focus trap/restore, Escape + outside click handling, nested overlay stack
// ─────────────────────────────────────────────────────────────
import * as React from 'react';

type CloseReason = 'escape' | 'outside';

interface OverlayOptions {
  element: HTMLElement; // portalled interactive root
  anchors?: HTMLElement[]; // nodes considered part of the overlay for outside-click
  onRequestClose?: (reason: CloseReason, ev: Event) => void;
  disableOutsideClick?: boolean;
  disableEscapeKeyDown?: boolean;
  trapFocus?: boolean;
  restoreFocusOnClose?: boolean;
  inertBackground?: boolean;
  label?: string; // for dev diagnostics
}

interface OverlayEntry extends OverlayOptions {
  id: number;
  previouslyFocused: Element | null;
}

let overlayRoot: HTMLElement | null = null;
let idCounter = 1;
const stack: OverlayEntry[] = [];

// Background lock / inert management -------------------------------------
type InertPrev = { hadInert: boolean; ariaHidden: string | null };
const lockState: {
  count: number;
  bodyOverflow: string;
  bodyPaddingRight: string;
  inertMap: WeakMap<HTMLElement, InertPrev>;
} = { count: 0, bodyOverflow: '', bodyPaddingRight: '', inertMap: new WeakMap() };

function computeScrollbarWidth(): number {
  if (typeof window === 'undefined') return 0;
  const docEl = document.documentElement;
  const w = window.innerWidth - docEl.clientWidth;
  return Math.max(0, w || 0);
}

function applyBackgroundLock() {
  if (typeof document === 'undefined') return;
  if (lockState.count > 0) {
    lockState.count += 1;
    return;
  }
  const body = document.body;
  lockState.bodyOverflow = body.style.overflow || '';
  lockState.bodyPaddingRight = body.style.paddingRight || '';
  const currentPad = parseFloat(getComputedStyle(body).paddingRight || '0') || 0;
  const sbw = computeScrollbarWidth();
  if (sbw > 0) body.style.paddingRight = `${currentPad + sbw}px`;
  body.style.overflow = 'hidden';
  // Mark all body children except overlayRoot inert + aria-hidden
  const children = Array.from(body.children) as HTMLElement[];
  for (const el of children) {
    if (el === overlayRoot) continue;
    const prev: InertPrev = {
      hadInert: el.hasAttribute('inert'),
      ariaHidden: el.getAttribute('aria-hidden'),
    };
    lockState.inertMap.set(el, prev);
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('inert', '');
  }
  lockState.count = 1;
}

function releaseBackgroundLock() {
  if (typeof document === 'undefined') return;
  if (lockState.count === 0) return;
  lockState.count -= 1;
  if (lockState.count > 0) return;
  const body = document.body;
  const children = Array.from(body.children) as HTMLElement[];
  for (const el of children) {
    const prev = lockState.inertMap.get(el);
    if (!prev) continue;
    if (prev.ariaHidden == null) el.removeAttribute('aria-hidden');
    else el.setAttribute('aria-hidden', prev.ariaHidden);
    if (!prev.hadInert) el.removeAttribute('inert');
  }
  lockState.inertMap = new WeakMap();
  body.style.overflow = lockState.bodyOverflow;
  body.style.paddingRight = lockState.bodyPaddingRight;
}

// Focus helpers -----------------------------------------------------------
const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  const list = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
  return list.filter((n) => {
    if (n.hasAttribute('disabled')) return false;
    if (n.getAttribute('aria-hidden') === 'true') return false;
    const style = (n.ownerDocument?.defaultView || window).getComputedStyle(n);
    if (!style) return true;
    if (style.visibility === 'hidden' || style.display === 'none') return false;
    return true;
  });
}

function trapTabWithin(container: HTMLElement, e: KeyboardEvent) {
  const nodes = getFocusable(container);
  if (nodes.length === 0) {
    e.preventDefault();
    container.focus();
    return;
  }
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const active = (document.activeElement as HTMLElement) || undefined;
  if (e.shiftKey) {
    if (!active || active === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    if (!active || active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

// Global listeners (attached when stack is non-empty) ---------------------
function handlePointerDown(ev: Event) {
  const e = ev as PointerEvent | MouseEvent;
  if (stack.length === 0) return;
  const top = stack[stack.length - 1];
  if (!top || top.disableOutsideClick) return;
  const target = e.target as Node | null;
  if (!target) return;
  // If the target is inside any overlay element, do nothing (nested overlay)
  for (let i = stack.length - 1; i >= 0; i--) {
    const entry = stack[i];
    if (entry.element.contains(target)) return;
    if (entry.anchors && entry.anchors.some((a) => a && a.contains(target as Node))) return;
  }
  top.onRequestClose?.('outside', ev);
}

function handleKeyDown(ev: KeyboardEvent) {
  if (stack.length === 0) return;
  const top = stack[stack.length - 1];
  if (!top) return;
  if (ev.key === 'Escape') {
    if (!top.disableEscapeKeyDown) {
      ev.stopPropagation();
      top.onRequestClose?.('escape', ev);
    }
    return;
  }
  if (ev.key === 'Tab' && top.trapFocus) {
    ev.preventDefault();
    trapTabWithin(top.element, ev);
  }
}

function attachGlobalListeners() {
  if (typeof document === 'undefined') return;
  document.addEventListener('pointerdown', handlePointerDown, true);
  document.addEventListener('keydown', handleKeyDown, true);
}

function detachGlobalListeners() {
  if (typeof document === 'undefined') return;
  document.removeEventListener('pointerdown', handlePointerDown, true);
  document.removeEventListener('keydown', handleKeyDown, true);
}

// Public API ---------------------------------------------------------------
export function getOverlayRoot(): HTMLElement {
  if (typeof document === 'undefined') return {} as unknown as HTMLElement;
  if (overlayRoot && document.body.contains(overlayRoot)) return overlayRoot;
  const root = document.createElement('div');
  root.setAttribute('id', 'valet-overlay-root');
  root.setAttribute('data-valet-overlay-root', 'true');
  // Keep it as the last body child to naturally sit on top
  document.body.appendChild(root);
  overlayRoot = root;
  return overlayRoot;
}

export function registerOverlay(opts: OverlayOptions): () => void {
  if (typeof document === 'undefined') return () => void 0;
  const entry: OverlayEntry = {
    id: idCounter++,
    previouslyFocused: document.activeElement,
    ...opts,
  };
  stack.push(entry);

  // Focus first focusable when trapping is enabled
  if (entry.trapFocus) {
    const focusable = getFocusable(entry.element);
    (focusable[0] || entry.element).focus({ preventScroll: true });
  }

  // Apply background lock if any entry requires it
  if (entry.inertBackground) applyBackgroundLock();

  // Add global listeners on first overlay
  if (stack.length === 1) attachGlobalListeners();

  return () => unregisterOverlay(entry.id);
}

export function unregisterOverlay(id: number) {
  const idx = stack.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const [entry] = stack.splice(idx, 1);

  // Restore focus if requested
  if (entry.restoreFocusOnClose && entry.previouslyFocused) {
    try {
      (entry.previouslyFocused as HTMLElement).focus();
    } catch {
      /* no-op */
    }
  }

  // Release background lock if no remaining entry requires it
  const anyInert = stack.some((e) => e.inertBackground);
  if (!anyInert) releaseBackgroundLock();

  // Detach global listeners when stack is empty
  if (stack.length === 0) detachGlobalListeners();
}

// React hook helper for ergonomic lifecycle tying -------------------------
export function useOverlay(opts: OverlayOptions | null | undefined) {
  React.useLayoutEffect(() => {
    if (!opts) return;
    let dispose: (() => void) | null = null;
    dispose = registerOverlay(opts);
    return () => {
      try {
        dispose?.();
      } catch {
        /* no-op */
      }
    };
    // Intentionally only run on mount/unmount for provided opts object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts?.element]);
}
