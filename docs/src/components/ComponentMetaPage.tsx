// ─────────────────────────────────────────────────────────────
// docs/src/components/ComponentMetaPage.tsx  | valet-docs
// Meta-driven docs template with 5 tabs: Usage, Best Practices, Playground, Examples, Reference
// ─────────────────────────────────────────────────────────────
import type { ReactNode } from 'react';
import { Surface, Stack, Tabs, Chip } from '@archway/valet';
import NavDrawer from './NavDrawer';
import PageHero from './PageHero';
import ReferenceSection from './ReferenceSection';
import BestPractices from './BestPractices';
import CuratedExamples from './CuratedExamples';
import type { ComponentSidecar } from '../utils/sidecar';
import { getBestPractices, getExamples } from '../utils/sidecar';
import { getComponentDoc, hasProps, hasCssVars, hasEvents } from '../utils/mcpDocs';

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
  const doc = getComponentDoc({ ...(slug ? { slug } : {}), ...(name ? { name } : {}) });
  const status: string | undefined =
    (meta && typeof (meta as unknown as { status?: string }).status === 'string'
      ? (meta as unknown as { status?: string }).status
      : undefined) ||
    (doc && typeof (doc as unknown as { status?: string }).status === 'string'
      ? (doc as unknown as { status?: string }).status
      : undefined);

  function statusChip() {
    if (!status || typeof status !== 'string') return null;
    const s = status.toLowerCase();
    let color:
      | 'default'
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'error'
      | 'success'
      | 'warning'
      | 'info' = 'default';
    let variant: 'filled' | 'outlined' = 'filled';
    let label = s.charAt(0).toUpperCase() + s.slice(1);
    if (s === 'golden') {
      color = 'tertiary';
      variant = 'filled';
      label = 'Golden';
    } else if (s === 'stable') {
      color = 'primary';
      variant = 'filled';
      label = 'Stable';
    } else if (s === 'experimental') {
      color = 'info';
      variant = 'outlined';
      label = 'Experimental';
    } else if (s === 'unstable') {
      color = 'warning';
      variant = 'outlined';
      label = 'Unstable';
    } else if (s === 'deprecated') {
      color = 'error';
      variant = 'outlined';
      label = 'Deprecated';
    }
    return (
      <Chip
        label={label}
        color={color}
        variant={variant}
      />
    );
  }

  // Build tab sections conditionally
  const sections: Array<{ label: string; content: ReactNode }> = [];
  // Usage always present
  sections.push({ label: 'Usage', content: usage });
  if (bestPractices && bestPractices.length > 0) {
    sections.push({
      label: 'Best Practices',
      content: <BestPractices items={bestPractices} />,
    });
  }
  if (playground) {
    sections.push({ label: 'Playground', content: playground });
  }
  if (examples && examples.length > 0) {
    sections.push({ label: 'Examples', content: <CuratedExamples examples={examples} /> });
  }
  const lookup: { slug?: string; name?: string } = {};
  if (slug) lookup.slug = slug;
  if (name) lookup.name = name;
  const showRef = hasProps(lookup) || hasCssVars(lookup) || hasEvents(lookup);
  if (showRef) {
    sections.push({
      label: 'Reference',
      content: (
        <ReferenceSection
          {...(slug ? { slug } : {})}
          {...(name ? { name } : {})}
        />
      ),
    });
  }

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero
          title={title}
          subtitle={subtitle}
          below={statusChip()}
        />

        {sections.length > 0 ? (
          <Tabs>
            {sections.map((s, i) => (
              <Tabs.Tab
                key={`tab-${i}`}
                label={s.label}
              />
            ))}
            {sections.map((s, i) => (
              <Tabs.Panel key={`panel-${i}`}>{s.content}</Tabs.Panel>
            ))}
          </Tabs>
        ) : null}
      </Stack>
    </Surface>
  );
}
