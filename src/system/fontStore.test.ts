// ─────────────────────────────────────────────────────────────
// src/system/fontStore.test.ts | valet
// THEMING S5 — the `started` flag distinguishes never-started from
// in-flight so Surface's never-block grace can't wedge a blockUntilFonts
// screen when no font load ever begins.
// ─────────────────────────────────────────────────────────────
import { beforeEach, describe, expect, it } from 'vitest';
import { useFonts } from './fontStore';

beforeEach(() => {
  useFonts.setState({ loading: 0, ready: false, started: false });
});

describe('fontStore started flag', () => {
  it('starts false before any load begins (distinct from in-flight)', () => {
    const s = useFonts.getState();
    expect(s.started).toBe(false);
    expect(s.loading).toBe(0);
    expect(s.ready).toBe(false);
  });

  it('start() latches started:true and marks a load in flight', () => {
    useFonts.getState().start();
    const s = useFonts.getState();
    expect(s.started).toBe(true);
    expect(s.loading).toBe(1);
    expect(s.ready).toBe(false);
  });

  it('finish() never resets started — a settled pipeline stays started:true', () => {
    const { start, finish } = useFonts.getState();
    start();
    finish();
    const s = useFonts.getState();
    expect(s.started).toBe(true); // not reset
    expect(s.loading).toBe(0);
    expect(s.ready).toBe(true);
  });

  it('disambiguates in-flight (started && loading>0) from never-started', () => {
    // never-started: the ambiguous ready:false state Surface must not wedge on
    expect(useFonts.getState().started).toBe(false);
    expect(useFonts.getState().loading).toBe(0);

    // in-flight: same loading=0? no — loading>0, and started is now true
    useFonts.getState().start();
    expect(useFonts.getState().started && useFonts.getState().loading > 0).toBe(true);
  });

  it('balanced start/finish pairs keep loading non-negative and started latched', () => {
    const { start, finish } = useFonts.getState();
    start();
    start();
    finish();
    expect(useFonts.getState().loading).toBe(1);
    expect(useFonts.getState().ready).toBe(false);
    expect(useFonts.getState().started).toBe(true);
    finish();
    expect(useFonts.getState().loading).toBe(0);
    expect(useFonts.getState().ready).toBe(true);
    expect(useFonts.getState().started).toBe(true);
  });
});
