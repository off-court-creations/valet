// ─────────────────────────────────────────────────────────────
// src/components/KeyModal.tsx | valet
// modal to capture an AI provider API key
// ─────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import Modal from './layout/Modal';
import Panel from './layout/Panel';
import Stack from './layout/Stack';
import Typography from './primitives/Typography';
import Button from './fields/Button';
import { useAIKey, AIProvider } from '../system/aiKeyStore';
import { useTheme } from '../system/themeStore';

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

  const resetFields = () => {
    setValue('');
    setRemember(false);
    setPassphrase('');
    setError('');
    setProv(provider ?? 'openai');
  };

  const handleClose = () => {
    resetFields();
    onClose?.();
  };

  useEffect(() => {
    if (!open) resetFields();
  }, [open]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={handleClose}>
      <Panel centered compact style={{ maxWidth: 480 }}>
        <Stack spacing={1}>
          <Typography variant="h3" bold>
            {cipher ? `Unlock ${prov === 'anthropic' ? 'Anthropic' : 'OpenAI'} key` : 'Paste your API key'}
          </Typography>

          {!cipher && (
            <input
              style={{ fontFamily: 'monospace', width: '100%', padding: '0.5rem' }}
              type="password"
              placeholder="sk-..."
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

          {!cipher && (
            <select
              value={prov}
              onChange={(e) => setProv(e.target.value as AIProvider)}
              style={{ width: '100%', padding: '0.5rem' }}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
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
                await setKey(
                  value.trim(),
                  prov,
                  remember ? passphrase : undefined,
                );
              }
              handleClose();
            }}
          >
            Save &amp; Continue
          </Button>

          {(cipher || apiKey) && (
            <Button variant="outlined" fullWidth onClick={() => { clearKey(); handleClose(); }}>
              Delete stored key
            </Button>
          )}
        </Stack>
      </Panel>
    </Modal>
  );
}

