// ─────────────────────────────────────────────────────────────
// src/components/widgets/CodeBlock.tsx  | valet
// Reusable code block with Markdown highlighting, copy button, and snackbar feedback
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import IconButton from '../fields/IconButton';
import { Markdown } from './Markdown';
import Snackbar from './Snackbar';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';

export interface CodeBlockProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable {
  code: string;
  language?: string;
  /** Accessible name for the (scrollable, focusable) code region. */
  ariaLabel?: string;
  /** Tooltip/title for the copy button (default "Copy"). */
  copyLabel?: string;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  ariaLabel,
  copyLabel,
  className,
  preset: p,
  sx,
  ...rest
}) => {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const { theme } = useTheme();
  const isMultiline = code.includes('\n');
  const displayCode = isMultiline ? code.replace(/\n+$/, '') : code;
  const markdown = `\`\`\`${language}\n${displayCode}\n\`\`\``;

  const handleCopy = () => {
    // navigator.clipboard is undefined on insecure (HTTP) origins / older
    // browsers — calling .writeText on it throws. Guard, and report failure
    // honestly instead of claiming success on the reject path.
    const clip = navigator.clipboard;
    if (!clip?.writeText) {
      setCopyState('failed');
      return;
    }
    clip.writeText(code).then(
      () => setCopyState('copied'),
      () => setCopyState('failed'),
    );
  };

  const presetCls = p ? preset(p) : '';
  return (
    <div
      {...rest}
      className={[presetCls, className].filter(Boolean).join(' ')}
      data-valet-component='CodeBlock'
      /* Relative so the copy button floats in the block's top-inline-end corner
         (inside its border) — long lines scroll under the pinned button. */
      style={{ position: 'relative', width: '100%', ...(sx || {}) }}
    >
      {/* The code is a scrollable region: give it a real accessible name and
          make it keyboard-focusable so non-pointer users can scroll long lines.
          The copy button carries its OWN label (not the region's). */}
      <div
        role='region'
        aria-label={ariaLabel ?? 'Code'}
        tabIndex={0}
        style={{ width: '100%', minWidth: 0 }}
      >
        <Markdown
          data={markdown}
          sx={{ margin: 0, width: '100%' }}
        />
      </div>
      <IconButton
        variant='outlined'
        size='sm'
        icon='mdi:content-copy'
        aria-label='Copy code snippet'
        title={copyLabel ?? 'Copy'}
        onClick={handleCopy}
        sx={{
          // Pinned inside the block, top-inline-end; a solid backdrop keeps it
          // legible over the code, and zIndex lifts it above the scroll layer.
          position: 'absolute',
          top: theme.spacing(0.5),
          insetInlineEnd: theme.spacing(0.5),
          zIndex: 1,
          background: theme.colors.backgroundAlt,
        }}
      />
      {copyState !== 'idle' && (
        <Snackbar
          message={copyState === 'copied' ? 'Copied' : 'Copy failed'}
          {...(copyState === 'failed'
            ? { role: 'alert' as const, 'aria-live': 'assertive' as const }
            : {})}
          onClose={() => setCopyState('idle')}
        />
      )}
    </div>
  );
};

export default CodeBlock;
