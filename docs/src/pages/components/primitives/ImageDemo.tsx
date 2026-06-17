// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/ImageDemo.tsx  | valet-docs
// Showcase of Image component using the reusable ComponentMetaPage (5 tabs)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Typography, Image, useTheme, Panel, Select, TextField } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import ImageMeta from '../../../../../src/components/primitives/Image.meta.json';

export default function ImageDemoPage() {
  const { theme } = useTheme();

  // Playground controls
  const [pgSrc, setPgSrc] = useState('https://picsum.photos/seed/valet-play/800/600');
  const [pgWidth, setPgWidth] = useState<string>('400px');
  const [pgHeight, setPgHeight] = useState<string>('260px');
  const [pgFit, setPgFit] = useState<'cover' | 'contain' | 'fill' | 'none' | 'scale-down'>('cover');
  const [pgLoading, setPgLoading] = useState<'lazy' | 'eager'>('lazy');
  const [pgObjectPos, setPgObjectPos] = useState<string>('center');
  const [pgAspect, setPgAspect] = useState<string>('auto');

  const usageContent = (
    <Stack>
      <Typography variant='h3'>1. Rounded corners (no wrapper)</Typography>
      <Typography variant='subtitle'>
        <code>radius</code> rounds the image itself — number → <code>theme.radius(n)</code> (scales with
        density), string → verbatim. No Panel/overflow wrapper needed.
      </Typography>
      <Image
        src='https://picsum.photos/seed/valet-meadow/800/600'
        alt='Meadow'
        width={400}
        height='auto'
        radius={2}
      />

      <Typography variant='h3'>2. Priority (LCP hero)</Typography>
      <Typography variant='subtitle'>
        <code>priority</code> sets <code>loading=eager</code> + <code>fetchPriority=high</code> for the
        above-the-fold hero. Everything else stays lazy by default.
      </Typography>
      <Image
        src='https://picsum.photos/id/1015/800/600'
        alt='River canyon hero'
        width={400}
        height={300}
        radius={2}
        priority
      />

      <Typography variant='h3'>3. Contain fit</Typography>
      <Image
        src='https://picsum.photos/id/1025/800/600'
        alt='Pug in a blanket, contained'
        width={400}
        height={260}
        fit='contain'
        radius={2}
      />

      <Typography variant='h3'>4. Aspect ratio + top focus</Typography>
      <Image
        src='https://picsum.photos/seed/valet-canyon/1200/800'
        alt='Canyon, 16:9 from the top'
        width={400}
        aspectRatio={16 / 9}
        fit='cover'
        objectPosition='top'
        radius={2}
      />

      <Typography variant='h3'>5. Error fallback (opt-in)</Typography>
      <Typography variant='subtitle'>
        Pass <code>fallback</code> to render a node when the image fails to load. Without it, a broken
        image behaves like a native <code>&lt;img&gt;</code>. You size/theme the fallback.
      </Typography>
      <Image
        src='https://example.invalid/does-not-exist.png'
        alt='A photo that fails to load'
        width={400}
        height={200}
        radius={2}
        fallback={
          <Stack
            sx={{
              width: 400,
              maxWidth: '100%',
              height: 200,
              background: theme.colors['backgroundAlt'],
              borderRadius: theme.radius(2),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant='subtitle'>Image unavailable</Typography>
          </Stack>
        }
      />
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
            name='src'
            label='src'
            placeholder='https://…'
            value={pgSrc}
            onChange={(e) => setPgSrc((e.target as HTMLInputElement).value)}
            sx={{ width: 320 }}
          />
          <Select
            placeholder='fit'
            value={pgFit}
            onValueChange={(v) => setPgFit(v as typeof pgFit)}
            sx={{ width: 180 }}
          >
            <Select.Option value='cover'>cover</Select.Option>
            <Select.Option value='contain'>contain</Select.Option>
            <Select.Option value='fill'>fill</Select.Option>
            <Select.Option value='none'>none</Select.Option>
            <Select.Option value='scale-down'>scale-down</Select.Option>
          </Select>
          <Select
            placeholder='loading'
            value={pgLoading}
            onValueChange={(v) => setPgLoading(v as typeof pgLoading)}
            sx={{ width: 160 }}
          >
            <Select.Option value='lazy'>lazy</Select.Option>
            <Select.Option value='eager'>eager</Select.Option>
          </Select>
          <TextField
            name='width'
            label='width'
            placeholder='e.g., 100% or 320px'
            value={pgWidth}
            onChange={(e) => setPgWidth((e.target as HTMLInputElement).value)}
            sx={{ width: 180 }}
          />
          <TextField
            name='height'
            label='height'
            placeholder='e.g., auto or 240px'
            value={pgHeight}
            onChange={(e) => setPgHeight((e.target as HTMLInputElement).value)}
            sx={{ width: 180 }}
          />
          <TextField
            name='objectPosition'
            label='objectPosition'
            placeholder='e.g., center or 50% 25%'
            value={pgObjectPos}
            onChange={(e) => setPgObjectPos((e.target as HTMLInputElement).value)}
            sx={{ width: 200 }}
          />
          <TextField
            name='aspectRatio'
            label='aspectRatio'
            placeholder='e.g., 16 / 9 or auto'
            value={pgAspect}
            onChange={(e) => setPgAspect((e.target as HTMLInputElement).value)}
            sx={{ width: 180 }}
          />
        </Stack>
      </Panel>
      <Panel fullWidth>
        <Image
          src={pgSrc}
          width={pgWidth}
          height={pgHeight}
          fit={pgFit}
          loading={pgLoading}
          objectPosition={pgObjectPos}
          aspectRatio={pgAspect}
          alt='Playground preview'
        />
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Image'
      subtitle='SSR-safe image: theme-aware radius, fit/object-position, aspect-ratio, lazy-by-default with a priority opt-in for LCP, and an optional onError fallback.'
      slug='components/primitives/image'
      meta={ImageMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
