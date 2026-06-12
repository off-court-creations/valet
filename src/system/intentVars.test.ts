// ─────────────────────────────────────────────────────────────
// src/system/intentVars.test.ts | valet
// Shared intent-var helper (API-TYPES S13): proper colour maths.
//   • parseColor handles hex / rgb() / hsl() / named / hex8
//   • makeMix always returns a valid #rrggbb (the AppBar fix)
//   • computeIntentVars reproduces each component's contract
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { parseColor, makeMix, computeIntentVars } from './intentVars';

const HEX6 = /^#[0-9a-f]{6}$/;

describe('parseColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseColor('#0E65C0')).toEqual({ r: 14, g: 101, b: 192 });
  });

  it('parses 3-digit hex', () => {
    expect(parseColor('#abc')).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc });
  });

  it('drops the alpha pair from #rrggbbaa', () => {
    expect(parseColor('#0E65C0F0')).toEqual({ r: 14, g: 101, b: 192 });
  });

  it('parses rgb() and rgba(), dropping alpha', () => {
    expect(parseColor('rgb(14, 101, 192)')).toEqual({ r: 14, g: 101, b: 192 });
    expect(parseColor('rgba(14,101,192,0.5)')).toEqual({ r: 14, g: 101, b: 192 });
  });

  it('parses percentage rgb channels', () => {
    expect(parseColor('rgb(100%, 0%, 0%)')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses hsl()', () => {
    // pure red == hsl(0,100%,50%)
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('parses a minimal named set', () => {
    expect(parseColor('red')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('white')).toEqual({ r: 255, g: 255, b: 255 });
  });
});

describe('makeMix', () => {
  it('returns valid #rrggbb for hex inputs', () => {
    expect(makeMix('#000000', '#ffffff', 0.5)).toMatch(HEX6);
  });

  it('returns valid #rrggbb for an rgb() input — the AppBar hex-concat fix', () => {
    // The old AppBar math did `'rgb(14, 101, 192)' + 'F0'` → invalid CSS.
    const result = makeMix('rgb(14, 101, 192)', '#F7F7F7', 0.15);
    expect(result).toMatch(HEX6);
  });

  it('returns valid #rrggbb for hsl() and named inputs', () => {
    expect(makeMix('hsl(210, 87%, 40%)', 'white', 0.15)).toMatch(HEX6);
    expect(makeMix('red', 'black', 0.5)).toMatch(HEX6);
  });

  it('matches the hex result whether the colour is given as hex or rgb()', () => {
    expect(makeMix('rgb(14, 101, 192)', '#F7F7F7', 0.15)).toBe(makeMix('#0E65C0', '#F7F7F7', 0.15));
  });
});

describe('computeIntentVars', () => {
  it('reproduces the filled-Button contract verbatim (characterization)', () => {
    // Default dark theme, intent=primary, variant=filled.
    const vars = computeIntentVars({
      bg: '#0E65C0',
      fg: '#F7F7F7',
      focus: '#0E65C0',
      disabledMixColor: '#161616',
      variant: 'filled',
      borderMixColor: '#F7F7F7',
      borderMixWeight: 0.25,
    });
    expect(vars).toEqual({
      '--valet-intent-bg': '#0E65C0',
      '--valet-intent-fg': '#F7F7F7',
      '--valet-intent-border': '#488ace',
      '--valet-intent-focus': '#0E65C0',
      '--valet-intent-bg-hover': '#317bc8',
      '--valet-intent-bg-active': '#488ace',
      '--valet-intent-fg-disabled': '#878787',
    });
  });

  it('reproduces the IconButton contract: border is bg for every variant', () => {
    const filled = computeIntentVars({
      bg: '#0E65C0',
      fg: '#F7F7F7',
      focus: '#0E65C0',
      disabledMixColor: '#161616',
      variant: 'filled',
    });
    expect(filled['--valet-intent-border']).toBe('#0E65C0');

    const plain = computeIntentVars({
      bg: '#0E65C0',
      fg: '#0E65C0',
      focus: '#0E65C0',
      disabledMixColor: '#161616',
      variant: 'plain',
    });
    // non-filled variants go transparent for hover/active
    expect(plain['--valet-intent-bg-hover']).toBe('transparent');
    expect(plain['--valet-intent-bg-active']).toBe('transparent');
    expect(plain['--valet-intent-border']).toBe('#0E65C0');
  });

  it('honours an explicit border override (Chip)', () => {
    const vars = computeIntentVars({
      bg: '#363636',
      fg: '#F7F7F7',
      focus: '#0E65C0',
      disabledMixColor: '#161616',
      variant: 'filled',
      border: '#abcdef',
      hoverWeight: 0.12,
      activeWeight: 0.2,
    });
    expect(vars['--valet-intent-border']).toBe('#abcdef');
  });
});
