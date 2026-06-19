// ─────────────────────────────────────────────────────────────
// src/components/widgets/Markdown.tsx | valet
// Lightweight Markdown renderer using valet primitives
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { marked } from 'marked';
import hljs from '../../system/highlight';
import type { TokensList, Token, Tokens } from 'marked';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
import Typography from '../primitives/Typography';
import type { Variant } from '../../types/typography';
import Image from '../primitives/Image';
import Divider from '../primitives/Divider';
import Table, { type TableColumn } from './Table';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { HLJS_LIGHT, HLJS_DARK } from '../../css/hljsThemes';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

// Enable GFM features (tables, strikethrough, task lists, etc.)
marked.setOptions({ gfm: true });

export interface MarkdownProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable {
  /** Raw markdown text */
  data: string;
  /** Optional override for the code block surface (the whole code area, not just
   *  its padding ring). Defaults to a GitHub-paired surface (LIGHT_BG/DARK_BG). */
  codeBackground?: string;
  /** Render the rendered prose non-selectable (`user-select: none`, cascades to
   *  all child elements). Default: text is selectable. */
  noSelect?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: import('../../types').Sx;
}

const LIGHT_BG = '#f6f8fa';
const DARK_BG = '#0d1117';

/* Threaded render context (block renderer only — inline renderer is contextless). */
interface RenderCtx {
  codeBg: string;
  divider: string;
}

/*───────────────────────────────────────────────────────────*/
/* Inline link — adds the mobile chrome kit + a focus-visible ring without
   touching the inherited link colour/underline. External links additionally
   get rel="noopener noreferrer" (set on the element below). No coarse 44px
   floor: a min-height breaks inline prose text-flow. */
const MdLink = styled('a')`
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  &:focus-visible {
    outline: 2px solid var(--valet-focus-ring-color, currentColor);
    outline-offset: 2px;
    border-radius: 2px;
  }
`;

/*───────────────────────────────────────────────────────────*/
/* URL sanitation                                             */
/* A safe href that navigates off-document, so it earns rel="noopener
   noreferrer". Anchors, relative paths, and mailto/tel don't need it.
   (isExternalHref / isSafeHref / isSafeImageSrc are exported for unit tests —
   they are NOT re-exported from the package barrel.) */
export const isExternalHref = (href: string): boolean => {
  if (href.startsWith('//')) return true; // protocol-relative
  const m = href.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!m) return false;
  const scheme = m[1].toLowerCase();
  return scheme === 'http' || scheme === 'https' || scheme === 'ftp';
};

export const isSafeHref = (href?: string | null): string | null => {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  // Browsers strip control chars + whitespace (incl. internal tabs/newlines)
  // before resolving a scheme, so test the decision against a stripped probe —
  // otherwise `\x01javascript:` / `java\tscript:` / `\x01data:text/html` slip
  // past the start-anchored regex into the "relative" branch and navigate live.
  // The original `trimmed` (not the probe) is returned so legitimate URLs are
  // preserved verbatim.
  const probe = trimmed.replace(/[\u0000-\u001f\s]/g, '');
  // allow anchors and relative URLs
  if (
    probe.startsWith('#') ||
    probe.startsWith('/') ||
    probe.startsWith('./') ||
    probe.startsWith('../')
  ) {
    return trimmed;
  }
  const schemeMatch = probe.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/);
  if (!schemeMatch) return trimmed; // relative without explicit scheme
  const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
  const allowed = new Set(['http', 'https', 'mailto', 'tel', 'ftp']);
  return allowed.has(scheme) ? trimmed : null;
};

export const isSafeImageSrc = (src?: string | null): string | null => {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  // Same obfuscation defence as isSafeHref — decide on a stripped probe, return
  // the original verbatim.
  const probe = trimmed.replace(/[\u0000-\u001f\s]/g, '');
  if (
    probe.startsWith('#') ||
    probe.startsWith('/') ||
    probe.startsWith('./') ||
    probe.startsWith('../')
  ) {
    return trimmed;
  }
  const lower = probe.toLowerCase();
  if (lower.startsWith('data:image/')) return trimmed;
  const schemeMatch = probe.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/);
  if (!schemeMatch) return trimmed;
  const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
  const allowed = new Set(['http', 'https']);
  return allowed.has(scheme) ? trimmed : null;
};

/*───────────────────────────────────────────────────────────*/
/* Entity decoding                                            */
/* marked's lexer leaves HTML entities verbatim in token text
   (it expects an HTML renderer); React escapes text itself, so
   decode exactly once here. A single left-to-right replace pass
   guarantees `&amp;lt;` → `&lt;`, never `<`.                  */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

const decodeEntities = (text: string): string =>
  text.replace(
    /&(?:#x([0-9a-fA-F]{1,6})|#(\d{1,7})|([a-zA-Z][a-zA-Z0-9]*));/g,
    (match, hex: string | undefined, dec: string | undefined, named: string | undefined) => {
      if (hex || dec) {
        const codePoint = hex ? parseInt(hex, 16) : parseInt(dec!, 10);
        if (codePoint === 0 || codePoint > 0x10ffff) return match;
        if (codePoint >= 0xd800 && codePoint <= 0xdfff) return match; // lone surrogate
        return String.fromCodePoint(codePoint);
      }
      return NAMED_ENTITIES[named!.toLowerCase()] ?? match;
    },
  );

const renderInline = (tokens?: Token[]): React.ReactNode => {
  if (!tokens) return null;
  return tokens.map((t: Token, i: number) => {
    /* Key by token type + index so a type change at a position forces a clean
       remount during streaming re-lexes (consumers grow `data` chunk by chunk). */
    const key = `${t.type}:${i}`;
    switch (t.type) {
      case 'strong':
        return <strong key={key}>{renderInline((t as Tokens.Strong).tokens)}</strong>;
      case 'em':
        return <em key={key}>{renderInline((t as Tokens.Em).tokens)}</em>;
      case 'del':
        return <del key={key}>{renderInline((t as Tokens.Del).tokens)}</del>;
      case 'codespan':
        return <code key={key}>{(t as Tokens.Codespan).text}</code>;
      case 'link': {
        const link = t as Tokens.Link;
        const safe = isSafeHref(link.href);
        if (!safe) return <span key={key}>{renderInline(link.tokens)}</span>;
        return (
          <MdLink
            key={key}
            href={safe}
            title={link.title ?? undefined}
            {...(isExternalHref(safe) ? { rel: 'noopener noreferrer' } : {})}
          >
            {renderInline(link.tokens)}
          </MdLink>
        );
      }
      case 'image': {
        const img = t as Tokens.Image;
        const safe = isSafeImageSrc(img.href);
        return safe ? (
          <Image
            key={key}
            src={safe}
            alt={img.text}
            sx={{ maxWidth: '100%' }}
          />
        ) : (
          <span key={key}>{img.text}</span>
        );
      }
      case 'br':
        return <br key={key} />;
      case 'escape':
        /* marked HTML-escapes the unescaped char (`\<` → `&lt;`) */
        return decodeEntities((t as Tokens.Escape).text);
      case 'text': {
        const text = t as Tokens.Text;
        /* Block-level text tokens (e.g. inside list items) carry their
           inline children in `.tokens` — recurse instead of dumping the
           still-marked-up source text. */
        if (text.tokens?.length) {
          return <React.Fragment key={key}>{renderInline(text.tokens)}</React.Fragment>;
        }
        return decodeEntities(text.text);
      }
      default:
        // Fallback to raw token text when no specific renderer exists
        return (t as Token).raw ?? '';
    }
  });
};

/* Block tokens inside a list item (marked: list → items → tokens).
   Tight-list `text` tokens hold the item's inline content in `.tokens`
   and must NOT gain paragraph chrome; every other token (nested list,
   fenced code, paragraph in a loose list, …) is a block token that is
   routed back through the block renderer. */
const renderListItemTokens = (tokens: Token[], ctx: RenderCtx): React.ReactNode =>
  tokens.map((t: Token, i: number) => {
    const key = `${t.type}:${i}`;
    if (t.type === 'text') {
      const text = t as Tokens.Text;
      return (
        <React.Fragment key={key}>
          {text.tokens?.length ? renderInline(text.tokens) : decodeEntities(text.text)}
        </React.Fragment>
      );
    }
    return <React.Fragment key={key}>{renderTokens([t], ctx)}</React.Fragment>;
  });

const renderTokens = (tokens: Token[], ctx: RenderCtx): React.ReactNode =>
  tokens.map((t: Token, i: number) => {
    /* Key by token type + index — a type change at an index (paragraph→heading→
       code) forces a clean remount instead of an in-place patch during streaming. */
    const key = `${t.type}:${i}`;
    switch (t.type) {
      case 'heading': {
        const heading = t as Tokens.Heading;
        const variant = `h${heading.depth}` as Variant;
        return (
          <Typography
            key={key}
            variant={variant}
            weight='bold'
          >
            {renderInline(heading.tokens)}
          </Typography>
        );
      }
      case 'paragraph': {
        const p = t as Tokens.Paragraph;
        return (
          <Typography
            key={key}
            sx={{ margin: '0.375rem 0' }}
          >
            {renderInline(p.tokens)}
          </Typography>
        );
      }
      case 'list': {
        const list = t as Tokens.List;
        const isOrdered = !!list.ordered;
        const ListTag = isOrdered ? 'ol' : 'ul';
        const start = isOrdered && typeof list.start === 'number' ? list.start : undefined;
        return (
          <ListTag
            key={key}
            /* `start` is already undefined for non-ordered/default lists; guard on
               that, not truthiness, so a `0.`-prefixed list keeps start=0. */
            {...(start !== undefined ? { start } : {})}
            style={{ paddingLeft: '1.25rem' }}
          >
            {list.items.map((item: Tokens.ListItem, j: number) => (
              <li key={j}>
                {item.task ? (
                  <>
                    <input
                      type='checkbox'
                      checked={!!item.checked}
                      readOnly
                      disabled
                      aria-readonly='true'
                      aria-checked={!!item.checked}
                      style={{ marginRight: '0.5rem' }}
                    />
                    {renderListItemTokens(item.tokens, ctx)}
                  </>
                ) : (
                  renderListItemTokens(item.tokens, ctx)
                )}
              </li>
            ))}
          </ListTag>
        );
      }
      case 'code': {
        const code = t as Tokens.Code;
        const lang = code.lang ?? 'plaintext';
        const validLang = hljs.getLanguage(lang) ? lang : 'plaintext';
        const html = hljs.highlight(code.text, { language: validLang }).value;
        return (
          <Panel
            key={key}
            /* `pad={1}` = spacing(1), matching the old `codePanel` preset — but
               via Panel's own API so the library no longer depends on an
               app-registered preset (rendering a fence used to throw "Unknown
               style preset codePanel" for bare consumers). */
            pad={1}
            color={ctx.codeBg}
            fullWidth
            sx={{
              margin: '0.5rem 0',
              /* Ensure the code block fits container width and scrolls internally */
              maxWidth: '100%',
            }}
          >
            <pre
              style={{
                margin: 0,
                background: 'transparent',
                overflowX: 'auto',
                width: '100%',
                maxWidth: '100%',
                /* keep whitespace to enable horizontal scroll */
                whiteSpace: 'pre',
              }}
            >
              <code
                className={`hljs language-${validLang}`}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </pre>
          </Panel>
        );
      }
      case 'blockquote': {
        const bq = t as Tokens.Blockquote;
        return (
          <Panel
            key={key}
            variant='outlined'
            sx={{
              /* Theme-token fallback (not a hardcoded near-black) so the accent
                 edge stays visible when Markdown is mounted with no Surface
                 ancestor emitting --valet-divider. */
              borderLeft: `4px solid var(--valet-divider, ${ctx.divider})`,
              padding: '0.5rem 0.75rem',
              margin: '0.5rem 0',
            }}
          >
            {renderTokens(bq.tokens, ctx)}
          </Panel>
        );
      }
      case 'hr':
        return <Divider key={key} />;
      case 'table': {
        const table = t as Tokens.Table;
        const columns: TableColumn<Record<string, React.ReactNode>>[] = table.header.map(
          (h: Tokens.TableCell, idx: number) => ({
            header: renderInline(h.tokens),
            accessor: idx.toString() as keyof Record<string, React.ReactNode>,
            align: (table.align?.[idx] as 'left' | 'center' | 'right' | null) ?? undefined,
          }),
        );
        const data = table.rows.map((row: Tokens.TableCell[]) => {
          const obj: Record<string, React.ReactNode> = {};
          row.forEach((cell: Tokens.TableCell, idx: number) => {
            // Preserve inline formatting within cells
            obj[idx] = renderInline(cell.tokens) ?? cell.text;
          });
          return obj;
        });
        return (
          <Table
            key={key}
            data={data}
            columns={columns}
            constrainHeight={false}
          />
        );
      }
      case 'space':
        return null;
      case 'text': {
        /* Block-level text (top level or routed from a list item) —
           render its inline children, never the raw markdown source. */
        const text = t as Tokens.Text;
        return (
          <Typography key={key}>
            {text.tokens?.length ? renderInline(text.tokens) : decodeEntities(text.text)}
          </Typography>
        );
      }
      default:
        return <Typography key={key}>{(t as Token).raw ?? ''}</Typography>;
    }
  });

export const Markdown: React.FC<MarkdownProps> = ({
  data,
  codeBackground,
  noSelect = false,
  className,
  preset: p,
  sx,
  ...rest
}) => {
  const { mode, theme } = useTheme();
  React.useEffect(() => {
    const id = 'hljs-theme';
    const existing = document.getElementById(id);
    if (existing && existing.tagName === 'LINK') existing.remove();
    let styleEl = existing as HTMLStyleElement | null;
    if (!styleEl || styleEl.tagName !== 'STYLE') {
      styleEl = document.createElement('style');
      styleEl.id = id;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = mode === 'dark' ? HLJS_DARK : HLJS_LIGHT;
  }, [mode]);
  const tokens = React.useMemo(() => marked.lexer(data) as TokensList, [data]);
  const ctx = React.useMemo<RenderCtx>(
    () => ({
      codeBg: codeBackground ?? (mode === 'dark' ? DARK_BG : LIGHT_BG),
      divider: theme.colors.divider ?? theme.colors.text,
    }),
    [codeBackground, mode, theme.colors.divider, theme.colors.text],
  );
  const presetCls = p ? preset(p) : '';
  return (
    <Stack
      {...rest}
      data-valet-component='Markdown'
      className={[presetCls, className].filter(Boolean).join(' ')}
      sx={noSelect ? { userSelect: 'none', WebkitUserSelect: 'none', ...sx } : sx}
    >
      {renderTokens(tokens, ctx)}
    </Stack>
  );
};

export default Markdown;
