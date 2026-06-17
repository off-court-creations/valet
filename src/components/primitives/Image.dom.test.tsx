// ─────────────────────────────────────────────────────────────
// src/components/primitives/Image.dom.test.tsx | valet
// Image — src/alt forwarding, the lazy-loading + async-decoding
// defaults, non-draggable-by-default with a preventDefault dragstart
// guard, and width/height/object-fit landing in the styled rule.
//
// Image is a pure styled <img> (no theme/surface), so no Surface
// wrapper is required.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Image } from './Image';
import * as sheet from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return container;
}

const img = (c: HTMLElement) => c.querySelector('img') as HTMLImageElement;

/** The CSS rule text for the element's first (styled) class. */
const ruleFor = (el: Element) => {
  const cls = el.className.split(' ').find(Boolean) ?? '';
  const rules = Array.from(sheet.getGlobalSheet()?.cssRules ?? [], (r) => r.cssText);
  return rules.find((t) => t.startsWith(`.${cls}`)) ?? '';
};

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ----------------------------------------------------------------- */
describe('Image (jsdom)', () => {
  it('forwards src + alt', () => {
    const el = img(
      render(
        <Image
          src='/cat.png'
          alt='A cat'
        />,
      ),
    );
    expect(el.getAttribute('src')).toBe('/cat.png');
    expect(el.getAttribute('alt')).toBe('A cat');
  });

  it('renders the empty alt for decorative images', () => {
    const el = img(
      render(
        <Image
          src='/deco.png'
          alt=''
        />,
      ),
    );
    expect(el.getAttribute('alt')).toBe('');
  });

  it('lazy-loads and decodes async by default', () => {
    const el = img(
      render(
        <Image
          src='/x.png'
          alt='x'
        />,
      ),
    );
    expect(el.getAttribute('loading')).toBe('lazy');
    expect(el.getAttribute('decoding')).toBe('async');
  });

  it('respects an explicit loading override', () => {
    const el = img(
      render(
        <Image
          src='/x.png'
          alt='x'
          loading='eager'
        />,
      ),
    );
    expect(el.getAttribute('loading')).toBe('eager');
  });

  it('is non-draggable by default and prevents the default dragstart', () => {
    const el = img(
      render(
        <Image
          src='/x.png'
          alt='x'
        />,
      ),
    );
    expect(el.getAttribute('draggable')).toBe('false');
    const evt = new Event('dragstart', { bubbles: true, cancelable: true });
    act(() => {
      el.dispatchEvent(evt);
    });
    expect(evt.defaultPrevented).toBe(true);
  });

  it('puts numeric width/height (as px) and object-fit in the styled rule', () => {
    const el = img(
      render(
        <Image
          src='/x.png'
          alt='x'
          width={200}
          height={100}
          fit='contain'
        />,
      ),
    );
    const rule = ruleFor(el);
    expect(rule).toContain('width: 200px');
    expect(rule).toContain('height: 100px');
    expect(rule).toContain('object-fit: contain');
  });

  it('forwards the sx object as inline style', () => {
    const el = img(
      render(
        <Image
          src='/x.png'
          alt='x'
          sx={{ marginTop: '4px' }}
        />,
      ),
    );
    expect(el.style.marginTop).toBe('4px');
  });
});

/* ── 1.0 additions: radius, agent marker, CLS attrs, priority, aspect-ratio, fallback ── */
describe('Image — 1.0 additions (jsdom)', () => {
  it('carries the data-valet-component marker (AI-proxy hook)', () => {
    const el = img(render(<Image src='/x.png' alt='x' />));
    expect(el.getAttribute('data-valet-component')).toBe('Image');
  });

  it('radius: number → theme.radius() calc, string → verbatim', () => {
    const num = img(render(<Image src='/x.png' alt='x' radius={2} />));
    expect(ruleFor(num)).toContain('border-radius: calc(var(--valet-radius');
    const str = img(render(<Image src='/x.png' alt='x' radius='10px' />));
    expect(ruleFor(str)).toContain('border-radius: 10px');
  });

  it('no radius → no border-radius declaration (unchanged from today)', () => {
    const el = img(render(<Image src='/x.png' alt='x' />));
    expect(ruleFor(el)).not.toContain('border-radius');
  });

  it('aspectRatio number is the literal decimal ratio (1.5 = 3:2, not coerced to a bogus value)', () => {
    // Note: CSSOM serializes `aspect-ratio: 1.5` back to `1.5 / 1` (same ratio),
    // so the runtime `/1`-drop is invisible — the real fix is the JSDoc steering
    // callers to pass a real ratio like 16/9. This pins the VALUE is correct.
    const el = img(render(<Image src='/x.png' alt='x' aspectRatio={1.5} />));
    expect(ruleFor(el)).toContain('aspect-ratio: 1.5');
  });

  it('emits native width/height attrs ONLY when both are numeric (CLS hint)', () => {
    const both = img(render(<Image src='/x.png' alt='x' width={200} height={100} />));
    expect(both.getAttribute('width')).toBe('200');
    expect(both.getAttribute('height')).toBe('100');

    const oneStr = img(render(<Image src='/x.png' alt='x' width={200} height='50%' />));
    expect(oneStr.hasAttribute('width')).toBe(false);
    expect(oneStr.hasAttribute('height')).toBe(false);

    const noneNum = img(render(<Image src='/x.png' alt='x' width='100%' />));
    expect(noneNum.hasAttribute('width')).toBe(false);
  });

  it('priority co-sets eager + fetchpriority=high; explicit values still win', () => {
    const pri = img(render(<Image src='/x.png' alt='x' priority />));
    expect(pri.getAttribute('loading')).toBe('eager');
    expect(pri.getAttribute('fetchpriority')).toBe('high');

    const override = img(
      render(<Image src='/x.png' alt='x' priority loading='lazy' fetchPriority='low' />),
    );
    expect(override.getAttribute('loading')).toBe('lazy');
    expect(override.getAttribute('fetchpriority')).toBe('low');
  });

  it('fallback renders on error; without it the bare <img> survives an error (byte-for-byte path)', () => {
    const c = render(<Image src='/bad.png' alt='x' fallback={<span data-fb='1'>broken</span>} />);
    expect(img(c)).not.toBeNull();
    act(() => {
      img(c).dispatchEvent(new Event('error'));
    });
    expect(c.querySelector('[data-fb]')).not.toBeNull();
    expect(img(c)).toBeNull();

    // No fallback → the img is unaffected by an error (no internal swap/handler).
    const c2 = render(<Image src='/bad.png' alt='x' />);
    act(() => {
      img(c2).dispatchEvent(new Event('error'));
    });
    expect(img(c2)).not.toBeNull();
  });
});
