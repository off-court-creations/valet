// ─────────────────────────────────────────────────────────────
// src/components/widgets/KeyModal.tsx | valet
// modal to capture an AI provider API key
//
// POSTURE: this captures a provider key for browser-direct LLM calls — a
// dev-tool convenience, not secret management. The key is reachable by any
// script on the page and is sent straight to the provider; at-rest encryption
// is opt-in (passphrase) and defends only against casual storage inspection,
// never against a hostile runtime. See src/system/aiKeyStore.ts for the full
// threat model. Do not collect production/multi-tenant keys here.
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import Modal from '../layout/Modal';
import Panel from '../layout/Panel';
import Stack from '../layout/Stack';
import Typography from '../primitives/Typography';
import Button from '../fields/Button';
import { useAIKey, AIProvider } from '../../system/aiKeyStore';
import { useTheme } from '../../system/themeStore';

export interface KeyModalProps {
  open: boolean;
  onClose?: () => void;
}

export default function KeyModal({ open, onClose }: KeyModalProps) {
  const { apiKey, provider, cipher, setKey, applyPassphrase, clearKey } = useAIKey();
  const [value, setValue] = useState('');
  const [remember, setRemember] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [prov, setProv] = useState<AIProvider>(provider ?? 'openai');
  const [error, setError] = useState('');
  const { theme } = useTheme();

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Panel
        centerContent
        compact
        sx={{ maxWidth: 480 }}
      >
        <Stack>
          <Typography
            variant='h3'
            bold
          >
            {cipher
              ? `Unlock ${prov === 'anthropic' ? 'Anthropic' : 'OpenAI'} key`
              : 'Paste your API key'}
          </Typography>

          <Typography variant='subtitle'>
            Dev tool: your key is sent browser-direct to the provider and is readable by any script
            on this page. Use a key you own for your own session — not a production key. A
            passphrase encrypts it at rest only.
          </Typography>

          {!cipher && (
            <input
              style={{
                fontFamily: 'monospace',
                width: '100%',
                padding: '0.5rem',
              }}
              type='password'
              placeholder='sk-...'
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
            />
          )}

          {(remember || cipher) && (
            <input
              type='password'
              placeholder='passphrase'
              value={passphrase}
              onChange={(e) => {
                setPassphrase(e.target.value);
                if (error) setError('');
              }}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          {!cipher && (
            <select
              value={prov}
              onChange={(e) => setProv(e.target.value as AIProvider)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value='openai'>OpenAI</option>
              <option value='anthropic'>Anthropic</option>
            </select>
          )}

          {error && <Typography color={theme.colors.error}>{error}</Typography>}

          {!cipher && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type='checkbox'
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <Typography>remember this key (encrypted)</Typography>
            </label>
          )}

          <Button
            fullWidth
            disabled={cipher ? !passphrase : !value.trim() || (remember && !passphrase)}
            onClick={async () => {
              setError('');
              if (cipher) {
                const ok = await applyPassphrase(passphrase);
                if (!ok) {
                  setError('Incorrect passphrase');
                  return;
                }
              } else {
                await setKey(value.trim(), prov, remember ? passphrase : undefined);
              }
              onClose?.();
            }}
          >
            Save &amp; Continue
          </Button>

          {(cipher || apiKey) && (
            <Button
              variant='outlined'
              fullWidth
              onClick={() => {
                clearKey();
                onClose?.();
              }}
            >
              Delete stored key
            </Button>
          )}
        </Stack>
      </Panel>
    </Modal>
  );
}
