// ─────────────────────────────────────────────────────────────
// src/components/fields/Slider.tsx | valet
// Theme-aware, ultra-fast <Slider/> for @archway/valet
// – Un/controlled, FormControl-aware, preset-friendly
// – Optional min/max & live value labels, ticks, three snap modes
// – NEW: `precision` prop - default 0 (integers only); specify decimals if needed
//
// FIELDS S9 (rulings R9/R10): value/form/internal resolution delegated to the
// shared `useFieldState` hook (precedence prop > form > internal, latched at
// mount, no mount-time store writes). ChangeInfo.source is now classified
// honestly per interaction path (pointer drag ⇒ 'pointer', arrow/Page/Home/End
// keys ⇒ 'keyboard', no-event programmatic commits ⇒ 'programmatic') instead of
// the old `instanceof KeyboardEvent` check that mislabelled every pointer drag
// as 'programmatic' (the pointer path passed no event). Orphan fix
// (audit Slider.tsx:368): a canceled pointer gesture left the document
// `pointermove`/`pointerup` listeners tracking forever — `pointercancel` now
// tears them down, and the thumb captures the pointer so the drag survives the
// pointer leaving the element.
// ─────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  PointerEvent as PE,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useFieldState } from '../../hooks/useControlledState';
import { useCompact } from '../../system/compactContext';
import { warnOnce } from '../../system/devErrors';
import { computeKeyStep } from './sliderMath';
import type { FieldBaseProps } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';

/*───────────────────────────────────────────────────────────*/
/* Size map                                                  */
type SliderSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SizeTokens {
  trackH: string;
  thumb: string;
  tickH: string;
  font: string;
}

const createSizeMap = (): Record<SliderSize, SizeTokens> => ({
  xs: { trackH: '4px', thumb: '14px', tickH: '6px', font: '0.625rem' },
  sm: { trackH: '6px', thumb: '18px', tickH: '8px', font: '0.75rem' },
  md: { trackH: '8px', thumb: '22px', tickH: '10px', font: '0.875rem' },
  lg: { trackH: '10px', thumb: '26px', tickH: '12px', font: '1rem' },
  xl: { trackH: '14px', thumb: '34px', tickH: '16px', font: '1.125rem' },
});

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Wrapper = styled('div')`
  position: relative;
  width: 100%;
  touch-action: none; /* prevent page pan while dragging */
  user-select: none;
`;

const Track = styled('div')<{ $h: string }>`
  position: relative;
  height: ${({ $h }) => $h};
  background: #0003;
  border-radius: 9999px;
  overflow: hidden;
  /* A touch-drag starting on the track must not pan the page (touch-action is
     not inherited from <Wrapper>). */
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
`;

const Fill = styled('div')<{ $primary: string }>`
  position: absolute;
  top: 0;
  /* rtl: physical-by-design — the slider is a physical coordinate system:
     pointer math maps clientX→value and the thumb/ticks are positioned by
     percentage from the physical left edge (style={{ left: pct% }}). The fill
     origin must share that frame; interactive-RTL drag math is a logged
     deferral, so this stays physical-left to track the thumb exactly. */
  left: 0;
  height: 100%;
  background: ${({ $primary }) => $primary};
`;

const Thumb = styled('button')<{
  $d: string;
  $primary: string;
}>`
  position: absolute;
  transform: translate(-50%, -50%);
  width: ${({ $d }) => $d};
  height: ${({ $d }) => $d};
  border-radius: 50%;
  border: 2px solid #fff;
  background: ${({ $primary }) => $primary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: box-shadow 0.15s;

  /* Mobile chrome kit — no blue tap flash, no iOS callout/selection, and the
     drag must not pan the page (touch-action is not inherited from <Wrapper>). */
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;

  /* Coarse-pointer (touch) grab target — expand to >=44px (24px under compact)
     WITHOUT changing the visual thumb; fine-pointer (desktop) is untouched.
     Logical centering (inset:0; margin:auto) keeps the RTL gate green. */
  @media (pointer: coarse) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      margin: auto;
      width: max(100%, var(--valet-slider-hit, 44px));
      height: max(100%, var(--valet-slider-hit, 44px));
    }
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px currentColor;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const ValueBubble = styled('span')<{ $font: string }>`
  position: absolute;
  bottom: 100%;
  transform: translate(-50%, -0.5rem);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  background: var(--valet-bg, #fff);
  color: var(--valet-text-color, #000);
  font-size: ${({ $font }) => $font};
  white-space: nowrap;
  pointer-events: none;
`;

const EndLabel = styled('span')<{ $font: string }>`
  position: absolute;
  top: 100%;
  transform: translateY(0.5rem);
  font-size: ${({ $font }) => $font};
  color: var(--valet-text-color, #000);
  pointer-events: none;
  user-select: none;
`;

const Tick = styled('span')<{ $h: string }>`
  position: absolute;
  transform: translate(-50%, -50%);
  width: 1px;
  height: ${({ $h }) => $h};
  background: currentColor;
  pointer-events: none;
`;

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */
type SnapMode = 'none' | 'step' | 'presets';

/** Round to `p` decimal places (default 0) */
const roundTo = (val: number, p: number) => parseFloat(val.toFixed(p));

const snapValue = (val: number, mode: SnapMode, step: number, presets: number[]) => {
  if (mode === 'step') return Math.round(val / step) * step;
  if (mode === 'presets')
    return presets.reduce((a, b) => (Math.abs(b - val) < Math.abs(a - val) ? b : a), presets[0]);
  return val;
};

/* Assign to either function or object ref without deprecated types */
function assignRef<T>(ref: React.Ref<T> | null | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
  } else {
    // RefObject has a readonly `current` in the type definition; runtime allows setting.
    (ref as unknown as { current: T | null }).current = value;
  }
}

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface SliderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'style'>,
    FieldBaseProps {
  /** Controlled value. */
  value?: number;
  /** Default for uncontrolled usage. */
  defaultValue?: number;
  /** Canonical value change (pointer drag, keyboard). */
  onValueChange?: OnValueChange<number>;
  /** Commit event (pointer up, blur, or Enter/Page/Home/End key). */
  onValueCommit?: OnValueCommit<number>;

  /** Minimum allowed value. */
  min?: number;
  /** Maximum allowed value. */
  max?: number;

  /** Fixed increment when `snap="step"`; defaults to 1. */
  step?: number;
  /** Preset snap points when `snap="presets"`. */
  presets?: number[];
  /** Snap behaviour. */
  snap?: SnapMode;

  /** Number of decimal places allowed. Default 0 (integers only). */
  precision?: number;

  /** Show live numeric value above thumb. */
  showValue?: boolean;
  /** Show min/max labels beneath the track ends. */
  showMinMax?: boolean;

  /** Show tick marks (follows snap points or `ticks`). */
  showTicks?: boolean;
  /** Custom tick set (overrides derived ticks). */
  ticks?: number[];

  size?: SliderSize | number | string;
  disabled?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value: valueProp,
      defaultValue = 0,
      onValueChange,
      onValueCommit,
      min = 0,
      max = 100,
      step = 1,
      presets = [],
      snap = 'none',
      precision = 0,
      showValue = false,
      showMinMax = false,
      showTicks = false,
      ticks,
      name,
      size = 'md',
      disabled = false,
      // API-TYPES S6 (stage A): destructure the FieldBaseProps cluster BEFORE the
      // rest-spread so label/helperText/error/fullWidth stop leaking onto the
      // <Wrapper> div as invalid DOM attributes. `error` drives aria-invalid on
      // the thumb; `label`/`helperText` are now rendered + wired as the thumb's
      // accessible name / description (WCAG 4.1.2). FieldShell rendering of
      // fullWidth is Phase 2 / Q10.
      label,
      helperText,
      error,
      fullWidth: _fullWidth,
      preset: p,
      className,
      sx,
      ...rest
    },
    forwardedRef,
  ) => {
    void _fullWidth;
    /* theme + geom tokens ----------------------------------- */
    const { theme } = useTheme();
    const map = createSizeMap();
    const effectiveCompact = useCompact();

    let geom: SizeTokens;

    if (map[size as SliderSize]) {
      geom = map[size as SliderSize];
    } else {
      // Accept numeric (px) or any CSS length; scale thumb from track height but keep
      // label font modest to avoid layout jumps.
      const h = typeof size === 'number' ? `${size}px` : (size as string);
      geom = {
        trackH: h,
        thumb: `calc(${h} * 2 + 6px)`,
        tickH: `calc(${h} + 2px)`,
        // Keep label font around base size even for large tracks
        font: '0.875rem',
      };
    }

    /**
     * Single resolution of value/control/form binding (ruling R9). Precedence
     * is prop > form > internal, latched at mount; an unseeded form key renders
     * `defaultValue ?? 0` as controlled and never writes on mount. The setter
     * writes through to the store whenever live-bound; the hook itself decides
     * whether `setValue` updates internal state.
     */
    const [current, setValue] = useFieldState<number>({
      value: valueProp,
      defaultValue,
      fallback: 0,
      name,
      component: 'Slider',
    });

    /* derived ticks ----------------------------------------- */
    const tickValues: number[] = useMemo(() => {
      if (!showTicks) return [];
      if (ticks?.length) return ticks.filter((v) => v >= min && v <= max);

      if (snap === 'step') {
        const out: number[] = [];
        for (let v = min; v <= max; v = roundTo(v + step, precision)) {
          out.push(v);
          if (v === max) break; // avoid floating-error loops
        }
        return out;
      }
      if (snap === 'presets' && presets.length) return presets;

      /* fallback – 10 even divisions */
      const div = 10;
      return Array.from({ length: div + 1 }, (_, i) =>
        roundTo(min + (i * (max - min)) / div, precision),
      );
    }, [showTicks, ticks, snap, presets, min, max, step, precision]);

    /* refs --------------------------------------------------- */
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const fillRef = useRef<HTMLDivElement | null>(null);
    const thumbRef = useRef<HTMLButtonElement | null>(null);

    /* helper – % <-> value ---------------------------------- */
    const pctFor = useCallback((val: number) => ((val - min) / (max - min)) * 100, [min, max]);
    const valFor = useCallback((pct: number) => min + ((max - min) * pct) / 100, [min, max]);

    /* visual paint ------------------------------------------ */
    const renderVisual = useCallback(
      (val: number) => {
        const pct = pctFor(val);
        if (fillRef.current) fillRef.current.style.width = `${pct}%`;
        if (thumbRef.current) thumbRef.current.style.left = `${pct}%`;
      },
      [pctFor],
    );

    useEffect(() => {
      renderVisual(current);
    }, [current, renderVisual]);

    /* commit helper ----------------------------------------- */
    // `source` is supplied explicitly by each interaction path (ruling R10):
    // pointer drag/click ⇒ 'pointer', arrow/Page/Home/End keys ⇒ 'keyboard',
    // a bare programmatic commit ⇒ 'programmatic'. The old `instanceof
    // KeyboardEvent` inference mislabelled every pointer drag as 'programmatic'
    // because the pointer path passed no event.
    const commitValue = useCallback(
      (
        v: number,
        phase: 'input' | 'commit' = 'commit',
        source: InputSource = 'programmatic',
        event?: React.SyntheticEvent,
      ) => {
        const snapped = snapValue(Math.min(Math.max(v, min), max), snap, step, presets);
        const rounded = roundTo(snapped, precision);

        // Updates internal state (uncontrolled) and/or writes through to the
        // form store (live-bound) via the hook's single precedence rule.
        setValue(rounded);
        const info: ChangeInfo<number> = {
          previousValue: current,
          phase,
          source,
          event,
          name,
        };
        if (phase === 'input') onValueChange?.(rounded, info);
        else {
          onValueChange?.(rounded, { ...info, phase: 'input' });
          onValueCommit?.(rounded, { ...info, phase: 'commit' });
        }
        renderVisual(rounded);
      },
      [
        setValue,
        min,
        max,
        name,
        onValueChange,
        onValueCommit,
        presets,
        snap,
        step,
        precision,
        renderVisual,
        current,
      ],
    );

    /* pointer handling -------------------------------------- */
    const updateFromClientX = useCallback(
      (clientX: number) => {
        if (!wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const pct = ((clientX - rect.left) / rect.width) * 100;
        commitValue(valFor(pct), 'commit', 'pointer');
      },
      [commitValue, valFor],
    );

    const onPointerDown = useCallback(
      (e: PE<HTMLElement>) => {
        if (disabled) return;
        e.preventDefault();
        updateFromClientX(e.clientX);

        // Capture the pointer on the thumb so the drag survives the pointer
        // leaving the element; the matching release happens in `cleanup`.
        const captureTarget = thumbRef.current;
        const pointerId = e.pointerId;
        if (captureTarget) {
          try {
            captureTarget.setPointerCapture(pointerId);
          } catch {
            /* setPointerCapture can throw if the pointer is already gone */
          }
        }

        const valueFromEvent = (ev: PointerEvent) =>
          valFor(
            ((ev.clientX - (wrapRef.current?.getBoundingClientRect().left ?? 0)) /
              (wrapRef.current?.getBoundingClientRect().width ?? 1)) *
              100,
          );

        // Orphan fix (audit Slider.tsx:368): tear down BOTH document listeners
        // and release the captured pointer. Called from `pointerup` (commit)
        // AND `pointercancel` (a canceled gesture used to leak `move` forever).
        const cleanup = () => {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', up as EventListener);
          document.removeEventListener('pointercancel', cancel as EventListener);
          if (captureTarget?.hasPointerCapture?.(pointerId)) {
            try {
              captureTarget.releasePointerCapture(pointerId);
            } catch {
              /* already released */
            }
          }
        };

        const move = (ev: PointerEvent) => {
          commitValue(valueFromEvent(ev), 'input', 'pointer');
        };
        const up = (ev: PointerEvent) => {
          cleanup();
          commitValue(valueFromEvent(ev), 'commit', 'pointer');
        };
        const cancel = () => {
          // Gesture aborted: stop tracking and snap the visual back to the
          // current value without firing a spurious commit.
          cleanup();
          renderVisual(current);
        };

        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up as EventListener);
        document.addEventListener('pointercancel', cancel as EventListener);
      },
      [disabled, updateFromClientX, commitValue, valFor, renderVisual, current],
    );

    /* keyboard handling ------------------------------------- */
    // Floored at 10**-precision so the step survives commit-path rounding
    const keyStep = computeKeyStep({ min, max, step, snap, precision });
    const pageStep = Math.max(step, Math.round((max - min) / 10));
    const onKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const k = e.key;
      if (k === 'Home') {
        e.preventDefault();
        commitValue(min, 'commit', 'keyboard', e);
        return;
      }
      if (k === 'End') {
        e.preventDefault();
        commitValue(max, 'commit', 'keyboard', e);
        return;
      }
      if (k === 'PageUp') {
        e.preventDefault();
        commitValue(current + pageStep, 'commit', 'keyboard', e);
        return;
      }
      if (k === 'PageDown') {
        e.preventDefault();
        commitValue(current - pageStep, 'commit', 'keyboard', e);
        return;
      }
      let delta = 0;
      if (k === 'ArrowRight' || k === 'ArrowUp') delta = keyStep;
      if (k === 'ArrowLeft' || k === 'ArrowDown') delta = -keyStep;
      if (delta) {
        e.preventDefault();
        commitValue(current + delta, 'commit', 'keyboard', e);
      }
    };

    /* preset → class merge ---------------------------------- */
    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    /* ref merger without deprecated MutableRefObject --------- */
    const setWrapperRef = useCallback(
      (node: HTMLDivElement | null) => {
        wrapRef.current = node;
        assignRef(forwardedRef, node);
      },
      [forwardedRef],
    );

    /*─────────────────────────────────────────────────────────*/
    /* JSX                                                     */
    /*─────────────────────────────────────────────────────────*/
    const id = useId();
    // WCAG 4.1.2 (Name, Role, Value): wire the visible `label` as the thumb's
    // accessible name and `helperText` as its description, mirroring RadioGroup.
    const labelId = label != null ? `${id}-label` : undefined;
    const helpId = helperText != null ? `${id}-help` : undefined;

    // Dev-time accessible-name guard (mirrors IconButton.tsx): warn ONCE if the
    // slider would render with no accessible name from ANY source. External
    // labelling via aria-label/aria-labelledby is valid and silences the warn.
    if (process.env.NODE_ENV !== 'production') {
      const hasName =
        label != null ||
        Boolean((rest as Record<string, unknown>)['aria-label']) ||
        Boolean((rest as Record<string, unknown>)['aria-labelledby']);
      if (!hasName) {
        warnOnce(
          `Slider:no-accessible-name:${id}`,
          'valet: Slider: provide an accessible name via the `label` prop, aria-label, or aria-labelledby (WCAG 4.1.2).',
        );
      }
    }

    const format = (v: number) => (precision ? v.toFixed(precision) : v);

    const baseTop = showValue ? theme.spacing(1) : theme.spacing(0.25);
    const baseBottom = showMinMax ? theme.spacing(1) : theme.spacing(0.25);
    const thumbOverflow = `calc((${geom.thumb} - ${geom.trackH}) / 2)`;
    const padTop = `calc(${baseTop} + ${thumbOverflow})`;
    const padBottom = `calc(${baseBottom} + ${thumbOverflow})`;
    const trackCenter = `calc(${padTop} + (${geom.trackH} / 2))`;

    const wrapper = (
      <Wrapper
        {...rest}
        ref={setWrapperRef}
        tabIndex={-1}
        data-valet-component='Slider'
        data-state={disabled ? 'disabled' : 'enabled'}
        data-disabled={disabled ? 'true' : 'false'}
        className={mergedCls}
        style={{ paddingTop: padTop, paddingBottom: padBottom, ...sx }}
        onFocus={() => {
          // Focus the interactive thumb when the wrapper receives programmatic focus
          thumbRef.current?.focus();
        }}
      >
        {/* track + fill */}
        <Track
          $h={geom.trackH}
          onPointerDown={onPointerDown}
          aria-hidden
        >
          <Fill
            ref={fillRef}
            $primary={theme.colors.primary}
          />
        </Track>

        {/* thumb */}
        <Thumb
          ref={thumbRef}
          id={id}
          role='slider'
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          aria-valuetext={String(format(current))}
          aria-invalid={error || undefined}
          aria-disabled={disabled || undefined}
          aria-labelledby={labelId}
          aria-describedby={helpId}
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
          $d={geom.thumb}
          $primary={theme.colors.primary}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
          style={
            {
              top: trackCenter,
              '--valet-slider-hit': effectiveCompact ? '24px' : '44px',
            } as React.CSSProperties
          }
        >
          {showValue && <ValueBubble $font={geom.font}>{format(current)}</ValueBubble>}
        </Thumb>

        {/* min / max labels — rtl: physical-by-design, pinned to the same
            physical track frame as the percentage-positioned thumb/ticks */}
        {showMinMax && (
          <>
            <EndLabel
              $font={geom.font}
              style={{ left: 0 }}
            >
              {format(min)}
            </EndLabel>
            <EndLabel
              $font={geom.font}
              style={{ right: 0 }}
            >
              {format(max)}
            </EndLabel>
          </>
        )}

        {/* ticks — rtl: physical-by-design, pctFor() is a physical-left percentage */}
        {showTicks &&
          tickValues.map((t) => (
            <Tick
              key={t}
              $h={geom.tickH}
              style={{ left: `${pctFor(t)}%`, top: trackCenter }}
            />
          ))}
      </Wrapper>
    );

    // When neither label nor helperText is supplied, render the bare <Wrapper>
    // (the positioned track region) exactly as before — no wrapper, no
    // structural change, so the absolutely-positioned thumb/ticks stay aligned.
    if (label == null && helperText == null) return wrapper;

    // The thumb/ticks are positioned relative to <Wrapper>'s padding box, so the
    // visible label/helper must live OUTSIDE it (an outer flex column) to avoid
    // shifting the track's positioning origin. The forwarded ref + `rest` stay
    // on the inner <Wrapper> (the slider root), so consumers are unaffected.
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {label != null && (
          <div
            id={labelId}
            style={{
              fontSize: '0.875rem',
              color: theme.colors.text,
              marginBottom: theme.spacing(0.5),
            }}
          >
            {label}
          </div>
        )}
        {wrapper}
        {helperText != null && (
          <div
            id={helpId}
            style={{
              fontSize: '0.75rem',
              color: theme.colors.text + 'AA',
              marginTop: theme.spacing(0.5),
            }}
            aria-live='polite'
          >
            {helperText}
          </div>
        )}
      </div>
    );
  },
);

Slider.displayName = 'Slider';
export default Slider;
