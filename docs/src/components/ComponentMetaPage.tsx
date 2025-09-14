// ─────────────────────────────────────────────────────────────
// docs/src/components/ComponentMetaPage.tsx  | valet-docs
// Meta-driven docs template with 5 tabs: Usage, Best Practices, Playground, Examples, Reference
// ─────────────────────────────────────────────────────────────
import type { ReactNode } from 'react';
import { Surface, Stack, Tabs } from '@archway/valet';
import NavDrawer from './NavDrawer';
import PageHero from './PageHero';
import ReferenceSection from './ReferenceSection';
import BestPractices from './BestPractices';
import CuratedExamples from './CuratedExamples';
import type { ComponentSidecar } from '../utils/sidecar';
import { getBestPractices, getExamples } from '../utils/sidecar';

export type ComponentMetaPageProps = {
  title: string;
  subtitle?: string;
  /**
   * Component identifier for reference docs. Provide either slug or name.
   * Slug format matches files in `mcp-data/components/*.json` (e.g. "components/layout/box").
   */
  slug?: string;
  name?: string;

  /** Sidecar meta used to render best practices and curated examples */
  meta?: ComponentSidecar | null;

  /** Arbitrary content shown in the Usage tab */
  usage?: ReactNode;

  /** Arbitrary content shown in the Playground tab */
  playground?: ReactNode;
};

export default function ComponentMetaPage({
  title,
  subtitle,
  slug,
  name,
  meta,
  usage,
  playground,
}: ComponentMetaPageProps) {
  const examples = getExamples(meta);
  const bestPractices = getBestPractices(meta);

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero
          title={title}
          subtitle={subtitle}
        />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>{usage}</Tabs.Panel>

          <Tabs.Tab label='Best Practices' />
          <Tabs.Panel>
            <BestPractices items={bestPractices} />
          </Tabs.Panel>

          <Tabs.Tab label='Playground' />
          <Tabs.Panel>{playground}</Tabs.Panel>

          <Tabs.Tab label='Examples' />
          <Tabs.Panel>
            <CuratedExamples examples={examples} />
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection
              {...(slug ? { slug } : {})}
              {...(name ? { name } : {})}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}
