// ─────────────────────────────────────────────────────────────
// src/utilities/colors.ts | valet
// theme colour helpers
// ─────────────────────────────────────────────────────────────

export interface RGB { r:number; g:number; b:number }

const rgbCache = new Map<string, RGB>();
export const toRgb = (hex:string):RGB => {
  if (rgbCache.has(hex)) return rgbCache.get(hex)!;
  let s = hex.charAt(0)==='#' ? hex.slice(1) : hex;
  if (s.length===3) s = s.replace(/./g,ch=>ch+ch);

  let rgb:RGB;
  if (s.length===6 && !/[^a-f\d]/i.test(s)) {
    const n = parseInt(s,16);
    rgb = { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  } else {
    rgb = { r:0, g:0, b:0 };
  }
  rgbCache.set(hex,rgb);
  return rgb;
};

export const mix = (a:RGB, b:RGB, w:number):RGB => {
  const t = w<=0 ? 0 : w>=1 ? 1 : w;
  return {
    r: ((a.r*(1-t)+b.r*t)+0.5)|0,
    g: ((a.g*(1-t)+b.g*t)+0.5)|0,
    b: ((a.b*(1-t)+b.b*t)+0.5)|0,
  };
};

export const toHex = ({r,g,b}:RGB):string => '#'+(((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1));

const stripeCache = new Map<string,string>();
export const stripe = (bg:string, txt:string):string => {
  const key = bg+'|'+txt;
  if (stripeCache.has(key)) return stripeCache.get(key)!;
  const val = toHex(mix(toRgb(bg),toRgb(txt),0.1));
  stripeCache.set(key,val);
  return val;
};

export const hoverColor = (
  bg: string,
  accent: string,
  striped: boolean,
  text: string,
): string => {
  const base = striped ? stripe(bg, text) : bg;
  const ratio = striped ? 0.15 : 0.35;
  return toHex(mix(toRgb(base), toRgb(accent), ratio));
};
