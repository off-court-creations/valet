// ─────────────────────────────────────────────────────────────
// src/pages/DrawerPersistentDemo.tsx | valet
// Persistent drawer used as a simple sidebar
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface, Stack, Typography, Button, Drawer, useTheme } from '@archway/valet';

export default function DrawerPersistentDemo() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState(true);

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          Persistent Drawer
        </Typography>
        <Typography variant="subtitle">
          Acts like a sidebar without backdrop
        </Typography>
        <Button variant="outlined" onClick={() => setOpen((o) => !o)}>
          Toggle drawer
        </Button>
        <div style={{ minHeight: 240 }}>
          <Drawer
            open={open}
            onClose={() => setOpen(false)}
            backdrop={false}
            persistent
          >
            <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
              <Typography variant="h4" bold>
                Sidebar content
              </Typography>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </Stack>
          </Drawer>
        </div>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
