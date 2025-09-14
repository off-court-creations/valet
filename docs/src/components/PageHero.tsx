// ─────────────────────────────────────────────────────────────
// src/components/PageHero.tsx  | valet-docs
// Reusable page hero header for docs pages
// ─────────────────────────────────────────────────────────────
import { Panel, Stack, Typography, Divider, useTheme } from '@archway/valet';
import type { ReactNode } from 'react';

export interface PageHeroProps {
  title: ReactNode;
  subtitle?: ReactNode;
  pad?: number | string;
  minHeight?: string;
  gradient?: string;
  dividerPad?: number | string;
  /** Optional inline content rendered under the subtitle (e.g., status chips) */
  below?: ReactNode;
}

export default function PageHero({
  title,
  subtitle,
  pad = 0.5,
  minHeight = '14vh',
  gradient = 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.25) 70%, rgba(0,0,0,0.0) 100%)',
  dividerPad = 0.25,
  below,
}: PageHeroProps) {
  const { theme } = useTheme();
  return (
    <>
      <Panel
        fullWidth
        pad={pad}
        background={gradient}
        sx={{ borderRadius: theme.radius(2), overflow: 'hidden', position: 'relative' }}
      >
        <Stack
          sx={{
            alignItems: 'center',
            gap: theme.spacing(0.5),
            minHeight,
            justifyContent: 'center',
          }}
        >
          <Typography
            variant='h1'
            sx={{ textAlign: 'center' }}
          >
            {title}
          </Typography>
          {subtitle ? (
            <Typography
              variant='subtitle'
              sx={{ textAlign: 'center', opacity: 0.9 }}
            >
              {subtitle}
            </Typography>
          ) : null}
          {below ? <div>{below}</div> : null}
        </Stack>
      </Panel>
      <Divider pad={dividerPad} />
    </>
  );
}
