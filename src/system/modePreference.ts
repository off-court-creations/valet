// ─────────────────────────────────────────────────────────────
// src/system/modePreference.ts | valet
// THEMING S8 — initial color-mode preference. Pure precedence
// resolution (stored > requested > system > fallback) plus
// guarded matchMedia/localStorage wrappers that are SSR-safe and
// throw-safe in sandboxed iframes. Boot default stays 'dark'
// (veto register); system-follow and persistence are strictly
// opt-in via useInitialTheme options.
// ─────────────────────────────────────────────────────────────
import type { ThemeMode } from './themeStore';

/** localStorage key for the persisted user mode choice. */
export const MODE_STORAGE_KEY = 'valet-mode';

/** Which input won the precedence resolution. */
export type ModeSource = 'stored' | 'requested' | 'system' | 'fallback';

export interface ResolveInitialModeInputs {
  /** Persisted user choice (see readStoredMode) */
  stored?: ThemeMode | null;
  /** Explicit mode requested by the caller ('system' resolves to null here) */
  requested?: ThemeMode | null;
  /** Detected OS preference (see getSystemMode) */
  system?: ThemeMode | null;
  /** Last resort; valet's boot default is 'dark' */
  fallback?: ThemeMode;
}

const isMode = (v: unknown): v is ThemeMode => v === 'light' || v === 'dark';

/**
 * Pure precedence: stored > requested > system > fallback.
 * Inputs that are not exactly 'light'/'dark' (null, undefined, garbage
 * read back from storage) are treated as absent.
 */
export function resolveInitialMode(inputs: ResolveInitialModeInputs = {}): {
  mode: ThemeMode;
  source: ModeSource;
} {
  const { stored, requested, system, fallback } = inputs;
  if (isMode(stored)) return { mode: stored, source: 'stored' };
  if (isMode(requested)) return { mode: requested, source: 'requested' };
  if (isMode(system)) return { mode: system, source: 'system' };
  return { mode: isMode(fallback) ? fallback : 'dark', source: 'fallback' };
}

/**
 * One-shot prefers-color-scheme read. Returns null when there is no DOM,
 * no matchMedia, no expressed preference, or when the call throws
 * (sandboxed iframes / exotic embedders).
 *
 * NOTE: live system-follow (a `change` listener on the MediaQueryList) is
 * deliberately deferred — this is a boot-time read only.
 */
export function getSystemMode(): ThemeMode | null {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
    return null;
  } catch {
    return null;
  }
}

/**
 * Guarded localStorage read. Returns null on SSR, when storage access
 * throws (sandboxed iframes raise SecurityError on the property read),
 * or when the stored value is not a valid mode.
 */
export function readStoredMode(): ThemeMode | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const v = window.localStorage.getItem(MODE_STORAGE_KEY);
    return isMode(v) ? v : null;
  } catch {
    return null;
  }
}

/** Guarded localStorage write — persisting is best-effort, never throws. */
export function writeStoredMode(mode: ThemeMode): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* sandboxed iframe / quota / privacy mode — best-effort only */
  }
}
