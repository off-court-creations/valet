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
  children: Map<string, ChildMetrics>
  registerChild: (
    id: string,
    node: HTMLElement,
    cb?: (metrics: ChildMetrics) => void,
  ) => void
  unregisterChild: (id: string) => void
}

export const createSurfaceStore = () =>
  create<SurfaceState>((set, get) => {
    const nodes = new Map<HTMLElement, { id: string; cb?: (m: ChildMetrics) => void }>()

    const ro = new ResizeObserver((entries) => {
      const surfEl = get().element
      const sRect = surfEl ? surfEl.getBoundingClientRect() : { top: 0, left: 0 }
      const scrollTop = surfEl ? surfEl.scrollTop : 0
      const scrollLeft = surfEl ? surfEl.scrollLeft : 0

      for (const entry of entries) {
        const meta = nodes.get(entry.target as HTMLElement)
        if (!meta) continue
        const rect = (entry.target as HTMLElement).getBoundingClientRect()
        const metrics = {
          width: rect.width,
          height: Math.round(rect.height),
          top: rect.top - sRect.top + scrollTop,
          left: rect.left - sRect.left + scrollLeft,
        }
        set((s) => {
          const next = new Map(s.children)
          next.set(meta.id, metrics)
          return { children: next }
        })
        meta.cb?.(metrics)
      }
    })

    return {
      width: 0,
      height: 0,
      breakpoint: 'xs',
      hasScrollbar: false,
      element: null,
      children: new Map(),
      registerChild: (id, node, cb) => {
        nodes.set(node, { id, cb })
        ro.observe(node)
        const surfEl = get().element
        const sRect = surfEl ? surfEl.getBoundingClientRect() : { top: 0, left: 0 }
        const scrollTop = surfEl ? surfEl.scrollTop : 0
        const scrollLeft = surfEl ? surfEl.scrollLeft : 0
        const rect = node.getBoundingClientRect()
        const metrics = {
          width: rect.width,
          height: Math.round(rect.height),
          top: rect.top - sRect.top + scrollTop,
          left: rect.left - sRect.left + scrollLeft,
        }
        set((s) => {
          const next = new Map(s.children)
          next.set(id, metrics)
          return { children: next }
        })
        cb?.(metrics)
      },
      unregisterChild: (id) => {
        for (const [el, meta] of nodes) {
          if (meta.id === id) {
            ro.unobserve(el)
            nodes.delete(el)
            break
          }
        }
        set((s) => {
          const next = new Map(s.children)
          next.delete(id)
          return { children: next }
        })
      },
    }
  })

export type SurfaceStore = ReturnType<typeof createSurfaceStore>

export const SurfaceCtx = React.createContext<SurfaceStore | null>(null)

export const useSurface = () => {
  const store = React.useContext(SurfaceCtx)
  if (!store)
    throw new Error('useSurface must be used within a <Surface> component')
  return store()
}
