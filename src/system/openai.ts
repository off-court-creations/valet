// ─────────────────────────────────────────────────────────────
// src/system/openai.ts  | valet
// basic helper to send chat to OpenAI using the stored key
// ─────────────────────────────────────────────────────────────
import { useOpenAIKey } from './openaiKeyStore';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
}

export interface ChatCompletion {
  choices: { message: OpenAIMessage }[];
  [key: string]: any;
}

export async function sendChat(messages: OpenAIMessage[]) {
  const apiKey = useOpenAIKey.getState().apiKey;
  if (!apiKey) throw new Error('No OpenAI key set');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<ChatCompletion>;
}
