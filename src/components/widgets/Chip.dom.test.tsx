// ─────────────────────────────────────────────────────────────
// src/components/widgets/Chip.dom.test.tsx | valet
// Chip — label rendering, the optional delete action (onDelete fires
// + is suppressed when disabled), leading icon/avatar, and the inert
// "static descriptor" contract (onClick/role/tabIndex stripped + warned).
// Chip renders Typography internally, which reads surface state, so the
// tree lives inside a Surface context.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Chip } from './Chip';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';
import { getGlobalSheet } from '../../css/sheet';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; createSurfaceStore constructs one ----- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode inside a minimal Surface context. */
function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(
      <React.StrictMode>
        <SurfaceCtx.Provider value={createSurfaceStore()}>{node}</SurfaceCtx.Provider>
      </React.StrictMode>,
    );
  });
  return container;
}

/* Chip carries no data-valet-component marker; under the Surface provider
   its styled Root is the mount container's first element child. */
const chipEl = (c: HTMLElement) => c.firstElementChild as HTMLElement;
const deleteBtn = (c: HTMLElement) => c.querySelector('button') as HTMLButtonElement | null;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* Suite ----------------------------------------------------------------- */
describe('Chip (jsdom)', () => {
  it('renders its text label', () => {
    const c = render(<Chip label='Tag A' />);
    expect(chipEl(c)).not.toBeNull();
    expect(c.textContent).toContain('Tag A');
  });

  it('renders no delete button by default', () => {
    const c = render(<Chip label='No delete' />);
    expect(deleteBtn(c)).toBeNull();
  });

  it('fires onDelete when the remove button is clicked', () => {
    const onDelete = vi.fn();
    const c = render(
      <Chip
        label='Removable'
        onDelete={onDelete}
      />,
    );
    const btn = deleteBtn(c);
    expect(btn).not.toBeNull();
    act(() => {
      btn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('suppresses the delete button (and onDelete) when disabled', () => {
    const onDelete = vi.fn();
    const c = render(
      <Chip
        label='Locked'
        onDelete={onDelete}
        disabled
      />,
    );
    expect(deleteBtn(c)).toBeNull();
    expect(chipEl(c).getAttribute('aria-disabled')).toBe('true');
  });

  it('renders a leading Icon when icon is provided', () => {
    const c = render(
      <Chip
        label='With icon'
        icon='mdi:tag'
      />,
    );
    // @iconify/react resolves icon glyphs asynchronously, so no <svg> appears
    // synchronously in jsdom — assert the Icon wrapper is mounted instead.
    expect(c.querySelector('[data-valet-component="Icon"]')).not.toBeNull();
  });

  it('renders a custom avatar element', () => {
    const c = render(
      <Chip
        label='Avatar'
        avatar={<span data-avatar>A</span>}
      />,
    );
    expect(c.querySelector('[data-avatar]')).not.toBeNull();
  });

  it('strips interactivity props (onClick/role/tabIndex) and dev-warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onClick = vi.fn();
    // Chip's type omits onClick/role/tabIndex; spread them through an untyped
    // record to prove the *runtime* strip (and the dev warnings) still fire.
    const inertProps = { onClick, role: 'button', tabIndex: 0 } as Record<string, unknown>;
    const c = render(
      <Chip
        label='Inert'
        {...inertProps}
      />,
    );
    const el = chipEl(c);
    expect(el.getAttribute('role')).toBeNull();
    expect(el.getAttribute('tabindex')).toBeNull();
    // The static-descriptor warnings fired (onClick + role/tabIndex).
    const msgs = warn.mock.calls.map((a) => String(a[0]));
    expect(msgs.some((m) => m.includes('Chip') && m.includes('onClick'))).toBe(true);
    expect(msgs.some((m) => m.includes('Chip') && m.includes('tabIndex'))).toBe(true);
    // Clicking the body never invokes the stripped handler.
    act(() => {
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(onClick).not.toHaveBeenCalled();
  });
});

/*───────────────────────────────────────────────────────────────*/
/* Mobile — delete-button touch target                            */

describe('Chip — mobile delete target', () => {
  it('sets a coarse-pointer hit-size var on the chip (44px default)', () => {
    const c = render(
      <Chip
        label='Tag'
        onDelete={() => {}}
      />,
    );
    expect(chipEl(c).style.getPropertyValue('--valet-chip-del-hit')).toBe('44px');
  });

  it('the delete button ships the chrome kit + a coarse >=44px hit-expander', () => {
    const c = render(
      <Chip
        label='Tag'
        onDelete={() => {}}
      />,
    );
    const btn = deleteBtn(c)!;
    const cls = btn.className.split(/\s+/).find(Boolean)!;
    const rule =
      Array.from(getGlobalSheet()!.cssRules, (r) => r.cssText).find((t) =>
        t.startsWith(`.${cls}`),
      ) ?? '';
    expect(rule).toContain('touch-action: manipulation');
    expect(rule).toContain('@media (pointer: coarse)');
    expect(rule).toContain('--valet-chip-del-hit'); // the expander reads the hit var
  });
});
