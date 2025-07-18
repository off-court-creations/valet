// ─────────────────────────────────────────────────────────────
// src/components/KeyModal.tsx  | valet
// minimal modal prompting for an OpenAI key
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import Surface from './layout/Surface';
import Panel from './layout/Panel';
import Stack from './layout/Stack';
import Typography from './primitives/Typography';
import Button from './fields/Button';
import { useOpenAIKey } from '../system/openaiKeyStore';

export default function KeyModal() {
  const { apiKey, setKey } = useOpenAIKey();
  const [value, setValue] = useState(apiKey ?? '');
  const [remember, setRemember] = useState(false);
  const [passphrase, setPassphrase] = useState('');

  if (apiKey) return null;

  return (
    <Surface fullscreen={false}>
      <Panel centered compact style={{ maxWidth: 480 }}>
        <Stack spacing={1}>
          <Typography variant="h3" bold>
            Paste your OpenAI key
          </Typography>

          <input
            style={{ fontFamily: 'monospace', width: '100%', padding: '0.5rem' }}
            type="password"
            placeholder="sk-..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <Typography>remember this key (encrypted)</Typography>
          </label>

          {remember && (
            <input
              type="password"
              placeholder="choose a passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          <Button
            fullWidth
            disabled={!value.trim() || (remember && !passphrase)}
            onClick={() => {
              setKey(value.trim());
              if (remember) {
                const _persist = JSON.parse(
                  localStorage.getItem('valet-openai-key') ?? '{}',
                );
                _persist.passphrase = passphrase;
                localStorage.setItem('valet-openai-key', JSON.stringify(_persist));
              }
            }}
          >
            Save &amp; Continue
          </Button>
        </Stack>
      </Panel>
    </Surface>
  );
}
