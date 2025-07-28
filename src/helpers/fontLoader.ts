// ─────────────────────────────────────────────────────────────
// src/helpers/fontLoader.ts | valet
// shared utilities for injecting Google and custom fonts
// ─────────────────────────────────────────────────────────────
export interface GoogleFontOptions {
  preload?: boolean;
}

export interface CustomFont {
  name: string;
  src: string;
}

export type Font = string | CustomFont;

const loadedFonts = new Set<string>();
const customFaces = new Map<string, FontFace>();

export function injectFontLinks(fonts: Font[], options: GoogleFontOptions = {}): () => void {
  const { preload = true } = options;
  const added: HTMLLinkElement[] = [];

  const googleFonts = fonts.filter((f): f is string => typeof f === 'string');
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
    if (typeof font === 'string') {
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
      (document as any).fonts.add(face);
      face.load().catch(() => {});
      customFaces.set(font.name, face);
      loadedFonts.add(font.name);
    }
  });

  return () => {
    added.forEach((el) => document.head.removeChild(el));
    fonts.forEach((f) => loadedFonts.delete(typeof f === 'string' ? f : f.name));
  };
}

export async function waitForFonts(fonts: Font[]): Promise<void> {
  await Promise.all(
    fonts.map((font) => {
      if (typeof font === 'string') {
        return document.fonts.load(`400 1em ${font}`);
      }
      const face =
        customFaces.get(font.name) ||
        new FontFace(font.name, `url(${font.src})`);
      if (!customFaces.has(font.name)) {
        customFaces.set(font.name, face);
        (document as any).fonts.add(face);
      }
      return face.load();
    })
  );
  if ((document as any).fonts?.ready) {
    await (document as any).fonts.ready;
  }
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 200));
}

export {
  injectFontLinks as injectGoogleFontLinks,
  waitForFonts as waitForGoogleFonts,
};
