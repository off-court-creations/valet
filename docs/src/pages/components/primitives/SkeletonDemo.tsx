// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/SkeletonDemo.tsx  | valet-docs
// Showcase of Skeleton component using the reusable ComponentMetaPage (5 tabs)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Skeleton,
  Avatar,
  Image,
  Button,
  Icon,
  useTheme,
  Panel,
  Select,
  Switch,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import SkeletonMeta from '../../../../../src/components/primitives/Skeleton.meta.json';

type Variant = 'text' | 'rect' | 'circle';

export default function SkeletonDemoPage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [variant, setVariant] = useState<Variant>('rect');

  const usageContent = (
    <Stack>
      <Typography variant='subtitle'>Adaptive placeholder with pulsing animation</Typography>

      <Button
        onClick={() => setLoading((l) => !l)}
        sx={{ alignSelf: 'flex-start', marginTop: theme.spacing(1) }}
      >
        {loading ? 'Show content' : 'Show skeleton'}
      </Button>

      <Stack compact>
        <Stack compact>
          <Typography variant='subtitle'>Text</Typography>
          <Skeleton loading={loading}>
            <Typography variant='body'>Text loads in…</Typography>
          </Skeleton>
        </Stack>

        <Stack compact>
          <Typography variant='subtitle'>Avatar</Typography>
          <Skeleton loading={loading}>
            <Avatar
              email='support@gravatar.com'
              size='l'
            />
          </Skeleton>
        </Stack>

        <Stack compact>
          <Typography variant='subtitle'>Image</Typography>
          <Skeleton loading={loading}>
            <Panel
              sx={{ width: 160, height: 80, borderRadius: theme.radius(1), overflow: 'hidden' }}
            >
              <Image
                src='https://picsum.photos/400/300'
                alt='Loading kitten'
                width='100%'
                height='100%'
                objectFit='cover'
              />
            </Panel>
          </Skeleton>
        </Stack>

        <Stack compact>
          <Typography variant='subtitle'>Rect (explicit variant)</Typography>
          <Skeleton variant='rect'>
            <div style={{ width: 160, height: 80, background: theme.colors['backgroundAlt'] }} />
          </Skeleton>
        </Stack>

        <Stack compact>
          <Typography variant='subtitle'>With icon</Typography>
          <Skeleton
            loading={loading}
            icon={<Icon icon='mdi:clock-outline' />}
          >
            <Typography variant='body'>Loading with icon…</Typography>
          </Skeleton>
        </Stack>
      </Stack>
    </Stack>
  );

  const playgroundContent = (
    <Stack gap={1}>
      <Panel fullWidth>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Select
            placeholder='variant'
            value={variant}
            onChange={(v) => setVariant(v as Variant)}
            sx={{ width: 160 }}
          >
            <Select.Option value='rect'>rect</Select.Option>
            <Select.Option value='text'>text</Select.Option>
            <Select.Option value='circle'>circle</Select.Option>
          </Select>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>loading</Typography>
            <Switch
              checked={loading}
              onChange={setLoading}
              aria-label='loading'
            />
          </Stack>
        </Stack>
      </Panel>
      <Panel fullWidth>
        <Skeleton
          loading={loading}
          variant={variant}
        >
          <Typography variant='body'>Preview content — toggled by loading</Typography>
        </Skeleton>
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Skeleton'
      subtitle='Adaptive placeholder with content-aware sizing and smooth fade.'
      slug='components/primitives/skeleton'
      meta={SkeletonMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
