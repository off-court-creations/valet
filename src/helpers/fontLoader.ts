// ─────────────────────────────────────────────────────────────
// src/helpers/fontLoader.ts | valet
// shared utilities for injecting Google and custom fonts (v2)
// - Google Fonts v2 URL builder with axes (wght/ital/opsz)
// - Normalized request keys, in-flight coalescing, refcount cleanup
// - Backward compatible with simple string family names
// ─────────────────────────────────────────────────────────────

export interface GoogleFontOptions {
  /** Preload CSS (google) or font file (custom) */
  preload?: boolean;
  /** Google Fonts CSS display strategy */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  /** Restrict glyphs to speed up delivery */
  text?: string;
}

export interface CustomFont {
  name: string;
  src: string;
  /** Optional metrics hinting for future CLS control */
  metrics?: Partial<{
    ascent: number;
    descent: number;
    lineGap: number;
    sizeAdjust: number;
  }>;
}

export type GoogleAxes = {
  /** Font weights as discrete list or min/max range */
  wght?: number[] | { min: number; max: number };
  /** Include italic axis; if true, request both 0 and 1 forms */
  ital?: boolean;
  /** Optical size range or fixed value when supported by the family */
  opsz?: [number, number] | number;
};

export type GoogleFontRequest =
  | string // shorthand family name
  | {
      family: string;
      provider?: 'google';
      axes?: GoogleAxes;
      subsets?: string[];
      display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
      text?: string;
      preload?: boolean;
    };

export type Font = GoogleFontRequest | CustomFont;

const loadedFonts = new Set<string>(); // keys: family name (legacy) or request key
const customFaces = new Map<string, FontFace>();
const activeLinks = new Map<string, { links: HTMLLinkElement[]; count: number }>();
const inflight = new Map<string, Promise<unknown>>();

// If your lib.dom typings don't include FontFaceSet.add/delete, add a global
// augmentation in src/types/fontface.d.ts as suggested earlier.

function sanitizeFamily(f: string) {
  return f.trim();
}

function plusify(f: string) {
  return f.replace(/ /g, '+');
}

function dedupeSorted(nums: number[]): number[] {
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function buildAxesPart(axes?: GoogleAxes): { axisList: string[]; matrixRows: string[] } {
  if (!axes) return { axisList: [], matrixRows: [] };
  const axisList: string[] = [];
  const rows: string[] = [];

  const weights = axes.wght;
  const ital = axes.ital ?? false;
  const opsz = axes.opsz;

  const wghtPart = (() => {
    if (!weights) return '';
    if (Array.isArray(weights)) return dedupeSorted(weights).join(';');
    return `${weights.min}..${weights.max}`;
  })();

  const opszPart = (() => {
    if (opsz == null) return '';
    if (Array.isArray(opsz)) {
      const [min, max] = opsz;
      return `${min}..${max}`;
    }
    return String(opsz);
  })();

  if (ital) {
    // matrix ordering must match axisList order
    const axesInOrder: string[] = ['ital'];
    if (opszPart) axesInOrder.push('opsz');
    if (wghtPart) axesInOrder.push('wght');

    axisList.push(...axesInOrder);
    const rowCore = [opszPart, wghtPart].filter(Boolean).join(',');
    // request both non-italic (0, …) and italic (1, …)
    rows.push(['0', rowCore].filter(Boolean).join(','));
    rows.push(['1', rowCore].filter(Boolean).join(','));
  } else {
    const axesInOrder: string[] = [];
    if (opszPart) axesInOrder.push('opsz');
    if (wghtPart) axesInOrder.push('wght');
    if (axesInOrder.length) axisList.push(...axesInOrder);
    if (axesInOrder.length) rows.push([opszPart, wghtPart].filter(Boolean).join(','));
  }

  return { axisList, matrixRows: rows };
}

function buildGoogleHref(
  req: Exclude<GoogleFontRequest, string>,
  global: GoogleFontOptions,
): { href: string; key: string } {
  const familyRaw = sanitizeFamily(req.family);
  const family = plusify(familyRaw);
  const { axisList, matrixRows } = buildAxesPart(req.axes);
  const parts: string[] = [];
  const axis = axisList.length ? `:${axisList.join(',')}` : '';
  const matrix = matrixRows.length ? `@${matrixRows.join(';')}` : '';
  parts.push(`family=${family}${axis}${matrix}`);
  const disp = req.display ?? global.display ?? 'swap';
  if (disp) parts.push(`display=${encodeURIComponent(disp)}`);
  if (req.text) parts.push(`text=${encodeURIComponent(req.text)}`);
  if (req.subsets && req.subsets.length)
    parts.push(`subset=${encodeURIComponent(req.subsets.sort().join(','))}`);
  const query = parts.join('&');
  const href = `https://fonts.googleapis.com/css2?${query}`;
  // Normalize key for de-dupe: lowercase family, sorted subsets, axis/matrix string
  const key = query.toLowerCase();
  return { href, key };
}

function toGoogleRequest(
  f: GoogleFontRequest,
  global: GoogleFontOptions,
): { href: string; key: string; preload: boolean } | null {
  if (typeof f === 'string') {
    const fam = sanitizeFamily(f);
    if (!fam) return null;
    const href = `https://fonts.googleapis.com/css2?family=${plusify(fam)}:wght@400;700&display=${global.display ?? 'swap'}`;
    const key = `family=${fam.toLowerCase()}&w=400;700&d=${global.display ?? 'swap'}`;
    return { href, key, preload: true };
  }
  const { href, key } = buildGoogleHref(f, global);
  return { href, key, preload: f.preload ?? true };
}

export function injectFontLinks(fonts: Font[], options: GoogleFontOptions = {}): () => void {
  const { preload = true } = options;
  const added: HTMLLinkElement[] = [];

  const isGoogleReq = (v: unknown): v is { family: string } => {
    if (!v || typeof v !== 'object') return false;
    const rec = v as Record<string, unknown>;
    return 'family' in rec && typeof rec.family === 'string';
  };
  const googleFonts = fonts.filter(
    (f): f is GoogleFontRequest => typeof f === 'string' || isGoogleReq(f),
  );
  if (googleFonts.length && !document.getElementById('valet-fonts-preconnect')) {
    const preconnect1 = document.createElement('link');
    preconnect1.id = 'valet-fonts-preconnect';
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.id = 'valet-fonts-preconnect-gstatic';
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);
  }

  fonts.forEach((font) => {
    if (typeof font === 'string' || (typeof font === 'object' && 'family' in font)) {
      const g = toGoogleRequest(font as GoogleFontRequest, options);
      if (!g) return;
      const { href, key, preload: reqPreload } = g;
      const existing = activeLinks.get(key);
      if (existing) {
        existing.count += 1;
        loadedFonts.add(key);
        return;
      }
      // Preload CSS if requested
      if (preload && reqPreload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'style';
        preloadLink.href = href;
        preloadLink.crossOrigin = 'anonymous';
        document.head.appendChild(preloadLink);
        added.push(preloadLink);
      }

      const keyLinks: HTMLLinkElement[] = [];
      if (preload && reqPreload) {
        // find the last added preload (just appended) and associate to key
        const last = added[added.length - 1];
        if (last && last.rel === 'preload' && last.as === 'style' && last.href === href)
          keyLinks.push(last);
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      added.push(link);

      keyLinks.push(link);
      activeLinks.set(key, { links: keyLinks, count: 1 });
      loadedFonts.add(key);
    } else {
      if (!font.name || loadedFonts.has(font.name)) return;

      if (preload) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'font';
        preloadLink.href = font.src;
        preloadLink.crossOrigin = 'anonymous';
        document.head.appendChild(preloadLink);
        added.push(preloadLink);
      }

      const face = new FontFace(font.name, `url(${font.src})`);
      document.fonts.add(face);
      // Ignore failures (network/unsupported) without empty-catch
      void face.load().catch(() => void 0);

      customFaces.set(font.name, face);
      loadedFonts.add(font.name);
    }
  });

  return () => {
    // Decrement refcounts and remove only when last consumer unmounts
    fonts.forEach((f) => {
      if (typeof f === 'string' || (typeof f === 'object' && 'family' in f)) {
        const { key } = toGoogleRequest(f as GoogleFontRequest, options) ?? { key: '' };
        if (!key) return;
        const rec = activeLinks.get(key);
        if (!rec) return;
        rec.count -= 1;
        if (rec.count <= 0) {
          rec.links.forEach((el) => {
            if (el.parentNode) el.parentNode.removeChild(el);
          });
          activeLinks.delete(key);
          loadedFonts.delete(key);
        }
      } else {
        loadedFonts.delete(f.name);
        customFaces.delete(f.name);
      }
    });
  };
}

function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

export async function waitForFonts(fonts: Font[]): Promise<void> {
  // Create or reuse in-flight promises per normalized request key
  const promises = fonts.map((font) => {
    if (typeof font === 'string') {
      const fam = sanitizeFamily(font);
      const key = `fam:${fam.toLowerCase()}`;
      if (!inflight.has(key)) inflight.set(key, document.fonts.load(`400 1em ${fam}`));
      return inflight.get(key)!;
    }
    if ('family' in font) {
      const g = toGoogleRequest(font, {});
      if (!g) return Promise.resolve();
      const key = `gcss:${g.key}`;
      if (!inflight.has(key)) inflight.set(key, document.fonts.ready);
      return inflight.get(key)!;
    }
    const existing = customFaces.get(font.name);
    const face = existing ?? new FontFace(font.name, `url(${font.src})`);
    if (!existing) {
      customFaces.set(font.name, face);
      document.fonts.add(face);
    }
    const key = `face:${font.name}`;
    if (!inflight.has(key)) inflight.set(key, face.load());
    return inflight.get(key)!;
  });

  await Promise.all(promises);

  await document.fonts.ready;

  // Let layout/paint settle before returning (two frames)
  await nextFrame();
  await nextFrame();

  // Small safety delay for late layout
  await new Promise<void>((r) => setTimeout(r, 200));
}

export { injectFontLinks as injectGoogleFontLinks, waitForFonts as waitForGoogleFonts };
