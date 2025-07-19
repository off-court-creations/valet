// ─────────────────────────────────────────────────────────────
// src/system/aiKeyStore.ts | valet
// secure in-browser store for AI provider keys
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';

export type AIProvider = 'openai' | 'anthropic';

/* ---- 1. simple AES-GCM helpers ---------------------------------- */
const algo = { name: 'AES-GCM', length: 256 } as const;

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(passphrase), { name: 'PBKDF2' }, false, ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120_000, hash: 'SHA-256' },
    keyMaterial, algo, false, ['encrypt', 'decrypt'],
  );
}

export async function encrypt(plaintext: string, passphrase: string) {
  const enc   = new TextEncoder();
  const salt  = crypto.getRandomValues(new Uint8Array(16));
  const iv    = crypto.getRandomValues(new Uint8Array(12));
  const key   = await deriveKey(passphrase, salt);
  const data  = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, enc.encode(plaintext),
  );
  return btoa(
    JSON.stringify({ iv: [...iv], salt: [...salt], data: [...new Uint8Array(data)] }),
  );
}

export async function decrypt(cipherB64: string, passphrase: string) {
  const { iv, salt, data } = JSON.parse(atob(cipherB64));
  const key  = await deriveKey(passphrase, new Uint8Array(salt));
  const dec  = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(data),
  );
  return new TextDecoder().decode(dec);
}

/* ---- 2. custom storage routing ---------------------------------- */
const dynamicStorage: StateStorage = {
  getItem: (n) => localStorage.getItem(n) ?? sessionStorage.getItem(n),
  setItem: (n, v) => {
    try {
      const p = JSON.parse(v);
      if (p.state?.cipher) {
        localStorage.setItem(n, v);
        sessionStorage.removeItem(n);
        return;
      }
    } catch {}
    sessionStorage.setItem(n, v);
  },
  removeItem: (n) => {
    localStorage.removeItem(n);
    sessionStorage.removeItem(n);
  },
};

/* ---- 3. Zustand secure store ------------------------------------ */
type KeyState = {
  apiKey: string | null;
  provider: AIProvider | null;
  model: string | null;
  cipher: string | null;
  passphrase: string | null;
  setKey: (k: string, provider: AIProvider, pass?: string) => Promise<void>;
  setModel: (m: string) => void;
  applyPassphrase: (pass: string) => Promise<boolean>;
  clearKey: () => void;
};

export const useAIKey = create<KeyState>()(
  persist(
    (set, get) => ({
      apiKey: null,
      provider: null,
      model: null,
      cipher: null,
      passphrase: null,
      setKey: async (k, provider, pass) => {
        if (pass) {
          const cipher = await encrypt(k, pass);
          set({ apiKey: k, provider, model: null, cipher, passphrase: pass });
        } else {
          set({ apiKey: k, provider, model: null, cipher: null, passphrase: null });
        }
      },
      setModel: (m) => set({ model: m }),
      applyPassphrase: async (pass) => {
        const { cipher } = get();
        if (!cipher) return false;
        try {
          const key = await decrypt(cipher, pass);
          set({ apiKey: key, passphrase: pass });
          return true;
        } catch {
          return false;
        }
      },
      clearKey: () => set({ apiKey: null, provider: null, model: null, cipher: null, passphrase: null }),
    }),
    {
      name: 'valet-ai-key',
      storage: createJSONStorage(() => dynamicStorage),
      partialize: (s) => ({ cipher: s.cipher, provider: s.provider, model: s.model }),
    },
  ),
);

/* ---- 4. helper for chat requests -------------------------------- */
export async function sendChat(
  messages: any[],
  model?: string,
  provider?: AIProvider,
  apiKey?: string,
  endpoint?: string,
) {
  const state = useAIKey.getState();
  const key = apiKey ?? state.apiKey;
  const prov = provider ?? state.provider;
  const mdl = model ?? state.model ?? (prov === 'anthropic' ? 'claude-3-sonnet-20240229' : 'gpt-4o');

  if (!key || !prov) throw new Error('No API key set yet');

  if (prov === 'openai') {
    const url = endpoint ?? 'https://api.openai.com/v1/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ model: mdl, messages }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  const url = endpoint ?? 'https://api.anthropic.com/v1/messages';
  let system: string | undefined;
  let msgs = messages;
  if (Array.isArray(messages) && messages[0]?.role === 'system') {
    system = messages[0].content;
    msgs = messages.slice(1);
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: mdl, system, messages: msgs, max_tokens: 1024 }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
