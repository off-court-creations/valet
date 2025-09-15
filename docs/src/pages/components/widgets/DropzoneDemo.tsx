// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/DropzoneDemo.tsx  | valet-docs
// Dropzone docs using ComponentMetaPage (Usage, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Button,
  Dropzone,
  useTheme,
  Panel,
  Select,
  Switch,
  Iterator,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import CuratedExamples from '../../../components/CuratedExamples';
import BestPractices from '../../../components/BestPractices';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import DropzoneMeta from '../../../../../src/components/widgets/Dropzone.meta.json';

export default function DropzoneDemoPage() {
  const { toggleMode } = useTheme();

  const usageContent = (
    <Stack>
      <Typography variant='h3'>1. Default</Typography>
      <Dropzone />

      <Typography variant='h3'>2. Image only</Typography>
      <Dropzone accept={{ 'image/*': [] }} />

      <Typography variant='h3'>3. Limit to two files</Typography>
      <Dropzone maxFiles={2} />

      <Typography variant='h3'>4. File list</Typography>
      <Dropzone
        showPreviews={false}
        showFileList
      />

      <Typography variant='h3'>5. No previews</Typography>
      <Dropzone showPreviews={false} />

      <Typography variant='h3'>6. Full width</Typography>
      <Dropzone fullWidth />

      <Typography variant='h3'>7. Theme toggle</Typography>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark
      </Button>
    </Stack>
  );

  // Playground
  const [pgAccept, setPgAccept] = useState<'any' | 'images' | 'audio' | 'video' | 'docs'>('any');
  const [pgMultiple, setPgMultiple] = useState(true);
  const [pgMaxFiles, setPgMaxFiles] = useState<number>(4);
  const [pgShowPreviews, setPgShowPreviews] = useState(true);
  const [pgShowFileList, setPgShowFileList] = useState(false);
  const [pgFullWidth, setPgFullWidth] = useState(false);
  const [pgCount, setPgCount] = useState(0);

  const acceptMap =
    pgAccept === 'images'
      ? { 'image/*': [] }
      : pgAccept === 'audio'
        ? { 'audio/*': [] }
        : pgAccept === 'video'
          ? { 'video/*': [] }
          : pgAccept === 'docs'
            ? {
                'application/pdf': [],
                'text/plain': [],
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [],
              }
            : undefined;

  const playgroundContent = (
    <Stack gap={1}>
      <Panel fullWidth>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Select
            placeholder='accept'
            value={pgAccept}
            onChange={(v) => setPgAccept(v as typeof pgAccept)}
            sx={{ width: 180 }}
          >
            <Select.Option value='any'>any</Select.Option>
            <Select.Option value='images'>images</Select.Option>
            <Select.Option value='audio'>audio</Select.Option>
            <Select.Option value='video'>video</Select.Option>
            <Select.Option value='docs'>docs</Select.Option>
          </Select>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>multiple</Typography>
            <Switch
              checked={pgMultiple}
              onChange={setPgMultiple}
              aria-label='multiple'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>maxFiles</Typography>
            <Iterator
              width={160}
              min={1}
              max={20}
              step={1}
              value={pgMaxFiles}
              onChange={(n) => setPgMaxFiles(Math.round(n))}
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>showPreviews</Typography>
            <Switch
              checked={pgShowPreviews}
              onChange={setPgShowPreviews}
              aria-label='showPreviews'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>showFileList</Typography>
            <Switch
              checked={pgShowFileList}
              onChange={setPgShowFileList}
              aria-label='showFileList'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>fullWidth</Typography>
            <Switch
              checked={pgFullWidth}
              onChange={setPgFullWidth}
              aria-label='fullWidth'
            />
          </Stack>
        </Stack>
      </Panel>
      <Panel fullWidth>
        <Dropzone
          accept={acceptMap}
          multiple={pgMultiple}
          maxFiles={pgMaxFiles}
          showPreviews={pgShowPreviews}
          showFileList={pgShowFileList}
          fullWidth={pgFullWidth}
          onFilesChange={(files) => setPgCount(files.length)}
        />
        <Typography variant='subtitle'>Files: {pgCount}</Typography>
      </Panel>
      <CuratedExamples examples={getExamples(DropzoneMeta)} />
      <BestPractices items={getBestPractices(DropzoneMeta)} />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Dropzone'
      subtitle='Themed file-drop area with previews and file list options.'
      slug='components/widgets/dropzone'
      meta={DropzoneMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
