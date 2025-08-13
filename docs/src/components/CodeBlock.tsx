// ─────────────────────────────────────────────────────────────
// src/components/CodeBlock.tsx  | valet-docs
// Reusable code block with syntax highlighting, copy button, and snackbar feedback
// ─────────────────────────────────────────────────────────────
import { Panel, Stack, IconButton, Snackbar, Markdown } from '@archway/valet';
import { useState } from 'react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  fullWidth?: boolean;
  ariaLabel?: string;
  title?: string;
}

export default function CodeBlock({ code, language, fullWidth, ariaLabel, title }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const isMultiline = code.includes('\n');
  const displayCode = isMultiline ? code.replace(/\n+$/, '') : code;
  const markdown = '```' + (language ?? '') + '\n' + displayCode + '\n```';

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(
      () => setCopied(true),
      () => setCopied(true),
    );
  };

  return (
    <Panel fullWidth={fullWidth ?? false}>
      <Stack
        direction='row'
        wrap={false}
        style={{
          justifyContent: 'space-between',
          alignItems: isMultiline ? 'flex-start' : 'center',
        }}
      >
        <Markdown
          data={markdown}
          codeBackground='transparent'
        />
        <IconButton
          variant='outlined'
          size='sm'
          icon='mdi:content-copy'
          aria-label={ariaLabel ?? 'Copy code snippet'}
          title={title ?? 'Copy'}
          onClick={handleCopy}
        />
      </Stack>
      {copied && (
        <Snackbar
          message='copied'
          onClose={() => setCopied(false)}
        />
      )}
    </Panel>
  );
}
