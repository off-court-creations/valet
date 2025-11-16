// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/Glossary.tsx  | valet-docs
// Canonical valet glossary. Parsed by MCP to power glossary tools.
// Enhanced UX: search, filters, anchors, and clearer layout.
// ─────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Panel,
  TextField,
  Select,
  Chip,
  IconButton,
  Divider,
} from '@archway/valet';
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
  // Search and filter state
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryEntry['category'] | 'all'>('all');
  const [groupBy, setGroupBy] = useState<'alphabet' | 'category'>('alphabet');

  // Derived helpers
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');

  const categoryLabel: Record<NonNullable<GlossaryEntry['category']>, string> = {
    core: 'Core',
    css: 'CSS',
    state: 'State',
    ai: 'AI',
    a11y: 'Accessibility',
    docs: 'Docs',
    components: 'Components',
    mcp: 'MCP',
    misc: 'Misc',
  };
  const categoryChipColor: Record<NonNullable<GlossaryEntry['category']>, string> = {
    core: 'primary',
    css: 'secondary',
    state: 'info',
    ai: 'tertiary',
    a11y: 'success',
    docs: 'default',
    components: 'warning',
    mcp: 'info',
    misc: 'default',
  };

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (e: GlossaryEntry) => {
      if (category !== 'all' && e.category !== category) return false;
      if (!q) return true;
      const hay = [e.term, e.definition, ...(e.aliases ?? []), ...(e.seeAlso ?? [])]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    };
    const out = GLOSSARY.filter(matches);
    out.sort((a, b) => a.term.localeCompare(b.term));
    return out;
  }, [query, category]);

  // Grouping views
  const byCategory = useMemo(() => {
    const order: NonNullable<GlossaryEntry['category']>[] = [
      'core',
      'components',
      'css',
      'state',
      'a11y',
      'ai',
      'mcp',
      'docs',
      'misc',
    ];
    const groups = new Map<NonNullable<GlossaryEntry['category']>, GlossaryEntry[]>();
    filtered.forEach((e) => {
      const c = e.category ?? 'misc';
      const arr = groups.get(c) ?? [];
      arr.push(e);
      groups.set(c, arr);
    });
    // Sort each group
    for (const arr of groups.values()) arr.sort((a, b) => a.term.localeCompare(b.term));
    return order.filter((k) => groups.has(k)).map((k) => ({ key: k, items: groups.get(k)! }));
  }, [filtered]);

  const byAlphabet = useMemo(() => {
    const groups = new Map<string, GlossaryEntry[]>();
    filtered.forEach((e) => {
      const ch = e.term.charAt(0).toUpperCase();
      const arr = groups.get(ch) ?? [];
      arr.push(e);
      groups.set(ch, arr);
    });
    const keys = Array.from(groups.keys()).sort();
    return keys.map((k) => ({
      key: k,
      items: groups.get(k)!.sort((a, b) => a.term.localeCompare(b.term)),
    }));
  }, [filtered]);

  // Result count live region
  const resultsCountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (resultsCountRef.current) {
      resultsCountRef.current.textContent = `Showing ${filtered.length} of ${GLOSSARY.length}`;
    }
  }, [filtered.length]);

  // Deep-link handling
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = decodeURIComponent(window.location.hash.replace('#', ''));
    if (id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Helpers
  const copyPageLink = (id: string) => {
    const base = window.location.href.split('#')[0];
    const url = `${base}#${id}`;
    navigator.clipboard?.writeText(url);
  };

  const highlight = (text: string): ReactNode => {
    const q = query.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const SeeAlso = ({ names }: { names: string[] }) => (
    <Typography variant='subtitle'>
      See also:{' '}
      {names.map((name, i) => (
        <a
          key={name}
          href={`#${slug(name)}`}
          onClick={() => {
            // Keep SPA navigation; allow default hash jump
            const id = slug(name);
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          style={{ textDecoration: 'underline', color: 'inherit' }}
        >
          {name}
          {i < names.length - 1 ? ', ' : ''}
        </a>
      ))}
    </Typography>
  );

  const ControlsBar = (
    <Panel
      fullWidth
      variant='outlined'
      sx={{ position: 'sticky', top: 0, zIndex: 1 }}
      pad={1}
    >
      <Stack
        direction='row'
        sx={{ alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
      >
        <TextField
          name='q'
          placeholder='Search terms, aliases, or definitions'
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
          aria-label='Search glossary'
          sx={{ minWidth: 280, flex: 1 }}
        />

        <Select
          value={category ?? 'all'}
          onValueChange={(v) =>
            setCategory((v as string) === 'all' ? 'all' : (v as GlossaryEntry['category']))
          }
          placeholder='Category'
          sx={{ width: 180 }}
        >
          <Select.Option value='all'>All categories</Select.Option>
          <Select.Option value='core'>Core</Select.Option>
          <Select.Option value='components'>Components</Select.Option>
          <Select.Option value='css'>CSS</Select.Option>
          <Select.Option value='state'>State</Select.Option>
          <Select.Option value='a11y'>Accessibility</Select.Option>
          <Select.Option value='ai'>AI</Select.Option>
          <Select.Option value='mcp'>MCP</Select.Option>
          <Select.Option value='docs'>Docs</Select.Option>
          <Select.Option value='misc'>Misc</Select.Option>
        </Select>

        <Select
          value={groupBy}
          onValueChange={(v) => setGroupBy(v as 'alphabet' | 'category')}
          placeholder='Group by'
          sx={{ width: 160 }}
        >
          <Select.Option value='alphabet'>A–Z</Select.Option>
          <Select.Option value='category'>Category</Select.Option>
        </Select>

        <IconButton
          icon='mdi:close'
          title='Clear search and filters'
          aria-label='Clear search and filters'
          onClick={() => {
            setQuery('');
            setCategory('all');
          }}
        />
        <IconButton
          icon='mdi:content-copy'
          title='Copy glossary JSON'
          aria-label='Copy glossary JSON'
          onClick={() => navigator.clipboard?.writeText(JSON.stringify(GLOSSARY, null, 2))}
        />
      </Stack>
      <Stack
        direction='row'
        sx={{ alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}
      >
        <Typography variant='subtitle'>
          Tip: this glossary powers MCP tools. See <a href='/mcp'>MCP & Introspection</a>.
        </Typography>
        <div
          aria-live='polite'
          ref={resultsCountRef}
        />
      </Stack>
    </Panel>
  );

  const LetterIndex =
    groupBy !== 'alphabet' || byAlphabet.length === 0 ? null : (
      <Stack
        direction='row'
        sx={{ gap: '0.25rem', flexWrap: 'wrap' }}
      >
        {byAlphabet.map((g) => (
          <a
            key={g.key}
            href={`#letter-${g.key}`}
            style={{ textDecoration: 'none' }}
          >
            <Chip
              label={g.key}
              size='sm'
              variant='outlined'
            />
          </a>
        ))}
      </Stack>
    );

  const EntryCard = (e: GlossaryEntry) => {
    const id = slug(e.term);
    return (
      <Stack
        id={id}
        key={e.term}
        sx={{ padding: '0.5rem 0', gap: '0.25rem' }}
      >
        <Stack
          direction='row'
          sx={{ alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}
        >
          <Typography
            variant='h4'
            bold
          >
            {highlight(e.term)}
          </Typography>
          {e.aliases?.length ? (
            <Typography
              variant='subtitle'
              sx={{ opacity: 0.9 }}
            >
              (
              {e.aliases.map((a, i) => (
                <span key={a}>
                  {highlight(a)}
                  {i < e.aliases!.length - 1 ? ', ' : ''}
                </span>
              ))}
              )
            </Typography>
          ) : null}
          {e.category ? (
            <Chip
              label={categoryLabel[e.category]}
              size='sm'
              variant='outlined'
              intent={categoryChipColor[e.category as NonNullable<GlossaryEntry['category']>]}
            />
          ) : null}
          <IconButton
            icon='mdi:link-variant'
            title='Copy link to this term'
            aria-label={`Copy link to ${e.term}`}
            onClick={() => copyPageLink(id)}
          />
        </Stack>
        <Typography>{highlight(e.definition)}</Typography>
        {e.seeAlso?.length ? <SeeAlso names={e.seeAlso} /> : null}
      </Stack>
    );
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack
        sx={{ padding: '1rem', maxWidth: 1100 }}
        gap={1}
      >
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

        {ControlsBar}

        {LetterIndex}

        <Panel fullWidth>
          {groupBy === 'category' ? (
            <Stack>
              {byCategory.map((g) => (
                <Stack key={g.key}>
                  <Typography
                    id={`letter-${g.key}`}
                    variant='h3'
                    bold
                    sx={{ marginTop: '0.5rem' }}
                  >
                    {categoryLabel[g.key]}
                  </Typography>
                  <Divider />
                  {g.items.map((e, idx) => (
                    <div key={e.term}>
                      {EntryCard(e)}
                      {idx < g.items.length - 1 ? <Divider /> : null}
                    </div>
                  ))}
                </Stack>
              ))}
            </Stack>
          ) : (
            <Stack>
              {byAlphabet.map((g) => (
                <Stack key={g.key}>
                  <Typography
                    id={`letter-${g.key}`}
                    variant='h3'
                    bold
                    sx={{ marginTop: '0.5rem' }}
                  >
                    {g.key}
                  </Typography>
                  <Divider />
                  {g.items.map((e, idx) => (
                    <div key={e.term}>
                      {EntryCard(e)}
                      {idx < g.items.length - 1 ? <Divider /> : null}
                    </div>
                  ))}
                </Stack>
              ))}
            </Stack>
          )}
        </Panel>
      </Stack>
    </Surface>
  );
}
