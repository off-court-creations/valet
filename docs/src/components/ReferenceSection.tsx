// ─────────────────────────────────────────────────────────────
// docs/src/components/ReferenceSection.tsx  | valet-docs
// Unified reference renderer (Props, CSS vars, Events) from MCP data
// ─────────────────────────────────────────────────────────────
import { Stack, Typography } from '@archway/valet';
import PropsTable from './PropsTable';
import CssVarsTable from './CssVarsTable';
import EventsTable from './EventsTable';
import { hasProps, hasCssVars, hasEvents } from '../utils/mcpDocs';

export type ReferenceSectionProps = {
  slug?: string;
  name?: string;
  showProps?: boolean;
  showCssVars?: boolean;
  showEvents?: boolean;
};

export default function ReferenceSection({
  slug,
  name,
  showProps = true,
  showCssVars = true,
  showEvents = true,
}: ReferenceSectionProps) {
  const lookup: { slug?: string; name?: string } = {};
  if (slug) lookup.slug = slug;
  if (name) lookup.name = name;
  const showP = showProps && hasProps(lookup as { slug?: string; name?: string });
  const showC = showCssVars && hasCssVars(lookup as { slug?: string; name?: string });
  const showE = showEvents && hasEvents(lookup as { slug?: string; name?: string });

  if (!showP && !showC && !showE) return null;

  return (
    <Stack gap={1}>
      {showP && (
        <>
          <Typography variant='h3'>Prop reference</Typography>
          <PropsTable
            {...(slug ? { slug } : {})}
            {...(name ? { name } : {})}
          />
        </>
      )}

      {showC && (
        <>
          <Typography variant='h3'>CSS variables</Typography>
          <CssVarsTable
            {...(slug ? { slug } : {})}
            {...(name ? { name } : {})}
          />
        </>
      )}

      {showE && (
        <>
          <Typography variant='h3'>Events</Typography>
          <EventsTable
            {...(slug ? { slug } : {})}
            {...(name ? { name } : {})}
          />
        </>
      )}
    </Stack>
  );
}
