// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/ChipDemo.tsx  | valet-docs
// Chip demos via the reusable ComponentMetaPage (5 tabs)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Typography, Chip, Panel, Select, Switch } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import ChipMeta from '../../../../../src/components/widgets/Chip.meta.json';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Variant = 'filled' | 'outlined' | 'plain';
type Intent = 'default' | 'primary' | 'secondary' | 'error' | 'success' | 'warning' | 'info';

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
          intent='primary'
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
          label='XS'
          size='xs'
        />
        <Chip
          label='SM'
          size='sm'
        />
        <Chip
          label='MD'
          size='md'
        />
        <Chip
          label='LG'
          size='lg'
        />
        <Chip
          label='XL'
          size='xl'
        />
      </Stack>
    </Stack>
  );

  const [size, setSize] = useState<Size>('md');
  const [variant, setVariant] = useState<Variant>('filled');
  const [intent, setIntent] = useState<Intent>('default');
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
            onValueChange={(v) => setSize(v as Size)}
            sx={{ width: 140 }}
          >
            <Select.Option value='xs'>xs</Select.Option>
            <Select.Option value='sm'>sm</Select.Option>
            <Select.Option value='md'>md</Select.Option>
            <Select.Option value='lg'>lg</Select.Option>
            <Select.Option value='xl'>xl</Select.Option>
          </Select>

          <Select
            placeholder='variant'
            value={variant}
            onValueChange={(v) => setVariant(v as Variant)}
            sx={{ width: 160 }}
          >
            <Select.Option value='filled'>filled</Select.Option>
            <Select.Option value='outlined'>outlined</Select.Option>
          </Select>

          <Select
            placeholder='intent'
            value={intent}
            onValueChange={(v) => setIntent(v as Intent)}
            sx={{ width: 180 }}
          >
            {(
              ['default', 'primary', 'secondary', 'error', 'success', 'warning', 'info'] as const
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
            onValueChange={(v) => setDeletable(!!v)}
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
          intent={intent}
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
