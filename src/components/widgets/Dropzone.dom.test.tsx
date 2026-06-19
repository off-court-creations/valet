// ─────────────────────────────────────────────────────────────
// src/components/widgets/Dropzone.dom.test.tsx | valet
// effect-hygiene regressions: stale rejections cleared by later
// drops, MIME-guarded previews, removeAt purity under StrictMode
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Dropzone from './Dropzone';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* Iconify fetches icon data over the network — stub it out. */
vi.mock('@iconify/react', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom lacks ResizeObserver (surfaceStore needs it) ------------------- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* jsdom lacks object URLs — count create/revoke calls ourselves. */
let urlSeq = 0;
const createObjectURL = vi.fn(() => `blob:mock-${++urlSeq}`);
const revokeObjectURL = vi.fn();
type UrlPatch = {
  createObjectURL?: typeof createObjectURL;
  revokeObjectURL?: typeof revokeObjectURL;
};

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode inside a Surface store; tracked for cleanup. */
function renderWithSurface(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  const store = createSurfaceStore();
  act(() => {
    root.render(
      <React.StrictMode>
        <SurfaceCtx.Provider value={store}>{node}</SurfaceCtx.Provider>
      </React.StrictMode>,
    );
  });
  return { root, container };
}

/** Drive react-dropzone through its hidden input's change event. */
async function dropFiles(container: HTMLElement, files: File[]) {
  const input = container.querySelector('input') as HTMLInputElement;
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
    /* file-selector's fromEvent resolves a microtask later */
    await new Promise((r) => setTimeout(r, 0));
  });
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  (URL as unknown as UrlPatch).createObjectURL = createObjectURL;
  (URL as unknown as UrlPatch).revokeObjectURL = revokeObjectURL;
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.unstubAllGlobals();
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  delete (URL as unknown as UrlPatch).createObjectURL;
  delete (URL as unknown as UrlPatch).revokeObjectURL;
});

/* Suite ----------------------------------------------------------------- */
describe('Dropzone (jsdom)', () => {
  it('clears stale rejection errors after a later successful drop', async () => {
    const { container } = renderWithSurface(<Dropzone accept={{ 'image/png': ['.png'] }} />);
    const live = () => container.querySelector('[role="alert"]');

    await dropFiles(container, [new File(['x'], 'bad.txt', { type: 'text/plain' })]);
    expect(live()).not.toBeNull();
    expect(live()!.textContent).toContain('bad.txt');

    await dropFiles(container, [new File(['y'], 'ok.png', { type: 'image/png' })]);
    expect(live()).toBeNull();
    expect(container.textContent).not.toContain('bad.txt');
    /* …and the accepted file made it into the previews */
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('ok.png');
  });

  it('replaces rejection errors on a mixed drop instead of stacking stale ones', async () => {
    const { container } = renderWithSurface(<Dropzone accept={{ 'image/png': ['.png'] }} />);
    const live = () => container.querySelector('[role="alert"]');

    await dropFiles(container, [new File(['x'], 'first-bad.gif', { type: 'image/gif' })]);
    expect(live()!.textContent).toContain('first-bad.gif');

    await dropFiles(container, [
      new File(['y'], 'ok.png', { type: 'image/png' }),
      new File(['z'], 'second-bad.gif', { type: 'image/gif' }),
    ]);
    expect(live()!.textContent).toContain('second-bad.gif');
    expect(live()!.textContent).not.toContain('first-bad.gif');
  });

  it('only image files get object URLs and <img> previews; others get icon tiles', async () => {
    const { container } = renderWithSurface(<Dropzone />);

    await dropFiles(container, [
      new File(['a'], 'notes.txt', { type: 'text/plain' }),
      new File(['b'], 'pic.png', { type: 'image/png' }),
    ]);

    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('alt')).toBe('pic.png');
    /* exactly one object URL — for the image, never the text file */
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    /* the non-image still appears, as an icon tile with its name */
    expect(container.textContent).toContain('notes.txt');
    expect(container.querySelector('[data-icon="carbon:document"]')).not.toBeNull();
  });

  it('removeAt fires onFilesChange exactly once per click under StrictMode', async () => {
    const onFilesChange = vi.fn();
    const { container } = renderWithSurface(<Dropzone onFilesChange={onFilesChange} />);

    await dropFiles(container, [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
    ]);
    expect(onFilesChange).toHaveBeenCalledTimes(1);
    expect(onFilesChange.mock.calls[0][0].map((f: File) => f.name)).toEqual(['a.png', 'b.png']);
    const createdUrls = createObjectURL.mock.results.map((r) => r.value);
    expect(createdUrls).toHaveLength(2);

    const removeBtn = container.querySelector(
      'button[aria-label="Remove a.png"]',
    ) as HTMLButtonElement;
    act(() => {
      removeBtn.click();
    });

    /* exactly one callback — an impure updater double-fires here */
    expect(onFilesChange).toHaveBeenCalledTimes(2);
    expect(onFilesChange.mock.calls[1][0].map((f: File) => f.name)).toEqual(['b.png']);

    /* the [files] effect owns revocation: removed URL revoked exactly once */
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith(createdUrls[0]);

    const imgs = container.querySelectorAll('img');
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute('alt')).toBe('b.png');
  });

  it('a freshly dropped image receives a blob: src and clears its spinner on load', async () => {
    const { container } = renderWithSurface(<Dropzone />);

    await dropFiles(container, [new File(['a'], 'pic.png', { type: 'image/png' })]);

    /* Regression: the URL used to be minted into a ref (no re-render), so the
       <img> shipped with src=undefined and span forever. After one drop the src
       must be a real blob:, and the tile must still be in its loading state. */
    let img = container.querySelector('img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toMatch(/^blob:/);
    expect(img.style.opacity).toBe('0');

    /* firing the real load event clears the spinner overlay (opacity → 1) */
    await act(async () => {
      img.dispatchEvent(new Event('load'));
    });
    img = container.querySelector('img') as HTMLImageElement;
    expect(img.style.opacity).toBe('1');
  });

  it('removing the middle of three previews keeps the survivors’ src/alt correct', async () => {
    const { container } = renderWithSurface(<Dropzone />);

    await dropFiles(container, [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
      new File(['c'], 'c.png', { type: 'image/png' }),
    ]);
    const srcOf = (alt: string) =>
      (
        Array.from(container.querySelectorAll('img')).find((i) => i.getAttribute('alt') === alt) as
          | HTMLImageElement
          | undefined
      )?.getAttribute('src');
    const aSrc = srcOf('a.png');
    const cSrc = srcOf('c.png');
    expect(aSrc).toMatch(/^blob:/);
    expect(cSrc).toMatch(/^blob:/);

    const removeB = container.querySelector(
      'button[aria-label="Remove b.png"]',
    ) as HTMLButtonElement;
    act(() => {
      removeB.click();
    });

    /* index-key reconciliation must not swap a/c's File-keyed URLs nor strand
       b's revoked URL on a surviving tile */
    const alts = Array.from(container.querySelectorAll('img')).map((i) => i.getAttribute('alt'));
    expect(alts).toEqual(['a.png', 'c.png']);
    expect(srcOf('a.png')).toBe(aSrc);
    expect(srcOf('c.png')).toBe(cSrc);
  });

  it('surfaces files past the cumulative maxFiles limit as rejections, not silent drops', async () => {
    const { container } = renderWithSurface(
      <Dropzone
        multiple
        maxFiles={4}
      />,
    );
    const live = () => container.querySelector('[role="alert"]');

    /* first drop of 3 is within the limit — no rejections */
    await dropFiles(container, [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.png', { type: 'image/png' }),
      new File(['c'], 'c.png', { type: 'image/png' }),
    ]);
    expect(live()).toBeNull();

    /* second drop of 3 crosses the cumulative limit: a–d kept, e/f surfaced */
    await dropFiles(container, [
      new File(['d'], 'd.png', { type: 'image/png' }),
      new File(['e'], 'e.png', { type: 'image/png' }),
      new File(['f'], 'f.png', { type: 'image/png' }),
    ]);
    expect(live()).not.toBeNull();
    expect(live()!.textContent).toContain('e.png');
    expect(live()!.textContent).toContain('f.png');
    expect(live()!.textContent).toContain('Too many files');
    /* the kept set is exactly the first four */
    const alts = Array.from(container.querySelectorAll('img')).map((i) => i.getAttribute('alt'));
    expect(alts).toEqual(['a.png', 'b.png', 'c.png', 'd.png']);
  });
});
