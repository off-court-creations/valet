// ─────────────────────────────────────────────────────────────
// src/components/fields/IconButton.dom.test.tsx | valet
// IconButton runtime contract in jsdom — caller style merges
// instead of being clobbered (style < geometry < intent vars < sx)
// and `as='a'` renders a real anchor with no `type` attribute
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { IconButton } from './IconButton';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode into a fresh container; tracked for cleanup. */
function renderStrict(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return { root, container };
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* raw path data keeps Icon offline (no Iconify fetch) ------------------ */
const PATH = 'M0 0h24v24H0z';

/* Suite ----------------------------------------------------------------- */
describe('IconButton (jsdom)', () => {
  it('merges a caller style prop instead of clobbering it (style < geometry < vars < sx)', () => {
    const { container } = renderStrict(
      <IconButton
        aria-label='probe'
        svg={PATH}
        style={
          {
            marginRight: '7px',
            marginTop: '3px',
            width: '11px',
            '--valet-intent-bg': 'red',
          } as React.CSSProperties
        }
        sx={{ marginTop: '9px' }}
      />,
    );
    const btn = container.querySelector('button')!;
    /* caller style survives the merge … */
    expect(btn.style.getPropertyValue('margin-right')).toBe('7px');
    /* … sx wins over caller style for the same property … */
    expect(btn.style.getPropertyValue('margin-top')).toBe('9px');
    /* … size-derived geometry wins over caller style … */
    expect(btn.style.getPropertyValue('width')).toBe('3rem');
    /* … and component-owned intent vars win over caller style. */
    expect(btn.style.getPropertyValue('--valet-intent-bg')).not.toBe('red');
    expect(btn.style.getPropertyValue('--valet-intent-bg')).not.toBe('');
  });

  it("as='a' renders a real anchor: href kept, `type` stripped", () => {
    const { container } = renderStrict(
      <IconButton
        as='a'
        href='#go'
        aria-label='probe'
        svg={PATH}
      />,
    );
    expect(container.querySelector('button')).toBeNull();
    const anchor = container.querySelector('a')!;
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('href')).toBe('#go');
    expect(anchor.hasAttribute('type')).toBe(false);
    expect(anchor.getAttribute('data-valet-component')).toBe('IconButton');
  });

  it("plain IconButton still defaults to type='button'", () => {
    const { container } = renderStrict(
      <IconButton
        aria-label='probe'
        svg={PATH}
      />,
    );
    expect(container.querySelector('button')!.getAttribute('type')).toBe('button');
  });
});
