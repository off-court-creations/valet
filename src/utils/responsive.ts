// ──────────────────────────────────────────────────────────────
// src/utils/responsive.ts | valet
// Compile a Responsive<T> value into CSS text for a styled() template.
//
// The whole point of valet's responsive model: breakpoint maps become CSS
// `@media (min-width: …)` blocks baked INTO the styled rule — NOT values
// resolved in JS off the surface store. That makes responsive layout
// SSR-stable (correct on the server's first paint), free of any <Surface>
// dependency, and free of hydration reflow. See `Responsive<T>` in types.ts.
//
// Rules are immortal (engine cardinality tripwire), so callers must only feed
// this enumerable values — never continuously-varying state.
// ──────────────────────────────────────────────────────────────
import type { Theme, Breakpoint } from '../system/themeStore';
import type { Responsive } from '../types';

/** Breakpoints smallest→largest; `xs` is the `min-width: 0` base. */
const BP_ORDER: readonly Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];

/** A responsive value is a breakpoint map (vs a bare scalar) iff it is a plain
 *  object. Scalars here are always `string`/`number` (direction, Space, align
 *  tokens), so a non-null, non-array object can only be a breakpoint map. */
function isBreakpointMap<T>(v: Responsive<T>): v is Partial<Record<Breakpoint, T>> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Compile a `Responsive<T>` into CSS declaration text.
 *
 * `decl(value)` returns the CSS declaration(s) for one concrete value, e.g.
 * `(d) => \`flex-direction:\${d};\``. A scalar emits that once. A breakpoint
 * map emits a base declaration (from `xs`, or from `fallback` when `xs` is
 * absent) followed by one `@media (min-width: <px>)` block per higher
 * breakpoint present (`min-width: 0` breakpoints are emitted unwrapped as the
 * base, never inside a media query).
 *
 * `fallback` is the value the property takes BELOW the smallest specified
 * breakpoint. Pass it for properties that always need a base declaration
 * (e.g. Stack's `direction` defaults to `column`); omit it for properties that
 * are simply unset by default (e.g. `justify`), in which case an absent value
 * emits nothing at all.
 *
 * @returns CSS text ready to interpolate into a styled() template (`''` when
 *          there is nothing to emit).
 */
export function responsive<T>(
  value: Responsive<T> | undefined,
  theme: Theme,
  decl: (v: T) => string,
  fallback?: T,
): string {
  if (value === undefined || value === null) {
    return fallback !== undefined ? decl(fallback) : '';
  }
  if (!isBreakpointMap(value)) return decl(value);

  let out = '';
  let baseEmitted = false;
  for (const bp of BP_ORDER) {
    const v = value[bp];
    if (v === undefined) continue;
    const min = theme.breakpoints[bp];
    if (min > 0) {
      // A map that skips the base (no xs) still needs the fallback below the
      // smallest specified breakpoint, so the property isn't left to the UA
      // default (e.g. a Stack would fall back to flex's row, not column).
      if (!baseEmitted && fallback !== undefined) out += decl(fallback);
      baseEmitted = true;
      out += `@media (min-width:${min}px){${decl(v)}}`;
    } else {
      out += decl(v); // xs / min-width 0 → base, unwrapped
      baseEmitted = true;
    }
  }
  return out;
}

export default responsive;
