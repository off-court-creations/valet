// ──────────────────────────────────────────────────────────────
// src/utils/resolveSpace.test.ts | valet
// unit tests for resolveSpace util
// ──────────────────────────────────────────────────────────────
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSpace } from './resolveSpace';
import type { Theme } from '../system/themeStore';

const theme: Theme = {
  colors: {},
  spacing: (u: number) => `${u}u`,
  spacingUnit: '1u',
  breakpoints: { xs: 0, sm: 0, md: 0, lg: 0, xl: 0 },
  typography: {},
  fonts: { heading: '', body: '', mono: '', button: '' },
};

describe('resolveSpace', () => {
  it('maps numbers via theme spacing', () => {
    assert.equal(resolveSpace(2, theme), '2u');
  });

  it('passes strings through', () => {
    assert.equal(resolveSpace('1rem', theme), '1rem');
  });

  it('falls back when undefined', () => {
    assert.equal(resolveSpace(undefined, theme, false, 3), '3u');
  });

  it('returns zero when compact', () => {
    assert.equal(resolveSpace(4, theme, true), '0');
  });
});
