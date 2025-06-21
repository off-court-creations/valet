// ─────────────────────────────────────────────────────────────
// src/system/surfaceStore.ts | valet
// per-surface Zustand store tracking size & children
// ─────────────────────────────────────────────────────────────
import React from 'react'
import { create } from 'zustand'
import type { Breakpoint } from './themeStore'

export interface ChildMetrics {
  width: number
  height: number
  top: number
  left: number
}

export interface SurfaceState {
  width: number
  height: number
  breakpoint: Breakpoint
  hasScrollbar: boolean
  element: HTMLDivElement | null
  children: Record<string, ChildMetrics>
  registerChild: (id: string, rect: ChildMetrics) => void
  updateChild: (id: string, rect: ChildMetrics) => void
  unregisterChild: (id: string) => void
}

export const createSurfaceStore = () =>
  create<SurfaceState>((set) => ({
    width: 0,
    height: 0,
    breakpoint: 'xs',
    hasScrollbar: false,
    element: null,
    children: {},
    registerChild: (id, rect) =>
      set((s) => ({ children: { ...s.children, [id]: rect } })),
    updateChild: (id, rect) =>
      set((s) => ({ children: { ...s.children, [id]: rect } })),
    unregisterChild: (id) =>
      set((s) => {
        const next = { ...s.children }
        delete next[id]
        return { children: next }
      }),
  }))

export type SurfaceStore = ReturnType<typeof createSurfaceStore>

export const SurfaceCtx = React.createContext<SurfaceStore | null>(null)

export const useSurface = () => {
  const store = React.useContext(SurfaceCtx)
  if (!store)
    throw new Error('useSurface must be used within a <Surface> component')
  return store()
}
