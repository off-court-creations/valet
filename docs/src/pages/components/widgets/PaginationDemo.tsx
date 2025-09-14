// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/PaginationDemo.tsx  | valet-docs
// Production docs layout for Pagination: Usage / Playground / Reference
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Surface, Stack, Typography, Tabs, Iterator, Pagination, Switch } from '@archway/valet';

import ReferenceSection from '../../../components/ReferenceSection';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import PaginationMeta from '../../../../../src/components/widgets/Pagination.meta.json';
import PageHero from '../../../components/PageHero';

export default function PaginationDemoPage() {
  const [usagePage, setUsagePage] = useState(1);
  const [count, setCount] = useState<number>(7);
  const [page, setPage] = useState<number>(3);
  const [visibleWindow, setVisibleWindow] = useState<number>(0);
  const [autoFollowActive, setAutoFollowActive] = useState<boolean>(true);

  /* reference handled by ReferenceSection */

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Pagination' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
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
          </Tabs.Panel>

          <Tabs.Tab label='Playground' />
          <Tabs.Panel>
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
                      // adjust visibleWindow max clamp
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
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/widgets/pagination' />
          </Tabs.Panel>
        </Tabs>

        <CuratedExamples examples={getExamples(PaginationMeta)} />
        <BestPractices items={getBestPractices(PaginationMeta)} />
      </Stack>
    </Surface>
  );
}
