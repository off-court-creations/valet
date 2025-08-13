// ─────────────────────────────────────────────────────────────
// src/pages/StyledEngine.tsx  | valet-docs
// Concept: minimal CSS-in-JS via createStyled and keyframes
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import type { DocMeta } from '../types';

export const meta: DocMeta = {
  id: 'styled-engine',
  title: 'Styled Engine',
  description: 'How createStyled and keyframes work, and how presets integrate.',
  pageType: 'concept',
  prerequisites: ['usage'],
  tldr: 'Use styled for lightweight, typed styles; prefer presets for shared patterns.',
};

export default function StyledEnginePage() {
  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Styled Engine
        </Typography>
        <Typography>
          valet ships a zero-dependency CSS-in-JS layer exposing <code>styled</code> and{' '}
          <code>keyframes</code>. It emits static classnames and minimal runtime for excellent
          tree-shaking.
        </Typography>

        <Typography
          variant='h3'
          bold
        >
          styled
        </Typography>
        <Panel fullWidth>
          <pre>
            <code>{`import { styled } from '@archway/valet';

const Badge = styled('span', ({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  borderRadius: 999,
  paddingInline: theme.spacing(1),
  height: 24,
  background: theme.colors.primary[9],
  color: theme.colors.primary[1],
}));
`}</code>
          </pre>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          keyframes
        </Typography>
        <Panel fullWidth>
          <pre>
            <code>{`import { keyframes, styled } from '@archway/valet';

const spin = keyframes({
  from: { transform: 'rotate(0deg)' },
  to: { transform: 'rotate(360deg)' },
});

const Spinner = styled('div', () => ({
  animation: \`\${spin} 1.2s linear infinite\`,
}));
`}</code>
          </pre>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Presets and the preset prop
        </Typography>
        <Typography>
          Define shared styles with <code>definePreset</code> and apply via the <code>preset</code>{' '}
          prop to keep markup clean and consistent across the app.
        </Typography>
      </Stack>
    </Surface>
  );
}
