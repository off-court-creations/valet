// ─────────────────────────────────────────────────────────────
// src/pages/SkeletonDemo.tsx | valet-docs
// Showcase of Skeleton component
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Skeleton,
  Avatar,
  Image,
  Button,
  Tabs,
  Icon,
  useTheme,
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import { getBestPractices } from '../../../utils/sidecar';
import SkeletonMeta from '../../../../../src/components/primitives/Skeleton.meta.json';
import PageHero from '../../../components/PageHero';

export default function SkeletonDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Skeleton' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
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
                  <Image
                    src='https://picsum.photos/400/300'
                    alt='Loading kitten'
                    width={160}
                    height={80}
                    rounded={4}
                  />
                </Skeleton>
              </Stack>

              <Stack compact>
                <Typography variant='subtitle'>Rect</Typography>
                <Skeleton variant='rect'>
                  <div
                    style={{
                      width: 160,
                      height: 80,
                      background: theme.colors['backgroundAlt'],
                    }}
                  />
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

              <Stack compact>
                <Typography variant='subtitle'>Image</Typography>
                <Skeleton>
                  <Image
                    src='https://picsum.photos/400/301'
                    alt='Random scenic'
                    width={160}
                    height={80}
                    rounded={4}
                  />
                </Skeleton>
              </Stack>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/primitives/skeleton' />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        <BestPractices items={getBestPractices(SkeletonMeta)} />
      </Stack>
    </Surface>
  );
}
