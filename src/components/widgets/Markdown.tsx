// ─────────────────────────────────────────────────────────────
// src/components/widgets/Markdown.tsx | valet
// Lightweight Markdown renderer using valet primitives
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { marked } from 'marked';
import type { TokensList, Token, Tokens } from 'marked';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
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
        return <strong key={i}>{renderInline(t.tokens)}</strong>;
      case 'em':
        return <em key={i}>{renderInline(t.tokens)}</em>;
      case 'codespan':
        return <code key={i}>{(t as Tokens.Codespan).text}</code>;
      case 'link':
        return (
          <a key={i} href={t.href} title={t.title}>
            {renderInline(t.tokens)}
          </a>
        );
      case 'image':
        return (
          <Image
            key={i}
            src={(t as Tokens.Image).href}
            alt={(t as Tokens.Image).text}
            style={{ maxWidth: '100%' }}
          />
        );
      case 'text':
        return (t as Tokens.Text).text;
      default:
        return (t as any).raw || '';
    }
  });
};

const renderTokens = (tokens: TokensList, codeBg?: string): React.ReactNode =>
  tokens.map((t: Token, i: number) => {
    switch (t.type) {
      case 'heading':
        const variant = (`h${t.depth}`) as Variant;
        return (
          <Typography key={i} variant={variant} bold>
            {renderInline(t.tokens)}
          </Typography>
        );
      case 'paragraph':
        return (
          <Typography key={i} style={{ margin: '0.5rem 0' }}>
            {renderInline(t.tokens)}
          </Typography>
        );
      case 'list':
        return (
          <ul key={i} style={{ paddingLeft: '1.25rem' }}>
            {t.items.map((item: Tokens.ListItem, j: number) => (
              <li key={j}>{renderInline(item.tokens)}</li>
            ))}
          </ul>
        );
      case 'code':
        return (
          <Panel
            key={i}
            preset="codePanel"
            background={codeBg}
            style={{ margin: '0.5rem 0' }}
          >
            <code>{t.text}</code>
          </Panel>
        );
      case 'table':
        const columns: TableColumn<Record<string, string>>[] = t.header.map((h: Tokens.TableCell, idx: number) => ({
          header: renderInline(h.tokens),
          accessor: idx.toString() as any,
        }));
        const data = t.rows.map((row: Tokens.TableCell[]) => {
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
      case 'space':
        return null;
      default:
        return (
          <Typography key={i}>
            {('raw' in t && (t as any).raw) || ''}
          </Typography>
        );
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
    <Stack {...rest} className={className} style={style}>
      {renderTokens(tokens, codeBackground)}
    </Stack>
  );
};

export default Markdown;
