// ─────────────────────────────────────────────────────────────
// src/hooks/useGoogleFonts.ts  | valet
// hook for dynamically loading Google Fonts once
// ─────────────────────────────────────────────────────────────
import { useInsertionEffect, useEffect } from 'react';
import { useFonts } from '../system/fontStore';

const loadedFonts = new Set();

export function useGoogleFonts(fonts: string[]) {
  const setReady = useFonts((s) => s.setReady);
  useInsertionEffect(() => {
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
    fonts.forEach(fontName => {
      if (!fontName || loadedFonts.has(fontName)) return;

      const formattedName = fontName.replace(/ /g, '+');
      const href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;

      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'style';
      preload.href = href;
      preload.crossOrigin = 'anonymous';
      document.head.appendChild(preload);
      added.push(preload);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      document.head.appendChild(link);
      added.push(link);
      loadedFonts.add(fontName);
    });

    return () => {
      added.forEach(link => {
        document.head.removeChild(link);
      });
      fonts.forEach(fontName => loadedFonts.delete(fontName));
    };
  }, [fonts.join(',')]);

  useEffect(() => {
    setReady(false);
    Promise.all(fonts.map((f) => document.fonts.load(`400 1em ${f}`)))
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [fonts.join(','), setReady]);
}
