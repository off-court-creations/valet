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
  const [pgSrc, setPgSrc] = useState('https://picsum.photos/600/400');
  const [pgWidth, setPgWidth] = useState<string>('100%');
  const [pgHeight, setPgHeight] = useState<string>('300px');
  const [pgFit, setPgFit] = useState<'cover' | 'contain' | 'fill' | 'none' | 'scale-down'>('cover');
  const [pgLoading, setPgLoading] = useState<'lazy' | 'eager'>('lazy');
  const [pgObjectPos, setPgObjectPos] = useState<string>('center');
  const [pgAspect, setPgAspect] = useState<string>('auto');

  const usageContent = (
    <Stack>
      <Typography variant='h3'>1. Basic usage</Typography>
      <Panel
        fullWidth
        sx={{ borderRadius: theme.radius(2), overflow: 'hidden' }}
      >
        <Image
          src='https://picsum.photos/400/300'
          alt='Kitten'
          width='100%'
          height='auto'
        />
      </Panel>

      <Typography variant='h3'>2. Eager loaded (hero)</Typography>
      <Image
        src='https://picsum.photos/400/300'
        alt='Eager kitten'
        width='100%'
        height='300px'
        loading='eager'
      />

      <Typography variant='h3'>3. Contain fit</Typography>
      <Image
        src='https://picsum.photos/400/300'
        alt='Contained kitten'
        width='100%'
        height='300px'
        fit='contain'
      />

      <Typography variant='h3'>4. Aspect ratio + top focus</Typography>
      <Image
        src='https://picsum.photos/800/600'
        alt='Aspect ratio demo'
        width='100%'
        aspectRatio='16 / 9'
        fit='cover'
        objectPosition='top'
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
            onChange={(v) => setPgFit(v as typeof pgFit)}
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
            onChange={(v) => setPgLoading(v as typeof pgLoading)}
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
      subtitle='Responsive image with native lazy-loading, fit/object-position, and optional aspect-ratio. Apply rounded corners via sx or a wrapper.'
      slug='components/primitives/image'
      meta={ImageMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
