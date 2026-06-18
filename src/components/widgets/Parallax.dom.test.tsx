// ─────────────────────────────────────────────────────────────
// src/components/widgets/Parallax.dom.test.tsx | valet
// Parallax family — ParallaxScroll (scroll-tracking root + context),
// ParallaxLayer (transform from scroll offset via the shared context),
// and ParallaxBackground (image vs. video media auto-detection + the
// IntersectionObserver-driven video play/pause hookup).
//
// jsdom note: there is no real scroll/layout engine, so scroll offsets
// stay 0 and a layer's transform is the identity translate. We assert
// the wiring (context provided, transform present, media element +
// observer registered), and feed a synthetic IntersectionObserver to
// exercise the video viewport hook without a layout pass.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ParallaxScroll, ParallaxLayer, ParallaxBackground, useParallax } from './Parallax';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Synthetic IntersectionObserver — ParallaxBackground observes a video
   and play/pauses on intersection. jsdom has none; this stub records the
   observed element so we can fire entries by hand. ---------------------- */
let ioInstances: Array<{ cb: IntersectionObserverCallback; el?: Element }>;
class IOStub {
  cb: IntersectionObserverCallback;
  el?: Element;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    ioInstances.push(this);
  }
  observe(el: Element) {
    this.el = el;
  }
  unobserve() {}
  disconnect() {}
}

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

beforeEach(() => {
  ioInstances = [];
  vi.stubGlobal('IntersectionObserver', IOStub);
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.unstubAllGlobals();
});

/* ── ParallaxScroll ──────────────────────────────────────────────────── */
describe('ParallaxScroll (jsdom)', () => {
  it('renders its children inside the relative/overflow-hidden root', () => {
    const c = render(
      <ParallaxScroll>
        <span data-inner>content</span>
      </ParallaxScroll>,
    );
    const root = c.firstElementChild as HTMLElement;
    expect(root.style.position).toBe('relative');
    expect(root.style.overflow).toBe('hidden');
    expect(c.querySelector('[data-inner]')).not.toBeNull();
  });

  it('provides a parallax context (initial offsets are zero)', () => {
    let seen: { scrollY: number; scrollX: number } | null = null;
    function Probe() {
      seen = useParallax();
      return null;
    }
    render(
      <ParallaxScroll>
        <Probe />
      </ParallaxScroll>,
    );
    expect(seen).toEqual({ scrollY: 0, scrollX: 0 });
  });
});

/* ── ParallaxLayer ───────────────────────────────────────────────────── */
describe('ParallaxLayer (jsdom)', () => {
  it('applies a transform (identity at scroll 0) and willChange hint', () => {
    const c = render(
      <ParallaxScroll>
        <ParallaxLayer speed={0.5}>
          <span data-layer>layer</span>
        </ParallaxLayer>
      </ParallaxScroll>,
    );
    const layer = c.querySelector('[data-layer]')!.parentElement as HTMLElement;
    expect(layer.style.willChange).toBe('transform');
    // No scroll has occurred in jsdom → offset 0 → identity translate.
    expect(layer.style.transform).toBe('translate3d(0, 0px, 0)');
  });

  it('uses the x-axis translate form when axis="x"', () => {
    const c = render(
      <ParallaxScroll>
        <ParallaxLayer axis='x'>
          <span data-layer>x</span>
        </ParallaxLayer>
      </ParallaxScroll>,
    );
    const layer = c.querySelector('[data-layer]')!.parentElement as HTMLElement;
    expect(layer.style.transform).toBe('translate3d(0px, 0, 0)');
  });

  it('renders standalone (no provider) reading the default zero context', () => {
    const c = render(
      <ParallaxLayer>
        <span data-layer>solo</span>
      </ParallaxLayer>,
    );
    expect(c.querySelector('[data-layer]')).not.toBeNull();
  });
});

/* ── ParallaxBackground ──────────────────────────────────────────────── */
describe('ParallaxBackground (jsdom)', () => {
  it('renders an <img> for an image source (auto-detected) with empty alt', () => {
    const c = render(
      <ParallaxScroll>
        <ParallaxBackground src='/bg.jpg' />
      </ParallaxScroll>,
    );
    const im = c.querySelector('img') as HTMLImageElement;
    expect(im).not.toBeNull();
    expect(im.getAttribute('src')).toBe('/bg.jpg');
    expect(im.getAttribute('alt')).toBe('');
    expect(im.getAttribute('loading')).toBe('lazy');
    // No video → no IntersectionObserver registered.
    expect(ioInstances).toHaveLength(0);
  });

  it('renders a <video> for a video source and registers an IntersectionObserver', () => {
    const c = render(
      <ParallaxScroll>
        <ParallaxBackground src='/clip.webm' />
      </ParallaxScroll>,
    );
    const vid = c.querySelector('video') as HTMLVideoElement;
    expect(vid).not.toBeNull();
    expect(vid.getAttribute('src')).toBe('/clip.webm');
    expect(ioInstances.length).toBeGreaterThan(0);
  });

  it('honours an explicit mediaType override', () => {
    const c = render(
      <ParallaxScroll>
        <ParallaxBackground
          src='/ambiguous'
          mediaType='video'
        />
      </ParallaxScroll>,
    );
    expect(c.querySelector('video')).not.toBeNull();
    expect(c.querySelector('img')).toBeNull();
  });

  it('pauses the video when it leaves the viewport (IntersectionObserver hook)', () => {
    const c = render(
      <ParallaxScroll>
        <ParallaxBackground
          src='/clip.mp4'
          autoPlay
        />
      </ParallaxScroll>,
    );
    const vid = c.querySelector('video') as HTMLVideoElement;
    // jsdom has no media engine; stub play/pause to observe the hook's calls.
    const play = vi.spyOn(vid, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(vid, 'pause').mockImplementation(() => {});
    const io = ioInstances[0];
    act(() => {
      io.cb(
        [{ isIntersecting: true, target: io.el } as unknown as IntersectionObserverEntry],
        io as unknown as IntersectionObserver,
      );
    });
    expect(play).toHaveBeenCalled();
    act(() => {
      io.cb(
        [{ isIntersecting: false, target: io.el } as unknown as IntersectionObserverEntry],
        io as unknown as IntersectionObserver,
      );
    });
    expect(pause).toHaveBeenCalled();
  });
});

/* ── ParallaxBackground — reduced motion (A11Y) ──────────────────────── */
describe('ParallaxBackground reduced motion (jsdom)', () => {
  const stubReduce = (reduce: boolean) =>
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: reduce && /reduce/.test(q),
      media: q,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    }));

  it('drops video autoplay when prefers-reduced-motion is set', () => {
    stubReduce(true);
    const c = render(
      <ParallaxScroll>
        <ParallaxBackground src='/clip.webm' />
      </ParallaxScroll>,
    );
    expect((c.querySelector('video') as HTMLVideoElement).autoplay).toBe(false);
  });

  it('keeps video autoplay when motion is allowed', () => {
    stubReduce(false);
    const c = render(
      <ParallaxScroll>
        <ParallaxBackground src='/clip.webm' />
      </ParallaxScroll>,
    );
    expect((c.querySelector('video') as HTMLVideoElement).autoplay).toBe(true);
  });
});
