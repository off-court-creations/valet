// ─────────────────────────────────────────────────────────────
// src/system/overlay.ts  | valet
// Shared overlay primitives — Registry v2 (OVERLAY S3):
// portal root, background lock/inert, focus trap/restore,
// Escape-on-top-most, stack-aware outside-click, LIVE per-entry
// options (handlers resolve options at event time, not at
// registration), and a ref-callback `useOverlay(active, config)`
// hook (registration on first open commit, deregistration on
// detach/close).
//
// INTERNAL module — never re-exported from src/index.ts.
// Consumers (Modal/Drawer/Tooltip/Select/SpeedDial) migrate to the
// v2 hook in Wave 1.2; until then the legacy `registerOverlay(opts)`
// and `useOverlay(opts | null)` shapes keep working unchanged.
// ─────────────────────────────────────────────────────────────
import * as React from 'react';

type CloseReason = 'escape' | 'outside';

/** Per-overlay behavior. Resolved LIVE at event time via the entry's getOptions(). */
export interface OverlayConfig {
  /** Nodes considered part of the overlay for outside-click (e.g. the anchor/trigger). */
  anchors?: HTMLElement[];
  onRequestClose?: (reason: CloseReason, ev: Event) => void;
  disableOutsideClick?: boolean;
  disableEscapeKeyDown?: boolean;
  trapFocus?: boolean;
  restoreFocusOnClose?: boolean;
  inertBackground?: boolean;
  /** For dev diagnostics. */
  label?: string;
}

/**
 * @deprecated-internal Registry-v1 options shape (element travels inside the
 * options object). Kept working through Wave 1.2 while consumers migrate to
 * `useOverlay(active, config)`.
 */
export interface OverlayOptions extends OverlayConfig {
  element: HTMLElement; // portalled interactive root
}

interface OverlayEntry {
  id: number;
  element: HTMLElement;
  previouslyFocused: Element | null;
  /**
   * Latched at registration: background-lock bookkeeping must stay symmetric
   * (one release per apply) even if live options flip mid-open.
   */
  inertBackground: boolean;
  /** Registry v2 — handlers read options at EVENT time through this. */
  getOptions: () => OverlayConfig;
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

// Pure decision core for the Tab focus trap. Exported for unit testing only;
// not re-exported from the package index.
export type TabAction = 'wrap-to-first' | 'wrap-to-last' | 'allow-default' | 'refocus-first';

/**
 * Decide what a trapped Tab keypress should do.
 *
 * @param activeIndex    index of the active element within the focusable list,
 *                       or -1 when focus escaped the dialog / sits on the
 *                       container / nothing is focused
 * @param shiftKey       whether Shift was held
 * @param focusableCount number of focusable nodes inside the dialog
 *
 * Only wrap/refocus results suppress the browser default — a mid-list Tab
 * resolves to 'allow-default' so native sequential focus keeps working.
 */
export function resolveTabAction(
  activeIndex: number,
  shiftKey: boolean,
  focusableCount: number,
): TabAction {
  // Nothing focusable inside — hold focus on the container itself
  if (focusableCount <= 0) return 'refocus-first';
  // Focus escaped the dialog (or index is stale) — pull it back inside
  if (activeIndex < 0 || activeIndex >= focusableCount) return 'refocus-first';
  if (shiftKey) return activeIndex === 0 ? 'wrap-to-last' : 'allow-default';
  return activeIndex === focusableCount - 1 ? 'wrap-to-first' : 'allow-default';
}

function trapTabWithin(container: HTMLElement, e: KeyboardEvent) {
  const nodes = getFocusable(container);
  const active = document.activeElement as HTMLElement | null;
  const activeIndex = active ? nodes.indexOf(active) : -1;
  const action = resolveTabAction(activeIndex, e.shiftKey, nodes.length);
  // Mid-list Tab falls through to the browser's own focus handling
  if (action === 'allow-default') return;
  e.preventDefault();
  if (action === 'wrap-to-last') nodes[nodes.length - 1].focus();
  // 'wrap-to-first' | 'refocus-first' (container when nothing is focusable)
  else (nodes[0] || container).focus();
}

// Stack-aware outside-click ------------------------------------------------
/** One stack layer as seen by the outside-click resolver (bottom → top order). */
export interface OutsideClickLayer {
  /** The pointerdown target sits inside this layer (element or anchors). */
  containsTarget: boolean;
  /** This layer closes on outside clicks (i.e. !disableOutsideClick). */
  dismissible: boolean;
}

/**
 * Pure decision core for stack-aware outside-click dismissal. Exported for
 * unit testing only; not re-exported from the package index.
 *
 * Given the overlay stack bottom → top, a click belonging to a layer is an
 * "inside" click for that layer and everything beneath it, and an "outside"
 * click for every layer stacked above it. A click on the page (contained by
 * no layer) is outside everything.
 *
 * @returns indices of the layers to close, TOP-MOST FIRST, skipping
 *          non-dismissible layers (they stay open but do not shield the
 *          dismissible layers above or below them).
 */
export function resolveOutsideClick(layers: readonly OutsideClickLayer[]): number[] {
  // Deepest layer containing the click = highest stack index containing it
  let deepestContaining = -1;
  for (let i = layers.length - 1; i >= 0; i--) {
    if (layers[i].containsTarget) {
      deepestContaining = i;
      break;
    }
  }
  const toClose: number[] = [];
  for (let i = layers.length - 1; i > deepestContaining; i--) {
    if (layers[i].dismissible) toClose.push(i);
  }
  return toClose;
}

// Global listeners (one per document, owned by this module; attached while
// the stack is non-empty) ---------------------------------------------------
function handlePointerDown(ev: Event) {
  if (stack.length === 0) return;
  const target = ev.target as Node | null;
  if (!target) return;
  // Snapshot entries + live options once up front: onRequestClose handlers
  // may unregister entries (mutating `stack`) while we iterate.
  const snapshot = stack.map((entry) => {
    const opts = entry.getOptions();
    const containsTarget =
      entry.element.contains(target) ||
      !!(opts.anchors && opts.anchors.some((a) => a && a.contains(target)));
    return { opts, containsTarget, dismissible: !opts.disableOutsideClick };
  });
  for (const i of resolveOutsideClick(snapshot)) {
    snapshot[i].opts.onRequestClose?.('outside', ev);
  }
}

function handleKeyDown(ev: KeyboardEvent) {
  if (stack.length === 0) return;
  const top = stack[stack.length - 1];
  if (!top) return;
  const opts = top.getOptions(); // live read at event time (registry v2)
  if (ev.key === 'Escape') {
    if (!opts.disableEscapeKeyDown) {
      ev.stopPropagation();
      opts.onRequestClose?.('escape', ev);
    }
    return;
  }
  if (ev.key === 'Tab' && opts.trapFocus) {
    // preventDefault happens inside trapTabWithin, and only on wrap/refocus
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

/**
 * Registry v2 entry point. `getOptions` is invoked at EVENT time — handlers
 * always see the caller's latest config, killing the frozen-options stale
 * closures of registry v1. `trapFocus` (initial focus) and `inertBackground`
 * (lock bookkeeping) are additionally read once at registration.
 *
 * @returns disposer that unregisters the entry.
 */
export function registerOverlayV2(
  element: HTMLElement,
  getOptions: () => OverlayConfig,
): () => void {
  if (typeof document === 'undefined') return () => void 0;
  const initial = getOptions();
  const entry: OverlayEntry = {
    id: idCounter++,
    element,
    previouslyFocused: document.activeElement,
    inertBackground: !!initial.inertBackground,
    getOptions,
  };
  stack.push(entry);

  // Focus first focusable when trapping is enabled
  if (initial.trapFocus) {
    const focusable = getFocusable(element);
    (focusable[0] || element).focus({ preventScroll: true });
  }

  // Apply background lock if this entry requires it (latched; released
  // symmetrically in unregisterOverlay)
  if (entry.inertBackground) applyBackgroundLock();

  // Add global listeners on first overlay
  if (stack.length === 1) attachGlobalListeners();

  return () => unregisterOverlay(entry.id);
}

/**
 * @deprecated-internal Registry-v1 shape — options travel by reference and
 * are read through that same object at event time. Wave 1.2 migrates all
 * consumers to `useOverlay(active, config)`; until then this keeps working.
 */
export function registerOverlay(opts: OverlayOptions): () => void {
  if (typeof document === 'undefined') return () => void 0;
  return registerOverlayV2(opts.element, () => opts);
}

export function unregisterOverlay(id: number) {
  const idx = stack.findIndex((e) => e.id === id);
  if (idx === -1) return;
  const [entry] = stack.splice(idx, 1);

  // Restore focus if requested (live read — close-time intent wins)
  if (entry.getOptions().restoreFocusOnClose && entry.previouslyFocused) {
    try {
      (entry.previouslyFocused as HTMLElement).focus();
    } catch {
      /* no-op */
    }
  }

  // Release exactly the lock this entry applied (apply/release stay 1:1 —
  // registry v1 under-released with two nested inert overlays open at once)
  if (entry.inertBackground) releaseBackgroundLock();

  // Detach global listeners when stack is empty
  if (stack.length === 0) detachGlobalListeners();
}

/** Test/debug helper — number of currently registered overlay layers. */
export function overlayStackSize(): number {
  return stack.length;
}

// React hooks ---------------------------------------------------------------
type OverlayConfigInput = OverlayConfig | (() => OverlayConfig);

/**
 * Registry v2 hook. Returns a CALLBACK REF to put on the overlay's portalled
 * root: registration happens on the first open commit (element attach) and
 * deregistration on detach/close/unmount. `config` (object or thunk) is
 * re-read every commit and resolved live at event time — handlers never see
 * stale closures.
 */
export function useOverlay(
  active: boolean,
  config: OverlayConfigInput,
): (node: HTMLElement | null) => void;
/**
 * @deprecated-internal Registry-v1 signature (element travels inside opts;
 * pass null/undefined while closed). Options are now resolved live at event
 * time. Wave 1.2 migrates consumers to `useOverlay(active, config)`.
 */
export function useOverlay(opts: OverlayOptions | null | undefined): void;
export function useOverlay(
  activeOrOpts: boolean | OverlayOptions | null | undefined,
  config?: OverlayConfigInput,
): ((node: HTMLElement | null) => void) | void {
  const isV2 = typeof activeOrOpts === 'boolean';

  // Latest-value refs, committed in layout effects below and read at event
  // time through getLiveOptions (never from render-scope closures).
  const sourceRef = React.useRef<OverlayConfigInput | OverlayOptions | null>(null);
  const lastResolvedRef = React.useRef<OverlayConfig | null>(null);
  const activeRef = React.useRef(false);
  const nodeRef = React.useRef<HTMLElement | null>(null);
  const registeredNodeRef = React.useRef<HTMLElement | null>(null);
  const disposeRef = React.useRef<(() => void) | null>(null);

  const source: OverlayConfigInput | OverlayOptions | null = isV2
    ? (config ?? null)
    : ((activeOrOpts as OverlayOptions | null | undefined) ?? null);
  const legacyElement = isV2
    ? null
    : ((activeOrOpts as OverlayOptions | null | undefined)?.element ?? null);

  // Stable live resolver handed to the registry — the registration entry's
  // getOptions(). Falls back to the last good resolve during the one-commit
  // window where a closing consumer passes null before deregistration runs.
  const getLiveOptions = React.useCallback((): OverlayConfig => {
    const raw = sourceRef.current;
    const resolved = typeof raw === 'function' ? raw() : raw;
    if (resolved) lastResolvedRef.current = resolved;
    return lastResolvedRef.current ?? {};
  }, []);

  // Idempotent register/deregister against the current (active, node) pair
  const sync = React.useCallback(() => {
    const node = nodeRef.current;
    const shouldRegister = activeRef.current && node != null;
    if (disposeRef.current != null && (!shouldRegister || registeredNodeRef.current !== node)) {
      const dispose = disposeRef.current;
      disposeRef.current = null;
      registeredNodeRef.current = null;
      try {
        dispose();
      } catch {
        /* no-op */
      }
    }
    if (shouldRegister && disposeRef.current == null) {
      disposeRef.current = registerOverlayV2(node as HTMLElement, getLiveOptions);
      registeredNodeRef.current = node;
    }
  }, [getLiveOptions]);

  // V2 callback ref — element attach/detach drives the registry
  const refCallback = React.useCallback(
    (node: HTMLElement | null) => {
      nodeRef.current = node;
      sync();
    },
    [sync],
  );

  // Commit the latest config/active (and legacy element) every render, then
  // reconcile. Runs before paint; first-open registration lands in the same
  // commit as the element attach.
  React.useLayoutEffect(() => {
    sourceRef.current = source;
    activeRef.current = isV2 ? (activeOrOpts as boolean) : source != null;
    if (!isV2) nodeRef.current = legacyElement;
    sync();
  });

  // Unmount safety net (the v2 path normally cleans up via refCallback(null))
  React.useLayoutEffect(
    () => () => {
      const dispose = disposeRef.current;
      disposeRef.current = null;
      registeredNodeRef.current = null;
      try {
        dispose?.();
      } catch {
        /* no-op */
      }
    },
    [],
  );

  return isV2 ? refCallback : undefined;
}
