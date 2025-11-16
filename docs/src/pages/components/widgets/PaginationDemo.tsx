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

  // Ten distinct lorem ipsum segments for usage demo content
  const lorem: string[] = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vitae sapien at tortor malesuada convallis. Integer viverra, nibh in convallis luctus, eros nisl aliquet leo, quis bibendum neque risus vitae nisl.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',
    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Quisque non urna sit amet libero pharetra bibendum. Vivamus ut arcu in magna tempor laoreet. Nam faucibus, lectus in tempor condimentum, augue lorem ultricies risus, vitae dictum mi tortor vel augue.',
    'Curabitur pharetra, justo a tempus porta, nisi sem sollicitudin risus, in dignissim arcu dolor id lectus. Suspendisse potenti. Cras porttitor, risus id tempor placerat, nunc lorem posuere nunc, a cursus nulla magna et mi.',
    'Integer tincidunt suscipit erat, non convallis dolor facilisis ac. Sed ac arcu nibh. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
    'Mauris congue, risus nec varius vehicula, purus massa auctor lacus, a malesuada risus magna sit amet sapien. Cras vitae massa quis est interdum efficitur. Donec vitae dictum mi.',
    'Fusce in efficitur risus. Aliquam auctor leo vitae velit tempor, sed efficitur urna malesuada. Vestibulum eget rhoncus massa. Aliquam ac est id ante tincidunt tincidunt a vel tellus.',
    'Proin ut nisl in augue auctor feugiat. In sed finibus arcu. Pellentesque id dolor ac dui sodales convallis. Phasellus id massa eu justo feugiat tincidunt at id libero.',
  ];

  const usageContent = (
    <Stack>
      <Typography variant='h3'>Controlled Pagination</Typography>
      <Stack gap={0.75}>
        <Typography variant='subtitle'>Content for page {usagePage}</Typography>
        <Typography>{lorem[usagePage - 1]}</Typography>
      </Stack>
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
            onValueChange={(n) => {
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
            onValueChange={(n) => setVisibleWindow(n)}
            aria-label='visibleWindow'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>autoFollowActive</Typography>
          <Switch
            checked={autoFollowActive}
            onValueChange={(v) => setAutoFollowActive(!!v)}
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
