// ─────────────────────────────────────────────────────────────────────────────
// src/pages/IconDemoPage.tsx
// A comprehensive live demo of every Icon capability in ZeroUI
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Box,
  Typography,
  Button,
  Icon,
  useTheme,
  definePreset,
  Tabs,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import ReferenceSection from '../../../components/ReferenceSection';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import IconMeta from '../../../../../src/components/primitives/Icon.meta.json';
import PageHero from '../../../components/PageHero';
import mymoSVG from '../../../assets/mygymlogo.svg?raw';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style presets – demonstrate Icon inside themed containers                   */
definePreset(
  'iconCard',
  (t) => `
    background   : ${t.colors['secondary']};
    color        : ${t.colors['secondaryText']};
    padding      : ${t.spacing(1)};
    border-radius: 16px;
    box-shadow   : 0 4px 12px ${t.colors['text']}22;
    display      : inline-flex;
    align-items  : center;
    gap          : ${t.spacing(1)};
  `,
);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function IconDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Icon' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='subtitle'>
              Built-in Iconify names, custom SVGs, presets, and theme coupling
            </Typography>

            {/* 1. Inline usage -------------------------------------------------- */}
            <Typography variant='h3'>1. Inline with text</Typography>
            <Typography>
              Icons inherit text colour automatically&nbsp;
              <Icon
                icon='mdi:rocket-launch-outline'
                size='1.25em'
              />
              &nbsp;anywhere in your prose.
            </Typography>

            {/* 2. Sizing -------------------------------------------------------- */}
            <Typography variant='h3'>2. Size prop</Typography>
            <Stack direction='row'>
              <Icon
                icon='mdi:home'
                size='xs'
                aria-label='home-xs'
              />
              <Icon
                icon='mdi:home'
                size='sm'
                aria-label='home-sm'
              />
              <Icon
                icon='mdi:home'
                size='md'
                aria-label='home-md'
              />
              <Icon
                icon='mdi:home'
                size='lg'
                aria-label='home-lg'
              />
              <Icon
                icon='mdi:home'
                size='xl'
                aria-label='home-xl'
              />
            </Stack>

            {/* 3. Color override ---------------------------------------------- */}
            <Typography variant='h3'>3. Colour override</Typography>
            <Stack direction='row'>
              <Icon
                icon='carbon:warning-filled'
                color={theme.colors['primary']}
                size={32}
              />
              <Icon
                icon='carbon:warning-filled'
                color='#ff6b6b'
                size={32}
              />
              <Icon
                icon='carbon:warning-filled'
                color='gold'
                size={32}
              />
            </Stack>

            {/* 4. Custom SVG (React element) ----------------------------------- */}
            <Typography variant='h3'>4. Custom SVG element</Typography>
            <Icon
              svg={mymoSVG}
              size={40}
              aria-label='heart'
            />

            {/* 6. Icon presets -------------------------------------------------- */}
            <Typography variant='h3'>5. Presets</Typography>
            <Box preset='iconCard'>
              <Icon
                icon='mdi:credit-card-outline'
                size={48}
              />
              <Typography
                variant='h4'
                bold
              >
                iconCard preset
              </Typography>
            </Box>

            {/* 7. Icon inside Button ------------------------------------------- */}
            <Typography variant='h3'>6. Icon in other components</Typography>
            <Stack direction='row'>
              <Button>
                <Icon
                  icon='mdi:thumb-up'
                  size={18}
                  sx={{ marginRight: 8 }}
                />
                Like
              </Button>
              <Button variant='outlined'>
                <Icon
                  icon='mdi:share-variant'
                  size={18}
                  sx={{ marginRight: 8 }}
                />
                Share
              </Button>
            </Stack>

            {/* 8. Live theme validation ---------------------------------------- */}
            <Typography variant='h3'>7. Theme coupling</Typography>
            <Button
              variant='outlined'
              onClick={toggleMode}
            >
              Toggle light / dark mode
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/primitives/icon' />
          </Tabs.Panel>
        </Tabs>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        <CuratedExamples examples={getExamples(IconMeta)} />
        <BestPractices items={getBestPractices(IconMeta)} />
      </Stack>
    </Surface>
  );
}
