// ─────────────────────────────────────────────────────────────
// docs/src/utils/sidecar.ts  | valet-docs
// Small helpers for consuming component sidecar JSON in docs
// ─────────────────────────────────────────────────────────────

export type ComponentSidecar = {
  docs?: {
    bestPractices?: string[];
  };
};

export function getBestPractices(meta: ComponentSidecar | undefined | null): string[] {
  return (meta?.docs?.bestPractices ?? []).filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0,
  );
}
