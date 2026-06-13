// ─────────────────────────────────────────────────────────────
// src/components/layout/resolveAnchor.test.ts | valet
// A11Y S12 — pure matrix proof for Drawer's logical-anchor resolver.
// Verifies the full (anchor × dir) table: 'start'/'end' follow the
// writing direction; physical 'left'/'right'/'top'/'bottom' never do.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { resolveAnchor, type DrawerAnchorInput } from './resolveAnchor';
import type { ValetDir } from '../../system/locale';

/* Full resolution matrix: [input, dir, expected physical side]. */
const MATRIX: Array<[DrawerAnchorInput, ValetDir, ReturnType<typeof resolveAnchor>]> = [
  // Logical anchors follow direction.
  ['start', 'ltr', 'left'],
  ['end', 'ltr', 'right'],
  ['start', 'rtl', 'right'],
  ['end', 'rtl', 'left'],
  // Physical anchors are direction-invariant.
  ['left', 'ltr', 'left'],
  ['left', 'rtl', 'left'],
  ['right', 'ltr', 'right'],
  ['right', 'rtl', 'right'],
  ['top', 'ltr', 'top'],
  ['top', 'rtl', 'top'],
  ['bottom', 'ltr', 'bottom'],
  ['bottom', 'rtl', 'bottom'],
];

describe('resolveAnchor (pure)', () => {
  it.each(MATRIX)('resolveAnchor(%s, %s) === %s', (anchor, dir, expected) => {
    expect(resolveAnchor(anchor, dir)).toBe(expected);
  });

  it('start under rtl resolves to the right side; end under rtl to the left', () => {
    expect(resolveAnchor('start', 'rtl')).toBe('right');
    expect(resolveAnchor('end', 'rtl')).toBe('left');
  });

  it('an explicit physical anchor never flips under rtl', () => {
    expect(resolveAnchor('left', 'rtl')).toBe('left');
    expect(resolveAnchor('right', 'rtl')).toBe('right');
  });

  it('only ever returns one of the four physical sides', () => {
    const physical = new Set(['left', 'right', 'top', 'bottom']);
    for (const [anchor, dir] of MATRIX) {
      expect(physical.has(resolveAnchor(anchor, dir))).toBe(true);
    }
  });
});
