// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/IconDemoPage.tsx  | valet-docs
// Showcase of Icon component using the reusable ComponentMetaPage (5 tabs)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Box,
  Typography,
  Button,
  Icon,
  useTheme,
  definePreset,
  Select,
  Panel,
  TextField,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import IconMeta from '../../../../../src/components/primitives/Icon.meta.json';
import mymoSVG from '../../../assets/mygymlogo.svg?raw';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style preset – demonstrate Icon inside a themed container                    */
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

export default function IconDemoPage() {
  const { theme, toggleMode } = useTheme();

  // Playground state
  const [pgIcon, setPgIcon] = useState('mdi:home');
  const [pgSize, setPgSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  const [pgColor, setPgColor] = useState<string>('');

  const usageContent = (
    <Stack>
      <Typography variant='subtitle'>
        Built-in Iconify names, custom SVGs, presets, and theme coupling
      </Typography>

      <Typography variant='h3'>1. Inline with text</Typography>
      <Typography>
        Icons inherit text colour automatically&nbsp;
        <Icon
          icon='mdi:rocket-launch-outline'
          size='1.25em'
        />
        &nbsp;anywhere in your prose.
      </Typography>

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

      <Typography variant='h3'>4. Custom SVG element</Typography>
      <Icon
        svg={mymoSVG}
        size={40}
        aria-label='custom-svg'
      />

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

      <Typography variant='h3'>7. Theme coupling</Typography>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark mode
      </Button>
    </Stack>
  );

  const playgroundContent = (
    <Stack gap={1}>
      <Panel fullWidth>
        <Typography variant='subtitle'>Playground</Typography>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <TextField
            name='icon'
            label='icon'
            placeholder='mdi:home'
            value={pgIcon}
            onChange={(e) => setPgIcon((e.target as HTMLInputElement).value)}
            sx={{ width: 260 }}
          />
          <Select
            placeholder='size'
            value={pgSize}
            onChange={(v) => setPgSize(v as typeof pgSize)}
            sx={{ width: 160 }}
          >
            <Select.Option value='xs'>xs</Select.Option>
            <Select.Option value='sm'>sm</Select.Option>
            <Select.Option value='md'>md</Select.Option>
            <Select.Option value='lg'>lg</Select.Option>
            <Select.Option value='xl'>xl</Select.Option>
          </Select>
          <TextField
            name='color'
            label='color'
            placeholder='currentColor or CSS color'
            value={pgColor}
            onChange={(e) => setPgColor((e.target as HTMLInputElement).value)}
            sx={{ width: 260 }}
          />
        </Stack>
      </Panel>
      <Stack
        gap={0.5}
        sx={{ alignItems: 'center' }}
      >
        <Icon
          icon={pgIcon}
          size={pgSize}
          color={pgColor || undefined}
          aria-label='preview-icon'
        />
        <Typography variant='subtitle'>Preview</Typography>
      </Stack>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Icon'
      subtitle='Built-in Iconify names, custom SVGs, presets, and theme coupling.'
      slug='components/primitives/icon'
      meta={IconMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
