// ─────────────────────────────────────────────────────────────
// src/system/surfaceStore.dom.test.ts | valet
// PERF S2 regression — registerChild is O(1) (no sync layout read,
// no per-element Map clone) and registry commits/deletes are
// microtask-batched: n mounts (or unmounts) → one notification.
//
// jsdom has no real ResizeObserver/layout, so a controllable stub
// drives the store API directly. What jsdom cannot prove (manual
// phase-gate check): real browsers deliver the initial RO
// observation before paint, which is what now supplies the first
// ChildMetrics in place of the removed synchronous gBCR.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSurfaceStore, type ChildMetrics } from './surfaceStore';

/* Controllable ResizeObserver stub ------------------------------------ */
type ROCallback = (entries: Array<{ target: Element }>, observer: unknown) => void;

class ROStub {
  static instances: ROStub[] = [];
  /** When true, observe() mimics the browser's initial delivery
      synchronously (worst case for batching — one callback per node). */
  static deliverInitial = false;
  cb: ROCallback;
  observed = new Set<Element>();
  constructor(cb: ROCallback) {
    this.cb = cb;
    ROStub.instances.push(this);
  }
  observe(el: Element) {
    this.observed.add(el);
    if (ROStub.deliverInitial) this.cb([{ target: el }], this);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
  }
  disconnect() {
    this.observed.clear();
  }
  deliver(targets: Element[]) {
    this.cb(
      targets.map((target) => ({ target })),
      this,
    );
  }
}

/* Helpers -------------------------------------------------------------- */
const lastRO = () => ROStub.instances[ROStub.instances.length - 1];

const makeNode = (rect: { width?: number; height?: number } = {}) => {
  const el = document.createElement('div');
  el.getBoundingClientRect = vi.fn(
    () => ({ width: 0, height: 0, top: 0, left: 0, ...rect }) as DOMRect,
  );
  return el;
};

/** Macrotask hop — guarantees every queued microtask flush has run. */
const drain = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const countingStore = () => {
  const store = createSurfaceStore();
  const counter = { n: 0 };
  store.subscribe(() => {
    counter.n += 1;
  });
  return { store, counter };
};

beforeEach(() => {
  ROStub.instances.length = 0;
  ROStub.deliverInitial = false;
  vi.stubGlobal('ResizeObserver', ROStub as unknown as typeof ResizeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* Suite ----------------------------------------------------------------- */
describe('surfaceStore (jsdom)', () => {
  it('registerChild is O(1): no synchronous layout read, no synchronous commit', () => {
    const { store, counter } = countingStore();
    const node = makeNode();
    store.getState().registerChild('a', node);
    expect(node.getBoundingClientRect).not.toHaveBeenCalled();
    expect(counter.n).toBe(0);
    expect(store.getState().children.size).toBe(0);
    expect(lastRO().observed.has(node)).toBe(true);
  });

  it('n mounts → one children notification, even with per-node RO callbacks', async () => {
    ROStub.deliverInitial = true;
    const { store, counter } = countingStore();
    const seen: Record<string, ChildMetrics> = {};
    for (let i = 1; i <= 5; i += 1) {
      store.getState().registerChild(`c${i}`, makeNode({ width: i * 10, height: i * 10 }), (m) => {
        seen[`c${i}`] = m;
      });
    }
    /* Metrics are staged + callbacks fired, but no commit yet. */
    expect(counter.n).toBe(0);
    expect(seen.c5).toEqual({ width: 50, height: 50, top: 0, left: 0 });
    await drain();
    expect(counter.n).toBe(1);
    const { children } = store.getState();
    expect(children.size).toBe(5);
    expect(children.get('c3')).toEqual({ width: 30, height: 30, top: 0, left: 0 });
  });

  it('redelivery with unchanged metrics does not notify', async () => {
    ROStub.deliverInitial = true;
    const { store, counter } = countingStore();
    const a = makeNode({ width: 10 });
    const b = makeNode({ width: 20 });
    store.getState().registerChild('a', a);
    store.getState().registerChild('b', b);
    await drain();
    expect(counter.n).toBe(1);
    lastRO().deliver([a, b]);
    await drain();
    expect(counter.n).toBe(1);
    /* …while a real change still lands. */
    a.getBoundingClientRect = () => ({ width: 99, height: 0, top: 0, left: 0 }) as DOMRect;
    lastRO().deliver([a, b]);
    await drain();
    expect(counter.n).toBe(2);
    expect(store.getState().children.get('a')!.width).toBe(99);
  });

  it('n unmounts → one batched delete notification', async () => {
    ROStub.deliverInitial = true;
    const { store, counter } = countingStore();
    const nodes = [makeNode({ width: 1 }), makeNode({ width: 2 }), makeNode({ width: 3 })];
    nodes.forEach((n, i) => store.getState().registerChild(`d${i}`, n));
    await drain();
    expect(counter.n).toBe(1);
    nodes.forEach((n, i) => {
      store.getState().unregisterChild(`d${i}`);
      expect(lastRO().observed.has(n)).toBe(false);
    });
    expect(counter.n).toBe(1); // deletes staged, not committed
    await drain();
    expect(counter.n).toBe(2);
    expect(store.getState().children.size).toBe(0);
  });

  it('mount + unmount within one tick nets to zero notifications', async () => {
    ROStub.deliverInitial = true;
    const { store, counter } = countingStore();
    store.getState().registerChild('ghost', makeNode({ width: 7 }));
    store.getState().unregisterChild('ghost');
    await drain();
    expect(counter.n).toBe(0);
    expect(store.getState().children.size).toBe(0);
  });

  it('same-tick remount (StrictMode shape) keeps the child and stays silent', async () => {
    ROStub.deliverInitial = true;
    const { store, counter } = countingStore();
    const node = makeNode({ width: 42 });
    store.getState().registerChild('sm', node);
    await drain();
    expect(counter.n).toBe(1);
    /* unregister + re-register with identical metrics in the same tick */
    store.getState().unregisterChild('sm');
    store.getState().registerChild('sm', node);
    await drain();
    expect(counter.n).toBe(1);
    expect(store.getState().children.get('sm')).toEqual({
      width: 42,
      height: 0,
      top: 0,
      left: 0,
    });
  });
});
