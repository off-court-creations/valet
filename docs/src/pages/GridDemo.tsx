// src/pages/GridDemo.tsx
import { Surface, Stack, Typography, Button, Grid, Box, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function GridDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack
        preset="showcaseStack"
      >
        <Typography variant="h2" bold>Grid Showcase</Typography>
        <Typography variant="subtitle">Responsive column layout</Typography>

        <Typography variant="h3">1. Two columns</Typography>
        <Grid columns={2} gap={2}>
          <Box style={{ background: theme.colors['primary'] as string, color: theme.colors['primaryText'] as string, padding: theme.spacing(1) }}>A</Box>
          <Box style={{ background: theme.colors['secondary'] as string, color: theme.colors['secondaryText'] as string, padding: theme.spacing(1) }}>B</Box>
        </Grid>

        <Typography variant="h3">2. Four columns</Typography>
        <Grid columns={4} gap={1}>
          {['1', '2', '3', '4', '5', '6', '7', '8'].map(n => (
            <Box key={n} style={{ background: theme.colors['primary'] as string, color: theme.colors['primaryText'] as string, padding: theme.spacing(1), textAlign: 'center' }}>{n}</Box>
          ))}
        </Grid>

        <Typography variant="h3">2. Eight columns</Typography>
        <Grid columns={8} gap={1}>
          {['1', '2', '3', '4', '5', '6', '7', '8'].map(n => (
            <Box key={n} style={{ background: theme.colors['primary'] as string, color: theme.colors['primaryText'] as string, padding: theme.spacing(1), textAlign: 'center' }}>{n}</Box>
          ))}
        </Grid>

        <Stack direction="row">
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
