// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/PaginationDemo.tsx  | valet-docs
// Pagination docs using ComponentMetaPage (Usage, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Typography, Iterator, Pagination, Switch } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import PaginationMeta from '../../../../../src/components/widgets/Pagination.meta.json';

export default function PaginationDemoPage() {
  const [usagePage, setUsagePage] = useState(1);
  const [count, setCount] = useState<number>(7);
  const [page, setPage] = useState<number>(3);
  const [visibleWindow, setVisibleWindow] = useState<number>(0);
  const [autoFollowActive, setAutoFollowActive] = useState<boolean>(true);

  const usageContent = (
    <Stack>
      <Typography variant='h3'>Controlled Pagination</Typography>
      <Pagination
        count={10}
        visibleWindow={5}
        page={usagePage}
        onChange={setUsagePage}
      />
      <Typography>Current page: {usagePage}</Typography>
    </Stack>
  );

  const playgroundContent = (
    <Stack gap={1}>
      <Stack
        direction='row'
        wrap={false}
        gap={1}
      >
        <Stack gap={0.25}>
          <Typography variant='subtitle'>count</Typography>
          <Iterator
            width={160}
            min={1}
            max={300}
            step={1}
            value={count}
            onChange={(n) => {
              setCount(n);
              setPage((p) => Math.min(n, Math.max(1, p)));
              setVisibleWindow((w) => (w > 0 ? Math.min(Math.max(1, n), w) : 0));
            }}
            aria-label='count'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>visibleWindow (0 = off)</Typography>
          <Iterator
            width={220}
            min={0}
            max={Math.max(0, count)}
            step={1}
            value={visibleWindow}
            onChange={(n) => setVisibleWindow(n)}
            aria-label='visibleWindow'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>autoFollowActive</Typography>
          <Switch
            checked={autoFollowActive}
            onChange={setAutoFollowActive}
          />
        </Stack>
      </Stack>

      <Pagination
        count={count}
        page={page}
        onChange={setPage}
        {...(visibleWindow > 0 ? { visibleWindow } : {})}
        autoFollowActive={autoFollowActive}
      />
      <Typography>Current page: {page}</Typography>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Pagination'
      subtitle='Accessible pagination with visible window, active tracking, and controlled mode.'
      slug='components/widgets/pagination'
      meta={PaginationMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
