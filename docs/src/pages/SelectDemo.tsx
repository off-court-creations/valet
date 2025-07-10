// ─────────────────────────────────────────────────────────────────────────────
// src/pages/SelectDemoPage.tsx | valet
// Exhaustive playground – now demonstrating FormControl integration.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  Surface,
  Stack,
  Box,
  Typography,
  Button,
  IconButton,
  Icon,
  Select,
  FormControl,
  createFormStore,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*───────────────────────────────────────────────────────────*/
/* Local form store                                          */
type DemoForm = {
  country: string;
  hobbies: string[];
};
const useDemoForm = createFormStore<DemoForm>({
  country: 'us',
  hobbies: ['coding'],
});

export default function SelectDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate               = useNavigate();

  /* other controlled examples ----------------------------------------- */
  const [pet, setPet]     = useState('cat');
  const [langs, setLangs] = useState<string[]>(['ts']);

  /* show submitted values --------------------------------------------- */
  const [submitted, setSubmitted] = useState<DemoForm | null>(null);

  return (
    <Surface>
      <NavDrawer />
      <Stack
        spacing={1}
        preset="showcaseStack"
      >
        <Typography variant="h2" bold>Select Playground</Typography>
        <Typography variant="subtitle">
          Uncontrolled • controlled • multiple • sizes • presets • FormControl
        </Typography>

        {/* ————————————————— Uncontrolled */}
        <Typography variant="h3">1. Uncontrolled (initialValue)</Typography>
        <Select initialValue="tea" placeholder="Choose drink">
          <Select.Option value="coffee">Coffee</Select.Option>
          <Select.Option value="tea">Tea</Select.Option>
          <Select.Option value="water">Water</Select.Option>
        </Select>

        {/* ————————————————— Controlled single */}
        <Typography variant="h3">2. Controlled – single</Typography>
        <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
          <Select value={pet} onChange={(v) => setPet(v as string)}>
            <Select.Option value="cat">Cat</Select.Option>
            <Select.Option value="dog">Dog</Select.Option>
            <Select.Option value="bird">Bird</Select.Option>
          </Select>
          <Typography>Current: <b>{pet}</b></Typography>
        </Stack>

        {/* ————————————————— Controlled multiple */}
        <Typography variant="h3">3. Controlled – multiple</Typography>
        <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
          <Select
            multiple
            value={langs}
            onChange={(v) => setLangs(v as string[])}
            placeholder="Languages"
            size="lg"
            style={{ minWidth: 260 }}
          >
            <Select.Option value="js">JavaScript</Select.Option>
            <Select.Option value="ts">TypeScript</Select.Option>
            <Select.Option value="py">Python</Select.Option>
            <Select.Option value="go">Go</Select.Option>
            <Select.Option value="rs">Rust</Select.Option>
          </Select>
          <Typography>{langs.join(', ')}</Typography>
        </Stack>

        {/* ————————————————— Sizes */}
        <Typography variant="h3">4. Size variants</Typography>
        <Stack direction="row" spacing={1}>
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <Select key={s} size={s} placeholder={s.toUpperCase()}>
              <Select.Option value="a">A</Select.Option>
              <Select.Option value="b">B</Select.Option>
            </Select>
          ))}
        </Stack>

        {/* ————————————————— Disabled / preset */}
        <Typography variant="h3">5. Disabled & preset</Typography>
        <Stack direction="row" spacing={1}>
          <Select disabled placeholder="Disabled">
            <Select.Option value="x">X</Select.Option>
          </Select>

          <Select initialValue="warn">
            <Select.Option value="warn">Danger preset</Select.Option>
            <Select.Option value="safe">Safe</Select.Option>
          </Select>
        </Stack>

        {/* ————————————————— FormControl demo */}
        <Typography variant="h3">6. FormControl integration</Typography>
        <FormControl
          useStore={useDemoForm}
          onSubmitValues={(vals) => setSubmitted(vals)}
        >
          <Stack spacing={1}>
            <Select
              name="country"
              placeholder="Country"
              size="md"
              style={{ maxWidth: 260 }}
            >
              <Select.Option value="us">United States</Select.Option>
              <Select.Option value="ca">Canada</Select.Option>
              <Select.Option value="uk">United Kingdom</Select.Option>
            </Select>

            <Select
              name="hobbies"
              multiple
              placeholder="Hobbies"
              size="sm"
              style={{ maxWidth: 300 }}
            >
              <Select.Option value="coding">Coding</Select.Option>
              <Select.Option value="music">Music</Select.Option>
              <Select.Option value="sports">Sports</Select.Option>
            </Select>

            <Button type="submit">Submit form</Button>
          </Stack>
        </FormControl>

        {submitted && (
          <Box
            style={{
              background   : theme.colors['surfaceElevated'],
              padding      : theme.spacing(1),
              borderRadius : 6,
              whiteSpace   : 'pre',
              fontFamily   : 'monospace',
            }}
          >
            {JSON.stringify(submitted, null, 2)}
          </Box>
        )}

        {/* ————————————————— Theme toggle */}
        <Typography variant="h3">7. Theme toggle</Typography>
        <IconButton icon="mdi:weather-night" onClick={toggleMode} aria-label="toggle theme" />
        {/* nav back */}
        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
