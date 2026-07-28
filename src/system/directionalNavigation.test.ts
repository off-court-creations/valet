// ─────────────────────────────────────────────────────────────
// src/system/directionalNavigation.test.ts  | valet
// Pure spatial candidate-scoring regression tests
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { findSpatialCandidateIndex, type NavigationDirection } from './directionalNavigation';

const rect = (left: number, top: number, width = 20, height = 20) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
  width,
  height,
});

const cardinalDirections = ['up', 'down', 'left', 'right'] as const satisfies readonly Exclude<
  NavigationDirection,
  'next' | 'previous'
>[];

describe('directionalNavigation spatial scoring', () => {
  it('selects a genuinely positioned candidate in each of the four directions', () => {
    const origin = rect(40, 40);
    const candidates = [
      { rect: rect(40, 10), order: 0 },
      { rect: rect(40, 70), order: 1 },
      { rect: rect(10, 40), order: 2 },
      { rect: rect(70, 40), order: 3 },
    ];
    const expected = [0, 1, 2, 3];

    cardinalDirections.forEach((direction, index) => {
      expect(findSpatialCandidateIndex(origin, candidates, direction)).toBe(expected[index]);
    });
  });

  it('prefers cross-axis alignment when a diagonal candidate is substantially displaced', () => {
    const origin = rect(0, 0);
    const candidates = [
      { rect: rect(80, 0), order: 0 },
      { rect: rect(25, 60), order: 1 },
    ];

    expect(findSpatialCandidateIndex(origin, candidates, 'right')).toBe(0);
  });

  it('still lets a nearby diagonal candidate beat an impractically distant aligned target', () => {
    const origin = rect(0, 0);
    const candidates = [
      { rect: rect(200, 0), order: 0 },
      { rect: rect(25, 30), order: 1 },
    ];

    expect(findSpatialCandidateIndex(origin, candidates, 'right')).toBe(1);
  });

  it('uses primary-axis distance when alignment is equal', () => {
    const origin = rect(0, 0);
    const candidates = [
      { rect: rect(50, 0), order: 0 },
      { rect: rect(25, 0), order: 1 },
    ];

    expect(findSpatialCandidateIndex(origin, candidates, 'right')).toBe(1);
  });

  it('uses stable DOM order for equal scores', () => {
    const origin = rect(0, 0);
    const candidates = [
      { rect: rect(30, 0), order: 8 },
      { rect: rect(30, 0), order: 2 },
    ];

    expect(findSpatialCandidateIndex(origin, candidates, 'right')).toBe(1);
  });

  it('returns no candidate for boxes that overlap or sit opposite the requested edge', () => {
    const origin = rect(0, 0);
    const candidates = [
      { rect: rect(19, 0), order: 0 },
      { rect: rect(-30, 0), order: 1 },
      { rect: rect(0, 5), order: 2 },
    ];

    expect(findSpatialCandidateIndex(origin, candidates, 'right')).toBe(-1);
  });
});
