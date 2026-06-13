// ─────────────────────────────────────────────────────────────
// src/components/widgets/LLMChat.a11y.dom.test.tsx | valet
// A11Y S2 — the message list is a live log:
//   role='log' + aria-relevant='additions' on the Messages container,
//   aria-busy reflecting whether a turn is currently typing.
// House style: createRoot + act, no @testing-library.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LLMChat, type ChatMessage } from './LLMChat';
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

/** The live message log container. */
const logOf = (container: HTMLElement) => container.querySelector('[role="log"]');

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Suite ---------------------------------------------------------------- */
describe('LLMChat live log (jsdom)', () => {
  it('marks the message list as a polite additions-only log', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];
    const container = render(
      <LLMChat
        messages={messages}
        disableInput
      />,
    );
    const log = logOf(container);
    expect(log).not.toBeNull();
    expect(log!.getAttribute('role')).toBe('log');
    expect(log!.getAttribute('aria-relevant')).toBe('additions');
    // Nothing is typing → the log is not busy.
    expect(log!.getAttribute('aria-busy')).toBe('false');
    // The conversation lives inside the log region.
    expect(log!.textContent).toContain('hello');
  });

  it('sets aria-busy while a message is typing, and clears it when settled', () => {
    const typing: ChatMessage[] = [
      { role: 'user', content: 'ping' },
      { role: 'assistant', content: '', typing: true },
    ];
    const container = render(
      <LLMChat
        messages={typing}
        disableInput
      />,
    );
    expect(logOf(container)!.getAttribute('aria-busy')).toBe('true');

    // Replace the typing turn with the settled assistant reply.
    const settled: ChatMessage[] = [
      { role: 'user', content: 'ping' },
      { role: 'assistant', content: 'pong' },
    ];
    act(() => {
      roots[roots.length - 1].root.render(
        <SurfaceCtx.Provider value={createSurfaceStore()}>
          <LLMChat
            messages={settled}
            disableInput
          />
        </SurfaceCtx.Provider>,
      );
    });
    expect(logOf(container)!.getAttribute('aria-busy')).toBe('false');
  });

  it('ignores a typing system message (it is filtered from the rendered log)', () => {
    // System messages never render, so a typing system entry must not flip busy.
    const messages: ChatMessage[] = [
      { role: 'system', content: 'context', typing: true },
      { role: 'assistant', content: 'done' },
    ];
    const container = render(
      <LLMChat
        messages={messages}
        disableInput
      />,
    );
    expect(logOf(container)!.getAttribute('aria-busy')).toBe('false');
  });
});
