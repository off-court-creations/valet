// ─────────────────────────────────────────────────────────────
// src/hooks/useOrientation.ts  | valet
// cross-browser orientation detection without surface polling
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'

export function useOrientation() {
  const get = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(orientation: portrait)').matches

  const [portrait, setPortrait] = useState(get())

  useEffect(() => {
    const mql = window.matchMedia('(orientation: portrait)')
    const handler = (e: MediaQueryListEvent) => setPortrait(e.matches)
    mql.addEventListener('change', handler)
    setPortrait(mql.matches)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return { portrait, landscape: !portrait }
}
