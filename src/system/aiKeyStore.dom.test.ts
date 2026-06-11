// ─────────────────────────────────────────────────────────────
// src/system/aiKeyStore.dom.test.ts | valet
// jsdom coverage for aiKeyStore hardening (SECURITY S2/S3)
// ─────────────────────────────────────────────────────────────
import { beforeAll, beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { encrypt, decrypt, useAIKey } from './aiKeyStore';

const STORE_KEY = 'valet-ai-key';

type PersistedRecord = {
  state: { cipher: string | null; provider: string | null; model: string | null };
  version: number;
};

const readRecord = (raw: string | null): PersistedRecord => {
  expect(raw).not.toBeNull();
  return JSON.parse(raw as string) as PersistedRecord;
};

beforeAll(() => {
  // jsdom has no SubtleCrypto; back the global with node's webcrypto
  if (!globalThis.crypto?.subtle) {
    Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  }
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  useAIKey.setState({ apiKey: null, provider: null, model: null, cipher: null });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('encrypt / decrypt', () => {
  it('round-trips plaintext through PBKDF2 + AES-GCM', async () => {
    const cipher = await encrypt('sk-round-trip', 'hunter2');
    expect(cipher).not.toContain('sk-round-trip');
    await expect(decrypt(cipher, 'hunter2')).resolves.toBe('sk-round-trip');
  });

  it('rejects on a wrong passphrase', async () => {
    const cipher = await encrypt('sk-round-trip', 'hunter2');
    await expect(decrypt(cipher, 'wrong')).rejects.toThrow();
  });

  it('throws a descriptive error when crypto.subtle is unavailable', async () => {
    const real = globalThis.crypto;
    // mimic a non-secure context: getRandomValues exists, subtle does not
    vi.stubGlobal('crypto', { getRandomValues: real.getRandomValues.bind(real) });
    await expect(encrypt('sk-x', 'pw')).rejects.toThrow(/secure context/i);
    const cipher = btoa(
      JSON.stringify({ iv: new Array(12).fill(0), salt: new Array(16).fill(0), data: [1, 2, 3] }),
    );
    await expect(decrypt(cipher, 'pw')).rejects.toThrow(/secure context/i);
  });
});

describe('storage routing', () => {
  it('persists cipher records to localStorage and clears any session copy', async () => {
    sessionStorage.setItem(STORE_KEY, 'stale-session-record');
    await useAIKey.getState().setKey('sk-protected', 'openai', 'pw');

    const record = readRecord(localStorage.getItem(STORE_KEY));
    expect(record.state.cipher).toBeTruthy();
    expect(record.state.provider).toBe('openai');
    // partialize: the plaintext key is never persisted
    expect(record.state).not.toHaveProperty('apiKey');
    expect(sessionStorage.getItem(STORE_KEY)).toBeNull();
  });

  it('evicts the stale localStorage cipher when an unprotected key replaces a protected one', async () => {
    await useAIKey.getState().setKey('sk-old', 'openai', 'pw');
    expect(localStorage.getItem(STORE_KEY)).not.toBeNull();

    await useAIKey.getState().setKey('sk-new', 'anthropic');

    expect(localStorage.getItem(STORE_KEY)).toBeNull();
    const record = readRecord(sessionStorage.getItem(STORE_KEY));
    expect(record.state.cipher).toBeNull();
    expect(record.state.provider).toBe('anthropic');

    // the superseded credential must not resurrect on reload
    await useAIKey.persist.rehydrate();
    expect(useAIKey.getState().cipher).toBeNull();
    expect(useAIKey.getState().provider).toBe('anthropic');
  });

  it('restores the key via applyPassphrase after a simulated reload', async () => {
    await useAIKey.getState().setKey('sk-reload', 'anthropic', 'pw');
    // fresh page: in-memory key gone, only the cipher survives in storage
    useAIKey.setState({ apiKey: null });
    await useAIKey.persist.rehydrate();
    expect(useAIKey.getState().apiKey).toBeNull();
    expect(useAIKey.getState().cipher).toBeTruthy();

    await expect(useAIKey.getState().applyPassphrase('wrong')).resolves.toBe(false);
    expect(useAIKey.getState().apiKey).toBeNull();

    await expect(useAIKey.getState().applyPassphrase('pw')).resolves.toBe(true);
    expect(useAIKey.getState().apiKey).toBe('sk-reload');
  });

  it('clearKey wipes both storages and the in-memory state', async () => {
    await useAIKey.getState().setKey('sk-clear', 'openai', 'pw');
    useAIKey.getState().clearKey();

    expect(useAIKey.getState().apiKey).toBeNull();
    expect(useAIKey.getState().cipher).toBeNull();
    const local = localStorage.getItem(STORE_KEY);
    if (local !== null) expect(readRecord(local).state.cipher).toBeNull();
    const session = sessionStorage.getItem(STORE_KEY);
    if (session !== null) expect(readRecord(session).state.cipher).toBeNull();
  });
});

describe('passphrase removal (S3)', () => {
  it('never holds a passphrase in store state', async () => {
    await useAIKey.getState().setKey('sk-s3', 'openai', 'pw');
    expect('passphrase' in useAIKey.getState()).toBe(false);

    useAIKey.setState({ apiKey: null });
    await useAIKey.getState().applyPassphrase('pw');
    expect('passphrase' in useAIKey.getState()).toBe(false);
  });
});
