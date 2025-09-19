// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/searchBestPractices.ts  | valet-mcp
// Tool: valet__search_best_practices – search best-practice guidance
// ─────────────────────────────────────────────────────────────
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  getComponentBySlug,
  getIndex,
  loadSynonyms,
  normalizeStatusFilter,
  simpleSearch,
  type ValetComponentDoc,
} from './shared.js';

const ParamsSchema = {
  query: z.string().min(1, 'Provide text to search.').describe('Primary search text.'),
  limit: z
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Maximum results to return (default 20).'),
  category: z.string().optional().describe('Optional category filter.'),
  status: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .describe('Optional status filter.'),
} as const;

type SearchArgs = {
  query: string;
  limit: number;
  category?: string;
  status?: string | string[];
};

type BestPracticeHit = {
  name: string;
  slug: string;
  category?: string;
  status?: string;
  bestPractice: string;
  matchScore: number;
  matchType?: string;
  index: number;
};

function createDocCache() {
  const cache = new Map<string, ValetComponentDoc | null>();
  return (slug: string): ValetComponentDoc | null => {
    if (!cache.has(slug)) {
      cache.set(slug, getComponentBySlug(slug));
    }
    return cache.get(slug) ?? null;
  };
}

export function registerSearchBestPractices(server: McpServer): void {
  server.registerTool(
    'valet__search_best_practices',
    {
      title: 'Search Best Practices',
      description: 'Search best-practice entries across components and surface the most relevant advice.',
      inputSchema: ParamsSchema,
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, limit, category, status }: SearchArgs) => {
      const trimmed = query.trim();
      if (!trimmed) {
        return { content: [{ type: 'text', text: '[]' }] };
      }

    const normalizedQuery = trimmed.toLowerCase();
    const tokens = Array.from(new Set((normalizedQuery.match(/[a-z0-9]+/g) ?? []).filter((t) => t.length >= 2)));
    const index = getIndex();
    const statusFilter = normalizeStatusFilter(status);
    const wantStatus = statusFilter.size > 0;
    const candidates = category ? index.filter((item) => item.category === category) : index;

    const docs = createDocCache();
    const simpleScores = new Map<string, number>();
    for (const entry of simpleSearch(trimmed, index, { category })) {
      if (entry.score > 0) {
        simpleScores.set(entry.item.slug, entry.score);
      }
    }

    const synonymMap = (() => {
      const { map: raw } = loadSynonyms();
      const normalized = new Map<string, string[]>();
      for (const [alias, targets] of Object.entries(raw)) {
        const key = alias.trim().toLowerCase();
        if (!key) continue;
        const values = Array.from(
          new Set((targets ?? []).map((t) => t.trim()).filter((t) => t.length > 0))
        ).map((t) => t.toLowerCase());
        if (values.length) {
          normalized.set(key, values);
        }
      }
      return normalized;
    })();

    const aliasCandidates = new Set<string>([normalizedQuery, ...tokens]);
    const results: BestPracticeHit[] = [];

    for (const item of candidates) {
      const doc = docs(item.slug);
      if (!doc || !Array.isArray(doc.bestPractices) || doc.bestPractices.length === 0) {
        continue;
      }

      if (wantStatus) {
        const idxStatus = (item.status ?? '').toString().toLowerCase();
        const docStatus = (doc.status ?? '').toString().toLowerCase();
        const matches = (idxStatus && statusFilter.has(idxStatus)) || (docStatus && statusFilter.has(docStatus));
        if (!matches) continue;
      }

      const componentNameLc = doc.name.toLowerCase();
      const categoryLc = (doc.category ?? item.category ?? '').toLowerCase();
      let hasAliasMatch = false;
      for (const alias of aliasCandidates) {
        if (!alias) continue;
        const targets = synonymMap.get(alias);
        if (!targets) continue;
        if (targets.includes(componentNameLc)) {
          hasAliasMatch = true;
          break;
        }
      }

      const categoryExact = categoryLc ? categoryLc === normalizedQuery : false;
      const componentScore = simpleScores.get(item.slug) ?? 0;

      doc.bestPractices.forEach((practice, practiceIndex) => {
        if (!practice) return;
        const text = practice.trim();
        if (!text) return;
        const lower = text.toLowerCase();
        let score = 0;
        const matchTypes = new Set<string>();

        if (lower.includes(normalizedQuery)) {
          score += 5;
          matchTypes.add('text');
        }

        for (const token of tokens) {
          if (token && lower.includes(token)) {
            score += 3;
            matchTypes.add('token');
          }
        }

        if (componentScore > 0) {
          score += 2;
          matchTypes.add('component');
        }

        if (hasAliasMatch) {
          score += 2;
          matchTypes.add('alias');
        }

        if (categoryExact) {
          score += 1;
          matchTypes.add('category');
        }

        if (score > 0) {
          const hit: BestPracticeHit = {
            name: doc.name,
            slug: doc.slug,
            category: doc.category ?? item.category,
            status: doc.status ?? item.status,
            bestPractice: text,
            matchScore: score,
            index: practiceIndex,
          };
          if (matchTypes.size > 0) {
            hit.matchType = Array.from(matchTypes).sort().join('|');
          }
          results.push(hit);
        }
      });
    }

    results.sort((a, b) => b.matchScore - a.matchScore || a.name.localeCompare(b.name) || a.index - b.index);
    const capped = results.slice(0, Math.max(0, Math.min(limit, 100)));
    return { content: [{ type: 'text', text: JSON.stringify(capped) }] };
    }
  );
}
