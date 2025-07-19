// ─────────────────────────────────────────────────────────────
// src/components/widgets/Markdown.tsx  | valet
// Minimal markdown renderer using valet primitives
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { marked, type Tokens } from 'marked';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
import { Typography } from '../primitives/Typography';
import Image from '../primitives/Image';
import { Table, type TableColumn } from './Table';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

export interface MarkdownProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  /** Raw markdown string */
  data: string;
}

function inline(tokens: Tokens.Generic[] = []): React.ReactNode[] {
  return tokens.map((t, i) => {
    switch (t.type) {
      case 'strong':
        return <strong key={i}>{inline(t.tokens)}</strong>;
      case 'em':
        return <em key={i}>{inline(t.tokens)}</em>;
      case 'codespan':
        return <code key={i}>{t.text}</code>;
      case 'link':
        return (
          <a key={i} href={t.href} title={t.title ?? undefined}>
            {inline(t.tokens)}
          </a>
        );
      case 'image':
        return <Image key={i} src={t.href} alt={t.text} />;
      case 'text':
        return t.text;
      default:
        return null;
    }
  });
}

function blocks(tokens: Tokens.Generic[]): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  tokens.forEach((t, i) => {
    if (t.type === 'space') return;
    switch (t.type) {
      case 'heading':
        out.push(
          <Typography key={i} variant={`h${t.depth}` as any} bold>
            {inline(t.tokens)}
          </Typography>,
        );
        break;
      case 'paragraph':
        out.push(
          <Typography key={i} variant="body">
            {inline(t.tokens)}
          </Typography>,
        );
        break;
      case 'list':
        out.push(
          React.createElement(
            t.ordered ? 'ol' : 'ul',
            { key: i },
            t.items.map((item: Tokens.ListItem, j: number) => (
              <li key={j}>{inline(item.tokens)}</li>
            )),
          ),
        );
        break;
      case 'code':
        out.push(
          <Panel key={i} preset="codePanel">
            <pre style={{ margin: 0 }}>{t.text}</pre>
          </Panel>,
        );
        break;
      case 'blockquote':
        out.push(
          <Panel key={i} style={{ borderLeft: '4px solid currentColor' }}>
            {blocks(t.tokens ?? [])}
          </Panel>,
        );
        break;
      case 'image':
        out.push(<Image key={i} src={t.href} alt={t.text} />);
        break;
      case 'table': {
        const columns: TableColumn<Record<string, React.ReactNode>>[] = t.header.map(
          (cell: Tokens.TableCell, c: number) => ({
            header: inline(cell.tokens),
            accessor: `c${c}`,
          }),
        );
        const data = t.rows.map((row: Tokens.TableCell[]) => {
          const obj: Record<string, React.ReactNode> = {};
          row.forEach((cell: Tokens.TableCell, c: number) => {
            obj[`c${c}`] = inline(cell.tokens);
          });
          return obj;
        });
        out.push(
          <Table key={i} data={data} columns={columns} constrainHeight={false} />,
        );
        break;
      }
      default:
        break;
    }
  });
  return out;
}

export const Markdown: React.FC<MarkdownProps> = ({
  data,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const tokens = marked.lexer(data);
  const cls = p ? preset(p) : '';
  return (
    <Stack {...rest} className={[cls, className].filter(Boolean).join(' ')} style={style}>
      {blocks(tokens)}
    </Stack>
  );
};

export default Markdown;
