// ─────────────────────────────────────────────────────────────
// src/components/fields/IconButton.dom.test.tsx | valet
// IconButton runtime contract in jsdom — style precedence,
// polymorphic semantics, and the visible keyboard focus ring
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IconButton } from './IconButton';
import * as sheet from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode into a fresh container; tracked for cleanup. */
function renderStrict(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return { root, container };
}

/** Flatten every injected rule's text (de-nested children included). */
const allRuleTexts = () => {
  const out: string[] = [];
  const walk = (rules: CSSRuleList | undefined) => {
    if (!rules) return;
    for (const rule of Array.from(rules)) {
      out.push(rule.cssText);
      const nested = (rule as unknown as { cssRules?: CSSRuleList }).cssRules;
      if (nested) walk(nested);
    }
  };
  walk(sheet.getGlobalSheet()?.cssRules);
  return out;
};

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* raw path data keeps Icon offline (no Iconify fetch) ------------------ */
const PATH = 'M0 0h24v24H0z';

/* Suite ----------------------------------------------------------------- */
describe('IconButton (jsdom)', () => {
  it('merges a caller style prop instead of clobbering it (style < geometry < vars < sx)', () => {
    const { container } = renderStrict(
      <IconButton
        aria-label='probe'
        svg={PATH}
        style={
          {
            marginRight: '7px',
            marginTop: '3px',
            width: '11px',
            '--valet-intent-bg': 'red',
          } as React.CSSProperties
        }
        sx={{ marginTop: '9px' }}
      />,
    );
    const btn = container.querySelector('button')!;
    /* caller style survives the merge … */
    expect(btn.style.getPropertyValue('margin-right')).toBe('7px');
    /* … sx wins over caller style for the same property … */
    expect(btn.style.getPropertyValue('margin-top')).toBe('9px');
    /* … size-derived geometry wins over caller style … */
    expect(btn.style.getPropertyValue('width')).toBe('3rem');
    /* … and component-owned intent vars win over caller style. */
    expect(btn.style.getPropertyValue('--valet-intent-bg')).not.toBe('red');
    expect(btn.style.getPropertyValue('--valet-intent-bg')).not.toBe('');
  });

  it("as='a' renders a real anchor: href kept, `type` stripped", () => {
    const { container } = renderStrict(
      <IconButton
        as='a'
        href='#go'
        aria-label='probe'
        svg={PATH}
      />,
    );
    expect(container.querySelector('button')).toBeNull();
    const anchor = container.querySelector('a')!;
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('href')).toBe('#go');
    expect(anchor.hasAttribute('type')).toBe(false);
    expect(anchor.getAttribute('data-valet-component')).toBe('IconButton');
  });

  it("plain IconButton still defaults to type='button'", () => {
    const { container } = renderStrict(
      <IconButton
        aria-label='probe'
        svg={PATH}
      />,
    );
    expect(container.querySelector('button')!.getAttribute('type')).toBe('button');
  });

  it('uses the valet focus-ring tokens for keyboard-visible focus', () => {
    renderStrict(
      <IconButton
        aria-label='probe'
        svg={PATH}
      />,
    );
    const focusRule = allRuleTexts().find(
      (text) => text.includes(':focus-visible:not(:disabled)') && text.includes('outline:'),
    );

    expect(focusRule).toContain('data-valet-navigation-focus');
    expect(focusRule).toContain(':focus:not(:disabled)');
    expect(focusRule).toContain('var(--valet-focus-width, 2px)');
    expect(focusRule).toContain(
      'var(--valet-focus-ring-color, var(--valet-intent-focus, currentColor))',
    );
    expect(focusRule).toContain('var(--valet-focus-offset, 2px)');
  });
});
