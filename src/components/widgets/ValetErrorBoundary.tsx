// ─────────────────────────────────────────────────────────────
// src/components/widgets/ValetErrorBoundary.tsx | valet
// GOVERNANCE S10 (plan §3.12 S10, ruling Q18(a)): opt-in resilience.
//
// The 22-component hard-throw policy stays: valet components throw
// enriched errors (component name + fix hint + docs link, see
// system/devErrors.ts) as the failure signal. This boundary is the
// OPT-IN catcher consumers wrap around a subtree to keep a throw from
// white-screening the host.
//
// Deliberately self-contained: NO styled()/theme machinery, NO
// useSurface, NO valet context of any kind. It renders a plain <div>
// with inline styles and role='alert', so it works WITHOUT a <Surface>
// ancestor BY DESIGN — it has to survive precisely the failures that
// originate above or outside the surface tree.
// ─────────────────────────────────────────────────────────────
import { Component, type CSSProperties, type ErrorInfo, type ReactNode } from 'react';

export interface ValetErrorFallbackProps {
  /** The error the boundary caught. */
  error: Error;
  /** Clear the error and re-render children. Wire to a retry button. */
  reset: () => void;
}

export interface ValetErrorBoundaryProps {
  /** The subtree to protect. */
  children: ReactNode;
  /**
   * Custom fallback. A render function receives the caught error and a
   * `reset` callback; a static node is rendered as-is. When omitted, the
   * built-in role='alert' panel shows the (enriched) error message and a
   * retry button.
   */
  fallback?: ReactNode | ((props: ValetErrorFallbackProps) => ReactNode);
  /**
   * Invoked once per caught error with the error and React's component
   * stack. Fires from componentDidCatch — exactly once per failure, not on
   * every re-render. Use it to report to your telemetry pipeline.
   */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ValetErrorBoundaryState {
  error: Error | null;
}

/* Plain inline styles — no theme tokens, no createStyled. ---------------- */
const panelStyle: CSSProperties = {
  boxSizing: 'border-box',
  padding: '16px',
  border: '1px solid #b00020',
  borderRadius: '6px',
  background: '#fff5f5',
  color: '#5c0011',
  font: '14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
};

const messageStyle: CSSProperties = {
  margin: '0 0 12px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

const buttonStyle: CSSProperties = {
  appearance: 'none',
  cursor: 'pointer',
  padding: '6px 12px',
  border: '1px solid #b00020',
  borderRadius: '4px',
  background: '#b00020',
  color: '#fff',
  font: 'inherit',
};

/**
 * Opt-in React error boundary for valet subtrees. Catches errors thrown
 * during render/commit of its children and renders a fallback instead of
 * letting the throw propagate to the host root.
 *
 * @example
 * <ValetErrorBoundary onError={report}>
 *   <RiskyTree />
 * </ValetErrorBoundary>
 */
export class ValetErrorBoundary extends Component<
  ValetErrorBoundaryProps,
  ValetErrorBoundaryState
> {
  state: ValetErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ValetErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  /** Clear the caught error so children re-mount and re-render. */
  reset = (): void => {
    this.setState({ error: null });
  };

  override render(): ReactNode {
    const { error } = this.state;
    if (error === null) return this.props.children;

    const { fallback } = this.props;
    if (typeof fallback === 'function') {
      return fallback({ error, reset: this.reset });
    }
    if (fallback !== undefined) return fallback;

    return (
      <div
        role='alert'
        style={panelStyle}
      >
        <p style={messageStyle}>{error.message || String(error)}</p>
        <button
          type='button'
          style={buttonStyle}
          onClick={this.reset}
        >
          Try again
        </button>
      </div>
    );
  }
}

export default ValetErrorBoundary;
