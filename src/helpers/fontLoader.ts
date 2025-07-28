// ─────────────────────────────────────────────────────────────
// src/helpers/fontLoader.ts | valet
// shared utilities for injecting and loading Google Fonts
// ─────────────────────────────────────────────────────────────
export interface LocalFont {
  /** Font-family name exposed to CSS */
  name: string;
  /** URL to the font file */
  src: string;
  /** Font format hint – defaults based on extension */
  format?: string;
  /** Preload link tag */
  preload?: boolean;
}

export interface GoogleFontOptions {
  preload?: boolean;
  /** Local fonts to register alongside Google fonts */
  local?: LocalFont[];
}

const loadedFonts = new Set<string>();

export function injectGoogleFontLinks(fonts: string[], options: GoogleFontOptions = {}): () => void {
  const { preload = true } = options;
  if (!document.getElementById('valet-fonts-preconnect')) {
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

  const added: HTMLLinkElement[] = [];
  fonts.forEach((font) => {
    if (!font || loadedFonts.has(font)) return;
    const formatted = font.replace(/ /g, '+');
    const href = `https://fonts.googleapis.com/css2?family=${formatted}:wght@400;700&display=swap`;

    if (preload) {
      const preloadLink = document.createElement('link');
      preloadLink.rel = 'preload';
      preloadLink.as = 'style';
      preloadLink.href = href;
      preloadLink.crossOrigin = 'anonymous';
      document.head.appendChild(preloadLink);
      added.push(preloadLink);
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    added.push(link);
    loadedFonts.add(font);
  });

  return () => {
    added.forEach((el) => document.head.removeChild(el));
    fonts.forEach((f) => loadedFonts.delete(f));
  };
}

export async function waitForGoogleFonts(fonts: string[]): Promise<void> {
  await Promise.all(fonts.map((f) => document.fonts.load(`400 1em ${f}`)));
  if ((document as any).fonts?.ready) {
    await (document as any).fonts.ready;
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 200));
}

export function injectLocalFontFaces(fonts: LocalFont[]): () => void {
  if (!fonts.length) return () => {};
  const style = document.createElement('style');
  style.dataset['valetLocalFonts'] = 'true';
  const addedLinks: HTMLLinkElement[] = [];
  style.textContent = fonts
    .map((f) => {
      const fmt = f.format || f.src.split('.').pop() || 'woff2';
      if (f.preload) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.href = f.src;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
        addedLinks.push(link);
      }
      return `@font-face{font-family:'${f.name}';src:url('${f.src}') format('${fmt}');font-display:swap;}`;
    })
    .join('');
  document.head.appendChild(style);
  return () => {
    document.head.removeChild(style);
    addedLinks.forEach((l) => document.head.removeChild(l));
  };
}

export async function waitForLocalFonts(fonts: LocalFont[]): Promise<void> {
  await Promise.all(fonts.map((f) => document.fonts.load(`400 1em ${f.name}`)));
  if ((document as any).fonts?.ready) {
    await (document as any).fonts.ready;
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 50));
}
