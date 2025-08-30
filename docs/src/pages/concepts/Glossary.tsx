// ─────────────────────────────────────────────────────────────
// src/pages/concepts/Glossary.tsx  | valet-docs
// Canonical valet glossary. Parsed by MCP to power glossary tools.
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';

export interface GlossaryEntry {
  term: string;
  definition: string;
  aliases?: string[];
  category?: 'core' | 'css' | 'state' | 'ai' | 'a11y' | 'docs' | 'components' | 'mcp' | 'misc';
  seeAlso?: string[]; // other terms by name
}

export const meta: DocMeta = {
  id: 'glossary',
  title: 'valet Glossary',
  description:
    'Authoritative definitions for valet terms and concepts. Used by MCP tools to answer concise "what does X mean?" queries.',
  pageType: 'reference',
  tldr: 'Canonical source of truth for valet vocabulary; powers MCP glossary + define tools.',
};

// NOTE: The MCP extractor reads this constant. Keep structure simple.
export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'valet',
    aliases: ['@archway/valet', 'Valet'],
    category: 'core',
    definition:
      'A performant, opinionated React UI library with a minimal CSS-in-JS engine, a11y-first components, and AI-forward introspection via MCP.',
    seeAlso: ['styled', 'Surface', 'MCP', 'Semantic Interface Layer'],
  },
  {
    term: 'styled',
    aliases: ['createStyled', 'css-in-js'],
    category: 'css',
    definition:
      'A tiny runtime styling helper exporting styled and keyframes. Registers elements with Surface and exposes CSS vars for size.',
    seeAlso: ['style preset', 'Surface'],
  },
  {
    term: 'Surface',
    category: 'core',
    definition:
      'A route-level container that owns a small Zustand store and CSS variables for screen size. Disallows nesting; components register themselves under a Surface.',
    seeAlso: ['Stack', 'Panel', 'styled'],
  },
  {
    term: 'style preset',
    aliases: ['preset', 'definePreset'],
    category: 'css',
    definition:
      'Named, reusable style tokens defined via definePreset and referenced by the preset prop to keep styles consistent and semantic.',
    seeAlso: ['styled', 'theme'],
  },
  {
    term: 'theme',
    aliases: ['themeStore', 'useTheme', 'useInitialTheme'],
    category: 'state',
    definition:
      'Zustand-backed theme store with runtime theming and font preloading. Read via useTheme and initialize once with useInitialTheme.',
    seeAlso: ['styled', 'style preset'],
  },
  {
    term: 'Semantic Interface Layer',
    aliases: ['semantic layer', 'component semantics'],
    category: 'ai',
    definition:
      'Per-component metadata (props, events, css vars, best practices) exposed to agents to enable safe generation and adaptation of UI code.',
    seeAlso: ['MCP', 'mcp-data'],
  },
  {
    term: 'MCP',
    aliases: ['Model Context Protocol', 'valet-mcp'],
    category: 'mcp',
    definition:
      'A small server and data pipeline that exposes machine-readable component facts (and glossary) to LLM agents via standardized tools.',
    seeAlso: ['get_component', 'search_components', 'get_glossary', 'define_term'],
  },
  {
    term: 'mcp-data',
    aliases: ['MCP data'],
    category: 'mcp',
    definition:
      'Generated JSON corpus with index.json, per-component docs, and auxiliary datasets (e.g., glossary.json). Served by the MCP server.',
    seeAlso: ['MCP'],
  },
  {
    term: 'Web Action Graph',
    aliases: ['action graph', 'WAG'],
    category: 'ai',
    definition:
      'A conceptual graph of user and system actions captured at runtime to enable introspection, automation, and adaptation.',
    seeAlso: ['Semantic Interface Layer'],
  },
  {
    term: 'Surface state',
    aliases: ['element registry'],
    category: 'core',
    definition:
      'Per-Surface Zustand store tracking screen and registered child element sizes. Components expose --valet-el-* CSS vars; Surface exposes screen vars.',
    seeAlso: ['Surface', 'styled'],
  },
  {
    term: 'accessibility',
    aliases: ['a11y'],
    category: 'a11y',
    definition:
      'Mandatory accessibility in every component: proper roles, labels, keyboard support, and predictable focus behavior across the library.',
    seeAlso: ['FormControl', 'Snackbar', 'Modal'],
  },
  {
    term: 'Context Bridge',
    aliases: ['state bridge'],
    category: 'ai',
    definition:
      'A typed, schema-driven bridge for state shared between app and agents, implemented with Zustand and JSON schemas.',
    seeAlso: ['theme', 'MCP'],
  },
  {
    term: 'Best Practices',
    aliases: ['guidelines'],
    category: 'docs',
    definition:
      'Curated recommendations extracted from docs pages to steer agents and humans toward correct usage of components and patterns.',
    seeAlso: ['Semantic Interface Layer', 'MCP'],
  },
];

export default function GlossaryPage() {
  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          valet Glossary
        </Typography>
        <Typography>
          Canonical definitions for valet terms. The MCP uses this page to answer short &quot;define
          X&quot; questions.
        </Typography>
        <Panel fullWidth>
          {GLOSSARY.map((e) => (
            <Stack
              key={e.term}
              sx={{ padding: '0.5rem 0', gap: '0.25rem' }}
            >
              <Typography
                variant='h4'
                bold
              >
                {e.term}
                {e.aliases?.length ? (
                  <Typography
                    variant='subtitle'
                    sx={{ marginLeft: '0.5rem', display: 'inline' }}
                  >
                    ({e.aliases.join(', ')})
                  </Typography>
                ) : null}
              </Typography>
              <Typography>{e.definition}</Typography>
              {e.seeAlso?.length ? (
                <Typography variant='subtitle'>See also: {e.seeAlso.join(', ')}</Typography>
              ) : null}
            </Stack>
          ))}
        </Panel>
      </Stack>
    </Surface>
  );
}
