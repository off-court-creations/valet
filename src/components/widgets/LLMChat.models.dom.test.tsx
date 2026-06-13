// ─────────────────────────────────────────────────────────────
// src/components/widgets/LLMChat.models.dom.test.tsx | valet
// SECURITY S7 — the LLMChat model picker:
//   (1) DEFAULT_MODELS is a refreshed, current catalog (no gpt-3.5 era);
//   (2) the `models` prop overrides the picker's options;
//   (3) absent the prop, the active provider's DEFAULT_MODELS list is used.
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LLMChat, DEFAULT_MODELS, type ChatMessage } from './LLMChat';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; LLMChat + surfaceStore construct them */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const g = globalThis as { ResizeObserver?: unknown };
if (!g.ResizeObserver) g.ResizeObserver = ResizeObserverStub;

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
  return container;
}

/** Click the combobox trigger to open the dropdown menu. */
function openMenu(container: HTMLElement) {
  const trigger = container.querySelector('[role="combobox"]') as HTMLButtonElement | null;
  expect(trigger).not.toBeNull();
  act(() => {
    trigger!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

/**
 * The Select menu portals to #valet-overlay-root (OVERLAY S6), so the open
 * options live outside the component subtree. Query the open listbox from the
 * overlay root rather than the local container.
 */
function optionTexts(): string[] {
  const root = document.getElementById('valet-overlay-root') ?? document.body;
  return Array.from(root.querySelectorAll('[role="option"]')).map((el) =>
    (el.textContent ?? '').trim(),
  );
}

const messages: ChatMessage[] = [{ role: 'assistant', content: 'hi' }];

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ---------------------------------------------------------------- */
describe('LLMChat model catalog (jsdom)', () => {
  it('DEFAULT_MODELS is refreshed away from the stale gpt-3.5 era', () => {
    // The audit flagged a hardcoded gpt-3.5-turbo / single-claude catalog.
    expect(DEFAULT_MODELS.openai).not.toContain('gpt-3.5-turbo');
    expect(DEFAULT_MODELS.openai).not.toContain('gpt-4-turbo');
    expect(DEFAULT_MODELS.openai[0]).toBe('gpt-4o');
    // Anthropic defaults are the current opus/sonnet/haiku ids, not a dated alias.
    expect(DEFAULT_MODELS.anthropic).toEqual([
      'claude-opus-4-8',
      'claude-sonnet-4-6',
      'claude-haiku-4-5',
    ]);
    expect(DEFAULT_MODELS.anthropic).not.toContain('claude-sonnet-4-20250514');
  });

  it('uses the provider DEFAULT_MODELS list when no `models` prop is given', () => {
    const container = render(
      <LLMChat
        messages={messages}
        provider='anthropic'
        apiKey='sk-test'
        disableInput
      />,
    );
    // Closed combobox shows the latched default (first catalog entry).
    const trigger = container.querySelector('[role="combobox"]')!;
    expect(trigger.textContent).toContain('claude-opus-4-8');

    openMenu(container);
    expect(optionTexts()).toEqual(DEFAULT_MODELS.anthropic);
  });

  it('honors the `models` prop, overriding the built-in catalog', () => {
    const custom = ['my-model-a', 'my-model-b'];
    const container = render(
      <LLMChat
        messages={messages}
        provider='anthropic'
        apiKey='sk-test'
        models={custom}
        disableInput
      />,
    );
    // The picker seeds to the first overridden option, not the default catalog.
    const trigger = container.querySelector('[role="combobox"]')!;
    expect(trigger.textContent).toContain('my-model-a');
    expect(trigger.textContent).not.toContain('claude-opus-4-8');

    openMenu(container);
    const opts = optionTexts();
    expect(opts).toEqual(custom);
    // None of the built-in defaults leak through.
    for (const def of DEFAULT_MODELS.anthropic) expect(opts).not.toContain(def);
  });
});
