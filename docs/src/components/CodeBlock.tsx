// ─────────────────────────────────────────────────────────────
// src/components/CodeBlock.tsx  | valet-docs
// Reusable code block with Markdown highlighting, copy button, and snackbar feedback
// ─────────────────────────────────────────────────────────────
import { Markdown, IconButton, Snackbar, useTheme } from '@archway/valet';
import { useState } from 'react';

export interface CodeBlockProps {
  code: string;
  language?: string;
  fullWidth?: boolean;
  ariaLabel?: string;
  title?: string;
}

export default function CodeBlock({
  code,
  language = 'typescript',
  fullWidth,
  ariaLabel,
  title,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { mode, theme } = useTheme();
  const isMultiline = code.includes('\n');
  const displayCode = isMultiline ? code.replace(/\n+$/, '') : code;
  const markdown = `\`\`\`${language}\n${displayCode}\n\`\`\``;

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(
      () => setCopied(true),
      () => setCopied(true),
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        width: fullWidth ? '100%' : 'fit-content',
      }}
    >
      <Markdown
        data={markdown}
        codeBackground={mode === 'dark' ? '#0d1117' : '#f6f8fa'}
        style={{ margin: 0, flex: 1 }}
      />
      <IconButton
        variant='outlined'
        size='sm'
        icon='mdi:content-copy'
        aria-label={ariaLabel ?? 'Copy code snippet'}
        title={title ?? 'Copy'}
        onClick={handleCopy}
        style={{
          marginLeft: theme.spacing(0.5),
          marginTop: theme.spacing(2),
        }}
      />
      {copied && (
        <Snackbar
          message='copied'
          onClose={() => setCopied(false)}
        />
      )}
    </div>
  );
}
