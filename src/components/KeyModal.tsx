// ─────────────────────────────────────────────────────────────
// src/components/KeyModal.tsx | valet
// modal to capture an OpenAI API key
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import Modal from './layout/Modal';
import Panel from './layout/Panel';
import Stack from './layout/Stack';
import Typography from './primitives/Typography';
import Button from './fields/Button';
import { useOpenAIKey } from '../system/openaiKeyStore';

export default function KeyModal() {
  const { apiKey, cipher, setKey, applyPassphrase } = useOpenAIKey();
  const [value, setValue] = useState('');
  const [remember, setRemember] = useState(false);
  const [passphrase, setPassphrase] = useState('');

  if (apiKey) return null;

  return (
    <Modal defaultOpen disableBackdropClick disableEscapeKeyDown>
      <Panel centered compact style={{ maxWidth: 480 }}>
        <Stack spacing={1}>
          <Typography variant="h3" bold>
            {cipher ? 'Unlock OpenAI key' : 'Paste your OpenAI key'}
          </Typography>

          {!cipher && (
            <input
              style={{ fontFamily: 'monospace', width: '100%', padding: '0.5rem' }}
              type="password"
              placeholder="sk-..."
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}

          {(remember || cipher) && (
            <input
              type="password"
              placeholder="passphrase"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          {!cipher && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <Typography>remember this key (encrypted)</Typography>
            </label>
          )}

          <Button
            fullWidth
            disabled={cipher ? !passphrase : (!value.trim() || (remember && !passphrase))}
            onClick={async () => {
              if (cipher) {
                await applyPassphrase(passphrase);
              } else {
                await setKey(value.trim(), remember ? passphrase : undefined);
              }
            }}
          >
            Save &amp; Continue
          </Button>
        </Stack>
      </Panel>
    </Modal>
  );
}

