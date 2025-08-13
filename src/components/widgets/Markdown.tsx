// ─────────────────────────────────────────────────────────────
// src/components/widgets/Markdown.tsx | valet
// Lightweight Markdown renderer using valet primitives
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { marked } from 'marked';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import type { TokensList, Token, Tokens } from 'marked';
import Stack from '../layout/Stack';
import Typography, { type Variant } from '../primitives/Typography';
import Image from '../primitives/Image';
import Table, { type TableColumn } from './Table';

export interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Raw markdown text */
  data: string;
  /** Optional override for code block background */
  codeBackground?: string;
}

const renderInline = (tokens?: Token[]): React.ReactNode => {
  if (!tokens) return null;
  return tokens.map((t: Token, i: number) => {
    switch (t.type) {
      case 'strong':
        return <strong key={i}>{renderInline((t as Tokens.Strong).tokens)}</strong>;
      case 'em':
        return <em key={i}>{renderInline((t as Tokens.Em).tokens)}</em>;
      case 'codespan':
        return <code key={i}>{(t as Tokens.Codespan).text}</code>;
      case 'link': {
        const link = t as Tokens.Link;
        return (
          <a
            key={i}
            href={link.href}
            title={link.title ?? undefined}
          >
            {renderInline(link.tokens)}
          </a>
        );
      }
      case 'image': {
        const img = t as Tokens.Image;
        return (
          <Image
            key={i}
            src={img.href}
            alt={img.text}
            style={{ maxWidth: '100%' }}
          />
        );
      }
      case 'text':
        return (t as Tokens.Text).text;
      default:
        // Fallback to raw token text when no specific renderer exists
        return (t as Token).raw ?? '';
    }
  });
};

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang ?? '') ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
  }),
);

const renderTokens = (tokens: TokensList, codeBg?: string): React.ReactNode =>
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
            style={{ margin: '0.5rem 0' }}
          >
            {renderInline(p.tokens)}
          </Typography>
        );
      }
      case 'list': {
        const list = t as Tokens.List;
        return (
          <ul
            key={i}
            style={{ paddingLeft: '1.25rem' }}
          >
            {list.items.map((item: Tokens.ListItem, j: number) => (
              <li key={j}>{renderInline(item.tokens)}</li>
            ))}
          </ul>
        );
      }
      case 'code': {
        const code = t as Tokens.Code;
        return (
          <pre
            key={i}
            style={{
              margin: '0.5rem 0',
              overflowX: 'auto',
            }}
          >
            <code
              className={code.lang ? `hljs language-${code.lang}` : 'hljs'}
              style={{ background: codeBg }}
              dangerouslySetInnerHTML={{ __html: code.text }}
            />
          </pre>
        );
      }
      case 'table': {
        const table = t as Tokens.Table;
        const columns: TableColumn<Record<string, string>>[] = table.header.map(
          (h: Tokens.TableCell, idx: number) => ({
            header: renderInline(h.tokens),
            accessor: idx.toString() as keyof Record<string, string>,
          }),
        );
        const data = table.rows.map((row: Tokens.TableCell[]) => {
          const obj: Record<string, string> = {};
          row.forEach((cell: Tokens.TableCell, idx: number) => {
            obj[idx] = cell.text;
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
  style,
  ...rest
}) => {
  const tokens = React.useMemo(() => marked.lexer(data) as TokensList, [data]);
  return (
    <Stack
      {...rest}
      className={className}
      style={style}
    >
      {renderTokens(tokens, codeBackground)}
    </Stack>
  );
};

export default Markdown;
