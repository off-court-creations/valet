// ─────────────────────────────────────────────────────────────
// src/system/sendChat.ts | valet
// minimal helper to post messages to OpenAI
// ─────────────────────────────────────────────────────────────
import { useOpenAIKey } from './openaiKeyStore';

export async function sendChat(messages: any[]) {
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
  return res.json();
}
