// ─────────────────────────────────────────────────────────────
// src/css/styleRegistry.dom.test.ts | valet
// ENGINE S10 — registry sheet sharing under a real DOM: a second
// engine instance (bundler duplication simulated via vi.resetModules)
// reuses the live <style> element instead of creating its own, and
// never double-injects a rule the first instance already owns.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const REGISTRY_KEY = Symbol.for('@archway/valet/style-registry/v1');

type Registry = import('./sheet').StyleRegistry;
const host = globalThis as unknown as Record<symbol, Registry | undefined>;

beforeEach(() => {
  delete host[REGISTRY_KEY];
  vi.resetModules();
});

afterEach(() => {
  delete host[REGISTRY_KEY];
  document.head.querySelectorAll('style').forEach((el) => el.remove());
});

describe('style registry sheet sharing (jsdom)', () => {
  it('a second module instance writes the SAME <style> sheet — no second element, no duplicate rule', async () => {
    const a = await import('./createStyled');
    const kfA = a.keyframes`from{opacity:0}to{opacity:1}`;
    expect(document.head.querySelectorAll('style')).toHaveLength(1);

    vi.resetModules();
    const b = await import('./createStyled');
    expect(b).not.toBe(a);

    /* New body from instance B lands in instance A's sheet… */
    const kfB = b.keyframes`from{transform:scale(0.5)}to{transform:scale(1)}`;
    expect(kfB).not.toBe(kfA);
    expect(document.head.querySelectorAll('style')).toHaveLength(1);

    const sheetMod = await import('./sheet');
    const texts = Array.from(sheetMod.getGlobalSheet()!.cssRules, (r) => r.cssText);
    expect(texts.some((t) => t.startsWith(`@keyframes ${kfA}`))).toBe(true);
    expect(texts.some((t) => t.startsWith(`@keyframes ${kfB}`))).toBe(true);

    /* …and re-declaring instance A's body from instance B dedupes. */
    const ruleCount = sheetMod.getGlobalSheet()!.cssRules.length;
    expect(b.keyframes`from{opacity:0}to{opacity:1}`).toBe(kfA);
    expect(sheetMod.getGlobalSheet()!.cssRules).toHaveLength(ruleCount);
  });
});
