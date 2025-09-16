// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/ChipDemo.tsx  | valet-docs
// Chip demos via the reusable ComponentMetaPage (5 tabs)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Typography, Chip, Panel, Select, Switch } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import ChipMeta from '../../../../../src/components/widgets/Chip.meta.json';

type Size = 's' | 'm' | 'l';
type Variant = 'filled' | 'outlined';
type Color =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'success'
  | 'warning'
  | 'info';

export default function ChipDemoPage() {
  const usageContent = (
    <Stack>
      <Panel fullWidth>
        <Typography>
          Chips are static descriptors — never use them as buttons, toggles, or radio inputs. Pair
          them with an adjacent action if you need interaction.
        </Typography>
      </Panel>
      <Typography variant='h3'>Basic</Typography>
      <Stack
        direction='row'
        gap={0.5}
      >
        <Chip label='Active' />
        <Chip
          label='Primary'
          color='primary'
        />
        <Chip
          label='Outlined'
          variant='outlined'
        />
      </Stack>

      <Typography variant='h3'>Icons & delete</Typography>
      <Stack
        direction='row'
        gap={0.5}
      >
        <Chip
          label='Assignee'
          icon='mdi:account'
        />
        <Chip
          label='Filter'
          icon='mdi:filter-variant'
          onDelete={() => {}}
        />
      </Stack>

      <Typography variant='h3'>Sizes</Typography>
      <Stack
        direction='row'
        gap={0.5}
      >
        <Chip
          label='Small'
          size='s'
        />
        <Chip
          label='Medium'
          size='m'
        />
        <Chip
          label='Large'
          size='l'
        />
      </Stack>
    </Stack>
  );

  const [size, setSize] = useState<Size>('m');
  const [variant, setVariant] = useState<Variant>('filled');
  const [color, setColor] = useState<Color>('default');
  const [deletable, setDeletable] = useState(false);

  const playgroundContent = (
    <Stack gap={1}>
      <Panel fullWidth>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Select
            placeholder='size'
            value={size}
            onChange={(v) => setSize(v as Size)}
            sx={{ width: 140 }}
          >
            <Select.Option value='s'>s</Select.Option>
            <Select.Option value='m'>m</Select.Option>
            <Select.Option value='l'>l</Select.Option>
          </Select>

          <Select
            placeholder='variant'
            value={variant}
            onChange={(v) => setVariant(v as Variant)}
            sx={{ width: 160 }}
          >
            <Select.Option value='filled'>filled</Select.Option>
            <Select.Option value='outlined'>outlined</Select.Option>
          </Select>

          <Select
            placeholder='color'
            value={color}
            onChange={(v) => setColor(v as Color)}
            sx={{ width: 180 }}
          >
            {(
              [
                'default',
                'primary',
                'secondary',
                'tertiary',
                'error',
                'success',
                'warning',
                'info',
              ] as const
            ).map((c) => (
              <Select.Option
                key={c}
                value={c}
              >
                {c}
              </Select.Option>
            ))}
          </Select>

          <Typography>deletable</Typography>
          <Switch
            checked={deletable}
            onChange={setDeletable}
            aria-label='deletable'
          />
        </Stack>
      </Panel>

      <Stack
        direction='row'
        gap={0.5}
      >
        <Chip
          label='Preview'
          size={size}
          variant={variant}
          color={color}
          {...(deletable ? { onDelete: () => {} } : {})}
        />
      </Stack>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Chip'
      subtitle='Static label token with optional icon and removal affordance.'
      slug='components/widgets/chip'
      meta={ChipMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
