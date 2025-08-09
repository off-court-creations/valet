// ─────────────────────────────────────────────────────────────────────────────
// src/pages/TabsDemoPage.tsx | valet
// Demonstrates placement-aware <Tabs/> with varied panel content.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Tabs,
  Icon,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Simple lorem snippets so every panel differs                               */
const ONE = 'One → Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
const TWO = 'Two → Vestibulum non lectus eget justo dignissim pulvinar.';
const THREE = 'Three → Cras feugiat orci in elit aliquet, a imperdiet odio.';
const FOUR = 'Four → Nulla facilisi. Praesent quis leo sem.';
const FIVE = 'Five → Sed cursus, augue non dignissim scelerisque, felis dui.';
const SIX = 'Six → Morbi tristique, sapien nec fringilla cursus, nisi risus.';

/*─────────────────────────────────────────────────────────────────────────────*/
export default function TabsDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  /* Controlled example state -------------------------------------------- */
  const [activeCtl, setActiveCtl] = useState(0);

  return (
    <Surface>
      <Stack>
        <Typography variant="h2" bold>
          Tabs Layout Showcase
        </Typography>
        <Typography variant="subtitle">
          Demonstrates top / bottom / left / right placements
        </Typography>

        {/* 1. Horizontal - top (default) ---------------------------------- */}
        <Typography variant="h3">1. Horizontal – top (default)</Typography>
        <Tabs>
          <Tabs.Tab label="One" />
          <Tabs.Panel>{ONE}</Tabs.Panel>

          <Tabs.Tab label="Two" />
          <Tabs.Panel>{TWO}</Tabs.Panel>

          <Tabs.Tab label="Three" />
          <Tabs.Panel>{THREE}</Tabs.Panel>
        </Tabs>

        {/* 2. Horizontal - bottom ---------------------------------------- */}
        <Typography variant="h3">2. Horizontal – bottom</Typography>
        <Tabs placement="bottom">
          <Tabs.Tab label="Alpha" />
          <Tabs.Panel>{FOUR}</Tabs.Panel>

          <Tabs.Tab label="Beta" />
          <Tabs.Panel>{FIVE}</Tabs.Panel>
        </Tabs>

        {/* 3. Vertical - left (default) ----------------------------------- */}
        <Typography variant="h3">3. Vertical – left (default)</Typography>
        <Tabs orientation="vertical" style={{ height: 200 }}>
          <Tabs.Tab label="Apple" />
          <Tabs.Panel>{'Apple → ' + ONE}</Tabs.Panel>

          <Tabs.Tab label="Banana" />
          <Tabs.Panel>{'Banana → ' + TWO}</Tabs.Panel>

          <Tabs.Tab label="Cherry" />
          <Tabs.Panel>{'Cherry → ' + THREE}</Tabs.Panel>
        </Tabs>

        {/* 4. Vertical - right ------------------------------------------- */}
        <Typography variant="h3">4. Vertical – right</Typography>
        <Tabs orientation="vertical" placement="right" style={{ height: 200 }}>
          <Tabs.Tab label="Left Brain" />
          <Tabs.Panel>{'Left → ' + FOUR}</Tabs.Panel>

          <Tabs.Tab label="Right Brain" />
          <Tabs.Panel>{'Right → ' + FIVE}</Tabs.Panel>
        </Tabs>

        {/* 5. Controlled example ----------------------------------------- */}
        <Typography variant="h3">5. Controlled example</Typography>
        <Button
          size="sm"
          variant="outlined"
          onClick={() => setActiveCtl((prev) => (prev === 2 ? 0 : prev + 1))}
          style={{ alignSelf: 'flex-start' }}
        >
          Next tab programmatically
        </Button>
        <Tabs active={activeCtl} onTabChange={setActiveCtl}>
          <Tabs.Tab label="First" />
          <Tabs.Panel>{'First → ' + ONE}</Tabs.Panel>

          <Tabs.Tab label="Second" />
          <Tabs.Panel>{'Second → ' + TWO}</Tabs.Panel>

          <Tabs.Tab label="Third" />
          <Tabs.Panel>{'Third → ' + SIX}</Tabs.Panel>
        </Tabs>

        {/* 6. Icon headings ----------------------------------------------- */}
        <Typography variant="h3">6. Icon headings</Typography>
        <Tabs>
          <Tabs.Tab
            label={<Icon icon="mdi:home" />}
            aria-label="Home"
            tooltip="Home"
          />
          <Tabs.Panel>{'Home → ' + ONE}</Tabs.Panel>

          <Tabs.Tab
            label={<Icon icon="mdi:account" />}
            aria-label="Profile"
            tooltip="Profile"
          />
          <Tabs.Panel>{'Profile → ' + TWO}</Tabs.Panel>

          <Tabs.Tab
            label={<Icon icon="mdi:cog" />}
            aria-label="Settings"
            tooltip="Settings"
          />
          <Tabs.Panel>{'Settings → ' + THREE}</Tabs.Panel>
        </Tabs>

        {/* 7. Centered headings ------------------------------------------- */}
        <Typography variant="h3">7. Centered headings</Typography>
        <Tabs centered>
          <Tabs.Tab
            label={
              <Stack
                direction="row"
                style={{ alignItems: 'center', gap: theme.spacing(0.5) }}
              >
                <Icon icon="mdi:home" />
                <Typography>Home</Typography>
              </Stack>
            }
          />
          <Tabs.Panel>{'Home → ' + ONE}</Tabs.Panel>

          <Tabs.Tab
            label={
              <Stack
                direction="row"
                style={{ alignItems: 'center', gap: theme.spacing(0.5) }}
              >
                <Icon icon="mdi:account" />
                <Typography>Profile</Typography>
              </Stack>
            }
          />
          <Tabs.Panel>{'Profile → ' + TWO}</Tabs.Panel>

          <Tabs.Tab
            label={
              <Stack
                direction="row"
                style={{ alignItems: 'center', gap: theme.spacing(0.5) }}
              >
                <Icon icon="mdi:cog" />
                <Typography>Settings</Typography>
              </Stack>
            }
          />
          <Tabs.Panel>{'Settings → ' + THREE}</Tabs.Panel>
        </Tabs>

        {/* 8. Vertical - left centered ---------------------------------- */}
        <Typography variant="h3">8. Vertical – left centered</Typography>
        <Tabs orientation="vertical" centered style={{ height: 200 }}>
          <Tabs.Tab
            label={<Icon icon="mdi:home" />}
            aria-label="Home"
            tooltip="Home"
          />
          <Tabs.Panel>{'Home → ' + ONE}</Tabs.Panel>

          <Tabs.Tab
            label={<Icon icon="mdi:account" />}
            aria-label="Profile"
            tooltip="Profile"
          />
          <Tabs.Panel>{'Profile → ' + TWO}</Tabs.Panel>

          <Tabs.Tab
            label={<Icon icon="mdi:cog" />}
            aria-label="Settings"
            tooltip="Settings"
          />
          <Tabs.Panel>{'Settings → ' + THREE}</Tabs.Panel>
        </Tabs>

        {/* Theme switcher -------------------------------------------------- */}
        <Typography variant="h3">9. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark
        </Button>

        {/* Back nav -------------------------------------------------------- */}
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
