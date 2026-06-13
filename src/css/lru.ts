// ─────────────────────────────────────────────────────────────
// src/css/lru.ts | valet
// Generic bounded LRU map (ENGINE S8). Backs the raw-css → className
// memo in createStyled.ts (capacity 4096 there).
//
// • Recency via Map insertion order: `get`/`set` re-append the key,
//   so the first key in iteration order is always the least recently
//   used — O(1) amortized for every operation, zero extra structures
// • `set` beyond capacity evicts exactly one entry (the LRU one)
// • Eviction here is ONLY ever a memo eviction. The engine's
//   injected/pending rule bookkeeping (createStyled.ts `injected`,
//   sheet.ts `pendingRules`) is NEVER evicted — rules are immortal
//   (plan §9 veto register). An evicted memo entry merely costs one
//   normalize+hash recompute on the next miss; it can never cause a
//   duplicate CSSOM insertion or a changed class name.
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────

export class LRU<K, V> {
  private readonly map = new Map<K, V>();

  readonly capacity: number;

  constructor(capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new RangeError(`LRU capacity must be a positive integer (got ${capacity})`);
    }
    this.capacity = capacity;
  }

  get size(): number {
    return this.map.size;
  }

  /** Presence check WITHOUT touching recency. */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /** Lookup; a hit makes `key` the most recently used entry. */
  get(key: K): V | undefined {
    const { map } = this;
    if (!map.has(key)) return undefined;
    const value = map.get(key) as V;
    map.delete(key);
    map.set(key, value);
    return value;
  }

  /**
   * Insert/overwrite; the entry becomes the most recently used. When the
   * capacity is exceeded the single least-recently-used entry is evicted.
   */
  set(key: K, value: V): this {
    const { map } = this;
    if (map.has(key)) map.delete(key);
    map.set(key, value);
    if (map.size > this.capacity) {
      map.delete(map.keys().next().value as K);
    }
    return this;
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  /** Keys in least → most recently used order (test/debug hook). */
  keys(): IterableIterator<K> {
    return this.map.keys();
  }
}
