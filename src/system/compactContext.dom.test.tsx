// ─────────────────────────────────────────────────────────────
// src/system/compactContext.dom.test.tsx | valet
// useCompact(own ?? inherited) resolution + the compact cascade
// through real layout containers (Panel/Stack/Box) and the
// compact={false} subtree opt-out.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CompactCtx, useCompact } from './compactContext';
import { Panel } from '../components/layout/Panel';
import { Stack } from '../components/layout/Stack';
import { Box } from '../components/layout/Box';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return { container };
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/** Reads the effective compact via useCompact and stamps it on the DOM. */
const Probe: React.FC<{ own?: boolean; id?: string }> = ({ own, id = 'probe' }) => {
  const v = useCompact(own);
  return (
    <span
      data-testid={id}
      data-compact={v ? '1' : '0'}
    />
  );
};

const read = (c: HTMLElement, id = 'probe') =>
  c.querySelector(`[data-testid="${id}"]`)?.getAttribute('data-compact');

/* Suite ---------------------------------------------------------------- */
describe('useCompact — own ?? inherited', () => {
  it('defaults to false with no provider in scope', () => {
    const { container } = render(<Probe />);
    expect(read(container)).toBe('0');
  });

  it('own=true forces compact', () => {
    const { container } = render(<Probe own />);
    expect(read(container)).toBe('1');
  });

  it('inherits the provider value when own is undefined', () => {
    const { container } = render(
      <CompactCtx.Provider value={true}>
        <Probe />
      </CompactCtx.Provider>,
    );
    expect(read(container)).toBe('1');
  });

  it('own=false opts out of an inherited compact', () => {
    const { container } = render(
      <CompactCtx.Provider value={true}>
        <Probe own={false} />
      </CompactCtx.Provider>,
    );
    expect(read(container)).toBe('0');
  });

  it('own=true forces compact even under a non-compact ancestor', () => {
    const { container } = render(
      <CompactCtx.Provider value={false}>
        <Probe own />
      </CompactCtx.Provider>,
    );
    expect(read(container)).toBe('1');
  });
});

describe('compact cascades through layout containers', () => {
  it('<Panel compact> provides compact to descendants', () => {
    const { container } = render(
      <Panel compact>
        <Probe />
      </Panel>,
    );
    expect(read(container)).toBe('1');
  });

  it('<Stack compact> provides compact to descendants', () => {
    const { container } = render(
      <Stack compact>
        <Probe />
      </Stack>,
    );
    expect(read(container)).toBe('1');
  });

  it('<Box compact> provides compact to descendants', () => {
    const { container } = render(
      <Box compact>
        <Probe />
      </Box>,
    );
    expect(read(container)).toBe('1');
  });

  it('cascades down nested containers that do not set compact', () => {
    const { container } = render(
      <Panel compact>
        <Stack>
          <Box>
            <Probe />
          </Box>
        </Stack>
      </Panel>,
    );
    expect(read(container)).toBe('1');
  });

  it('a nested compact={false} opts only its subtree back out', () => {
    const { container } = render(
      <Panel compact>
        <Probe id='outer' />
        <Panel compact={false}>
          <Probe id='inner' />
        </Panel>
      </Panel>,
    );
    expect(read(container, 'outer')).toBe('1');
    expect(read(container, 'inner')).toBe('0');
  });

  it('a non-compact container leaves descendants non-compact', () => {
    const { container } = render(
      <Panel>
        <Probe />
      </Panel>,
    );
    expect(read(container)).toBe('0');
  });
});
