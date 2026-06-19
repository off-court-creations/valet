// ─────────────────────────────────────────────────────────────
// src/components/primitives/Video.dom.test.tsx | valet
// Video — sources/tracks rendering, native-control + playback flags,
// and the lazy-load gate (sources are withheld until the
// IntersectionObserver reports the element in view).
//
// jsdom note: HTMLMediaElement has no real playback engine, so this
// suite asserts on the rendered DOM/attributes and the lazy gate it
// drives — not on actual play/pause behavior.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Video } from './Video';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Controllable IntersectionObserver: tests trigger intersection by hand. */
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
/** Fire an isIntersecting=true entry for every live observer. */
const enterViewport = () =>
  act(() => {
    for (const io of ioInstances) {
      io.cb(
        [{ isIntersecting: true, target: io.el } as unknown as IntersectionObserverEntry],
        io as unknown as IntersectionObserver,
      );
    }
  });

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

const video = (c: HTMLElement) => c.querySelector('video') as HTMLVideoElement;

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

const SRC = [
  { src: 'movie.mp4', type: 'video/mp4' as const },
  { src: 'movie.webm', type: 'video/webm' as const },
];

/* Suite ----------------------------------------------------------------- */
describe('Video (jsdom)', () => {
  it('renders a <source> per provided source (non-lazy → ready immediately)', () => {
    const c = render(<Video sources={SRC} />);
    const sources = c.querySelectorAll('video > source');
    expect(sources).toHaveLength(2);
    expect((sources[0] as HTMLSourceElement).getAttribute('src')).toBe('movie.mp4');
    expect((sources[0] as HTMLSourceElement).getAttribute('type')).toBe('video/mp4');
    expect((sources[1] as HTMLSourceElement).getAttribute('type')).toBe('video/webm');
  });

  it('renders <track> elements with their attributes', () => {
    const c = render(
      <Video
        sources={SRC}
        tracks={[
          { src: 'en.vtt', kind: 'subtitles', srclang: 'en', label: 'English', default: true },
        ]}
      />,
    );
    const track = c.querySelector('video > track') as HTMLTrackElement;
    expect(track).not.toBeNull();
    expect(track.getAttribute('src')).toBe('en.vtt');
    expect(track.getAttribute('kind')).toBe('subtitles');
    expect(track.getAttribute('srclang')).toBe('en');
    expect(track.getAttribute('label')).toBe('English');
  });

  it('honours controls/muted/loop flags + a poster', () => {
    const c = render(
      <Video
        sources={SRC}
        controls={false}
        muted
        loop
        poster='poster.jpg'
        autoPlay={false}
      />,
    );
    const v = video(c);
    expect(v.controls).toBe(false);
    expect(v.muted).toBe(true);
    expect(v.loop).toBe(true);
    expect(v.getAttribute('poster')).toBe('poster.jpg');
    // tabIndex 0 makes the keyboard-toggle target focusable
    expect(v.getAttribute('tabindex')).toBe('0');
  });

  it('carries the data-valet-component marker on the wrapper (AI-proxy hook)', () => {
    const c = render(<Video sources={SRC} />);
    expect(c.querySelector('[data-valet-component="Video"]')).not.toBeNull();
  });

  it('lazy: withholds <source>s until the element scrolls into view', () => {
    const c = render(
      <Video
        sources={SRC}
        lazy
      />,
    );
    // Not ready yet — no sources rendered.
    expect(c.querySelectorAll('video > source')).toHaveLength(0);
    expect(ioInstances.length).toBeGreaterThan(0);
    // Intersection flips ready → sources mount.
    enterViewport();
    expect(c.querySelectorAll('video > source')).toHaveLength(2);
  });
});
