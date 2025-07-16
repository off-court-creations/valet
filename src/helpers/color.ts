// ─────────────────────────────────────────────────────────────
// src/helpers/color.ts
// High-performance colour utilities (memoised).
//   • toRgb   – Hex → RGB
//   • mix     – Blend two RGB colours
//   • toHex   – RGB → Hex
//   • stripe  – 90 % bg + 10 % text zebra-stripe helper
// ─────────────────────────────────────────────────────────────
export type RGB = { r: number; g: number; b: number };

/*──────────── Hex → RGB (memoised) ────────────*/
const rgbCache = new Map<string, RGB>();

export function toRgb(hex: string): RGB {
  if (rgbCache.has(hex)) return rgbCache.get(hex)!;

  let s = hex.startsWith('#') ? hex.slice(1) : hex;
  if (s.length === 3) s = s.replace(/./g, ch => ch + ch); // #abc → aabbcc

  let rgb: RGB;
  if (s.length === 6 && !/[^a-f\d]/i.test(s)) {
    const n = parseInt(s, 16);
    rgb = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  } else {
    rgb = { r: 0, g: 0, b: 0 }; // defensive fallback
  }

  rgbCache.set(hex, rgb);
  return rgb;
}

/*──────────── Blend two RGB colours ────────────*/
export function mix(a: RGB, b: RGB, weight: number): RGB {
  const t = weight <= 0 ? 0 : weight >= 1 ? 1 : weight;
  return {
    r: ((a.r * (1 - t) + b.r * t) + 0.5) | 0,
    g: ((a.g * (1 - t) + b.g * t) + 0.5) | 0,
    b: ((a.b * (1 - t) + b.b * t) + 0.5) | 0,
  };
}

/*──────────── RGB → Hex ────────────*/
export function toHex({ r, g, b }: RGB): string {
  return '#' + (((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1));
}

/*──────────── Hex → RGBA string ────────────*/
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = toRgb(hex);
  const a = alpha <= 0 ? 0 : alpha >= 1 ? 1 : alpha;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/*──────────── Cached zebra-stripe colour ────────────*/
const stripeCache = new Map<string, string>();

export function stripe(bgHex: string, textHex: string): string {
  const key = `${bgHex}|${textHex}`;
  if (stripeCache.has(key)) return stripeCache.get(key)!;

  const result = toHex(mix(toRgb(bgHex), toRgb(textHex), 0.1));
  stripeCache.set(key, result);
  return result;
}
