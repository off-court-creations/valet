// src/pages/DropzoneDemo.tsx
import { Surface, Stack, Typography, Button, Dropzone, useTheme, Icon } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function DropzoneDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>Dropzone Showcase</Typography>
        <Typography variant="subtitle">File upload area built on react-dropzone</Typography>

        <Typography variant="h3">Example</Typography>
        <Dropzone accept={{ 'image/*': [] }} maxFiles={3} />

        <Stack direction="row" style={{ marginTop: theme.spacing(1) }}>
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
