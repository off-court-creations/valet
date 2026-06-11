// ─────────────────────────────────────────────────────────────
// src/components/fields/sliderMath.ts | valet
// Pure keyboard-step math for <Slider/> — no React/css imports
// ─────────────────────────────────────────────────────────────

/** Snap behaviour, mirrored from Slider so this module stays dependency-free. */
export type SliderSnapMode = 'none' | 'step' | 'presets';

export interface KeyStepArgs {
  /** Minimum allowed value. */
  min: number;
  /** Maximum allowed value. */
  max: number;
  /** Fixed increment when `snap="step"`. */
  step: number;
  /** Snap behaviour. */
  snap: SliderSnapMode;
  /** Number of decimal places allowed (0 = integers only). */
  precision: number;
}

/**
 * Arrow-key increment for the slider thumb.
 *
 * In `snap="step"` mode the configured step wins verbatim. Otherwise the
 * natural 1%-of-range step is floored at `10 ** -precision` — the smallest
 * increment that survives the commit path's `roundTo(value, precision)`.
 * Without the floor, any range under ~50 with the default `precision={0}`
 * yields a sub-0.5 step that rounds back to the previous value, making the
 * arrow keys of a `role="slider"` a complete no-op.
 */
export const computeKeyStep = ({ min, max, step, snap, precision }: KeyStepArgs): number =>
  snap === 'step' ? step : Math.max((max - min) / 100, 10 ** -precision);
