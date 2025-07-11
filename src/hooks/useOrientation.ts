// ─────────────────────────────────────────────────────────────
// src/hooks/useOrientation.ts  | valet
// orientation hook for responsive components
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

export type Orientation = 'portrait' | 'landscape';

const query = '(orientation: portrait)';

function getOrientation(): Orientation {
  if (typeof window === 'undefined') return 'landscape';
  return window.matchMedia(query).matches ? 'portrait' : 'landscape';
}

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(getOrientation);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setOrientation(mql.matches ? 'portrait' : 'landscape');
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return orientation;
}
