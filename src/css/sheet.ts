// ─────────────────────────────────────────────────────────────
// src/css/sheet.ts | valet
// Lazy, guarded access to the single global stylesheet PLUS the
// process-wide style registry (ENGINE S10, ruling Q2(a)).
//
// • ALL engine singleton state — the normalized-css → className
//   cache, the injected-rule id set, the render queue, the bounded
//   raw-css memo, the pending-rule list and the CSSStyleSheet ref —
//   lives in ONE registry object stored at
//   `globalThis[Symbol.for('@archway/valet/style-registry/v1')]`.
//   The package ships ESM-only, but bundlers can still duplicate the
//   module (two lockfile copies, mixed pre-bundled/source graphs);
//   `Symbol.for` hands every copy the same key, so all instances
//   share one cache and one <style> element instead of forking
//   caches and double-injecting rules. The key is versioned: any
//   change to the registry's shape bumps `/v1` so two valet versions
//   with incompatible shapes never share an object.
// • The CSSStyleSheet is created on first injection in a DOM
//   environment – never at module scope – so importing valet in
//   Node (SSR, RSC, vitest, scripts) can never throw
// • Non-DOM environments record pending rule text instead, keeping
//   class names deterministic and letting tests assert exactly what
//   would have been injected
// • Pending rules are flushed (in order) the moment a DOM becomes
//   available and the sheet is created
// • Dev-mode hash-collision guard (`recordClassName`): minting the
//   same class name for two different normalized css bodies is a
//   silent wrong-styles bug — dev builds console.error loudly
// • NOTHING here is public API: the barrel stopped re-exporting the
//   engine singletons (`styleCache`/`globalSheet`, removed per Q2),
//   and src/index.ts never re-exports this module
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────
import { LRU } from './lru';

/* Raw-css memo entry (ENGINE S8; the LRU below is the only bounded
   structure — see createStyled.ts for the eviction-safety argument). */
export interface RawCssMemoEntry {
  className: string;
  ruleText: string;
}

const RAW_CSS_MEMO_CAPACITY = 4096;

/**
 * Every mutable engine singleton, in one place. Stored on `globalThis`
 * under a versioned `Symbol.for` key so duplicated module instances
 * (bundler duplication, linked dev trees) share one registry.
 */
export interface StyleRegistry {
  /** normalized css → className */
  styleCache: Map<string, string>;
  /** injected rule ids (class selectors / keyframes names) — never evicted */
  injected: Set<string>;
  /** cssId → rule text queued during render, flushed from useInsertionEffect */
  renderQueue: Map<string, string>;
  /** raw compiled css → memo entry (BOUNDED — the only evictable structure) */
  rawCssMemo: LRU<string, RawCssMemoEntry>;
  /** rule text recorded while no DOM was available (insertion order) */
  pendingRules: string[];
  /** the single global stylesheet; undefined until first DOM injection */
  sheet: CSSStyleSheet | undefined;
  /** dev only: className → normalized css that minted it (collision guard) */
  classToCss: Map<string, string>;
}

const REGISTRY_KEY = Symbol.for('@archway/valet/style-registry/v1');

function createRegistry(): StyleRegistry {
  return {
    styleCache: new Map(),
    injected: new Set(),
    renderQueue: new Map(),
    rawCssMemo: new LRU(RAW_CSS_MEMO_CAPACITY),
    pendingRules: [],
    sheet: undefined,
    classToCss: new Map(),
  };
}

/** The process-wide registry (created on first access, then shared). */
export function getStyleRegistry(): StyleRegistry {
  const host = globalThis as unknown as Record<symbol, StyleRegistry | undefined>;
  let registry = host[REGISTRY_KEY];
  if (!registry) {
    registry = createRegistry();
    host[REGISTRY_KEY] = registry;
  }
  return registry;
}

/*───────────────────────────────────────────────────────────*/
/**
 * Dev-mode hash-collision guard. `className` is a hash of
 * `normalizedCss`, so one class mapping to two different bodies means
 * a real FNV-1a collision — one of the two callers is silently
 * rendering the other's styles. Loud `console.error` in dev; free in
 * production (first-line bail).
 */
export function recordClassName(className: string, normalizedCss: string): void {
  if (process.env.NODE_ENV === 'production') return;
  const { classToCss } = getStyleRegistry();
  const prev = classToCss.get(className);
  if (prev === undefined) {
    classToCss.set(className, normalizedCss);
    return;
  }
  if (prev !== normalizedCss) {
    console.error(
      `valet: style hash collision — "${className}" was minted for two different css bodies; ` +
        'one of them is rendering the wrong styles. Please report this with both bodies below.\n' +
        `existing: ${prev}\n` +
        `incoming: ${normalizedCss}`,
    );
  }
}

/*───────────────────────────────────────────────────────────*/
function ensureSheet(): CSSStyleSheet | undefined {
  const registry = getStyleRegistry();
  if (registry.sheet) return registry.sheet;
  if (typeof document === 'undefined') return undefined;
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  registry.sheet = styleEl.sheet as CSSStyleSheet;
  /* Flush anything recorded before the DOM existed ------------------- */
  for (const ruleText of registry.pendingRules) {
    insertIntoSheet(registry.sheet, ruleText);
  }
  registry.pendingRules.length = 0;
  return registry.sheet;
}

function insertIntoSheet(sheet: CSSStyleSheet, ruleText: string): CSSRule | undefined {
  try {
    const index = sheet.insertRule(ruleText, sheet.cssRules.length);
    return sheet.cssRules[index];
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('valet: failed to insert CSS rule:\n%s', ruleText, err);
    }
    return undefined;
  }
}

/*───────────────────────────────────────────────────────────*/
/**
 * Append one rule to the global sheet. In non-DOM environments the rule
 * text is recorded instead so a later DOM flush (or a test) can observe
 * what would have been injected. Returns the live CSSRule when available.
 */
export function insertRuleText(ruleText: string): CSSRule | undefined {
  const sheet = ensureSheet();
  if (!sheet) {
    getStyleRegistry().pendingRules.push(ruleText);
    return undefined;
  }
  return insertIntoSheet(sheet, ruleText);
}

/**
 * Flush rules recorded while no DOM was available into a live sheet,
 * if a DOM has appeared since (the Node→DOM same-process edge flagged
 * in Wave 0.0, closed here by ENGINE S10). No-op when nothing is
 * pending or there is still no DOM. Called from the styled insertion
 * effect so even an all-cached re-render flushes the backlog.
 */
export function flushPendingRules(): void {
  if (getStyleRegistry().pendingRules.length > 0) ensureSheet();
}

/* Registry accessors (internal/test hooks — NOT re-exported by the barrel) */

/** The live global sheet; `undefined` until the first DOM injection. */
export function getGlobalSheet(): CSSStyleSheet | undefined {
  return getStyleRegistry().sheet;
}

/** Snapshot of rules recorded while no DOM was available. */
export function getPendingRules(): readonly string[] {
  return getStyleRegistry().pendingRules;
}
