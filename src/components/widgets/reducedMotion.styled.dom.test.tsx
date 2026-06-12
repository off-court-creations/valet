// ─────────────────────────────────────────────────────────────
// src/components/widgets/reducedMotion.styled.dom.test.tsx | valet
// A11Y S5 — styled-CSS reduced-motion guards.
//
// For motion expressed in a styled() template the guard mechanism is a
// `@media (prefers-reduced-motion: reduce)` block, which jsdom cannot
// *evaluate* (it never matches a media query). The assertable fact is that
// the guard actually SHIPS in the generated CSS: rendering each component
// injects its rule into the live sheet, and the reduced-motion block must be
// present in (or nested under) that rule — right where its infinite/transition
// motion is declared.
//
// House style: createRoot + act, no @testing-library. We read the engine's
// live sheet (sheet.getGlobalSheet()), walking nested rules like the existing
// SpeedDial suite does. The source-level repo gate
// (src/system/reducedMotion.test.ts) proves every site is covered; this suite
// proves the guard reaches the runtime stylesheet for the styled sites.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import * as sheet from '../../css/sheet';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { LLMChat, type ChatMessage } from './LLMChat';
import { RichChat, type RichMessage } from './RichChat';
import SpeedDial, { type SpeedDialAction } from './SpeedDial';
import Snackbar from './Snackbar';
import { ProgressBar } from '../primitives/Progress';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver (surfaceStore/chat widgets construct them) */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const g = globalThis as { ResizeObserver?: unknown };
if (!g.ResizeObserver) g.ResizeObserver = ResizeObserverStub;

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];
function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<SurfaceCtx.Provider value={createSurfaceStore()}>{node}</SurfaceCtx.Provider>);
  });
  return container;
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/**
 * The styled rule whose top-level selector targets `.cls`, including its full
 * nested body. The engine injects each styled component as one rule with its
 * `@media`/`&:hover` children nested inside (native CSS nesting), so the
 * reduced-motion block lives in that rule's cssText.
 *
 * Scoped per-class on purpose: the engine's sheet is immortal and shared
 * across the whole process, so a repo-wide "is a guard anywhere?" check would
 * pass trivially once any earlier component injected one. We assert the guard
 * sits in THIS element's own rule.
 */
const ruleTextForClass = (cls: string): string => {
  const rules = sheet.getGlobalSheet()?.cssRules;
  if (!rules) return '';
  for (const r of Array.from(rules)) {
    const text = r.cssText;
    if (new RegExp(`(^|[\\s,])\\.${cls}\\b`).test(text.split('{')[0])) return text;
  }
  return '';
};

/** Assert the styled element carrying `infinite`/transition motion has its
    reduced-motion guard in its OWN injected rule. */
const expectGuardOnElement = (el: Element) => {
  const cls = el.className.split(' ').find((c) => c.startsWith('z-'));
  expect(cls, `expected a z-* styled class on ${el.tagName}`).toBeTruthy();
  const text = ruleTextForClass(cls!);
  expect(text, `no injected rule found for .${cls}`).not.toBe('');
  expect(/prefers-reduced-motion\s*:\s*reduce/.test(text)).toBe(true);
};

/* Suite --------------------------------------------------------------- */
describe('styled-CSS reduced-motion guards ship in the injected sheet (A11Y S5)', () => {
  /** The Typing indicator: a div whose only children are the 3 dot spans. */
  const typingIndicator = (c: HTMLElement): Element | undefined =>
    Array.from(c.querySelectorAll('div')).find(
      (d) =>
        d.children.length === 3 &&
        Array.from(d.children).every((ch) => ch.tagName === 'SPAN' && !ch.textContent),
    );

  it('LLMChat typing dots carry a prefers-reduced-motion guard in their own rule', () => {
    const messages: ChatMessage[] = [{ role: 'assistant', content: '', typing: true }];
    const c = render(
      <LLMChat
        messages={messages}
        disableInput
      />,
    );
    const dots = typingIndicator(c);
    expect(dots, 'typing dots not rendered').toBeTruthy();
    expectGuardOnElement(dots!);
  });

  it('RichChat typing dots carry a prefers-reduced-motion guard in their own rule', () => {
    const messages: RichMessage[] = [{ role: 'assistant', content: '', typing: true }];
    const c = render(
      <RichChat
        messages={messages}
        disableInput
      />,
    );
    const dots = typingIndicator(c);
    expect(dots, 'typing dots not rendered').toBeTruthy();
    expectGuardOnElement(dots!);
  });

  it('SpeedDial main FAB transitions carry a prefers-reduced-motion guard in its own rule', () => {
    const actions: SpeedDialAction[] = [
      { icon: <span>•</span>, label: 'Share', onClick: () => {} },
    ];
    const c = render(
      <SpeedDial
        icon={<span>+</span>}
        actions={actions}
      />,
    );
    const fab = c.querySelector('button[aria-label="Speed dial"]')!;
    expectGuardOnElement(fab);
    // The slide-out action buttons are guarded too (separate styled rule).
    const action = c.querySelector('button[aria-label="Share"]')!;
    expectGuardOnElement(action);
  });

  it('Snackbar enter/exit transition carries a prefers-reduced-motion guard in its own rule', () => {
    const c = render(<Snackbar open>hello</Snackbar>);
    const root = c.querySelector('[role="status"]')!;
    expectGuardOnElement(root);
  });

  it('Progress indeterminate bar animation carries a prefers-reduced-motion guard in its own rule', () => {
    // value omitted → indeterminate → the animated Bar rule is injected.
    const c = render(<ProgressBar />);
    // The animated bars live inside the track; pick one with a z-* class.
    const bar = Array.from(c.querySelectorAll('div')).find((d) =>
      d.className.split(' ').some((cl) => cl.startsWith('z-')),
    );
    // The Bar styled rule (with the @media guard) is injected; assert it ships.
    const guarded = Array.from(c.querySelectorAll('div')).some((d) => {
      const cls = d.className.split(' ').find((cl) => cl.startsWith('z-'));
      return cls ? /prefers-reduced-motion\s*:\s*reduce/.test(ruleTextForClass(cls)) : false;
    });
    expect(bar, 'no styled bar rendered').toBeTruthy();
    expect(guarded, 'no Progress bar rule carries a reduced-motion guard').toBe(true);
  });
});
