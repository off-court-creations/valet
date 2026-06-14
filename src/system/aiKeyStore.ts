// ─────────────────────────────────────────────────────────────
// src/system/aiKeyStore.ts | valet
// in-browser store for AI provider keys — DEV-TOOL POSTURE
// ─────────────────────────────────────────────────────────────
//
// THREAT MODEL — read before shipping this to production.
//
// aiKeyStore, `sendChat`, `useAIKey`, and the KeyModal/LLMChat widgets are a
// convenience dev tool for prototyping browser-direct LLM calls. They are NOT
// a secret-management solution. Treat every key handed to this module as
// exposed to the page it runs on.
//
//   • Browser-direct transport. `sendChat` calls api.openai.com /
//     api.anthropic.com straight from the page, sending the raw key in the
//     request. Anthropic requires the explicit
//     `anthropic-dangerous-direct-browser-access` opt-in for exactly this
//     reason — the key is visible to anyone who can read the network tab or
//     inject script into the origin. There is no backend proxy.
//   • At-rest encryption is opt-in and only as strong as the passphrase.
//     With a passphrase, the key is AES-GCM encrypted (PBKDF2, 600k
//     iterations — OWASP 2023 floor for PBKDF2-SHA256) and the ciphertext
//     lives in localStorage. WITHOUT a
//     passphrase the plaintext key is held in memory and persisted only as
//     `provider`/`model` metadata (the key itself is not written to storage,
//     but it is readable from the live store while the tab is open).
//   • No XSS isolation. Any third-party script, browser extension, or
//     supply-chain compromise on the page can read the decrypted key from the
//     zustand store or intercept it in flight. Encryption-at-rest does not
//     defend against a hostile runtime.
//   • Secure-context requirement. crypto.subtle is unavailable on plain HTTP;
//     encryption silently cannot run outside HTTPS/localhost (see getSubtle).
//
// SAFE USE: local prototyping, internal demos, and apps where the end user
// supplies and owns the key for their own session. For multi-tenant or
// production traffic, terminate keys on a server you control and proxy the
// request — do not ship provider keys to the browser. A future AI-runtime
// redesign (streaming/abort/tool-calling + a server contract) is the intended
// home for production use; this module is deliberately scoped to dev tooling.
// ─────────────────────────────────────────────────────────────
import { createWithEqualityFn as create } from 'zustand/traditional';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';

export type AIProvider = 'openai' | 'anthropic';

/* ---- 1. simple AES-GCM helpers ---------------------------------- */
const algo = { name: 'AES-GCM', length: 256 } as const;

// crypto.subtle only exists in secure contexts (HTTPS / localhost);
// fail with a readable error instead of an opaque TypeError
function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      'valet: crypto.subtle is unavailable — AI key encryption requires a ' +
        'secure context (HTTPS or localhost).',
    );
  }
  return subtle;
}

// Pass TypedArray VIEWS (BufferSource) to WebCrypto, never `.buffer`: a raw
// ArrayBuffer fails Node 20's cross-realm `isAnyArrayBuffer` check under jsdom
// ("'salt' … is not instance of ArrayBuffer, Buffer, TypedArray, or DataView"),
// whereas an ArrayBufferView passes via ArrayBuffer.isView's internal-slot test.
async function deriveKey(passphrase: string, salt: BufferSource) {
  const subtle = getSubtle();
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600_000, hash: 'SHA-256' },
    keyMaterial,
    algo,
    false,
    ['encrypt', 'decrypt'],
  );
}

type CipherPayload = { iv: number[]; salt: number[]; data: number[] };

export async function encrypt(plaintext: string, passphrase: string) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const data = await getSubtle().encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
  return btoa(
    JSON.stringify({
      iv: [...iv],
      salt: [...salt],
      data: [...new Uint8Array(data)],
    }),
  );
}

export async function decrypt(cipherB64: string, passphrase: string) {
  const { iv, salt, data } = JSON.parse(atob(cipherB64)) as CipherPayload;
  const key = await deriveKey(passphrase, new Uint8Array(salt));
  const dec = await getSubtle().decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data),
  );
  return new TextDecoder().decode(dec);
}

/* ---- 2. custom storage routing ---------------------------------- */
function hasCipherState(x: unknown): x is { state: { cipher?: unknown } } {
  if (typeof x !== 'object' || x === null) return false;
  if (!('state' in x)) return false;
  const s = (x as { state: unknown }).state;
  return typeof s === 'object' && s !== null && 'cipher' in s;
}

const dynamicStorage: StateStorage = {
  getItem: (n) => localStorage.getItem(n) ?? sessionStorage.getItem(n),
  setItem: (n, v) => {
    try {
      const parsed = JSON.parse(v) as unknown;
      if (hasCipherState(parsed) && parsed.state.cipher) {
        // Encrypted records live in localStorage; clear any session copy
        localStorage.setItem(n, v);
        sessionStorage.removeItem(n);
        return;
      }
    } catch {
      // ignore invalid JSON; fall back to sessionStorage
      void 0;
    }
    // Session records evict any stale localStorage cipher; otherwise getItem
    // (which prefers localStorage) would resurrect a superseded credential
    localStorage.removeItem(n);
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
      setKey: async (k, provider, pass) => {
        if (pass) {
          const cipher = await encrypt(k, pass);
          set({ apiKey: k, provider, model: null, cipher });
        } else {
          set({ apiKey: k, provider, model: null, cipher: null });
        }
      },
      setModel: (m) => set({ model: m }),
      applyPassphrase: async (pass) => {
        const { cipher } = get();
        if (!cipher) return false;
        try {
          const key = await decrypt(cipher, pass);
          set({ apiKey: key });
          return true;
        } catch {
          return false;
        }
      },
      clearKey: () => {
        dynamicStorage.removeItem('valet-ai-key');
        set({
          apiKey: null,
          provider: null,
          model: null,
          cipher: null,
        });
      },
    }),
    {
      name: 'valet-ai-key',
      storage: createJSONStorage(() => dynamicStorage),
      partialize: (s) => ({
        cipher: s.cipher,
        provider: s.provider,
        model: s.model,
      }),
    },
  ),
);

/* ---- 4. helper for chat requests -------------------------------- */

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
};

/**
 * Normalized chat-completion result returned by {@link sendChat}. Both the
 * OpenAI and Anthropic branches resolve to this shape (the OpenAI completion
 * already carries `choices[].message`; the Anthropic response is mapped into
 * it), so callers read `result.choices[0].message.content` uniformly.
 */
export type ChatCompletion = {
  choices: Array<{ message: { role: string; content: string } }>;
};

type AnthropicResponse = {
  role: 'assistant' | 'user';
  content: string | Array<{ type: string; text?: string }>;
};

export async function sendChat(
  messages: ChatMessage[],
  model?: string,
  provider?: AIProvider,
  apiKey?: string,
  endpoint?: string,
): Promise<ChatCompletion> {
  const state = useAIKey.getState();
  const key = apiKey ?? state.apiKey;
  const prov = provider ?? state.provider;
  const mdl =
    model ?? state.model ?? (prov === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4o');

  if (!key || !prov) throw new Error('No API key set yet');

  if (prov === 'openai') {
    const url = endpoint ?? 'https://api.openai.com/v1/chat/completions';
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ model: mdl, messages }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as ChatCompletion;
  }

  // Anthrop(ic)
  const url = endpoint ?? 'https://api.anthropic.com/v1/messages';
  let system: string | undefined;
  let msgs: ChatMessage[] = messages;
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
    body: JSON.stringify({
      model: mdl,
      system,
      messages: msgs,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(await res.text());

  const json = (await res.json()) as AnthropicResponse;

  const contentText =
    typeof json.content === 'string'
      ? json.content
      : json.content.map((block) => (typeof block.text === 'string' ? block.text : '')).join('');

  return {
    choices: [
      {
        message: {
          role: json.role,
          content: contentText,
        },
      },
    ],
  };
}
