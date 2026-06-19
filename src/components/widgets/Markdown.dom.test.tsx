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
import Markdown, { isSafeHref, isSafeImageSrc, isExternalHref } from './Markdown';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* NOTE: intentionally NO `definePreset('codePanel')` here. The library must
   render fenced code with ZERO app-level preset registration — Markdown uses
   Panel's own `pad` API, not an app preset. If a fence ever throws "Unknown
   style preset codePanel" again, this suite (it renders fences) catches the
   1.0 blocker regression. */

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

/* XSS defense (SECURITY — 1.0 regression guard) ------------------------- */
// The renderer is lexer-only (no marked HTML serializer): raw HTML tokens fall
// through to React-escaped text, and link/image URLs are scheme-allowlisted
// (isSafeHref / isSafeImageSrc). These cases lock that in.
describe('Markdown XSS defense (jsdom)', () => {
  it('renders raw <script> HTML as inert escaped text — no script element', () => {
    const container = renderMarkdown('hello <script>window.__pwned = 1</script> world');
    expect(container.querySelector('script')).toBeNull();
    // The angle-bracketed markup survives as visible text, not as a DOM node.
    expect(container.textContent).toContain('<script>');
    expect(
      (globalThis as unknown as { __pwned?: number }).__pwned,
      'inline script must never execute',
    ).toBeUndefined();
  });

  it('does not create an <img onerror> handler from raw HTML', () => {
    const container = renderMarkdown('<img src=x onerror="window.__pwned = 1">');
    const img = container.querySelector('img');
    // Raw HTML is escaped to text; no element (and thus no onerror) is created.
    expect(img).toBeNull();
    expect((globalThis as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  it('strips a javascript: link href (scheme not in the allowlist)', () => {
    const container = renderMarkdown('[click me](javascript:window.__pwned=1)');
    const a = container.querySelector('a');
    // Either no anchor href, or a sanitized one — never a javascript: URL.
    const href = a?.getAttribute('href') ?? '';
    expect(href.toLowerCase()).not.toContain('javascript:');
  });

  it('preserves a normal https link href (positive control)', () => {
    const container = renderMarkdown('[safe](https://example.com/path)');
    const a = container.querySelector('a');
    expect(a).not.toBeNull();
    expect(a!.getAttribute('href')).toBe('https://example.com/path');
  });

  it('rejects a non-image data: URL on an image', () => {
    const container = renderMarkdown('![x](data:text/html;base64,PHNjcmlwdD4=)');
    const img = container.querySelector('img');
    const src = img?.getAttribute('src') ?? '';
    expect(src).not.toContain('data:text/html');
  });
});

/* URL sanitiser — obfuscation defence (SECURITY, 1.0 major) ------------- */
// Direct unit tests: browsers strip control chars + whitespace before resolving
// a scheme, so the allow-list must too. These exercise the stripped-probe path
// regardless of how the upstream lexer happens to tokenize the destination.
describe('isSafeHref / isSafeImageSrc obfuscation defence', () => {
  it('rejects a leading-control-char javascript: href', () => {
    expect(isSafeHref('javascript:alert(1)')).toBeNull();
  });
  it('rejects an internal-whitespace java\\tscript: href', () => {
    expect(isSafeHref('java\tscript:alert(1)')).toBeNull();
    expect(isSafeHref('java\nscript:alert(1)')).toBeNull();
  });
  it('rejects a control-char-obfuscated data:text/html href and image src', () => {
    expect(isSafeHref('data:text/html,<script>1</script>')).toBeNull();
    expect(isSafeImageSrc('data:text/html;base64,PHN2Zz4=')).toBeNull();
    expect(isSafeImageSrc('da\tta:text/html;base64,PHN2Zz4=')).toBeNull();
  });
  it('still passes legitimate hrefs/srcs verbatim', () => {
    expect(isSafeHref('https://example.com/p?q=1')).toBe('https://example.com/p?q=1');
    expect(isSafeHref('#anchor')).toBe('#anchor');
    expect(isSafeHref('/rel/path')).toBe('/rel/path');
    expect(isSafeHref('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(isSafeImageSrc('data:image/png;base64,iVBORw0KGgo=')).toBe(
      'data:image/png;base64,iVBORw0KGgo=',
    );
    expect(isSafeImageSrc('https://cdn.example.com/x.png')).toBe('https://cdn.example.com/x.png');
  });
  it('classifies external vs in-document hrefs for rel hardening', () => {
    expect(isExternalHref('https://example.com')).toBe(true);
    expect(isExternalHref('//cdn.example.com')).toBe(true);
    expect(isExternalHref('#anchor')).toBe(false);
    expect(isExternalHref('/rel/path')).toBe(false);
    expect(isExternalHref('mailto:a@b.com')).toBe(false);
  });
});

/* Link hardening (Q1 — rel + focusable) -------------------------------- */
describe('Markdown link hardening (jsdom)', () => {
  it('adds rel="noopener noreferrer" to external links only', () => {
    const container = renderMarkdown(
      ['[ext](https://example.com)', '', '[rel](/local/path)', '', '[anchor](#h)'].join('\n'),
    );
    const links = Array.from(container.querySelectorAll('a')) as HTMLAnchorElement[];
    const byText = (t: string) => links.find((a) => a.textContent === t)!;
    expect(byText('ext').getAttribute('rel')).toBe('noopener noreferrer');
    expect(byText('rel').getAttribute('rel')).toBeNull();
    expect(byText('anchor').getAttribute('rel')).toBeNull();
  });
});

/* Ordered lists (minor — start=0) -------------------------------------- */
describe('Markdown ordered-list start', () => {
  it('keeps start=0 instead of defaulting to 1', () => {
    const container = renderMarkdown(['0. zero', '1. one'].join('\n'));
    const ol = container.querySelector('ol');
    expect(ol).not.toBeNull();
    expect(ol!.getAttribute('start')).toBe('0');
  });
  it('preserves an explicit non-zero start', () => {
    const container = renderMarkdown(['5. five', '6. six'].join('\n'));
    const ol = container.querySelector('ol');
    expect(ol!.getAttribute('start')).toBe('5');
  });
});
