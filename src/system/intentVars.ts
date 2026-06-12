// ─────────────────────────────────────────────────────────────
// src/system/intentVars.ts | valet
// Shared intent CSS-variable contract (API-TYPES S13).
//
// One `computeIntentVars`/`makeMix` helper replaces the ~152-line
// verbatim duplication across Button/IconButton and AppBar's broken
// hex-concat hover math (`base + 'F0'`, which produces invalid CSS for
// rgb()/hsl()/named theme colours). The colour blend delegates to the
// proper colour maths in `../helpers/color` (mix/toHex); `makeMix` first
// parses hex, rgb()/rgba(), hsl()/hsla() and a minimal CSS named set into
// RGB so every input format yields a valid `#rrggbb` result.
// ─────────────────────────────────────────────────────────────
import { toRgb, mix, toHex, type RGB } from '../helpers/color';

/** The seven `--valet-intent-*` custom properties every intent-driven
 *  component writes onto its root element's inline style. */
export interface IntentVars {
  '--valet-intent-bg': string;
  '--valet-intent-fg': string;
  '--valet-intent-border': string;
  '--valet-intent-focus': string;
  '--valet-intent-bg-hover': string;
  '--valet-intent-bg-active': string;
  '--valet-intent-fg-disabled': string;
}

/*───────────────────────────────────────────────────────────*/
/* Robust colour parsing                                      */

/** Minimal CSS named-colour set used by the intent palette. Theme tokens
 *  are hex today, but callers may pass `color='red'` or `'transparent'`;
 *  unknown names fall through to the hex parser (→ defensive black). */
const NAMED: Record<string, string> = {
  transparent: '#000000',
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
};

const clamp255 = (n: number): number => (n < 0 ? 0 : n > 255 ? 255 : Math.round(n));

/** hsl → rgb (h in degrees, s/l in 0..1). */
function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return { r: clamp255((r + m) * 255), g: clamp255((g + m) * 255), b: clamp255((b + m) * 255) };
}

/**
 * Parse any common CSS colour string into RGB. Handles hex (#rgb/#rrggbb,
 * with or without an alpha pair), rgb()/rgba(), hsl()/hsla() and a minimal
 * named set; alpha channels are dropped (intent vars carry opaque colours).
 * Unknown formats fall back to the hex parser's defensive black, exactly as
 * the original per-component `makeMix` did — never invalid CSS.
 */
export function parseColor(input: string): RGB {
  const c = input.trim();
  const lower = c.toLowerCase();

  if (lower in NAMED) return toRgb(NAMED[lower]!);

  if (c.startsWith('#')) {
    // Strip an 8-digit (#rrggbbaa) or 4-digit (#rgba) alpha pair so the
    // hex parser sees an opaque 6/3-digit value.
    const hex = c.slice(1);
    if (hex.length === 8) return toRgb('#' + hex.slice(0, 6));
    if (hex.length === 4) return toRgb('#' + hex.slice(0, 3));
    return toRgb(c);
  }

  const rgbMatch = lower.match(/^rgba?\(([^)]+)\)$/);
  if (rgbMatch) {
    const parts = rgbMatch[1]!.split(/[,/]/).map((p) => p.trim());
    const channel = (raw: string): number => {
      if (raw.endsWith('%')) return clamp255((parseFloat(raw) / 100) * 255);
      return clamp255(parseFloat(raw));
    };
    return { r: channel(parts[0]!), g: channel(parts[1]!), b: channel(parts[2]!) };
  }

  const hslMatch = lower.match(/^hsla?\(([^)]+)\)$/);
  if (hslMatch) {
    const parts = hslMatch[1]!.split(/[,/]/).map((p) => p.trim());
    const h = parseFloat(parts[0]!);
    const s = parseFloat(parts[1]!) / 100;
    const l = parseFloat(parts[2]!) / 100;
    return hslToRgb(h, s, l);
  }

  // Unknown format — defensive black (matches legacy toRgb fallback).
  return toRgb(c);
}

/**
 * Blend two colours by weight (0 → all `a`, 1 → all `b`) and return an
 * opaque `#rrggbb` string. Accepts any colour format `parseColor` understands,
 * so it is safe on theme tokens, explicit `rgb()`/`hsl()` overrides and named
 * colours alike — this is the fix for AppBar's `base + 'F0'` hex concat.
 */
export function makeMix(a: string, b: string, weight: number): string {
  return toHex(mix(parseColor(a), parseColor(b), weight));
}

/*───────────────────────────────────────────────────────────*/
/* Intent variable contract                                   */

export interface IntentVarOptions {
  /** Resolved background / accent colour for this intent. */
  bg: string;
  /** Resolved foreground (text/icon) colour for this intent. */
  fg: string;
  /** Focus-ring colour (typically the theme primary). */
  focus: string;
  /** Background colour disabled foreground mixes toward (typically theme background). */
  disabledMixColor: string;
  /** Visual variant; `filled` gets coloured hover/active, others go transparent. */
  variant: 'filled' | 'outlined' | 'plain' | (string & {});
  /**
   * Explicit border colour override. When omitted, the border is `bg` for
   * outlined variants and `borderMixColor`-derived otherwise (see below).
   */
  border?: string;
  /**
   * For non-outlined variants, the colour the border mixes `bg` toward
   * (Button blends `bg` toward `text` at 0.25; IconButton/Chip use `bg`
   * directly by leaving this undefined).
   */
  borderMixColor?: string;
  /** Weight for the non-outlined border mix when `borderMixColor` is set. */
  borderMixWeight?: number;
  /** Hover blend weight (filled only). Defaults to 0.15. */
  hoverWeight?: number;
  /** Active blend weight (filled only). Defaults to 0.25. */
  activeWeight?: number;
  /** Disabled-foreground blend weight. Defaults to 0.5. */
  disabledWeight?: number;
}

/**
 * Compute the seven `--valet-intent-*` custom properties from resolved
 * colours and a variant. Filled variants get hover/active backgrounds blended
 * toward `fg`; outlined/plain go transparent. The result is a plain object
 * ready to spread into an element's inline `style`.
 */
export function computeIntentVars(opts: IntentVarOptions): IntentVars {
  const {
    bg,
    fg,
    focus,
    disabledMixColor,
    variant,
    border,
    borderMixColor,
    borderMixWeight = 0.25,
    hoverWeight = 0.15,
    activeWeight = 0.25,
    disabledWeight = 0.5,
  } = opts;

  const filled = variant === 'filled';

  const intentBorder =
    border ??
    (variant === 'outlined'
      ? bg
      : borderMixColor !== undefined
        ? makeMix(bg, borderMixColor, borderMixWeight)
        : bg);

  return {
    '--valet-intent-bg': bg,
    '--valet-intent-fg': fg,
    '--valet-intent-border': intentBorder,
    '--valet-intent-focus': focus,
    '--valet-intent-bg-hover': filled ? makeMix(bg, fg, hoverWeight) : 'transparent',
    '--valet-intent-bg-active': filled ? makeMix(bg, fg, activeWeight) : 'transparent',
    '--valet-intent-fg-disabled': makeMix(fg, disabledMixColor, disabledWeight),
  };
}
