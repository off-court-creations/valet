// src/hooks/useGoogleFonts.ts
import { useEffect } from 'react';

const loadedFonts = new Set();

export function useGoogleFonts(fonts: string[]) {
  useEffect(() => {
    fonts.forEach(fontName => {
      if (!fontName || loadedFonts.has(fontName)) return;

      const formattedName = fontName.replace(/ /g, '+');
      const href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;

      document.head.appendChild(link);
      loadedFonts.add(fontName);
    });

    return () => {
      fonts.forEach(fontName => {
        const formattedName = fontName.replace(/ /g, '+');
        const href = `https://fonts.googleapis.com/css2?family=${formattedName}:wght@400;700&display=swap`;
        const existingLink = document.head.querySelector(`link[href="${href}"]`);
        if (existingLink) {
          document.head.removeChild(existingLink);
          loadedFonts.delete(fontName);
        }
      });
    };
  }, [fonts.join(',')]);
}
