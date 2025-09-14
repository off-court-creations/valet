// ─────────────────────────────────────────────────────────────────────────────
// src/pages/components/Panel.tsx | valet-docs
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack, // tidy vertical layout
  Panel,
  Typography,
  useTheme,
  Tabs,
} from '@archway/valet';

import ReferenceSection from '../../../components/ReferenceSection';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */

export default function PanelDemoPage() {
  const { theme } = useTheme(); // live theme switch

  // manual reference removed; using ReferenceSection

  return (
    <Surface /* Surface already defaults to theme background */>
      <NavDrawer />
      <Stack>
        <PageHero title='Panel' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              {/* 1. 
              Default Panel ------------------------------------------- */}
              <Typography variant='h3'>Default Panel</Typography>
              <Panel preset='codePanel'>
                <Typography>(no props) — inherits theme backgroundAlt &amp; text</Typography>
              </Panel>

              {/* 2. alt variant --------------------------------------------------- */}
              <Typography variant='h3'>
                <code>variant</code>=&quot;alt&quot;
              </Typography>
              <Panel
                variant='alt'
                preset='codePanel'
              >
                <Typography>Transparent with outline by default</Typography>
              </Panel>

              {/* 3. background override ------------------------------------------ */}
              <Typography variant='h3'>
                <code>background</code> prop
              </Typography>
              <Stack>
                <Panel
                  background={theme.colors['primary']}
                  preset='codePanel'
                >
                  <Typography>{`background=${theme.colors['primary']}`}</Typography>
                </Panel>
              </Stack>

              {/* 4. fullWidth prop ----------------------------------------------- */}
              <Typography variant='h3'>
                <code>fullWidth</code> prop
              </Typography>
              <Panel
                fullWidth
                sx={{ marginBottom: theme.spacing(4) }}
              >
                <Typography>
                  Stretch me edge-to-edge with <code>fullWidth</code>
                </Typography>
              </Panel>

              {/* 5. Inline style overrides --------------------------------------- */}
              <Typography variant='h3'>Inline sx</Typography>
              <Panel
                sx={{
                  borderRadius: 12,
                  border: `2px dashed ${theme.colors['text']}`,
                }}
                preset='codePanel'
              >
                <Typography>
                  Custom dashed border &amp; radius via <code>sx</code>
                </Typography>
              </Panel>

              {/* 6. Nested Panels & colour inheritance --------------------------- */}
              <Typography variant='h3'>Nested Panels</Typography>
              <Panel
                background={theme.colors['primary']}
                sx={{
                  padding: theme.spacing(1),
                  marginBottom: theme.spacing(4),
                }}
              >
                <Panel
                  variant='alt'
                  fullWidth
                  sx={{ padding: theme.spacing(1) }}
                >
                  <Typography>
                    Parent sets&nbsp;
                    <code style={{ color: 'var(--zero-text-color)' }}>--zero-text-color</code>
                    &nbsp;for child
                  </Typography>
                </Panel>
              </Panel>

              {/* 7. Preset demos -------------------------------------------------- */}
              <Typography variant='h3'>Presets</Typography>
              <Stack sx={{ marginBottom: theme.spacing(4) }}>
                <Panel preset='fancyHolder'>
                  <Typography>preset=&quot;fancyHolder&quot;</Typography>
                </Panel>

                <Panel preset='glassHolder'>
                  <Typography>preset=&quot;glassHolder&quot;</Typography>
                </Panel>

                <Panel preset='gradientHolder'>
                  <Typography>preset=&quot;gradientHolder&quot;</Typography>
                </Panel>

                <Panel preset={['glassHolder', 'fancyHolder']}>
                  <Typography>
                    Combination&nbsp;
                    <code>{`preset={['glassHolder', 'fancyHolder']}`}</code>
                  </Typography>
                </Panel>
              </Stack>

              {/* 8. centerContent prop ------------------------------------------ */}
              <Typography variant='h3'>
                <code>centerContent</code> prop
              </Typography>
              <Panel
                centerContent
                fullWidth
              >
                <Typography>
                  Contents centered with <code>centerContent</code>
                </Typography>
              </Panel>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/layout/panel' />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}
