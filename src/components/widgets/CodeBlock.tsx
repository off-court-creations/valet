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
      {/* The code is a scrollable region: give it a real accessible name and
          make it keyboard-focusable so non-pointer users can scroll long lines.
          The copy button carries its OWN label (not the region's). */}
      <div
        role='region'
        aria-label={ariaLabel ?? 'Code'}
        tabIndex={0}
        style={{ flex: 1, minWidth: 0 }}
      >
        <Markdown
          data={markdown}
          sx={{ margin: 0, width: '100%' }}
        />
      </div>
      <IconButton
        variant='outlined'
        size='md'
        icon='mdi:content-copy'
        aria-label='Copy code snippet'
        title={copyLabel ?? 'Copy'}
        onClick={handleCopy}
        sx={{
          marginLeft: stackControls ? 0 : theme.spacing(0.5),
          marginTop: stackControls ? theme.spacing(0.5) : theme.spacing(2),
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
