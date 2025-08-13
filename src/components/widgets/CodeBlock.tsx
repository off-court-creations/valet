// ─────────────────────────────────────────────────────────────
// src/components/widgets/CodeBlock.tsx  | valet
// Reusable code block with Markdown highlighting, copy button, and snackbar feedback
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import IconButton from '../fields/IconButton';
import { Markdown } from './Markdown';
import Snackbar from './Snackbar';
import { useTheme } from '../../system/themeStore';

export interface CodeBlockProps {
  code: string;
  language?: string;
  ariaLabel?: string;
  title?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  ariaLabel,
  title,
}) => {
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
        width: '100%',
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
};

export default CodeBlock;
