// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/ImageDemo.tsx  | valet-docs
// Showcase of Image component using the reusable ComponentMetaPage (5 tabs)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Image,
  useTheme,
  Panel,
  Select,
  Iterator,
  Switch,
  TextField,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import ImageMeta from '../../../../../src/components/primitives/Image.meta.json';

export default function ImageDemoPage() {
  const { theme } = useTheme();

  // Playground controls
  const [pgSrc, setPgSrc] = useState('https://picsum.photos/600/400');
  const [pgWidth, setPgWidth] = useState<string>('100%');
  const [pgHeight, setPgHeight] = useState<string>('300px');
  const [pgFit, setPgFit] = useState<'cover' | 'contain' | 'fill' | 'none' | 'scale-down'>('cover');
  const [pgRounded, setPgRounded] = useState<number>(8);
  const [pgLazy, setPgLazy] = useState<boolean>(false);
  const [pgPlaceholder, setPgPlaceholder] = useState<string>('https://placehold.co/10x10');

  const usageContent = (
    <Stack>
      <Typography variant='h3'>1. Basic usage</Typography>
      <Image
        src='https://picsum.photos/400/300'
        alt='Kitten'
        width='100%'
        height='auto'
        rounded={8}
      />

      <Typography variant='h3'>2. Lazy loaded</Typography>
      <Image
        src='https://picsum.photos/400/300'
        alt='Lazy kitten'
        width='100%'
        height='300px'
        lazy
        placeholder='https://placehold.co/10x10'
      />

      <Typography variant='h3'>3. Contain fit</Typography>
      <Image
        src='https://picsum.photos/400/300'
        alt='Contained kitten'
        width='100%'
        height='300px'
        objectFit='contain'
        sx={{ background: '#0003' }}
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
            placeholder='objectFit'
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
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>rounded</Typography>
            <Iterator
              width={160}
              min={0}
              max={24}
              step={2}
              value={pgRounded}
              onChange={setPgRounded}
              aria-label='Rounded radius'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>lazy</Typography>
            <Switch
              checked={pgLazy}
              onChange={setPgLazy}
              aria-label='lazy'
            />
          </Stack>
          <TextField
            name='placeholder'
            label='placeholder'
            placeholder='https://…'
            value={pgPlaceholder}
            onChange={(e) => setPgPlaceholder((e.target as HTMLInputElement).value)}
            sx={{ width: 240 }}
          />
        </Stack>
      </Panel>
      <Panel fullWidth>
        <Image
          src={pgSrc}
          width={pgWidth}
          height={pgHeight}
          objectFit={pgFit}
          rounded={pgRounded}
          lazy={pgLazy}
          placeholder={pgPlaceholder}
          alt='Playground preview'
          sx={{ background: theme.colors['text'] + '11' }}
        />
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Image'
      subtitle='Responsive, lazy-loading image with object-fit and rounded corners.'
      slug='components/primitives/image'
      meta={ImageMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
