// ─────────────────────────────────────────────────────────────
// src/pages/HelloValet.tsx  | valet-docs
// Hands-on tutorial: build a small page with valet primitives
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, Button, TextField, Snackbar } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { DocMeta } from '../types';

export const meta: DocMeta = {
  id: 'hello-valet',
  title: 'Hello Valet',
  description:
    'A guided, copy-paste tutorial that introduces the Surface, layout, typography, and a simple form.',
  pageType: 'tutorial',
  prerequisites: ['quickstart'],
  tldr: 'Surface + Stack + Typography + Button + TextField + Snackbar for first interactive flow.',
};

export default function HelloValetPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);

  return (
    <Surface>
      <NavDrawer />
      <Stack
        style={{ padding: '1rem' }}
        gap={2}
      >
        <Typography
          variant='h2'
          bold
        >
          Hello Valet Tutorial
        </Typography>
        <Typography>
          You’ll assemble a small screen with layout primitives, a form field, and a feedback toast.
        </Typography>

        <Typography
          variant='h3'
          bold
        >
          1) Layout + heading
        </Typography>
        <Panel
          fullWidth
          compact
        >
          <pre>
            <code>{`<Surface>
  <Stack gap={2} style={{ padding: '1rem', maxWidth: 720 }}>
    <Typography variant="h2">Welcome</Typography>
  </Stack>
</Surface>`}</code>
          </pre>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          2) Add a form row
        </Typography>
        <Panel
          fullWidth
          compact
        >
          <pre>
            <code>{`<Stack direction="row" gap={1}>
  <TextField
    name="hello-name"
    label="Name"
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="Ada"
  />
  <Button onClick={() => setOpen(true)}>Greet</Button>
</Stack>`}</code>
          </pre>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          3) Feedback with Snackbar
        </Typography>
        <Panel
          fullWidth
          compact
        >
          <pre>
            <code>{`<Snackbar
  open={open}
  onClose={() => setOpen(false)}
  message={name ? \`Hello, \${name}!\` : 'Hello!'}
/>`}</code>
          </pre>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Live demo
        </Typography>
        <Panel fullWidth>
          <Stack
            direction='row'
            gap={1}
          >
            <TextField
              name='hello-name'
              label='Name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ada'
            />
            <Button onClick={() => setOpen(true)}>Greet</Button>
          </Stack>
          <Snackbar
            open={open}
            onClose={() => setOpen(false)}
            message={name ? `Hello, ${name}!` : 'Hello!'}
          />
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          What you learned
        </Typography>
        <Typography>
          Layout with <code>Stack</code>, text with <code>Typography</code>, inputs with{' '}
          <code>TextField</code>, and feedback with <code>Snackbar</code> — all inside a single{' '}
          <code>Surface</code> to inherit theme variables and sizing.
        </Typography>

        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
