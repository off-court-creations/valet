// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/KeyModalDemo.tsx  | valet-docs
// KeyModal docs using ComponentMetaPage (Usage, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Typography, Button, KeyModal } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import KeyModalMeta from '../../../../../src/components/widgets/KeyModal.meta.json';

export default function KeyModalDemoPage() {
  const [open, setOpen] = useState(false);

  const usageContent = (
    <Stack>
      <Typography variant='subtitle'>
        A <strong>dev-tool</strong> modal that captures an AI provider API key for browser-direct
        LLM calls (<code>open</code>/<code>onClose</code>). The key is reachable by any script on
        the page; at-rest encryption (a passphrase) is opt-in. Never collect production or
        multi-tenant keys with it.
      </Typography>
      <Button onClick={() => setOpen(true)}>Open key modal</Button>
      <KeyModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='KeyModal'
      subtitle='Capture an AI provider API key for browser-direct LLM calls (dev tool).'
      slug='components/widgets/keymodal'
      meta={KeyModalMeta}
      usage={usageContent}
    />
  );
}
