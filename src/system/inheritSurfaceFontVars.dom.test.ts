// ─────────────────────────────────────────────────────────────
// src/system/inheritSurfaceFontVars.dom.test.ts  | valet
// Regression coverage for Surface token inheritance across portals
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import { inheritSurfaceFontVars } from './inheritSurfaceFontVars';

const mounted = (attributes?: Record<string, string>) => {
  const element = document.createElement('div');
  for (const [name, value] of Object.entries(attributes ?? {})) {
    element.setAttribute(name, value);
  }
  document.body.appendChild(element);
  return element;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe('inheritSurfaceFontVars', () => {
  it('copies Surface focus-ring tokens to a portalled target', () => {
    const source = mounted();
    source.style.setProperty('--valet-focus-width', '3px');
    source.style.setProperty('--valet-focus-offset', '4px');
    source.style.setProperty('--valet-focus-ring-color', 'rgb(12, 34, 56)');
    const target = mounted();

    inheritSurfaceFontVars(target, source);

    expect(target.style.getPropertyValue('--valet-focus-width')).toBe('3px');
    expect(target.style.getPropertyValue('--valet-focus-offset')).toBe('4px');
    expect(target.style.getPropertyValue('--valet-focus-ring-color')).toBe('rgb(12, 34, 56)');
  });

  it('finds the mounted Surface when a portal does not pass an explicit source', () => {
    const source = mounted({ 'data-valet-surface-root': '' });
    source.style.setProperty('--valet-focus-width', '0.2rem');
    source.style.setProperty('--valet-focus-offset', '0.1rem');
    source.style.setProperty('--valet-focus-ring-color', 'rebeccapurple');
    const target = mounted();

    inheritSurfaceFontVars(target);

    expect(target.style.getPropertyValue('--valet-focus-width')).toBe('0.2rem');
    expect(target.style.getPropertyValue('--valet-focus-offset')).toBe('0.1rem');
    expect(target.style.getPropertyValue('--valet-focus-ring-color')).toBe('rebeccapurple');
  });

  it('preserves target focus-ring tokens when the source does not define them', () => {
    const source = mounted();
    const target = mounted();
    target.style.setProperty('--valet-focus-width', '5px');
    target.style.setProperty('--valet-focus-offset', '6px');
    target.style.setProperty('--valet-focus-ring-color', 'orange');

    inheritSurfaceFontVars(target, source);

    expect(target.style.getPropertyValue('--valet-focus-width')).toBe('5px');
    expect(target.style.getPropertyValue('--valet-focus-offset')).toBe('6px');
    expect(target.style.getPropertyValue('--valet-focus-ring-color')).toBe('orange');
  });
});
