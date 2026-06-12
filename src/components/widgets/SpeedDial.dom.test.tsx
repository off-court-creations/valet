// ─────────────────────────────────────────────────────────────
// src/components/widgets/SpeedDial.dom.test.tsx | valet
// A11Y S4: disclosure ARIA (aria-expanded/aria-controls/role='group',
// per-action aria-labels) + a visible keyboard focus ring replacing the
// audited `outline:none` (WCAG 2.4.7). Dismissal behavior (Escape /
// outside-click / close-on-action) is OVERLAY S8's lane and is NOT
// asserted here.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import SpeedDial, { type SpeedDialAction } from './SpeedDial';
import * as sheet from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

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

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* raw path data keeps any Icon offline — but actions take ReactNode so a
   bare span is enough for these structural assertions. */
const dot = (key: string) => <span data-icon={key}>•</span>;

const actions: SpeedDialAction[] = [
  { icon: dot('a'), label: 'Share', onClick: () => {} },
  { icon: dot('b'), label: 'Print', onClick: () => {} },
];

/** Flatten every injected rule's text (de-nested children included). */
const allRuleTexts = () => {
  const out: string[] = [];
  const walk = (rules: CSSRuleList | undefined) => {
    if (!rules) return;
    for (const r of Array.from(rules)) {
      out.push(r.cssText);
      // Native CSS nesting: nested rules live under the parent rule.
      const nested = (r as unknown as { cssRules?: CSSRuleList }).cssRules;
      if (nested) walk(nested);
    }
  };
  walk(sheet.getGlobalSheet()?.cssRules);
  return out;
};

/* Suite ----------------------------------------------------------------- */
describe('SpeedDial a11y (jsdom)', () => {
  it("main FAB is a disclosure: aria-expanded reflects state and aria-controls points at the role='group' actions container", () => {
    const { container } = renderStrict(
      <SpeedDial
        icon={dot('main')}
        actions={actions}
      />,
    );

    const fab = container.querySelector('button[aria-label="Speed dial"]')! as HTMLButtonElement;
    expect(fab).toBeTruthy();

    /* Collapsed by default. */
    expect(fab.getAttribute('aria-expanded')).toBe('false');

    /* aria-controls resolves to a real role='group' element. */
    const controls = fab.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    const group = document.getElementById(controls!)!;
    expect(group).toBeTruthy();
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe('Speed dial actions');

    /* Toggling open flips aria-expanded (the only behavior A11Y S4 owns). */
    act(() => {
      fab.click();
    });
    expect(fab.getAttribute('aria-expanded')).toBe('true');
  });

  it('each action exposes an aria-label drawn from its label', () => {
    const { container } = renderStrict(
      <SpeedDial
        icon={dot('main')}
        actions={actions}
      />,
    );
    const group = document.getElementById(
      container.querySelector('button[aria-label="Speed dial"]')!.getAttribute('aria-controls')!,
    )!;
    const actionButtons = Array.from(group.querySelectorAll('button'));
    expect(actionButtons.map((b) => b.getAttribute('aria-label'))).toEqual(['Share', 'Print']);
  });

  it('replaces the audited outline:none with a visible :focus-visible ring on both buttons', () => {
    renderStrict(
      <SpeedDial
        icon={dot('main')}
        actions={actions}
      />,
    );
    const texts = allRuleTexts();

    /* No suppressed outline anywhere in the SpeedDial-injected rules. */
    expect(texts.some((t) => /outline:\s*none/.test(t))).toBe(false);

    /* A focus-visible outline rule exists (main FAB + action share the
       same pattern, so at least one such rule must be present). */
    const focusRules = texts.filter((t) => t.includes(':focus-visible') && /outline:/.test(t));
    expect(focusRules.length).toBeGreaterThan(0);
  });
});
