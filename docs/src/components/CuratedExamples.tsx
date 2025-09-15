// ─────────────────────────────────────────────────────────────
// docs/src/components/CuratedExamples.tsx  | valet-docs
// Render curated examples from component sidecar meta
// ─────────────────────────────────────────────────────────────
import { Panel, Stack, Typography } from '@archway/valet';
import LiveCodePreview from './LiveCodePreview';

export type CuratedExample = {
  id: string;
  title?: string;
  code: string;
  lang?: string;
};

export type CuratedExamplesProps = {
  title?: string;
  examples: CuratedExample[] | undefined | null;
};

export default function CuratedExamples({ title = 'Examples', examples }: CuratedExamplesProps) {
  if (!examples || examples.length === 0) return null;
  return (
    <Panel fullWidth>
      <Typography variant='h4'>{title}</Typography>
      <Stack sx={{ gap: '0.5rem' }}>
        {examples.map((ex) => (
          <LiveCodePreview
            key={ex.id}
            title={ex.title}
            code={ex.code}
            language={ex.lang || 'tsx'}
          />
        ))}
      </Stack>
    </Panel>
  );
}
