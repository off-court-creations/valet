// ─────────────────────────────────────────────────────────────
// src/components/widgets/Markdown.dom.test.tsx | valet
// PERF S11 — list items must render their marked token tree, not
// raw markdown source: inline formatting inside items, nested
// lists, fenced code routed through the block renderer, and HTML
// entities decoded exactly once.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Markdown from './Markdown';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { definePreset } from '../../css/stylePresets';

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

/** Render markdown under StrictMode inside a minimal Surface context. */
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

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('Markdown list-item token rendering (jsdom)', () => {
  it('renders bold/italic/links inside list items as elements, not literal markdown', () => {
    const container = renderMarkdown(
      [
        '- **bold** move',
        '- look at [the docs](https://example.com/docs)',
        '- *emphasis* too',
      ].join('\n'),
    );
    const items = container.querySelectorAll('ul > li');
    expect(items).toHaveLength(3);

    const strong = container.querySelector('li strong');
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe('bold');

    const link = container.querySelector('li a') as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('https://example.com/docs');
    expect(link!.textContent).toBe('the docs');

    const em = container.querySelector('li em');
    expect(em).not.toBeNull();
    expect(em!.textContent).toBe('emphasis');

    /* no raw markdown leaks */
    expect(container.textContent).not.toContain('**');
    expect(container.textContent).not.toContain('[the docs]');
    expect(container.textContent).not.toContain('(https://example.com/docs)');
  });

  it('renders nested lists as nested <ul>/<ol> instead of a raw dump', () => {
    const container = renderMarkdown(
      ['1. first', '   - alpha', '   - beta', '2. second'].join('\n'),
    );
    const ol = container.querySelector('ol');
    expect(ol).not.toBeNull();
    const topItems = ol!.querySelectorAll(':scope > li');
    expect(topItems).toHaveLength(2);

    const nested = topItems[0].querySelector('ul');
    expect(nested).not.toBeNull();
    const nestedItems = nested!.querySelectorAll(':scope > li');
    expect(nestedItems).toHaveLength(2);
    expect(nestedItems[0].textContent).toBe('alpha');
    expect(nestedItems[1].textContent).toBe('beta');

    /* the nested markers must not appear as literal text */
    expect(container.textContent).not.toContain('- alpha');
    expect(topItems[1].textContent).toBe('second');
  });

  it('renders fenced code inside a list item as a highlighted code block', () => {
    const container = renderMarkdown(
      ['- intro line', '  ```ts', '  const x: number = 1;', '  ```', '- after'].join('\n'),
    );
    const code = container.querySelector('li pre code');
    expect(code).not.toBeNull();
    expect(code!.className).toContain('hljs');
    expect(code!.className).toContain('language-ts');
    expect(code!.textContent).toContain('const x: number = 1;');

    /* fence markers never reach the DOM */
    expect(container.textContent).not.toContain('```');
    /* the leading text of the item still renders */
    const firstItem = container.querySelector('ul > li')!;
    expect(firstItem.textContent).toContain('intro line');
  });

  it('decodes HTML entities exactly once', () => {
    const container = renderMarkdown(
      ['Fish &amp; chips &amp;amp; crisps', '', '- AT&T &amp; &#65; &#x42;'].join('\n'),
    );
    /* paragraph: &amp; → &, but the double-escaped &amp;amp; only → &amp; */
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    expect(p!.textContent).toBe('Fish & chips &amp; crisps');

    /* list item: named + numeric + hex entities */
    const li = container.querySelector('li');
    expect(li).not.toBeNull();
    expect(li!.textContent).toBe('AT&T & A B');
  });

  it('renders task-list items with formatted inline content', () => {
    const container = renderMarkdown(['- [x] **done** thing', '- [ ] open thing'].join('\n'));
    const checks = container.querySelectorAll('li input[type="checkbox"]');
    expect(checks).toHaveLength(2);
    expect((checks[0] as HTMLInputElement).checked).toBe(true);
    expect((checks[1] as HTMLInputElement).checked).toBe(false);
    const strong = container.querySelector('li strong');
    expect(strong).not.toBeNull();
    expect(strong!.textContent).toBe('done');
    expect(container.textContent).not.toContain('**');
  });
});
