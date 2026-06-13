// ─────────────────────────────────────────────────────────────
// src/hooks/usePrefersReducedMotion.ts | valet
// A11Y S5 — prefers-reduced-motion guards.
//
// House mechanism for motion that lives in *inline JS style* (where a
// `@media (prefers-reduced-motion: reduce)` block in the styled CSS
// cannot reach): a guarded JS branch reading the live media query.
//
// Single source of truth so every JS-side guard degrades identically:
//   • SSR / non-DOM: returns `false` (motion-allowed) — the server can't
//     know the user's preference, and the engine renders deterministic
//     markup either way. The client re-resolves on mount/subscription.
//   • Browser: reads `matchMedia('(prefers-reduced-motion: reduce)')` and
//     re-renders when the OS preference flips mid-session.
//
// Internal — not exported from the package barrel (R6: index.ts is the
// API-TYPES registrar; this is engine-internal plumbing).
// ─────────────────────────────────────────────────────────────
import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** True only when we can actually observe the preference and it is "reduce". */
function readPreference(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(QUERY).matches;
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mql = window.matchMedia(QUERY);
  // Safari <14 only has the deprecated addListener/removeListener pair.
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

/**
 * Reactively report whether the user has requested reduced motion.
 *
 * Use this only to gate motion that is expressed in *inline JS style*
 * (e.g. `style={{ animation: … }}` on an SVG, or a scroll-driven
 * transform). Motion expressed in a styled() template should instead
 * carry a `@media (prefers-reduced-motion: reduce)` block — that needs
 * no JS and survives SSR untouched.
 *
 * @returns `true` when the OS/browser reports `prefers-reduced-motion:
 * reduce`; `false` otherwise (including SSR and environments without
 * `matchMedia`, where motion stays enabled).
 */
export function usePrefersReducedMotion(): boolean {
  // getServerSnapshot mirrors the client's non-DOM resolution so SSR and
  // the first client render agree (no hydration mismatch).
  return useSyncExternalStore(subscribe, readPreference, () => false);
}
