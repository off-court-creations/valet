// ─────────────────────────────────────────────────────────────
// src/components/widgets/RichChat.dom.test.tsx | valet
// PERF S11 — onFormSubmit must report the message's index in the
// caller's `messages` array, not its position in the rendered
// (system-filtered) list.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { RichChat, type RichMessage } from './RichChat';
import { SurfaceCtx, createSurfaceStore } from '../../system/surfaceStore';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* jsdom ships no ResizeObserver; RichChat + surfaceStore construct them */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
const g = globalThis as { ResizeObserver?: unknown };
if (!g.ResizeObserver) g.ResizeObserver = ResizeObserverStub;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

/** Render under StrictMode inside a minimal Surface context. */
function renderStrict(node: React.ReactNode) {
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

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* Canned-response form: a single button that submits a fixed value. */
const CannedForm: React.FC<{ onSubmit: (value: string) => void }> = ({ onSubmit }) => (
  <button
    type='button'
    data-testid='canned'
    onClick={() => onSubmit('yes')}
  >
    yes
  </button>
);

/* Suite ----------------------------------------------------------------- */
describe('RichChat onFormSubmit index (jsdom)', () => {
  it('reports the index in the original messages array, not the system-filtered list', () => {
    const calls: Array<[string, number]> = [];
    const messages: RichMessage[] = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'Pick one', form: CannedForm },
    ];
    const container = renderStrict(
      <RichChat
        messages={messages}
        onFormSubmit={(value, index) => calls.push([value, index])}
      />,
    );

    /* the system message is filtered from the rendered list … */
    expect(container.textContent).not.toContain('You are a helpful assistant.');

    const btn = container.querySelector('[data-testid="canned"]')!;
    expect(btn).not.toBeNull();
    act(() => {
      btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    /* … but the emitted index addresses messages[2], the form message. */
    expect(calls).toEqual([['yes', 2]]);
    expect(messages[calls[0][1]].form).toBe(CannedForm);
  });
});

/* ── A11Y S2: chat message list is a live log ──────────────────────────── */
describe('RichChat live log (jsdom)', () => {
  const logOf = (container: HTMLElement) => container.querySelector('[role="log"]');

  it('marks the message list as a polite additions-only log', () => {
    const messages: RichMessage[] = [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];
    const container = renderStrict(<RichChat messages={messages} />);
    const log = logOf(container);
    expect(log).not.toBeNull();
    expect(log!.getAttribute('role')).toBe('log');
    expect(log!.getAttribute('aria-relevant')).toBe('additions');
    expect(log!.getAttribute('aria-busy')).toBe('false');
    expect(log!.textContent).toContain('hello');
  });

  it('sets aria-busy while a message is typing, and clears it when settled', () => {
    const typing: RichMessage[] = [
      { role: 'user', content: 'ping' },
      { role: 'assistant', content: '', typing: true },
    ];
    const container = renderStrict(<RichChat messages={typing} />);
    expect(logOf(container)!.getAttribute('aria-busy')).toBe('true');

    const settled: RichMessage[] = [
      { role: 'user', content: 'ping' },
      { role: 'assistant', content: 'pong' },
    ];
    act(() => {
      roots[roots.length - 1].root.render(
        <React.StrictMode>
          <SurfaceCtx.Provider value={createSurfaceStore()}>
            <RichChat messages={settled} />
          </SurfaceCtx.Provider>
        </React.StrictMode>,
      );
    });
    expect(logOf(container)!.getAttribute('aria-busy')).toBe('false');
  });

  it('ignores a typing system message (filtered from the rendered log)', () => {
    const messages: RichMessage[] = [
      { role: 'system', content: 'context', typing: true },
      { role: 'assistant', content: 'done' },
    ];
    const container = renderStrict(<RichChat messages={messages} />);
    expect(logOf(container)!.getAttribute('aria-busy')).toBe('false');
  });
});
