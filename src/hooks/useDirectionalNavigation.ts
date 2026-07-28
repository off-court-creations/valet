// ─────────────────────────────────────────────────────────────
// src/hooks/useDirectionalNavigation.ts  | valet
// StrictMode-safe React facade for directional DOM-focus navigation
// ─────────────────────────────────────────────────────────────
import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  createDirectionalNavigation,
  syncDirectionalNavigationScope,
  type DirectionalNavigation,
  type DirectionalNavigationController,
  type DirectionalNavigationOptions,
} from '../system/directionalNavigation';

/**
 * Create a stable React navigation facade for an explicit DOM scope.
 *
 * The underlying controller is effect-owned so StrictMode's setup/cleanup
 * replay cannot permanently dispose the object returned to the component.
 */
export function useDirectionalNavigation(
  options: DirectionalNavigationOptions,
): DirectionalNavigation {
  const { scope } = options;
  const controllerRef = useRef<DirectionalNavigationController | null>(null);

  const navigation = useMemo<DirectionalNavigation>(
    () => ({
      move: (direction) => controllerRef.current?.move(direction) ?? false,
      activate: () => controllerRef.current?.activate() ?? false,
      clear: () => controllerRef.current?.clear(),
    }),
    [],
  );

  useLayoutEffect(() => {
    const controller = createDirectionalNavigation({ scope });
    controllerRef.current = controller;
    return () => {
      if (controllerRef.current === controller) controllerRef.current = null;
      controller.dispose();
    };
  }, [scope]);

  // Ref objects can replace `.current` without changing identity. Reconcile on
  // every commit so an old, still-mounted node never keeps a stale marker.
  useLayoutEffect(() => {
    if (controllerRef.current) syncDirectionalNavigationScope(controllerRef.current);
  });

  return navigation;
}
