// ─────────────────────────────────────────────────────────────
// src/helpers/fontLoader.ts | valet
// shared utilities for injecting and loading Google Fonts
// ─────────────────────────────────────────────────────────────
export interface GoogleFontOptions {
  preload?: boolean;
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
