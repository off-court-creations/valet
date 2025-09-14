// ─────────────────────────────────────────────────────────────
// docs/src/utils/sidecar.ts  | valet-docs
// Small helpers for consuming component sidecar JSON in docs
// ─────────────────────────────────────────────────────────────

export type ComponentSidecar = {
  name?: string;
  docs?: {
    bestPractices?: string[];
  };
  examples?: Array<{
    id?: string;
    title?: string;
    code: string;
    lang?: string;
  }>;
};

export function getBestPractices(meta: ComponentSidecar | undefined | null): string[] {
  return (meta?.docs?.bestPractices ?? []).filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0,
  );
}

export type NormalizedExample = {
  id: string;
  title?: string;
  code: string;
  lang?: string;
};

export function getExamples(meta: ComponentSidecar | undefined | null): NormalizedExample[] {
  const raw = Array.isArray(meta?.examples) ? meta!.examples! : [];
  return raw
    .filter((e) => e && typeof e.code === 'string' && e.code.trim().length > 0)
    .map((e, i) => {
      const out: NormalizedExample = {
        id:
          e.id && e.id.trim()
            ? e.id
            : `${(meta?.name || 'component').toString().toLowerCase()}-example-${i + 1}`,
        code: e.code,
        lang: e.lang || 'tsx',
      };
      if (e.title && e.title.trim()) out.title = e.title;
      return out;
    });
}
