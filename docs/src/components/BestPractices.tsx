// ─────────────────────────────────────────────────────────────
// docs/src/components/BestPractices.tsx  | valet-docs
// Reusable renderer for sidecar-provided best practices lists
// ─────────────────────────────────────────────────────────────
import { Panel, Stack, Typography } from '@archway/valet';

export type BestPracticesProps = {
  title?: string;
  items: string[] | undefined | null;
};

export default function BestPractices({ title = 'Best Practices', items }: BestPracticesProps) {
  if (!items || items.length === 0) return null;
  return (
    <Panel fullWidth>
      <Typography variant='h4'>{title}</Typography>
      <Stack sx={{ gap: '0.25rem' }}>
        {items.map((bp, i) => (
          <Typography key={i}>{bp}</Typography>
        ))}
      </Stack>
    </Panel>
  );
}
