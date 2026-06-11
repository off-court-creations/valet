// ─────────────────────────────────────────────────────────────
// src/components/fields/Button.dom.test.tsx | valet
// Button runtime contract in jsdom — caller style merges instead
// of being clobbered (style < intent vars < sx) and `as='a'`
// renders a real anchor with no `type` attribute
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Button } from './Button';

/* String children mount <Typography>, which requires a <Surface> provider —
   element children pass straight through, keeping this suite Surface-free. */

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

/* Suite ----------------------------------------------------------------- */
describe('Button (jsdom)', () => {
  it('merges a caller style prop instead of clobbering it (style < intent vars < sx)', () => {
    const { container } = renderStrict(
      <Button
        style={
          {
            marginRight: '7px',
            marginTop: '3px',
            '--valet-intent-bg': 'red',
          } as React.CSSProperties
        }
        sx={{ marginTop: '9px' }}
      >
        <span>Go</span>
      </Button>,
    );
    const btn = container.querySelector('button')!;
    /* caller style survives the merge … */
    expect(btn.style.getPropertyValue('margin-right')).toBe('7px');
    /* … sx wins over caller style for the same property … */
    expect(btn.style.getPropertyValue('margin-top')).toBe('9px');
    /* … and component-owned intent vars win over caller style. */
    expect(btn.style.getPropertyValue('--valet-intent-bg')).not.toBe('red');
    expect(btn.style.getPropertyValue('--valet-intent-bg')).not.toBe('');
  });

  it("as='a' renders a real anchor: href kept, `type` stripped, role untouched", () => {
    const { container } = renderStrict(
      <Button
        as='a'
        href='#go'
      >
        <span>Go</span>
      </Button>,
    );
    expect(container.querySelector('button')).toBeNull();
    const anchor = container.querySelector('a')!;
    expect(anchor).toBeTruthy();
    expect(anchor.getAttribute('href')).toBe('#go');
    expect(anchor.hasAttribute('type')).toBe(false);
    expect(anchor.getAttribute('data-valet-component')).toBe('Button');
  });

  it("plain Button still defaults to type='button'", () => {
    const { container } = renderStrict(
      <Button>
        <span>Go</span>
      </Button>,
    );
    expect(container.querySelector('button')!.getAttribute('type')).toBe('button');
  });
});
