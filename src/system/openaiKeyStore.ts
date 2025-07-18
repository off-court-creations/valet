// ─────────────────────────────────────────────────────────────
// src/system/openaiKeyStore.ts | valet
// secure in-browser store for OpenAI keys
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

/* ---- 2. Zustand secure store ------------------------------------ */
type KeyState = {
  apiKey: string | null;
  setKey: (k: string | null) => void;
};

export const useOpenAIKey = create<KeyState>()(
  persist(
    (set) => ({
      apiKey: null,
      setKey: (k) => set({ apiKey: k }),
    }),
    {
      name: 'valet-openai-key',
      storage: createJSONStorage<KeyState>(() => sessionStorage),
      serialize: async (state: any) => {
        const { apiKey, _persist } = state.state as KeyState & { _persist?: any };
        if (!_persist?.passphrase || !apiKey) return JSON.stringify(state);
        return JSON.stringify({
          ...state,
          state: {
            ...state.state,
            apiKey: await encrypt(apiKey, _persist.passphrase),
          },
        });
      },
      deserialize: async (raw: string) => {
        const obj: any = JSON.parse(raw);
        if (obj.state && obj.state.apiKey && obj.state._persist?.passphrase) {
          obj.state.apiKey = await decrypt(
            obj.state.apiKey,
            obj.state._persist.passphrase,
          );
        }
        return obj;
      },
    },
  ),
);

/* ---- 3. helper for OpenAI chat ---------------------------------- */
export async function sendChat(messages: any[], model = 'gpt-4o') {
  const apiKey = useOpenAIKey.getState().apiKey;
  if (!apiKey) throw new Error('No OpenAI key set');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

