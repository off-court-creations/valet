// ─────────────────────────────────────────────────────────────
// src/components/fields/Slider.tsx | valet
// Theme-aware, ultra-fast <Slider/> for @archway/valet
// – Un/controlled, FormControl-aware, preset-friendly
// – Optional min/max & live value labels, ticks, three snap modes
// – NEW: `precision` prop - default 0 (integers only); specify decimals if needed
// ─────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  PointerEvent as PE,
  KeyboardEvent,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useForm } from './FormControl';
import type { Presettable } from '../../types';

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
`;

const Fill = styled('div')<{ $primary: string }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: ${({ $primary }) => $primary};
`;

const Thumb = styled('button')<{
  $d: string;
  $primary: string;
}>`
  position: absolute;
  top: 50%;
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
  top: 50%;
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
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  /** Controlled value. */
  value?: number;
  /** Default for uncontrolled usage. */
  defaultValue?: number;
  /** Fires on every change (pointer + keyboard). */
  onChange?: (value: number) => void;

  min?: number;
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

  /** Optional FormControl binding. */
  name?: string;

  size?: SliderSize | number | string;
  disabled?: boolean;
}

/* Minimal form shape we rely on (values + optional setField) */
type NumForm = {
  values: Record<string, number | undefined>;
  setField?: (name: string, value: number) => void;
};

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value: valueProp,
      defaultValue = 0,
      onChange,
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
      preset: p,
      className,
      style,
      ...rest
    },
    forwardedRef,
  ) => {
    /* theme + geom tokens ----------------------------------- */
    const { theme } = useTheme();
    const map = createSizeMap();

    let geom: SizeTokens;

    if (typeof size === 'number') {
      const h = `${size}px`;
      geom = {
        trackH: h,
        thumb: `calc(${h} * 2 + 6px)`,
        tickH: `calc(${h} + 2px)`,
        font: `calc(${h} + 6px)`,
      };
    } else if (map[size as SliderSize]) {
      geom = map[size as SliderSize];
    } else {
      const h = size as string;
      geom = {
        trackH: h,
        thumb: `calc(${h} * 2 + 6px)`,
        tickH: `calc(${h} + 2px)`,
        font: `calc(${h} + 6px)`,
      };
    }

    /* optional FormControl binding (always call hook) -------- */
    // We only rely on `values` and an optional `setField`.
    const form = useForm<Record<string, number | undefined>>() as unknown as NumForm;

    /* controlled hierarchy ---------------------------------- */
    const formVal = form && name ? form.values[name] : undefined;
    const controlled = formVal !== undefined || valueProp !== undefined;
    const [self, setSelf] = useState(defaultValue);
    const current = controlled ? (formVal !== undefined ? formVal : (valueProp as number)) : self;

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
    const commitValue = useCallback(
      (v: number) => {
        const snapped = snapValue(Math.min(Math.max(v, min), max), snap, step, presets);
        const rounded = roundTo(snapped, precision);

        if (!controlled) setSelf(rounded);
        if (name && form?.setField) form.setField(name, rounded);
        onChange?.(rounded);
        renderVisual(rounded);
      },
      [controlled, form, min, max, name, onChange, presets, snap, step, precision, renderVisual],
    );

    /* pointer handling -------------------------------------- */
    const updateFromClientX = useCallback(
      (clientX: number) => {
        if (!wrapRef.current) return;
        const rect = wrapRef.current.getBoundingClientRect();
        const pct = ((clientX - rect.left) / rect.width) * 100;
        commitValue(valFor(pct));
      },
      [commitValue, valFor],
    );

    const onPointerDown = useCallback(
      (e: PE<HTMLElement>) => {
        if (disabled) return;
        e.preventDefault();
        updateFromClientX(e.clientX);

        const move = (ev: PointerEvent) => updateFromClientX(ev.clientX);
        const up = () => {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerup', up as EventListener);
        };

        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up as EventListener, { once: true });
      },
      [disabled, updateFromClientX],
    );

    /* keyboard handling ------------------------------------- */
    const keyStep = snap === 'step' ? step : (max - min) / 100;
    const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      let delta = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') delta = keyStep;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') delta = -keyStep;
      if (!delta) return;
      e.preventDefault();
      commitValue(current + delta);
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
    const format = (v: number) => (precision ? v.toFixed(precision) : v);

    return (
      <Wrapper
        {...rest}
        ref={setWrapperRef}
        className={mergedCls}
        style={style}
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
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          disabled={disabled}
          $d={geom.thumb}
          $primary={theme.colors.primary}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          style={{ top: `calc(${geom.trackH} / 2)` }}
        >
          {showValue && <ValueBubble $font={geom.font}>{format(current)}</ValueBubble>}
        </Thumb>

        {/* min / max labels */}
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

        {/* ticks */}
        {showTicks &&
          tickValues.map((t) => (
            <Tick
              key={t}
              $h={geom.tickH}
              style={{ left: `${pctFor(t)}%` }}
            />
          ))}
      </Wrapper>
    );
  },
);

Slider.displayName = 'Slider';
export default Slider;
