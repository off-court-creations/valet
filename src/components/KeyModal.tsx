// ─────────────────────────────────────────────────────────────
// src/components/KeyModal.tsx | valet
// modal to capture an AI provider key
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import Modal from './layout/Modal';
import Panel from './layout/Panel';
import Stack from './layout/Stack';
import Typography from './primitives/Typography';
import Button from './fields/Button';
import { useAIKey, Provider } from '../system/openaiKeyStore';
import Select from './fields/Select';
import { useTheme } from '../system/themeStore';

export interface KeyModalProps {
  open: boolean;
  onClose?: () => void;
}

export default function KeyModal({ open, onClose }: KeyModalProps) {
  const { apiKey, cipher, provider, setKey, applyPassphrase, clearKey } = useAIKey();
  const [prov, setProv] = useState<Provider>(provider ?? 'openai');
  const [value, setValue] = useState('');
  const [remember, setRemember] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const { theme } = useTheme();

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Panel centered compact style={{ maxWidth: 480 }}>
        <Stack spacing={1}>
          <Typography variant="h3" bold>
            {cipher ? `Unlock ${provider ?? prov} key` : 'Paste your API key'}
          </Typography>

          {!cipher && (
            <Select value={prov} onChange={v => setProv(v as Provider)}>
              <Select.Option value="openai">OpenAI</Select.Option>
              <Select.Option value="anthropic">Anthropic</Select.Option>
            </Select>
          )}

          {!cipher && (
            <input
              style={{ fontFamily: 'monospace', width: '100%', padding: '0.5rem' }}
              type="password"
              placeholder="api-key"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError('');
              }}
            />
          )}

          {(remember || cipher) && (
            <input
              type="password"
              placeholder="passphrase"
              value={passphrase}
              onChange={(e) => {
                setPassphrase(e.target.value);
                if (error) setError('');
              }}
              style={{ width: '100%', padding: '0.5rem' }}
            />
          )}

          {error && (
            <Typography color={theme.colors.secondary}>{error}</Typography>
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
            <Button variant="outlined" fullWidth onClick={() => { clearKey(); onClose?.(); }}>
              Delete stored key
            </Button>
          )}
        </Stack>
      </Panel>
    </Modal>
  );
}

