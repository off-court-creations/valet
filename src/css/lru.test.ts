// ─────────────────────────────────────────────────────────────
// src/css/lru.test.ts | valet
// Generic bounded LRU (ENGINE S8) — recency semantics, single-entry
// eviction, capacity validation, edge values
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { LRU } from './lru';

describe('LRU', () => {
  it('stores and retrieves values; misses return undefined', () => {
    const lru = new LRU<string, number>(4);
    expect(lru.get('a')).toBeUndefined();
    lru.set('a', 1).set('b', 2);
    expect(lru.get('a')).toBe(1);
    expect(lru.get('b')).toBe(2);
    expect(lru.size).toBe(2);
  });

  it('evicts exactly the least-recently-used entry when capacity is exceeded', () => {
    const lru = new LRU<string, number>(3);
    lru.set('a', 1).set('b', 2).set('c', 3);
    lru.set('d', 4); // over capacity → 'a' (oldest) evicted, nothing else
    expect(lru.has('a')).toBe(false);
    expect([...lru.keys()]).toEqual(['b', 'c', 'd']);
    expect(lru.size).toBe(3);
  });

  it('get() refreshes recency — a recently read key survives eviction', () => {
    const lru = new LRU<string, number>(3);
    lru.set('a', 1).set('b', 2).set('c', 3);
    lru.get('a'); // 'a' becomes MRU → 'b' is now LRU
    lru.set('d', 4);
    expect(lru.has('a')).toBe(true);
    expect(lru.has('b')).toBe(false);
    expect([...lru.keys()]).toEqual(['c', 'a', 'd']);
  });

  it('set() on an existing key updates the value and refreshes recency without evicting', () => {
    const lru = new LRU<string, number>(3);
    lru.set('a', 1).set('b', 2).set('c', 3);
    lru.set('a', 10); // overwrite: size stays 3, 'a' becomes MRU
    expect(lru.size).toBe(3);
    expect(lru.get('a')).toBe(10);
    lru.set('d', 4); // 'b' is LRU now (a was refreshed; then get(a) above refreshed again)
    expect(lru.has('b')).toBe(false);
    expect(lru.has('a')).toBe(true);
  });

  it('has() does NOT refresh recency', () => {
    const lru = new LRU<string, number>(2);
    lru.set('a', 1).set('b', 2);
    lru.has('a'); // must not rescue 'a'
    lru.set('c', 3);
    expect(lru.has('a')).toBe(false);
    expect([...lru.keys()]).toEqual(['b', 'c']);
  });

  it('capacity 1 keeps only the most recent entry', () => {
    const lru = new LRU<string, string>(1);
    lru.set('a', 'A');
    lru.set('b', 'B');
    expect(lru.has('a')).toBe(false);
    expect(lru.get('b')).toBe('B');
    expect(lru.size).toBe(1);
  });

  it('delete() and clear() remove entries', () => {
    const lru = new LRU<string, number>(4);
    lru.set('a', 1).set('b', 2);
    expect(lru.delete('a')).toBe(true);
    expect(lru.delete('a')).toBe(false);
    expect(lru.size).toBe(1);
    lru.clear();
    expect(lru.size).toBe(0);
    expect(lru.get('b')).toBeUndefined();
  });

  it('stores undefined and falsy values distinguishably from misses', () => {
    const lru = new LRU<string, number | undefined>(4);
    lru.set('u', undefined).set('z', 0);
    expect(lru.has('u')).toBe(true);
    expect(lru.get('u')).toBeUndefined();
    expect(lru.get('z')).toBe(0);
    // undefined-valued entries still participate in recency/eviction
    const tiny = new LRU<string, undefined>(1);
    tiny.set('x', undefined);
    tiny.set('y', undefined);
    expect(tiny.has('x')).toBe(false);
    expect(tiny.has('y')).toBe(true);
  });

  it('rejects non-positive / non-integer capacities', () => {
    expect(() => new LRU(0)).toThrow(RangeError);
    expect(() => new LRU(-1)).toThrow(RangeError);
    expect(() => new LRU(1.5)).toThrow(RangeError);
    expect(() => new LRU(Number.NaN)).toThrow(RangeError);
    expect(() => new LRU(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it('a long churn never grows past capacity and always keeps the newest entries', () => {
    const cap = 64;
    const lru = new LRU<number, number>(cap);
    for (let i = 0; i < 10_000; i += 1) {
      lru.set(i, i * 2);
      expect(lru.size).toBeLessThanOrEqual(cap);
    }
    expect(lru.size).toBe(cap);
    // exactly the last `cap` keys survive, oldest-first
    expect([...lru.keys()]).toEqual(Array.from({ length: cap }, (_, i) => 10_000 - cap + i));
    expect(lru.get(9_999)).toBe(19_998);
    expect(lru.get(0)).toBeUndefined();
  });
});
