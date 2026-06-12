// ─────────────────────────────────────────────────────────────
// src/css/styleRegistry.test.ts | valet
// ENGINE S10 (ruling Q2(a)) — privatized singletons + the
// dual-package-safe registry:
//  • all singleton state lives at
//    globalThis[Symbol.for('@archway/valet/style-registry/v1')]
//  • two module instances (bundler duplication simulated via
//    vi.resetModules + dynamic import) share ONE cache/sheet —
//    same class names, no duplicate rule recording
//  • dev hash-collision guard console.errors when one class name
//    is minted for two different normalized css bodies
//  • the public barrel no longer exports styleCache/globalSheet
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

const REGISTRY_KEY = Symbol.for('@archway/valet/style-registry/v1');

type Registry = import('./sheet').StyleRegistry;
const host = globalThis as unknown as Record<symbol, Registry | undefined>;

/* Each test gets a pristine registry AND pristine module instances. */
beforeEach(() => {
  delete host[REGISTRY_KEY];
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete host[REGISTRY_KEY];
});

describe('style registry (ENGINE S10)', () => {
  it('is created on globalThis under the versioned Symbol.for key with the v1 shape', async () => {
    expect(host[REGISTRY_KEY]).toBeUndefined();
    await import('./createStyled');
    const reg = host[REGISTRY_KEY];
    expect(reg).toBeDefined();
    expect(reg!.styleCache).toBeInstanceOf(Map);
    expect(reg!.injected).toBeInstanceOf(Set);
    expect(reg!.renderQueue).toBeInstanceOf(Map);
    expect(reg!.pendingRules).toEqual([]);
    expect(reg!.sheet).toBeUndefined();
    expect(reg!.classToCss).toBeInstanceOf(Map);
  });

  it('two module instances share one registry: identical class names, one cache entry', async () => {
    const a = await import('./createStyled');
    vi.resetModules();
    const b = await import('./createStyled');
    expect(b).not.toBe(a); // genuinely a second instance

    const css = 'color: rgb(101, 102, 103);';
    const Adiv = a.styled('div')`
      ${css}
    `;
    const Bdiv = b.styled('div')`
      ${css}
    `;
    const clsA = /class="([^"]+)"/.exec(renderToString(React.createElement(Adiv)))?.[1];
    const clsB = /class="([^"]+)"/.exec(renderToString(React.createElement(Bdiv)))?.[1];
    expect(clsA).toMatch(/^z-div-/);
    expect(clsB).toBe(clsA);

    /* One shared styleCache entry — instance B hit instance A's cache. */
    const reg = host[REGISTRY_KEY]!;
    const entries = [...reg.styleCache.values()].filter((v) => v === clsA);
    expect(entries).toHaveLength(1);
  });

  it('keyframes from a second instance dedupe through the shared injected set (one pending rule)', async () => {
    const a = await import('./createStyled');
    vi.resetModules();
    const b = await import('./createStyled');

    const name = a.keyframes`from{opacity:0}to{opacity:1}`;
    expect(b.keyframes`from{opacity:0}to{opacity:1}`).toBe(name);

    /* Non-DOM env: exactly ONE @keyframes rule recorded across both. */
    const sheetMod = await import('./sheet');
    const pending = sheetMod.getPendingRules().filter((t) => t.startsWith(`@keyframes ${name}{`));
    expect(pending).toHaveLength(1);
  });

  it('dev hash-collision guard: same class + different css body → console.error (same body stays silent)', async () => {
    const { recordClassName } = await import('./sheet');
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});

    recordClassName('z-div-collide-1', 'color:red');
    recordClassName('z-div-collide-1', 'color:red'); // same body — fine
    expect(err).not.toHaveBeenCalled();

    recordClassName('z-div-collide-1', 'color:blue'); // collision
    expect(err).toHaveBeenCalledTimes(1);
    expect(String(err.mock.calls[0][0])).toContain('hash collision');
    expect(String(err.mock.calls[0][0])).toContain('z-div-collide-1');
  });

  it('the collision guard is a no-op in production', async () => {
    const { recordClassName } = await import('./sheet');
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    recordClassName('z-div-collide-2', 'color:red');
    recordClassName('z-div-collide-2', 'color:blue');
    expect(err).not.toHaveBeenCalled();
    /* …and nothing was recorded either (first-line bail). */
    expect(host[REGISTRY_KEY]?.classToCss.has('z-div-collide-2') ?? false).toBe(false);
  });

  it('flushPendingRules drains the Node-recorded backlog once a DOM appears (Node→DOM edge)', async () => {
    const sheetMod = await import('./sheet');
    const { keyframes } = await import('./createStyled');

    /* Recorded with no DOM available. */
    const name = keyframes`from{opacity:0}to{opacity:1}`;
    expect(sheetMod.getPendingRules().length).toBeGreaterThan(0);

    /* A DOM appears (minimal stub — createElement + head.appendChild). */
    const inserted: string[] = [];
    const fakeSheet = {
      cssRules: { length: 0 },
      insertRule(text: string, index: number) {
        inserted.push(text);
        this.cssRules.length += 1;
        return index;
      },
    };
    vi.stubGlobal('document', {
      createElement: () => ({ sheet: fakeSheet }),
      head: { appendChild: () => {} },
    });

    /* The styled insertion effect calls this on every flush — even when
       the render itself queued nothing new. */
    sheetMod.flushPendingRules();
    expect(sheetMod.getPendingRules()).toHaveLength(0);
    expect(inserted.some((t) => t.startsWith(`@keyframes ${name}{`))).toBe(true);
    expect(sheetMod.getGlobalSheet()).toBe(fakeSheet);

    /* Idempotent — nothing left to flush. */
    const count = inserted.length;
    sheetMod.flushPendingRules();
    expect(inserted).toHaveLength(count);
  });

  it('the public barrel no longer exports the engine singletons (Q2)', async () => {
    const barrel = (await import('../index')) as Record<string, unknown>;
    expect('styleCache' in barrel).toBe(false);
    expect('globalSheet' in barrel).toBe(false);
    /* …while the engine itself is still public. */
    expect(typeof barrel.styled).toBe('function');
    expect(typeof barrel.keyframes).toBe('function');
  });
});
