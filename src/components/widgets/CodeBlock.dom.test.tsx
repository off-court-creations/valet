// ─────────────────────────────────────────────────────────────
// src/components/widgets/CodeBlock.dom.test.tsx | valet
// CodeBlock — renders highlighted code via Markdown's fenced-code path,
// exposes a labelled copy button, and copies to the clipboard on click.
//
// CodeBlock embeds Markdown (→ Typography/Panel, needs a Surface) and
// Snackbar, so the tree lives inside a Surface context with a
// ResizeObserver stub, the docs-app `codePanel` preset registered, and
// a stubbed navigator.clipboard. highlight.js runs synchronously and is
// fine in jsdom; the overflow ResizeObserver/MutationObserver wiring is
// exercised but not asserted (jsdom reports zero geometry).
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CodeBlock } from './CodeBlock';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { definePreset } from '../../css/stylePresets';

/* Markdown's fenced-code Panel references the app-defined `codePanel`
   preset (the docs app registers it in globalPresets.ts). --------------- */
definePreset('codePanel', (t) => `padding: ${t.spacing(1)};`);

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface + CodeBlock construct one ----- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];
let writeText: ReturnType<typeof vi.fn>;

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

const blockEl = (c: HTMLElement) =>
  c.querySelector('[data-valet-component="CodeBlock"]') as HTMLElement;
const copyBtn = (c: HTMLElement) =>
  c.querySelector('button[aria-label]') as HTMLButtonElement | null;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  writeText = vi.fn(() => Promise.resolve());
  // jsdom has no clipboard; provide a writeText that the copy handler awaits.
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.unstubAllGlobals();
});

/* Suite ----------------------------------------------------------------- */
describe('CodeBlock (jsdom)', () => {
  it('renders the code through highlight.js (<code class="hljs ...">)', () => {
    const c = render(
      <CodeBlock
        code={'const x = 1;'}
        language='typescript'
      />,
    );
    expect(blockEl(c)).not.toBeNull();
    const code = c.querySelector('code');
    expect(code).not.toBeNull();
    expect(code!.className).toContain('hljs');
    expect(code!.className).toContain('language-typescript');
    expect(code!.textContent).toContain('const x = 1;');
  });

  it('exposes a labelled copy button with the default aria-label', () => {
    const c = render(<CodeBlock code='hello()' />);
    const btn = copyBtn(c);
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute('aria-label')).toBe('Copy code snippet');
  });

  it('honours a custom ariaLabel + title on the copy button', () => {
    const c = render(
      <CodeBlock
        code='hi'
        ariaLabel='Copy sample'
        title='Copy it'
      />,
    );
    const btn = copyBtn(c)!;
    expect(btn.getAttribute('aria-label')).toBe('Copy sample');
    expect(btn.getAttribute('title')).toBe('Copy it');
  });

  it('writes the code to the clipboard when the copy button is clicked', async () => {
    const c = render(<CodeBlock code={'copy-me()'} />);
    const btn = copyBtn(c)!;
    await act(async () => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('copy-me()');
  });
});
