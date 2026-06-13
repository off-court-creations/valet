// ─────────────────────────────────────────────────────────────
// src/system/highlight.dom.test.tsx | valet
// PACKAGING S6 (ruling Q22(a)) — curated highlight.js registry:
// the 13 curated grammars (and their aliases) are registered and
// produce hljs token spans through Markdown's fenced-code path;
// unregistered fences fall back to 'plaintext' without crashing;
// registerHighlightLanguage() extends the shared instance so a
// consumer-registered grammar highlights on the next render.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { LanguageFn } from 'highlight.js';
import hljs, { registerHighlightLanguage } from './highlight';
import Markdown from '../components/widgets/Markdown';
import { SurfaceCtx, createSurfaceStore } from './surfaceStore';
import { definePreset } from '../css/stylePresets';

/* Markdown's fenced-code Panel references the app-defined `codePanel`
   preset (the docs app registers it in globalPresets.ts) ------------- */
definePreset('codePanel', (t) => `padding: ${t.spacing(1)};`);

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; surfaceStore constructs one ----------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const g = globalThis as { ResizeObserver?: unknown };
if (!g.ResizeObserver) g.ResizeObserver = ResizeObserverStub;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function renderMarkdown(data: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(
      <React.StrictMode>
        <SurfaceCtx.Provider value={createSurfaceStore()}>
          <Markdown data={data} />
        </SurfaceCtx.Provider>
      </React.StrictMode>,
    );
  });
  return container;
}

const fence = (lang: string, code: string) => `\`\`\`${lang}\n${code}\n\`\`\``;

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('curated highlight registry (jsdom)', () => {
  it('registers all 13 curated grammars under their canonical names', () => {
    const curated = [
      'typescript',
      'javascript',
      'xml',
      'css',
      'json',
      'bash',
      'shell',
      'python',
      'yaml',
      'markdown',
      'diff',
      'sql',
      'plaintext',
    ];
    for (const name of curated) {
      expect(hljs.getLanguage(name), `grammar '${name}' missing`).toBeDefined();
    }
  });

  it('resolves the common aliases the grammars declare', () => {
    for (const alias of [
      'ts',
      'tsx',
      'js',
      'jsx',
      'html',
      'sh',
      'py',
      'yml',
      'md',
      'patch',
      'txt',
    ]) {
      expect(hljs.getLanguage(alias), `alias '${alias}' missing`).toBeDefined();
    }
  });

  it('highlights a ts fence into hljs token spans', () => {
    const container = renderMarkdown(fence('ts', "const greeting: string = 'hi';"));
    const code = container.querySelector('code.hljs');
    expect(code).not.toBeNull();
    expect(code!.className).toContain('language-ts');
    /* token spans, not escaped plain text */
    expect(code!.querySelectorAll('span.hljs-keyword').length).toBeGreaterThan(0);
    expect(code!.querySelectorAll('span.hljs-string').length).toBeGreaterThan(0);
    expect(code!.textContent).toContain("const greeting: string = 'hi';");
  });

  it('renders an unregistered fence as plaintext without crashing', () => {
    const source = 'main = putStrLn "const notTs = 1;"';
    const container = renderMarkdown(fence('brainfudge', source));
    const code = container.querySelector('code.hljs');
    expect(code).not.toBeNull();
    expect(code!.className).toContain('language-plaintext');
    /* plaintext emits no token spans and preserves the source verbatim */
    expect(code!.querySelectorAll('span').length).toBe(0);
    expect(code!.textContent).toBe(source);
  });

  it('renders a fence with no language tag as plaintext', () => {
    const container = renderMarkdown('```\nno language here\n```');
    const code = container.querySelector('code.hljs');
    expect(code).not.toBeNull();
    expect(code!.className).toContain('language-plaintext');
    expect(code!.textContent).toBe('no language here');
  });

  it('registerHighlightLanguage makes a new grammar highlight through Markdown', () => {
    const fooLang: LanguageFn = () => ({
      name: 'foolang',
      keywords: 'valet overhaul',
      contains: [],
    });

    /* before registration: unknown → plaintext fallback */
    expect(hljs.getLanguage('foolang')).toBeUndefined();
    const before = renderMarkdown(fence('foolang', 'valet ships the overhaul'));
    const codeBefore = before.querySelector('code.hljs')!;
    expect(codeBefore.className).toContain('language-plaintext');
    expect(codeBefore.querySelectorAll('span').length).toBe(0);

    registerHighlightLanguage('foolang', fooLang);

    /* after registration: the shared instance highlights the fence */
    expect(hljs.getLanguage('foolang')).toBeDefined();
    const after = renderMarkdown(fence('foolang', 'valet ships the overhaul'));
    const codeAfter = after.querySelector('code.hljs')!;
    expect(codeAfter.className).toContain('language-foolang');
    const keywords = Array.from(codeAfter.querySelectorAll('span.hljs-keyword')).map(
      (s) => s.textContent,
    );
    expect(keywords).toEqual(['valet', 'overhaul']);
  });
});
