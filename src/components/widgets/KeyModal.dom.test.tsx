// ─────────────────────────────────────────────────────────────
// src/components/widgets/KeyModal.dom.test.tsx | valet
// KeyModal — the open/closed gate, the key + provider inputs, the
// Save button's enablement contract, and that saving a key routes
// through the aiKeyStore and closes the modal.
//
// KeyModal renders inside a Modal portal (→ #valet-overlay-root, a
// body child) and uses Typography, so the tree needs both a Surface
// context and a ResizeObserver stub. Assertions query document, not
// the mount container, because the content is portalled.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import KeyModal from './KeyModal';
import { useAIKey } from '../../system/aiKeyStore';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; Surface/overlay touch it indirectly --- */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(<SurfaceCtx.Provider value={createSurfaceStore()}>{node}</SurfaceCtx.Provider>);
  });
  return {
    container,
    rerender: (next: React.ReactNode) =>
      act(() => {
        root.render(<SurfaceCtx.Provider value={createSurfaceStore()}>{next}</SurfaceCtx.Provider>);
      }),
  };
}

/* KeyModal portals into the shared overlay root; query the document. */
const pwInputs = () =>
  Array.from(document.querySelectorAll('input[type="password"]')) as HTMLInputElement[];
const providerSelect = () => document.querySelector('select') as HTMLSelectElement | null;
const buttonByText = (text: string) =>
  Array.from(document.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes(text),
  ) as HTMLButtonElement | undefined;

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  // Start from a clean key store so the "no cipher" entry path is exercised.
  act(() => useAIKey.getState().clearKey());
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  document.getElementById('valet-overlay-root')?.replaceChildren();
  act(() => useAIKey.getState().clearKey());
  vi.unstubAllGlobals();
});

/* Suite ----------------------------------------------------------------- */
describe('KeyModal (jsdom)', () => {
  it('renders nothing when closed', () => {
    render(<KeyModal open={false} />);
    expect(pwInputs()).toHaveLength(0);
    expect(providerSelect()).toBeNull();
  });

  it('opens with the key input, provider select, and a Save button', () => {
    render(<KeyModal open />);
    // No cipher stored → the API-key password input + provider select are shown.
    expect(pwInputs().length).toBeGreaterThanOrEqual(1);
    const sel = providerSelect();
    expect(sel).not.toBeNull();
    const opts = Array.from(sel!.options).map((o) => o.value);
    expect(opts).toEqual(['openai', 'anthropic']);
    expect(buttonByText('Save')).toBeTruthy();
  });

  it('disables Save until a key is typed, then enables it', () => {
    render(<KeyModal open />);
    const save = buttonByText('Save')!;
    expect(save.disabled).toBe(true);

    const key = pwInputs()[0];
    const setVal = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!;
    act(() => {
      setVal.call(key, 'sk-test-123');
      key.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(save.disabled).toBe(false);
  });

  it('lets the provider be switched to Anthropic', () => {
    render(<KeyModal open />);
    const sel = providerSelect()!;
    const setVal = Object.getOwnPropertyDescriptor(
      window.HTMLSelectElement.prototype,
      'value',
    )!.set!;
    act(() => {
      setVal.call(sel, 'anthropic');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(sel.value).toBe('anthropic');
  });

  it('saving a key writes it to the store and calls onClose', async () => {
    const onClose = vi.fn();
    render(
      <KeyModal
        open
        onClose={onClose}
      />,
    );

    const key = pwInputs()[0];
    const setVal = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )!.set!;
    act(() => {
      setVal.call(key, 'sk-live-abc');
      key.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const save = buttonByText('Save')!;
    // setKey() is async; flush microtasks inside act.
    await act(async () => {
      save.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useAIKey.getState().apiKey).toBe('sk-live-abc');
    expect(useAIKey.getState().provider).toBe('openai');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
