// ─────────────────────────────────────────────────────────────
// src/components/widgets/Markdown.tsx | valet
// Lightweight Markdown renderer using valet primitives
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import type { TokensList, Token, Tokens } from 'marked';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
import Typography, { type Variant } from '../primitives/Typography';
import Image from '../primitives/Image';
import Divider from '../primitives/Divider';
import Table, { type TableColumn } from './Table';
import { useTheme } from '../../system/themeStore';
import { HLJS_LIGHT, HLJS_DARK } from '../../css/hljsThemes';

// Enable GFM features (tables, strikethrough, task lists, etc.)
marked.setOptions({ gfm: true });

export interface MarkdownProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  /** Raw markdown text */
  data: string;
  /** Optional override for code block background */
  codeBackground?: string;
  /** Inline styles (with CSS var support) */
  sx?: import('../../types').Sx;
}

const LIGHT_BG = '#f6f8fa';
const DARK_BG = '#0d1117';

/*───────────────────────────────────────────────────────────*/
/* URL sanitation                                             */
const isSafeHref = (href?: string | null): string | null => {
  if (!href) return null;
  const trimmed = href.trim();
  if (!trimmed) return null;
  // allow anchors and relative URLs
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed;
  }
  const schemeMatch = trimmed.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/);
  if (!schemeMatch) return trimmed; // relative without explicit scheme
  const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
  const allowed = new Set(['http', 'https', 'mailto', 'tel', 'ftp']);
  return allowed.has(scheme) ? trimmed : null;
};

const isSafeImageSrc = (src?: string | null): string | null => {
  if (!src) return null;
  const trimmed = src.trim();
  if (!trimmed) return null;
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../')
  ) {
    return trimmed;
  }
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('data:image/')) return trimmed;
  const schemeMatch = trimmed.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/);
  if (!schemeMatch) return trimmed;
  const scheme = schemeMatch[0].slice(0, -1).toLowerCase();
  const allowed = new Set(['http', 'https']);
  return allowed.has(scheme) ? trimmed : null;
};

const renderInline = (tokens?: Token[]): React.ReactNode => {
  if (!tokens) return null;
  return tokens.map((t: Token, i: number) => {
    switch (t.type) {
      case 'strong':
        return <strong key={i}>{renderInline((t as Tokens.Strong).tokens)}</strong>;
      case 'em':
        return <em key={i}>{renderInline((t as Tokens.Em).tokens)}</em>;
      case 'del':
        return <del key={i}>{renderInline((t as Tokens.Del).tokens)}</del>;
      case 'codespan':
        return <code key={i}>{(t as Tokens.Codespan).text}</code>;
      case 'link': {
        const link = t as Tokens.Link;
        const safe = isSafeHref(link.href);
        return safe ? (
          <a
            key={i}
            href={safe}
            title={link.title ?? undefined}
          >
            {renderInline(link.tokens)}
          </a>
        ) : (
          <span key={i}>{renderInline(link.tokens)}</span>
        );
      }
      case 'image': {
        const img = t as Tokens.Image;
        const safe = isSafeImageSrc(img.href);
        return safe ? (
          <Image
            key={i}
            src={safe}
            alt={img.text}
            sx={{ maxWidth: '100%' }}
          />
        ) : (
          <span key={i}>{img.text}</span>
        );
      }
      case 'br':
        return <br key={i} />;
      case 'text':
        return (t as Tokens.Text).text;
      default:
        // Fallback to raw token text when no specific renderer exists
        return (t as Token).raw ?? '';
    }
  });
};

const renderTokens = (tokens: TokensList, codeBg: string): React.ReactNode =>
  tokens.map((t: Token, i: number) => {
    switch (t.type) {
      case 'heading': {
        const heading = t as Tokens.Heading;
        const variant = `h${heading.depth}` as Variant;
        return (
          <Typography
            key={i}
            variant={variant}
            bold
          >
            {renderInline(heading.tokens)}
          </Typography>
        );
      }
      case 'paragraph': {
        const p = t as Tokens.Paragraph;
        return (
          <Typography
            key={i}
            sx={{ margin: '0.5rem 0' }}
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
            key={i}
            {...(isOrdered && start ? { start } : {})}
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
                    {renderInline(item.tokens)}
                  </>
                ) : (
                  renderInline(item.tokens)
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
            key={i}
            preset='codePanel'
            background={codeBg}
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
            key={i}
            variant='alt'
            sx={{
              borderLeft: '4px solid var(--valet-divider, rgba(0,0,0,0.12))',
              padding: '0.5rem 0.75rem',
              margin: '0.5rem 0',
            }}
          >
            {renderTokens(bq.tokens as unknown as TokensList, codeBg)}
          </Panel>
        );
      }
      case 'hr':
        return <Divider key={i} />;
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
            key={i}
            data={data}
            columns={columns}
            constrainHeight={false}
          />
        );
      }
      case 'space':
        return null;
      default:
        return <Typography key={i}>{(t as Token).raw ?? ''}</Typography>;
    }
  });

export const Markdown: React.FC<MarkdownProps> = ({
  data,
  codeBackground,
  className,
  sx,
  ...rest
}) => {
  const { mode } = useTheme();
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
  const resolvedBg = codeBackground ?? (mode === 'dark' ? DARK_BG : LIGHT_BG);
  return (
    <Stack
      {...rest}
      className={className}
      sx={sx}
    >
      {renderTokens(tokens, resolvedBg)}
    </Stack>
  );
};

export default Markdown;
