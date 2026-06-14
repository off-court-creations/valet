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

  it('puts numeric width/height (as px), object-fit and aspect-ratio in the styled rule', () => {
    const el = img(
      render(
        <Image
          src='/x.png'
          alt='x'
          width={200}
          height={100}
          fit='contain'
          aspectRatio={16}
        />,
      ),
    );
    const rule = ruleFor(el);
    expect(rule).toContain('width: 200px');
    expect(rule).toContain('height: 100px');
    expect(rule).toContain('object-fit: contain');
    expect(rule).toContain('aspect-ratio: 16 / 1');
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
