// ─────────────────────────────────────────────────────────────
// src/components/widgets/ValetErrorBoundary.dom.test.tsx | valet
// GOVERNANCE S10 (plan §3.12 S10, ruling Q18(a)): the opt-in resilience
// boundary. Regression coverage for the catch path:
//   • catches a throwing child and renders the enriched valetError message
//   • default fallback is a role='alert' panel with a working retry
//   • onError fires exactly once per failure (from componentDidCatch)
//   • custom fallback — static node AND render-fn(reset) — is honoured
//   • reset() clears the error so a now-healthy child re-renders
//   • works with NO <Surface> ancestor and emits no valet theme vars
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ValetErrorBoundary from './ValetErrorBoundary';
import { valetError } from '../../system/devErrors';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* React logs caught boundary errors to console.error; silence the noise
 * so the suite output stays readable. We assert on rendered DOM, not logs. */
let errSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];
function render(node: React.ReactNode): HTMLDivElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  roots.push({ root, container });
  return container;
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  errSpy.mockRestore();
});

/* A child that throws an enriched valetError on first render, then (once
 * `heal` flips true) renders harmless content. */
const ENRICHED = valetError('Surface', 'must wrap children', 'components/layout/surface');
function Boom({ heal = false }: { heal?: boolean }): React.ReactElement {
  if (!heal) throw ENRICHED;
  return <span data-testid='healed'>ok</span>;
}

describe('ValetErrorBoundary — catch + fallback', () => {
  it('renders children unchanged when nothing throws', () => {
    const c = render(
      <ValetErrorBoundary>
        <span data-testid='child'>hello</span>
      </ValetErrorBoundary>,
    );
    expect(c.querySelector('[data-testid="child"]')?.textContent).toBe('hello');
    expect(c.querySelector('[role="alert"]')).toBeNull();
  });

  it('catches a thrown enriched error and shows it in a role=alert panel', () => {
    const c = render(
      <ValetErrorBoundary>
        <Boom />
      </ValetErrorBoundary>,
    );
    const alert = c.querySelector('[role="alert"]');
    expect(alert).not.toBeNull();
    // The enriched message (component name + fix hint) is surfaced verbatim.
    expect(alert?.textContent).toContain('valet: Surface: must wrap children');
    // Default fallback ships a retry control.
    expect(c.querySelector('button')?.textContent).toBe('Try again');
  });

  it('fires onError exactly once per caught failure', () => {
    const onError = vi.fn();
    render(
      <ValetErrorBoundary onError={onError}>
        <Boom />
      </ValetErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    const [err, info] = onError.mock.calls[0];
    expect(err).toBe(ENRICHED);
    expect(info).toHaveProperty('componentStack');
  });

  it('reset() clears the error so a healthy child re-renders', () => {
    function Harness(): React.ReactElement {
      const [heal, setHeal] = React.useState(false);
      return (
        <ValetErrorBoundary
          fallback={({ reset }) => (
            <button
              data-testid='retry'
              onClick={() => {
                setHeal(true);
                reset();
              }}
            >
              retry
            </button>
          )}
        >
          <Boom heal={heal} />
        </ValetErrorBoundary>
      );
    }
    const c = render(<Harness />);
    // Initially caught: render-fn fallback is shown.
    const retry = c.querySelector('[data-testid="retry"]') as HTMLButtonElement;
    expect(retry).not.toBeNull();
    act(() => {
      retry.click();
    });
    // After reset + heal, the child mounts cleanly.
    expect(c.querySelector('[data-testid="healed"]')?.textContent).toBe('ok');
  });

  it('honours a static-node fallback', () => {
    const c = render(
      <ValetErrorBoundary fallback={<span data-testid='static'>down</span>}>
        <Boom />
      </ValetErrorBoundary>,
    );
    expect(c.querySelector('[data-testid="static"]')?.textContent).toBe('down');
    // No built-in panel when a custom fallback is supplied.
    expect(c.querySelector('[role="alert"]')).toBeNull();
  });

  it('works without a <Surface> ancestor and emits no valet theme vars/classes', () => {
    // The boundary is rendered with NO Surface store in context (see render()).
    const c = render(
      <ValetErrorBoundary>
        <Boom />
      </ValetErrorBoundary>,
    );
    const alert = c.querySelector('[role="alert"]') as HTMLElement;
    expect(alert).not.toBeNull();
    // No styled()/theme machinery: inline styles only, zero --valet-* vars
    // and no z-* generated class names anywhere in the fallback subtree.
    expect(c.innerHTML).not.toMatch(/--valet-/);
    expect(c.innerHTML).not.toMatch(/class="[^"]*\bz-[0-9a-z]+/i);
    // Background comes from the inline panelStyle, not a CSS var.
    expect(alert.getAttribute('style') || '').toMatch(/background/);
  });
});
