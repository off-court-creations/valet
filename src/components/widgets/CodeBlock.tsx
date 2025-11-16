// ─────────────────────────────────────────────────────────────
// src/components/widgets/CodeBlock.tsx  | valet
// Reusable code block with Markdown highlighting, copy button, and snackbar feedback
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
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
  ariaLabel?: string;
  title?: string;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  ariaLabel,
  title,
  className,
  preset: p,
  sx,
  ...rest
}) => {
  const [copied, setCopied] = useState(false);
  const { mode, theme } = useTheme();
  const isMultiline = code.includes('\n');
  const displayCode = isMultiline ? code.replace(/\n+$/, '') : code;
  const markdown = `\`\`\`${language}\n${displayCode}\n\`\`\``;

  // Width awareness: detect horizontal overflow inside the rendered <pre>
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stackControls, setStackControls] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const root = containerRef.current;
      if (!root) return;
      const pre = root.querySelector('pre');
      if (!pre) return;
      const el = pre as HTMLElement;
      // Compare scrollable width vs visible width
      const overflow = el.scrollWidth - el.clientWidth > 1;
      setStackControls(overflow);
    };

    // Initial check after paint
    const id = window.requestAnimationFrame(checkOverflow);

    // React to size/content changes
    const ro = new ResizeObserver(checkOverflow);
    const mo = new MutationObserver(checkOverflow);
    const pre = containerRef.current?.querySelector('pre');
    if (pre) {
      ro.observe(pre);
      mo.observe(pre, { childList: true, subtree: true, characterData: true });
    }
    const onResize = () => checkOverflow();
    window.addEventListener('resize', onResize);
    return () => {
      window.cancelAnimationFrame(id);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      mo.disconnect();
    };
  }, [code, language, mode]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(
      () => setCopied(true),
      () => setCopied(true),
    );
  };

  const presetCls = p ? preset(p) : '';
  return (
    <div
      {...rest}
      ref={containerRef}
      className={[presetCls, className].filter(Boolean).join(' ')}
      data-valet-component='CodeBlock'
      style={{
        display: 'flex',
        flexDirection: stackControls ? ('column' as const) : ('row' as const),
        alignItems: 'flex-start',
        width: '100%',
        ...(sx || {}),
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <Markdown
          data={markdown}
          codeBackground={mode === 'dark' ? '#0d1117' : '#f6f8fa'}
          sx={{ margin: 0, width: '100%' }}
        />
      </div>
      <IconButton
        variant='outlined'
        size='sm'
        icon='mdi:content-copy'
        aria-label={ariaLabel ?? 'Copy code snippet'}
        title={title ?? 'Copy'}
        onClick={handleCopy}
        sx={{
          marginLeft: stackControls ? 0 : theme.spacing(0.5),
          marginTop: stackControls ? theme.spacing(0.5) : theme.spacing(2),
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
