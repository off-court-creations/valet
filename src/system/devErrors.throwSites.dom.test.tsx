// ─────────────────────────────────────────────────────────────
// src/system/devErrors.throwSites.dom.test.tsx | valet
// GOVERNANCE S9 regression — hard throws are enriched via valetError:
// the missing-<Surface> throw names the CALLER component (not the
// internal useSurface hook ~22 components reach via Typography), and
// every enriched site carries a fix hint plus a docs link.
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useSurface } from './surfaceStore';
import { VALET_DOCS_BASE } from './devErrors';
import { useForm } from '../components/fields/FormControl';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Render and hand back the error the tree threw ------------------------ */
const renderExpectingError = (element: React.ReactElement): Error => {
  /* React logs the uncaught render error before rethrowing — keep the
     suite output clean without losing the assertion surface. */
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let caught: unknown = null;
  try {
    act(() => {
      root.render(element);
    });
  } catch (err) {
    caught = err;
  } finally {
    act(() => root.unmount());
    container.remove();
    errSpy.mockRestore();
  }
  if (!(caught instanceof Error)) throw new Error('expected the render to throw an Error');
  return caught;
};

/* Consumer-named components that reach the hooks ----------------------- */
function ProfileCard() {
  const breakpoint = useSurface((s) => s.breakpoint);
  return <span>{breakpoint}</span>;
}

function NameField() {
  useForm();
  return <input />;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('enriched throw sites (jsdom)', () => {
  it('useSurface outside <Surface> names the calling component, not the hook', () => {
    const err = renderExpectingError(<ProfileCard />);
    expect(err.name).toBe('ValetError');
    expect(err.message).toContain('valet: ProfileCard:');
    expect(err.message).toContain('<ProfileCard> reads surface state');
    expect(err.message).toContain('must be rendered inside a <Surface>');
    expect(err.message).toContain(`Docs: ${VALET_DOCS_BASE}/surface`);
  });

  it('useForm outside <FormControl> carries component, fix hint and docs link', () => {
    const err = renderExpectingError(<NameField />);
    expect(err.name).toBe('ValetError');
    expect(err.message).toContain('valet: FormControl:');
    expect(err.message).toContain('useForm must be called inside a <FormControl>');
    expect(err.message).toContain(`Docs: ${VALET_DOCS_BASE}/form`);
  });
});
