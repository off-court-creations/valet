// ─────────────────────────────────────────────────────────────
// src/types.ts  | valet-docs
// Shared types for docs metadata consumed by agents/tooling
// ─────────────────────────────────────────────────────────────
export type DocPageType = 'landing' | 'guide' | 'concept' | 'tutorial' | 'reference' | 'recipe';

export interface DocMeta {
  id: string; // stable, kebab-case identifier
  title: string;
  description: string;
  pageType: DocPageType;
  // components referenced on this page (stable identifiers)
  components?: string[];
  // pre-req concepts or pages (ids)
  prerequisites?: string[];
  // short TL;DR for embeddings and AI proxies
  tldr?: string;
}
