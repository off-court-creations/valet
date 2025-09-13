// ─────────────────────────────────────────────────────────────
// docs/src/utils/mcpDocs.ts  | valet-docs
// Shared helpers to read MCP component docs and test for sections
// ─────────────────────────────────────────────────────────────

export type MCPEvent = { name: string; payloadType?: string; description?: string };
export type MCPComponentDoc = {
  slug: string;
  name: string;
  props?: unknown[];
  cssVars?: string[];
  events?: MCPEvent[];
};

type Lookup = { slug?: string; name?: string };

const modules = import.meta.glob('../../../mcp-data/components/*.json', { eager: true });

function buildIndex(): Record<string, MCPComponentDoc> {
  const out: Record<string, MCPComponentDoc> = {};
  for (const [path, mod] of Object.entries(modules)) {
    const data = (mod as { default?: unknown })?.default ?? mod;
    const json = data as MCPComponentDoc;
    let slug = json?.slug;
    if (!slug) {
      const fname =
        path
          .split('/')
          .pop()
          ?.replace(/\.json$/, '') || '';
      slug = fname.split('_').join('/');
    }
    if (slug) out[slug] = json;
  }
  return out;
}

const bySlug = buildIndex();

export function getComponentDoc({ slug, name }: Lookup): MCPComponentDoc | undefined {
  if (slug && bySlug[slug]) return bySlug[slug];
  if (name) return Object.values(bySlug).find((d) => d.name === name);
  return undefined;
}

export function hasProps(input: Lookup): boolean {
  const doc = getComponentDoc(input);
  return !!doc && Array.isArray(doc.props) && doc.props.length > 0;
}

export function hasCssVars(input: Lookup): boolean {
  const doc = getComponentDoc(input);
  return !!doc && Array.isArray(doc.cssVars) && doc.cssVars.length > 0;
}

export function hasEvents(input: Lookup): boolean {
  const doc = getComponentDoc(input);
  return !!doc && Array.isArray(doc.events) && doc.events.length > 0;
}
