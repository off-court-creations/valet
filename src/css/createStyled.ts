// ─────────────────────────────────────────────────────────────
// src/css/createStyled.ts | valet
// Tiny CSS-in-JS helper powering valet primitives. Now exports `styled` +
// `keyframes`, giving our components Emotion-style animation ergonomics.
//
// • Atomic – each unique rule hashed → single class / keyframes injection
// • Zero deps at runtime (only dev-time hash util)
// • Filters out `$prop` transient values so they never hit the DOM
// • Size tracking is OPT-IN (PERF S9, ruling Q9(a)): a styled element
//   registers with the surface store — and gets the `--valet-el-width`/
//   `--valet-el-height` CSS vars set on it via ResizeObserver — ONLY when
//   it is passed the `$trackSize` transient prop. The previous universal
//   registration was dead on arrival (it ran for every styled element but
//   the `--valet-el-*` contract never held on the initial mount and nothing
//   consumed the vars), so it was pure ResizeObserver/store churn. Opt-in
//   keeps the contract truthful and the default path allocation-free.
// • Render purity (ENGINE S6): class names are still computed
//   synchronously in render (cache lookup + hash — SSR renderToString
//   keeps producing classes), but the CSSOM mutation is queued via
//   `ensureRule` and flushed from `useInsertionEffect`, which runs
//   before layout/paint so first-paint correctness is preserved.
//   `keyframes()`/`definePreset()` at module scope still inject
//   eagerly — they are not in render.
// • Memoization (ENGINE S8): a bounded raw-css → className LRU skips
//   normalize+hash for repeat strings, and a per-instance last-raw
//   ref short-circuits unchanged re-renders before even that. Only
//   the memo is bounded; injected/pending rule bookkeeping is never
//   evicted (rules are immortal — plan §9 veto register).
// • Privatized singletons (ENGINE S10, ruling Q2(a)): nothing here
//   exports mutable state any more (`styleCache`/`globalSheet` are
//   gone from the public surface). All singleton state lives in the
//   process-wide registry at
//   globalThis[Symbol.for('@archway/valet/style-registry/v1')]
//   (see sheet.ts), so a bundler-duplicated second copy of this
//   module shares one cache/sheet instead of double-injecting.
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────
import React, { useContext, useId, useInsertionEffect, useLayoutEffect, useRef } from 'react';
import type { JSX } from 'react';
import { compileTemplate, type Interpolation } from './compile';
import { hashStr } from './hash';
import { normalizeCSS } from './normalize';
import {
  flushPendingRules,
  getStyleRegistry,
  insertRuleText,
  recordClassName,
  type RawCssMemoEntry,
} from './sheet';
import { SurfaceCtx } from '../system/surfaceStore';
import { warnOnce } from '../system/devErrors';

function labelize(raw: string) {
  return raw.toLowerCase().replace(/[^a-z0-9_-]+/g, '') || 'el';
}

/*───────────────────────────────────────────────────────────*/
/* Rule-lifecycle tripwire (ENGINE S9). Rules are immortal — nothing
   ever calls deleteRule — so the rule space of a styled component must
   stay DISCRETE (a bounded set of theme/prop variants). A component
   whose interpolations bake a continuously-varying value (measured px,
   ratios, distance-derived durations) into rule text mints a permanent
   CSSOM rule per unique value: a leak. Dev builds count the distinct
   rules each styled component has generated and warn once past this
   limit; the fix is always the same — move the continuous value to a
   CSS custom property set on inline style and read `var(...)` from the
   template (see AGENTS.md "Rule lifecycle policy"). */
const STYLED_RULE_CARDINALITY_LIMIT = 256;
/* Per-process sequence so each styled component gets its own warnOnce
   key even though many share a displayName like `styled(div)`. */
let styledSeq = 0;

/*───────────────────────────────────────────────────────────*/
/* Internal caches — ALL singleton state lives in the shared registry
   (ENGINE S10). The collections are created once per process and never
   replaced, so destructuring here is safe and keeps the render path
   property-lookup-free.

   • styleCache  — normalized css → className
   • injected    — injected rule ids (never evicted)
   • renderQueue — rules discovered during render, awaiting the
                   insertion-effect flush
   • rawCssMemo  — Memoization (ENGINE S8) layer 1 (global): raw
     compiled css → { className, ruleText }. A hit skips normalizeCSS +
     hashStr entirely for repeat strings. BOUNDED: prop-driven
     interpolations can produce unbounded distinct raw strings, so this
     memo is an LRU (cap 4096, sheet.ts). Only the memo is bounded —
     `injected` and the pending-rule bookkeeping are NEVER evicted
     (veto register: rules are immortal). An eviction only costs a
     recompute on the next miss; normalize+hash is deterministic and
     `styleCache`/`injected` still dedupe, so the same class name comes
     back and no rule is ever re-inserted.
     Layer 2 (per component instance): a last-raw ref inside the styled
     component short-circuits a re-render whose raw css is unchanged
     before even touching this LRU (see StyledComponent below). */
const { styleCache, injected, renderQueue, rawCssMemo } = getStyleRegistry();

/* Single global stylesheet for all rules (lazy, see sheet.ts) --------- */
function inject(cssId: string, css: string) {
  if (injected.has(cssId)) return;
  insertRuleText(css);
  injected.add(cssId);
}

/**
 * Render-phase half of injection: remember the rule WITHOUT touching the
 * CSSOM (render must stay pure — StrictMode/concurrent safe). Idempotent
 * under StrictMode double-render and across cache hits.
 */
function ensureRule(cssId: string, css: string) {
  if (injected.has(cssId) || renderQueue.has(cssId)) return;
  renderQueue.set(cssId, css);
}

/**
 * Effect-phase half: flush every queued rule into the global sheet.
 * Called from `useInsertionEffect`, which runs before layout effects and
 * paint — so anything reading computed styles in a layout effect (or
 * later) already sees the rules. Safe to call repeatedly; `inject`
 * dedupes via the `injected` set.
 */
function flushRules() {
  /* Node→DOM same-process edge (ENGINE S10): rules recorded before a
     DOM existed flush on the first insertion effect after one appears —
     even when every rule THIS render needed is already cached/injected
     and the queue below is empty. */
  flushPendingRules();
  if (renderQueue.size === 0) return;
  for (const [cssId, css] of renderQueue) inject(cssId, css);
  renderQueue.clear();
}

/* Remove transient props that start with `$` -------------------------- */
type TransientPropKey = `$${string}`;
type WithoutTransient<P> = {
  [K in keyof P as K extends string ? (K extends TransientPropKey ? never : K) : K]: P[K];
};

function filterStyledProps<P extends Record<string, unknown>>(raw: P): WithoutTransient<P> {
  const clean: Record<string, unknown> = {};
  for (const k in raw) if (!k.startsWith('$')) clean[k] = raw[k];
  return clean as WithoutTransient<P>;
}

/*───────────────────────────────────────────────────────────*/
/* styled<tag>`…` factory                                    */
export function styled<Tag extends keyof JSX.IntrinsicElements>(tag: Tag) {
  return function styledFactory<ExtraProps extends Record<string, unknown> = Record<never, never>>(
    strings: TemplateStringsArray,
    ...exprs: Array<
      | string
      | number
      | false
      | null
      | undefined
      | ((
          props: ExtraProps & JSX.IntrinsicElements[Tag],
        ) => string | number | false | null | undefined)
    >
  ) {
    type DomRef = Tag extends keyof HTMLElementTagNameMap
      ? HTMLElementTagNameMap[Tag]
      : HTMLElement;

    type StyledProps = ExtraProps &
      JSX.IntrinsicElements[Tag] & {
        className?: string;
        /**
         * Opt into per-element size tracking (PERF S9, ruling Q9(a)). When
         * truthy, this element registers with the nearest <Surface> store and
         * the surface writes `--valet-el-width`/`--valet-el-height` onto its
         * inline style via ResizeObserver. Transient: stripped before the DOM.
         * Off by default — most elements never need their own metrics, and the
         * old universal registration was unconsumed observer churn.
         */
        $trackSize?: boolean;
      };

    type PropsArg = React.PropsWithoutRef<StyledProps>;

    /* Dev-only cardinality bookkeeping (ENGINE S9): the distinct class
       names THIS styled component has resolved to. Bounded — once the
       tripwire fires the set stops growing (≤ limit + 1 entries). */
    const componentSeq = ++styledSeq;
    const mintedClasses: Set<string> | null =
      process.env.NODE_ENV === 'production' ? null : new Set();
    const trackRuleCardinality = (className: string) => {
      if (!mintedClasses || mintedClasses.size > STYLED_RULE_CARDINALITY_LIMIT) return;
      mintedClasses.add(className);
      if (mintedClasses.size > STYLED_RULE_CARDINALITY_LIMIT) {
        const preview = strings.join(' ${…} ').replace(/\s+/g, ' ').trim().slice(0, 64);
        warnOnce(
          `valet-styled-cardinality:${componentSeq}`,
          `valet: styled(${String(tag)}) [template "${preview}…"] has generated more than ` +
            `${STYLED_RULE_CARDINALITY_LIMIT} distinct CSS rules. Rules are immortal (never ` +
            'removed from the CSSOM), so a continuously-varying interpolation (measured px, ' +
            'ratios, computed durations) leaks one permanent rule per unique value. Route ' +
            'continuous values through a CSS custom property set on inline style and read ' +
            'var(--…) from the template instead (AGENTS.md: "Rule lifecycle policy").',
        );
      }
    };

    const StyledComponent = React.forwardRef<DomRef, StyledProps>((props, ref) => {
      const localRef = useRef<DomRef | null>(null);
      const surface = useContext(SurfaceCtx);
      /* Stable SSR-safe instance id (surface registration key) ------- */
      const instanceId = useId();

      /* Build raw CSS string (inc. interpolations) ------------------- */
      const rawCSS = compileTemplate<PropsArg>(
        strings,
        exprs as ReadonlyArray<Interpolation<PropsArg>>,
        props,
      );

      /* Memo layer 2 (ENGINE S8): last-raw short-circuit. A re-render of
         THIS instance with unchanged raw css skips even the LRU lookup.
         Render-phase ref write is safe here: the value is a pure,
         idempotent cache of derived state (same raw → same entry). */
      const lastCss = useRef<{ raw: string; entry: RawCssMemoEntry } | null>(null);
      let entry: RawCssMemoEntry;
      if (lastCss.current !== null && lastCss.current.raw === rawCSS) {
        entry = lastCss.current.entry;
      } else {
        /* Memo layer 1 (ENGINE S8): global raw → className LRU. A hit
           skips normalizeCSS + hashStr for repeat strings. */
        let memo = rawCssMemo.get(rawCSS);
        if (!memo) {
          const normalized = normalizeCSS(rawCSS);
          let className = styleCache.get(normalized);
          if (!className) {
            // Tag is constrained to intrinsic tags, so it's a string
            const rawLabel = tag as string;
            const label = labelize(rawLabel);
            className = `z-${label}-${hashStr(normalized)}`;
            /* Dev hash-collision guard (ENGINE S10): a styleCache miss
               that mints an already-seen class name means two different
               css bodies hashed identically — error loudly. */
            recordClassName(className, normalized);
            styleCache.set(normalized, className);
          }
          memo = { className, ruleText: `.${className}{${normalized}}` };
          rawCssMemo.set(rawCSS, memo);
          /* Dev tripwire (ENGINE S9): same render-phase contract as
             recordClassName above — idempotent bookkeeping, warnOnce. */
          trackRuleCardinality(className);
        }
        entry = memo;
        lastCss.current = { raw: rawCSS, entry };
      }
      const className = entry.className;
      /* Queue (render) → flush (insertion effect): no CSSOM writes here.
         Unconditional — even on a memo hit — so a rule queued by a
         discarded render is always (re)observed; `injected`/`renderQueue`
         make it a cheap no-op once the rule is live. */
      ensureRule(`.${className}`, entry.ruleText);

      /* Flush every queued rule before layout/paint. No deps: a new
         class can be queued on ANY render (prop-driven interpolations). */
      useInsertionEffect(flushRules);

      const merged = [className, props.className].filter(Boolean).join(' ');
      const rawProps = filterStyledProps<PropsArg>(props);
      // Support polymorphic `as` to override the intrinsic tag. Strip it from DOM props.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { as: asProp, ...domProps } = rawProps as any as PropsArg & { as?: React.ElementType };

      /* Size tracking is OPT-IN (PERF S9, ruling Q9(a)): register with the
         surface store — and expose the `--valet-el-*` vars — only when the
         caller passes `$trackSize`. The default path does no registration,
         no ResizeObserver observe, and no store churn. */
      const trackSize = Boolean((props as { $trackSize?: boolean }).$trackSize);
      useLayoutEffect(() => {
        if (!trackSize) return;
        const el = localRef.current;
        if (!surface || !el) return;
        const root = surface.getState().element;
        // Skip registration for elements rendered outside the surface root
        // (e.g. portalled overlays like Drawer/Modal). This avoids tracking
        // and ResizeObserver churn during window resizes.
        if (!root || !root.contains(el)) return;
        surface.getState().registerChild(instanceId, el, (m) => {
          el.style.setProperty('--valet-el-width', `${m.width}px`);
          el.style.setProperty('--valet-el-height', `${Math.round(m.height)}px`);
        });
        return () => {
          surface.getState().unregisterChild(instanceId);
        };
      }, [trackSize, surface, instanceId]);

      const elementTag = (asProp as unknown as keyof JSX.IntrinsicElements) || tag;
      return React.createElement(elementTag, {
        ...(domProps as unknown as JSX.IntrinsicElements[Tag] & ExtraProps),
        className: merged,
        ref: (node: DomRef | null) => {
          localRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref && 'current' in ref) {
            (ref as React.MutableRefObject<DomRef | null>).current = node;
          }
        },
      });
    });

    StyledComponent.displayName = `styled(${String(tag)})`;
    return StyledComponent;
  };
}

/*───────────────────────────────────────────────────────────*/
/* keyframes template literal                               */
export function keyframes(
  strings: TemplateStringsArray,
  ...exprs: Array<string | number | false | null | undefined>
): string {
  /* Build raw keyframe body ------------------------------------------- */
  const rawCSS = compileTemplate(strings, exprs, undefined);

  const normalized = normalizeCSS(rawCSS);
  const animName = `z-kf-${hashStr(normalized)}`;

  /* Dev hash-collision guard (ENGINE S10) — checked BEFORE the injected
     bail so a colliding second body is reported, not silently aliased. */
  recordClassName(animName, normalized);

  /* Only inject once --------------------------------------------------- */
  if (!injected.has(animName)) {
    inject(animName, `@keyframes ${animName}{${normalized}}`);
  }

  return animName; // used as animation-name
}

/* ENGINE S10 (ruling Q2(a)): the former `styleCache`/`globalSheet`
   exports are GONE — engine singletons are private. Internal state is
   reachable for tests/diagnostics via the registry in sheet.ts. */
