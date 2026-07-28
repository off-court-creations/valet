// ─────────────────────────────────────────────────────────────
// src/components/fields/Button.dom.test.tsx | valet
// Button runtime contract in jsdom — style precedence, polymorphic
// semantics, intent variables, and the visible keyboard focus ring
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Button } from './Button';
import * as sheet from '../../css/sheet';

/* String children mount <Typography>, which requires a <Surface> provider —
   element children pass straight through, keeping this suite Surface-free. */

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

/* Suite ----------------------------------------------------------------- */
describe('Button (jsdom)', () => {
  it('merges a caller style prop instead of clobbering it (style < intent vars < sx)', () => {
    const { container } = renderStrict(
      <Button
        style={
          {
            marginRight: '7px',
            marginTop: '3px',
            '--valet-intent-bg': 'red',
          } as React.CSSProperties
        }
        sx={{ marginTop: '9px' }}
      >
        <span>Go</span>
      </Button>,
    );
    const btn = container.querySelector('button')!;
    /* caller style survives the merge … */
    expect(btn.style.getPropertyValue('margin-right')).toBe('7px');
    /* … sx wins over caller style for the same property … */
    expect(btn.style.getPropertyValue('margin-top')).toBe('9px');
    /* … and component-owned intent vars win over caller style. */
    expect(btn.style.getPropertyValue('--valet-intent-bg')).not.toBe('red');
    expect(btn.style.getPropertyValue('--valet-intent-bg')).not.toBe('');
  });

  it("as='a' renders a real anchor: href kept, `type` stripped, role untouched", () => {
    const { container } = renderStrict(
      <Button
        as='a'
        href='#go'
      >
        <span>Go</span>
      </Button>,
    );
    expect(container.querySelector('button')).toBeNull();
    const anchor = container.querySelector('a')!;
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('href')).toBe('#go');
    expect(anchor.hasAttribute('type')).toBe(false);
    expect(anchor.getAttribute('data-valet-component')).toBe('Button');
  });

  it("plain Button still defaults to type='button'", () => {
    const { container } = renderStrict(
      <Button>
        <span>Go</span>
      </Button>,
    );
    expect(container.querySelector('button')!.getAttribute('type')).toBe('button');
  });

  it('uses the valet focus-ring tokens for keyboard-visible focus', () => {
    renderStrict(
      <Button>
        <span>Go</span>
      </Button>,
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

  /* API-TYPES S13 — the intent-var contract moved to the shared
     computeIntentVars helper. This characterization pins the default
     filled-Button output (intent=primary, dark theme) so the refactor is
     provably behaviour-preserving. */
  it('emits the same intent CSS variables after the shared-helper refactor (characterization)', () => {
    const { container } = renderStrict(
      <Button intent='primary'>
        <span>Go</span>
      </Button>,
    );
    const s = container.querySelector('button')!.style;
    expect(s.getPropertyValue('--valet-intent-bg')).toBe('#0E65C0');
    expect(s.getPropertyValue('--valet-intent-fg')).toBe('#F7F7F7');
    expect(s.getPropertyValue('--valet-intent-border')).toBe('#488ace');
    expect(s.getPropertyValue('--valet-intent-focus')).toBe('#0E65C0');
    expect(s.getPropertyValue('--valet-intent-bg-hover')).toBe('#317bc8');
    expect(s.getPropertyValue('--valet-intent-bg-active')).toBe('#488ace');
    expect(s.getPropertyValue('--valet-intent-fg-disabled')).toBe('#878787');
    // the non-intent label var is still set alongside
    expect(s.getPropertyValue('--valet-text-color')).toBe('#F7F7F7');
  });
});
