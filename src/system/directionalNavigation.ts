// ─────────────────────────────────────────────────────────────
// src/system/directionalNavigation.ts  | valet
// Input-agnostic sequential and spatial DOM-focus navigation
// ─────────────────────────────────────────────────────────────
import { ensureNavigationFocusRule, NAVIGATION_FOCUS_ATTRIBUTE } from './navigationFocus';

export type NavigationDirection = 'up' | 'down' | 'left' | 'right' | 'next' | 'previous';

/** Structural ref contract; React refs satisfy it without coupling the core to React. */
export interface DirectionalNavigationScopeRef {
  readonly current: HTMLElement | null;
}

/**
 * A DOM scope, a live ref-like object, or a getter. Ref/getter scopes are
 * resolved for every intent so mounting and node replacement are safe.
 */
export type DirectionalNavigationScope =
  | HTMLElement
  | DirectionalNavigationScopeRef
  | (() => HTMLElement | null)
  | null;

export interface DirectionalNavigationOptions {
  /** Required DOM containment boundary. There is deliberately no document-wide default. */
  readonly scope: DirectionalNavigationScope;
}

export interface DirectionalNavigation {
  /**
   * Move real DOM focus. Returns true only when an eligible target received focus.
   * A false result is safe for an adapter to hand back to gameplay/application logic.
   */
  move(direction: NavigationDirection): boolean;
  /**
   * Run the focused target's native `.click()` activation. Returns false when
   * focus is outside the scope or the target is no longer eligible/activatable.
   */
  activate(): boolean;
  /**
   * Remove this navigator's marker and blur only the exact focus it still owns.
   * Focus established by a keyboard, pointer, or another navigator is untouched.
   */
  clear(): void;
}

/** Non-React controller. React consumers normally use `useDirectionalNavigation`. */
export interface DirectionalNavigationController extends DirectionalNavigation {
  /** Remove listeners/ownership without blurring; the controller is unusable afterward. */
  dispose(): void;
}

interface NavigationRect {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

interface NavigationCandidate {
  readonly element: HTMLElement;
  readonly rect: NavigationRect;
}

interface SpatialCandidate {
  readonly rect: NavigationRect;
  readonly order: number;
}

interface NavigationFocusOwner {
  release(element: HTMLElement): void;
}

const navigationFocusOwners = new WeakMap<HTMLElement, NavigationFocusOwner>();

const CANDIDATE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  'summary',
  'iframe',
  'object',
  'embed',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]',
].join(',');

const ACTIVATABLE_ROLES = new Set([
  'button',
  'checkbox',
  'combobox',
  'link',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'option',
  'radio',
  'switch',
  'tab',
  'treeitem',
]);

const DOCUMENT_POSITION_PRECEDING = 2;
const DOCUMENT_POSITION_FOLLOWING = 4;
const CROSS_AXIS_GAP_WEIGHT = 2;
const CROSS_AXIS_CENTER_WEIGHT = 0.25;

function isScopeElement(value: unknown): value is HTMLElement {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as HTMLElement).nodeType === 1 &&
    typeof (value as HTMLElement).querySelectorAll === 'function'
  );
}

function resolveScope(scope: DirectionalNavigationScope): HTMLElement | null {
  if (isScopeElement(scope)) return scope;
  const resolved =
    typeof scope === 'function'
      ? scope()
      : scope && typeof scope === 'object' && 'current' in scope
        ? scope.current
        : null;
  return isScopeElement(resolved) ? resolved : null;
}

function isHTMLElement(element: Element | null): element is HTMLElement {
  if (!element) return false;
  const HTMLElementCtor = element.ownerDocument.defaultView?.HTMLElement;
  return HTMLElementCtor ? element instanceof HTMLElementCtor : element.nodeType === 1;
}

function attributeIsTrue(element: Element, name: string): boolean {
  return element.getAttribute(name)?.toLowerCase() === 'true';
}

function isEditingHost(element: HTMLElement): boolean {
  const value = element.getAttribute('contenteditable');
  return value != null && value.toLowerCase() !== 'false';
}

function isSequentiallyReachable(element: HTMLElement): boolean {
  if (element.localName === 'input' && (element as HTMLInputElement).type === 'hidden') {
    return false;
  }
  if (element.localName === 'summary' && !element.hasAttribute('tabindex')) {
    const details = element.parentElement;
    if (details?.localName !== 'details') return false;
    const firstSummary = Array.from(details.children).find(
      (child) => child.localName === 'summary',
    );
    if (firstSummary !== element) return false;
  }
  if (element.tabIndex >= 0) return true;
  if (!isEditingHost(element)) return false;
  const explicitTabIndex = element.getAttribute('tabindex');
  return explicitTabIndex == null || Number.parseInt(explicitTabIndex, 10) >= 0;
}

function hasBlockedState(element: HTMLElement, scope: HTMLElement): boolean {
  const view = element.ownerDocument.defaultView;
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    if (current.hidden || current.hasAttribute('inert')) return true;
    if (attributeIsTrue(current, 'aria-hidden') || attributeIsTrue(current, 'aria-disabled')) {
      return true;
    }
    // The scope itself may carry this marker to isolate it from an outer
    // navigator; its own navigator intentionally ignores that one boundary.
    if (current !== scope && attributeIsTrue(current, 'data-valet-navigation-exclude')) {
      return true;
    }

    if (view) {
      const style = view.getComputedStyle(current);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.visibility === 'collapse' ||
        style.getPropertyValue('content-visibility') === 'hidden'
      ) {
        return true;
      }
    }
  }
  return false;
}

function isActuallyDisabled(element: HTMLElement): boolean {
  if (element.hasAttribute('disabled')) return true;
  try {
    return element.matches(':disabled');
  } catch {
    return false;
  }
}

function toNavigationRect(rect: DOMRect): NavigationRect | null {
  const values = [rect.top, rect.right, rect.bottom, rect.left, rect.width, rect.height];
  if (!values.every(Number.isFinite)) return null;
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function renderedRect(element: HTMLElement): NavigationRect | null {
  let rect: NavigationRect | null;
  let hasClientRect = false;
  try {
    rect = toNavigationRect(element.getBoundingClientRect());
    hasClientRect = element.getClientRects().length > 0;
  } catch {
    return null;
  }
  if (!rect) return null;
  if (rect.width <= 0 && rect.height <= 0) {
    const proxy = element.nextElementSibling;
    if (isHTMLElement(proxy) && proxy.hasAttribute('data-indicator')) {
      try {
        const proxyRect = toNavigationRect(proxy.getBoundingClientRect());
        const proxyIsRendered =
          proxy.getClientRects().length > 0 ||
          (proxyRect != null && (proxyRect.width > 0 || proxyRect.height > 0));
        if (proxyRect && proxyIsRendered) return proxyRect;
      } catch {
        // Fall through to the real focus target's own rendered-box check.
      }
    }
  }
  // Zero-sized, visually-hidden proxy inputs can still own a client rect and
  // real focus (Checkbox/Radio). display:none and detached nodes have neither.
  if (!hasClientRect && rect.width <= 0 && rect.height <= 0) return null;
  return rect;
}

function isEligibleCandidate(element: HTMLElement, scope: HTMLElement): NavigationRect | null {
  if (!scope.isConnected || !element.isConnected || !scope.contains(element)) return null;
  if (!element.matches(CANDIDATE_SELECTOR) || !isSequentiallyReachable(element)) return null;
  if (isActuallyDisabled(element) || hasBlockedState(element, scope)) return null;
  return renderedRect(element);
}

function discoverCandidates(scope: HTMLElement): NavigationCandidate[] {
  const candidates: NavigationCandidate[] = [];
  for (const candidate of Array.from(scope.querySelectorAll(CANDIDATE_SELECTOR))) {
    if (!isHTMLElement(candidate)) continue;
    const rect = isEligibleCandidate(candidate, scope);
    if (rect) candidates.push({ element: candidate, rect });
  }
  return candidates;
}

function compareDocumentOrder(a: HTMLElement, b: HTMLElement): number {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & DOCUMENT_POSITION_FOLLOWING) return -1;
  if (position & DOCUMENT_POSITION_PRECEDING) return 1;
  return 0;
}

function compareSequentialOrder(a: HTMLElement, b: HTMLElement): number {
  const aTabIndex = a.tabIndex;
  const bTabIndex = b.tabIndex;
  const aPositive = aTabIndex > 0;
  const bPositive = bTabIndex > 0;
  if (aPositive !== bPositive) return aPositive ? -1 : 1;
  if (aPositive && aTabIndex !== bTabIndex) return aTabIndex - bTabIndex;
  return compareDocumentOrder(a, b);
}

function isNamedRadio(element: HTMLElement): element is HTMLInputElement {
  return (
    element.localName === 'input' &&
    (element as HTMLInputElement).type === 'radio' &&
    (element as HTMLInputElement).name.length > 0
  );
}

function belongsToSameRadioGroup(a: HTMLInputElement, b: HTMLInputElement): boolean {
  return a.name === b.name && a.form === b.form && a.getRootNode() === b.getRootNode();
}

function normalizeSequentialRadioGroups(elements: readonly HTMLElement[]): HTMLElement[] {
  const representatives = new Set<HTMLElement>();
  const groups = new Map<Node, Map<HTMLFormElement | null, Map<string, HTMLInputElement>>>();

  for (const element of elements) {
    if (!isNamedRadio(element)) {
      representatives.add(element);
      continue;
    }

    const root = element.getRootNode();
    let rootGroups = groups.get(root);
    if (!rootGroups) {
      rootGroups = new Map();
      groups.set(root, rootGroups);
    }
    let formGroups = rootGroups.get(element.form);
    if (!formGroups) {
      formGroups = new Map();
      rootGroups.set(element.form, formGroups);
    }

    const current = formGroups.get(element.name);
    if (!current) {
      formGroups.set(element.name, element);
      representatives.add(element);
    } else if (element.checked && !current.checked) {
      representatives.delete(current);
      formGroups.set(element.name, element);
      representatives.add(element);
    }
  }

  return elements.filter((element) => representatives.has(element));
}

function sequentialTarget(
  candidates: readonly NavigationCandidate[],
  active: HTMLElement | null,
  scope: HTMLElement,
  direction: 'next' | 'previous',
): HTMLElement | null {
  if (candidates.length === 0) return null;
  const ordered = normalizeSequentialRadioGroups(candidates.map(({ element }) => element)).sort(
    compareSequentialOrder,
  );

  if (active && active !== scope && scope.contains(active) && active.isConnected) {
    const traversalActive = isNamedRadio(active)
      ? (ordered.find(
          (candidate) => isNamedRadio(candidate) && belongsToSameRadioGroup(active, candidate),
        ) ?? active)
      : active;
    if (!ordered.includes(traversalActive) && isSequentiallyReachable(traversalActive)) {
      ordered.push(traversalActive);
      ordered.sort(compareSequentialOrder);
    }
    const currentIndex = ordered.indexOf(traversalActive);
    if (currentIndex >= 0) {
      const targetIndex = currentIndex + (direction === 'next' ? 1 : -1);
      const target = ordered[targetIndex];
      return target && target !== active ? target : null;
    }
  }

  return direction === 'next' ? ordered[0] : ordered[ordered.length - 1];
}

function primaryAndCrossMetrics(
  reference: NavigationRect,
  candidate: NavigationRect,
  direction: Exclude<NavigationDirection, 'next' | 'previous'>,
): { primaryGap: number; crossGap: number; crossCenterOffset: number } | null {
  let primaryGap: number;
  let referenceCrossStart: number;
  let referenceCrossEnd: number;
  let candidateCrossStart: number;
  let candidateCrossEnd: number;

  switch (direction) {
    case 'up':
      if (candidate.bottom > reference.top) return null;
      primaryGap = reference.top - candidate.bottom;
      referenceCrossStart = reference.left;
      referenceCrossEnd = reference.right;
      candidateCrossStart = candidate.left;
      candidateCrossEnd = candidate.right;
      break;
    case 'down':
      if (candidate.top < reference.bottom) return null;
      primaryGap = candidate.top - reference.bottom;
      referenceCrossStart = reference.left;
      referenceCrossEnd = reference.right;
      candidateCrossStart = candidate.left;
      candidateCrossEnd = candidate.right;
      break;
    case 'left':
      if (candidate.right > reference.left) return null;
      primaryGap = reference.left - candidate.right;
      referenceCrossStart = reference.top;
      referenceCrossEnd = reference.bottom;
      candidateCrossStart = candidate.top;
      candidateCrossEnd = candidate.bottom;
      break;
    case 'right':
      if (candidate.left < reference.right) return null;
      primaryGap = candidate.left - reference.right;
      referenceCrossStart = reference.top;
      referenceCrossEnd = reference.bottom;
      candidateCrossStart = candidate.top;
      candidateCrossEnd = candidate.bottom;
      break;
  }

  const crossGap = Math.max(
    0,
    referenceCrossStart - candidateCrossEnd,
    candidateCrossStart - referenceCrossEnd,
  );
  const referenceCrossCenter = (referenceCrossStart + referenceCrossEnd) / 2;
  const candidateCrossCenter = (candidateCrossStart + candidateCrossEnd) / 2;
  return {
    primaryGap,
    crossGap,
    crossCenterOffset: Math.abs(referenceCrossCenter - candidateCrossCenter),
  };
}

/**
 * Pure spatial selector, exported from the internal module for regression tests.
 * Candidates must sit wholly beyond the requested edge, mirroring the CSS
 * Spatial Navigation draft's conservative directional filter. Distance then
 * balances primary progress with cross-axis gap/alignment; order breaks ties.
 */
export function findSpatialCandidateIndex(
  reference: NavigationRect,
  candidates: readonly SpatialCandidate[],
  direction: Exclude<NavigationDirection, 'next' | 'previous'>,
): number {
  let bestIndex = -1;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestOrder = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate, index) => {
    const metrics = primaryAndCrossMetrics(reference, candidate.rect, direction);
    if (!metrics) return;
    const score =
      metrics.primaryGap +
      metrics.crossGap * CROSS_AXIS_GAP_WEIGHT +
      metrics.crossCenterOffset * CROSS_AXIS_CENTER_WEIGHT;
    if (score < bestScore || (score === bestScore && candidate.order < bestOrder)) {
      bestIndex = index;
      bestScore = score;
      bestOrder = candidate.order;
    }
  });

  return bestIndex;
}

function initialSpatialTarget(
  candidates: readonly NavigationCandidate[],
  direction: Exclude<NavigationDirection, 'next' | 'previous'>,
): HTMLElement | null {
  let best: NavigationCandidate | null = null;
  for (const candidate of candidates) {
    if (!best) {
      best = candidate;
      continue;
    }
    const isNearerEntryEdge =
      (direction === 'down' && candidate.rect.top < best.rect.top) ||
      (direction === 'up' && candidate.rect.bottom > best.rect.bottom) ||
      (direction === 'right' && candidate.rect.left < best.rect.left) ||
      (direction === 'left' && candidate.rect.right > best.rect.right);
    if (isNearerEntryEdge) best = candidate;
  }
  return best?.element ?? null;
}

function spatialTarget(
  candidates: readonly NavigationCandidate[],
  active: HTMLElement | null,
  scope: HTMLElement,
  direction: Exclude<NavigationDirection, 'next' | 'previous'>,
): HTMLElement | null {
  const activeRect =
    active && active !== scope && active.isConnected && scope.contains(active)
      ? renderedRect(active)
      : null;
  if (!activeRect) return initialSpatialTarget(candidates, direction);

  const eligible = candidates.filter(({ element }) => element !== active);
  const index = findSpatialCandidateIndex(
    activeRect,
    eligible.map(({ rect }, order) => ({ rect, order })),
    direction,
  );
  return index >= 0 ? eligible[index].element : null;
}

function isActivatable(element: HTMLElement): boolean {
  const activationOverride = element.getAttribute('data-valet-navigation-activate');
  if (activationOverride?.toLowerCase() === 'false') return false;
  if (activationOverride?.toLowerCase() === 'true') return true;

  const tag = element.localName;
  if (
    tag === 'button' ||
    tag === 'input' ||
    tag === 'select' ||
    tag === 'textarea' ||
    tag === 'summary' ||
    tag === 'label' ||
    tag === 'audio' ||
    tag === 'video'
  ) {
    return true;
  }
  if ((tag === 'a' || tag === 'area') && element.hasAttribute('href')) return true;

  const roles = (element.getAttribute('role') ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  return roles.some((role) => ACTIVATABLE_ROLES.has(role));
}

class DirectionalNavigationControllerImpl implements DirectionalNavigationController {
  private disposed = false;
  private operationGeneration = 0;
  private markedElement: HTMLElement | null = null;
  private markedDocument: Document | null = null;
  private pendingFocus: HTMLElement | null = null;

  private readonly owner: NavigationFocusOwner = {
    release: (element) => this.releaseMarker(false, element),
  };

  private readonly handleBlur = (event: Event) => {
    if (event.currentTarget === this.markedElement) this.releaseMarker(false);
  };

  private readonly handleModalityChange = () => {
    this.releaseMarker(false);
  };

  constructor(private readonly options: DirectionalNavigationOptions) {}

  move(direction: NavigationDirection): boolean {
    if (this.disposed) return false;
    const operation = ++this.operationGeneration;
    this.reconcileMarker();
    const scope = resolveScope(this.options.scope);
    if (this.disposed || operation !== this.operationGeneration || !scope?.isConnected) {
      return false;
    }

    const candidates = discoverCandidates(scope);
    if (candidates.length === 0) return false;
    const activeElement = scope.ownerDocument.activeElement;
    const active = isHTMLElement(activeElement) ? activeElement : null;
    const target =
      direction === 'next' || direction === 'previous'
        ? sequentialTarget(candidates, active, scope, direction)
        : spatialTarget(candidates, active, scope, direction);
    if (!target) return false;

    this.pendingFocus = target;
    try {
      target.focus();
    } catch {
      if (this.pendingFocus === target) this.pendingFocus = null;
      return false;
    }

    const liveScope = resolveScope(this.options.scope);
    if (
      this.disposed ||
      operation !== this.operationGeneration ||
      liveScope?.ownerDocument.activeElement !== target ||
      !isEligibleCandidate(target, liveScope)
    ) {
      if (this.pendingFocus === target) this.pendingFocus = null;
      return false;
    }
    if (this.pendingFocus === target) this.pendingFocus = null;
    return this.claimMarker(target, operation);
  }

  activate(): boolean {
    if (this.disposed) return false;
    this.reconcileMarker();
    const scope = resolveScope(this.options.scope);
    if (!scope?.isConnected) return false;
    const activeElement = scope.ownerDocument.activeElement;
    if (!isHTMLElement(activeElement)) return false;
    if (!isEligibleCandidate(activeElement, scope) || !isActivatable(activeElement)) {
      return false;
    }
    activeElement.click();
    return true;
  }

  clear(): void {
    if (this.disposed) return;
    ++this.operationGeneration;
    const pendingFocus = this.pendingFocus;
    this.pendingFocus = null;
    this.reconcileMarker();
    this.releaseMarker(true);
    if (pendingFocus && pendingFocus.ownerDocument.activeElement === pendingFocus) {
      pendingFocus.blur();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    ++this.operationGeneration;
    this.pendingFocus = null;
    this.disposed = true;
    this.releaseMarker(false);
  }

  /** Hook-only commit reconciliation; intentionally not part of the public controller. */
  syncScope(): void {
    if (!this.disposed) this.reconcileMarker();
  }

  private claimMarker(element: HTMLElement, operation: number): boolean {
    if (this.disposed || operation !== this.operationGeneration) return false;
    if (this.markedElement && this.markedElement !== element) this.releaseMarker(false);
    if (this.disposed || operation !== this.operationGeneration) return false;

    const previousOwner = navigationFocusOwners.get(element);
    if (previousOwner && previousOwner !== this.owner) previousOwner.release(element);
    if (this.disposed || operation !== this.operationGeneration) return false;

    ensureNavigationFocusRule();
    const document = element.ownerDocument;
    try {
      this.markedElement = element;
      this.markedDocument = document;
      navigationFocusOwners.set(element, this.owner);
      element.addEventListener('blur', this.handleBlur);
      document.addEventListener('pointerdown', this.handleModalityChange, true);
      document.addEventListener('keydown', this.handleModalityChange, true);
      // Last so a custom element's synchronous attributeChangedCallback can
      // clear/dispose and unwind the fully installed ownership safely.
      element.setAttribute(NAVIGATION_FOCUS_ATTRIBUTE, 'true');
    } catch {
      this.releaseMarker(false);
      return false;
    }

    const claimed =
      !this.disposed &&
      operation === this.operationGeneration &&
      this.markedElement === element &&
      navigationFocusOwners.get(element) === this.owner &&
      element.getAttribute(NAVIGATION_FOCUS_ATTRIBUTE) === 'true';
    if (!claimed && this.markedElement === element) this.releaseMarker(false, element);
    return claimed;
  }

  private reconcileMarker(): void {
    const element = this.markedElement;
    if (!element) return;
    const scope = resolveScope(this.options.scope);
    const ownsMarker = navigationFocusOwners.get(element) === this.owner;
    if (
      !ownsMarker ||
      element.getAttribute(NAVIGATION_FOCUS_ATTRIBUTE) !== 'true' ||
      !scope ||
      scope.ownerDocument.activeElement !== element ||
      !isEligibleCandidate(element, scope)
    ) {
      this.releaseMarker(false);
    }
  }

  private releaseMarker(blur: boolean, expected?: HTMLElement): void {
    const element = this.markedElement;
    if (!element || (expected && expected !== element)) return;
    const document = this.markedDocument;
    const ownsMarker = navigationFocusOwners.get(element) === this.owner;

    element.removeEventListener('blur', this.handleBlur);
    document?.removeEventListener('pointerdown', this.handleModalityChange, true);
    document?.removeEventListener('keydown', this.handleModalityChange, true);
    this.markedElement = null;
    this.markedDocument = null;

    if (ownsMarker) {
      navigationFocusOwners.delete(element);
      element.removeAttribute(NAVIGATION_FOCUS_ATTRIBUTE);
    }
    if (blur && ownsMarker && document?.activeElement === element) element.blur();
  }
}

export function createDirectionalNavigation(
  options: DirectionalNavigationOptions,
): DirectionalNavigationController {
  return new DirectionalNavigationControllerImpl(options);
}

/** Internal hook bridge: reconcile marker ownership after ref/node replacement. */
export function syncDirectionalNavigationScope(controller: DirectionalNavigationController): void {
  if (controller instanceof DirectionalNavigationControllerImpl) controller.syncScope();
}
