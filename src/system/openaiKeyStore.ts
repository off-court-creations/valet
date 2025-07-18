// ─────────────────────────────────────────────────────────────
// src/system/openaiKeyStore.ts | valet
// persistent OpenAI API key store with optional encryption
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';
import { persist, StateStorage, PersistStorage } from 'zustand/middleware';

// simple AES-GCM helpers
const algo = { name: 'AES-GCM', length: 256 } as const;

async function deriveKey(passphrase: string, salt: Uint8Array) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120_000, hash: 'SHA-256' },
    keyMaterial,
    algo,
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encrypt(plaintext: string, passphrase: string) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return btoa(
    JSON.stringify({ iv: [...iv], salt: [...salt], data: [...new Uint8Array(data)] }),
  );
}

export async function decrypt(cipherB64: string, passphrase: string) {
  const { iv, salt, data } = JSON.parse(atob(cipherB64));
  const key = await deriveKey(passphrase, new Uint8Array(salt));
  const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, key, new Uint8Array(data));
  return new TextDecoder().decode(dec);
}

// Zustand secure store
export type KeyState = {
  apiKey: string | null;
  setKey: (k: string | null) => void;
};

export const useOpenAIKey = create<KeyState>()(
  persist<KeyState>(
    (set) => ({
      apiKey: null,
      setKey: (k) => set({ apiKey: k }),
    }),
    {
      name: 'valet-openai-key',
      storage: {
        getItem: (name: string) => sessionStorage.getItem(name),
        setItem: (name: string, value: string) => sessionStorage.setItem(name, value!),
        removeItem: (name: string) => sessionStorage.removeItem(name),
      } as unknown as PersistStorage<KeyState>,
      serialize: async (state: string) => {
        const { apiKey, _persist } = JSON.parse(state) as KeyState & { _persist: any };
        if (!_persist?.passphrase || !apiKey) return state;
        return JSON.stringify({
          ..._persist,
          apiKey: await encrypt(apiKey, _persist.passphrase),
        });
      },
      deserialize: async (raw: string) => {
        const obj = JSON.parse(raw);
        if (obj._persist?.passphrase && obj.state.apiKey) {
          obj.state.apiKey = await decrypt(obj.state.apiKey, obj._persist.passphrase);
        }
        return obj;
      },
    } as any,
  ),
);
