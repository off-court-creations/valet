// ─────────────────────────────────────────────────────────────
// src/components/layout/Accordion.tsx  | valet
// Re-architected single-file Accordion
// - Headless reducer core + roving focus manager
// - Controlled/uncontrolled; single/multiple; optional unmountOnExit
// - Improved motion: reduced-measure, reduced-motion aware
// - Semantics: strict ARIA wiring; heading level; data-state attrs
// - Surface-aware height constraint
// ─────────────────────────────────────────────────────────────
/* eslint-disable react/prop-types */
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useMemo,
  useLayoutEffect,
  useState,
  useId,
  useEffect,
} from 'react';
import type { JSX } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { toRgb, mix, toHex } from '../../helpers/color';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import type { Presettable, SpacingProps, Sx } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';
import { Typography } from '../primitives/Typography';

/*───────────────────────────────────────────────────────────*/
/* Types / machine                                           */
type Mode = 'single' | 'multiple';

// (internal note) A reducer-based machine was considered; for simplicity and
// alignment with controllable state, we compute next state in callbacks using Mode.

function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (next: T) => void,
) {
  const [inner, setInner] = useState<T>(defaultValue);
  const isControlled = controlled !== undefined;
  const value = isControlled ? (controlled as T) : inner;
  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInner(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [value, setValue] as const;
}

/*───────────────────────────────────────────────────────────*/
/* Context (roving focus + actions)                          */
interface Ctx {
  open: number[];
  toggle: (idx: number) => void;
  mode: Mode;
  headerTag: keyof JSX.IntrinsicElements;
  // Keyboard navigation helpers (roving focus)
  registerItem: (idx: number, el: HTMLButtonElement | null, disabled: boolean) => void;
  updateDisabled: (idx: number, disabled: boolean) => void;
  focusItem: (idx: number) => void;
  focusNext: (from: number) => void;
  focusPrev: (from: number) => void;
  focusFirst: () => void;
  focusLast: () => void;
  activeIndex: number;
}

const AccordionCtx = createContext<Ctx | null>(null);
const useAccordion = () => {
  const ctx = useContext(AccordionCtx);
  if (!ctx) throw new Error('<Accordion.Item> must be inside <Accordion>');
  return ctx;
};

/*───────────────────────────────────────────────────────────*/
/* Styled primitives + CSS vars                              */
const Root = styled('div')<{ $pad: string }>`
  width: 100%;
  box-sizing: border-box;
  padding: ${({ $pad }) => $pad};
  /* theming surface: allow per-instance overrides */
  --acc-duration: var(--valet-acc-duration, 300ms);
  --acc-ease: var(--valet-acc-ease, cubic-bezier(0.4, 0, 0.2, 1));
`;

const Wrapper = styled('div')`
  width: 100%;
  display: block;
  box-sizing: border-box;
  min-height: 0;
`;

const ItemWrapper = styled('div')<{
  $hoverDur: string;
  $hoverEase: string;
}>`
  border-bottom: var(--valet-divider-stroke, 1px) solid currentColor;
  transition: border-bottom-color ${({ $hoverDur }) => $hoverDur} ${({ $hoverEase }) => $hoverEase};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  /* Hover affordance: divider fades
     - Do not affect disabled items
     - When hovering a closed item, hide its bottom divider (not open)
     - When hovering an item (open or closed), hide the divider directly above it
       by fading the previous item's bottom border, unless that previous item is disabled */
  @media (hover: hover) {
    /*
      Hide this item's bottom divider only when hovered and not open, and not disabled,
      AND only if the next sibling is not selected (open). If the next is selected,
      keep this bottom divider visible to preserve the selected item's top edge.
    */
    &:hover:not([data-open='true']):not([data-disabled='true']):not([data-skip-hover='true']):not(
        :has(+ &[data-open='true'])
      ) {
      border-bottom-color: transparent;
    }

    /*
      Hide the top divider (previous item's bottom border) when the next item is hovered,
      unless this item is disabled OR this item is selected (keep selected bottom edge visible).
    */
    &:not([data-disabled='true']):not([data-open='true']):has(
        + &:hover:not([data-disabled='true']):not([data-skip-hover='true'])
      ) {
      border-bottom-color: transparent;
    }
  }
`;

const HeaderBtn = styled('button')<{
  $open: boolean;
  $primary: string;
  $disabledColor: string;
  $highlight: string;
  $shift: string;
  $skipHover: boolean;
  $hoverBg: string;
  $padV: string;
}>`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: ${({ $padV }) => $padV} ${({ $shift }) => $shift};
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-align: left;
  appearance: none;
  box-sizing: border-box;
  margin-inline-start: -${({ $shift }) => $shift};
  margin-inline-end: -${({ $shift }) => $shift};

  /* Disable blue tap-highlight on mobile */
  -webkit-tap-highlight-color: transparent;

  transition: background 200ms ease;

  /* Hover tint – only on devices that actually support hover */
  @media (hover: hover) {
    &:hover:not(:disabled) {
      ${({ $skipHover, $hoverBg }) => ($skipHover ? '' : `background:${$hoverBg};`)}
    }
  }

  ${({ $open, $highlight }) => $open && `background:${$highlight};`}

  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid
      var(--valet-focus-ring-color, ${({ $primary }) => $primary});
    outline-offset: var(--valet-focus-offset, 2px);
  }

  &:disabled {
    color: ${({ $disabledColor }) => $disabledColor};
    cursor: not-allowed;
    opacity: 0.6; /* Iterator-style dim */
    filter: grayscale(0.2);
  }
`;

const Chevron = styled('svg')<{ $open: boolean }>`
  width: 1em;
  height: 1em;
  flex-shrink: 0;
  transition: transform var(--acc-duration) var(--acc-ease);
  transform: rotate(${({ $open }) => ($open ? 180 : 0)}deg);
`;

const Content = styled('div')<{ $open: boolean; $height: number; $reduced: boolean }>`
  overflow: hidden;
  height: ${({ $open, $height }) => ($open ? `${$height}px` : '0')};
  transition: ${({ $reduced }) =>
    $reduced ? 'none' : 'height var(--acc-duration) var(--acc-ease)'};
  will-change: height;
`;

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */
export interface AccordionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable,
    Pick<SpacingProps, 'pad' | 'compact'> {
  defaultOpen?: number | number[];
  open?: number | number[];
  multiple?: boolean;
  onOpenChange?: (open: number[]) => void;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  constrainHeight?: boolean;
  unmountOnExit?: boolean;
  /** Inline styles via CSSProperties (with CSS var support) */
  sx?: Sx;
}

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  header: ReactNode;
  index?: number;
  disabled?: boolean;
  children: ReactNode;
  /** Inline styles via CSSProperties (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Accordion root                                            */
export const Accordion: React.FC<AccordionProps> & {
  Item: React.FC<AccordionItemProps>;
} = ({
  defaultOpen,
  open: openProp,
  multiple = false,
  onOpenChange,
  headingLevel = 3,
  constrainHeight = true,
  unmountOnExit = false,
  pad: padProp,
  compact = false,
  preset: p,
  className,
  sx,
  children,
  ...divProps
}) => {
  const { theme } = useTheme();
  const surface = useSurface(
    (s) => ({
      element: s.element,
      height: s.height,
      registerChild: s.registerChild,
      unregisterChild: s.unregisterChild,
    }),
    shallow,
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const [maxHeight, setMaxHeight] = useState<number>();
  const [shouldConstrain, setShouldConstrain] = useState(false);
  const constraintRef = useRef(false);
  // Roving focus state --------------------------------------------------
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const disabledSet = useRef<Set<number>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const toArray = (v?: number | number[]) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
  const [externalOpen, setExternalOpen] = useControllableState<number[]>(
    openProp ? toArray(openProp) : undefined,
    toArray(defaultOpen),
    onOpenChange,
  );

  const mode: Mode = multiple ? 'multiple' : 'single';
  const open = externalOpen;
  const toggle = useCallback(
    (idx: number) => {
      const isOpen = open.includes(idx);
      let next: number[];
      if (isOpen) next = open.filter((i) => i !== idx);
      else next = mode === 'single' ? [idx] : [...open, idx];
      setExternalOpen(next);
    },
    [open, mode, setExternalOpen],
  );

  const ctx = useMemo<Ctx>(() => {
    const nextEnabledFrom = (start: number, step: 1 | -1) => {
      const count = itemRefs.current.length;
      if (count === 0) return -1;
      let i = start;
      for (let n = 0; n < count; n++) {
        i = (i + step + count) % count;
        if (!disabledSet.current.has(i)) return i;
      }
      return -1; // all disabled
    };

    const focusItem = (idx: number) => {
      if (idx < 0) return;
      setActiveIndex(idx);
      const btn = itemRefs.current[idx];
      if (btn) {
        // Ensure element is focusable in tab sequence then focus it
        try {
          btn.focus();
        } catch {
          /* ignore */
        }
      }
    };

    const registerItem = (idx: number, el: HTMLButtonElement | null, disabled: boolean) => {
      itemRefs.current[idx] = el;
      if (disabled) disabledSet.current.add(idx);
      else disabledSet.current.delete(idx);
      // If nothing active yet or active points to a disabled/non-existent, correct it
      const a = activeIndex;
      if (!itemRefs.current[a] || disabledSet.current.has(a)) {
        const firstEnabled = nextEnabledFrom(-1, 1);
        if (firstEnabled >= 0) setActiveIndex(firstEnabled);
      }
    };

    const updateDisabled = (idx: number, disabled: boolean) => {
      if (disabled) disabledSet.current.add(idx);
      else disabledSet.current.delete(idx);
      if (disabled && activeIndex === idx) {
        const next = nextEnabledFrom(idx, 1);
        if (next >= 0) setActiveIndex(next);
      }
    };

    return {
      open,
      toggle,
      mode,
      headerTag: `h${headingLevel}` as keyof JSX.IntrinsicElements,
      registerItem,
      updateDisabled,
      focusItem,
      focusNext: (from: number) => focusItem(nextEnabledFrom(from, 1)),
      focusPrev: (from: number) => focusItem(nextEnabledFrom(from, -1)),
      focusFirst: () => focusItem(nextEnabledFrom(-1, 1)),
      focusLast: () => focusItem(nextEnabledFrom(0, -1)),
      activeIndex,
    };
  }, [open, toggle, mode, headingLevel, activeIndex]);

  const presetClasses = p ? preset(p) : '';

  const calcCutoff = () => {
    if (typeof document === 'undefined') return 32;
    const fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return (isNaN(fs) ? 16 : fs) * 2;
  };

  const bottomRef = useRef(0);
  const rafRef = useRef<number>(0);
  const prevHeightRef = useRef<number | undefined>(undefined);
  const prevConstrainedRef = useRef(false);

  const runUpdate = useCallback(() => {
    const node = wrapRef.current;
    const surfEl = surface.element;
    if (!node || !surfEl) return;
    const sRect = surfEl.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    const top = Math.round(nRect.top - sRect.top + surfEl.scrollTop);
    const dynBottom = Math.round(
      surfEl.scrollHeight - (nRect.bottom - sRect.top + surfEl.scrollTop),
    );
    if (!constraintRef.current) bottomRef.current = dynBottom;
    const available = Math.round(surface.height - top - bottomRef.current);
    const cutoff = calcCutoff();

    const shouldClamp = node.scrollHeight - available > 1 && available >= cutoff;

    if (shouldClamp) {
      // Do not reset parent scroll position when entering constrain mode.
      constraintRef.current = true;
      if (!prevConstrainedRef.current) {
        prevConstrainedRef.current = true;
        setShouldConstrain(true);
      }
      const newHeight = Math.max(0, available);
      if (prevHeightRef.current !== newHeight) {
        prevHeightRef.current = newHeight;
        setMaxHeight(newHeight);
      }
    } else {
      constraintRef.current = false;
      bottomRef.current = dynBottom;
      if (prevConstrainedRef.current) {
        prevConstrainedRef.current = false;
        setShouldConstrain(false);
      }
      if (prevHeightRef.current !== undefined) {
        prevHeightRef.current = undefined;
        setMaxHeight(undefined);
      }
    }
  }, [surface]);

  const update = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(runUpdate);
  }, [runUpdate]);

  useEffect(() => {
    if (!constrainHeight) {
      constraintRef.current = false;
      setShouldConstrain(false);
      setMaxHeight(undefined);
    } else {
      constraintRef.current = false;
    }
  }, [constrainHeight]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    const node = wrapRef.current;
    surface.registerChild(uniqueId, node, update);
    const ro = new ResizeObserver(update);
    ro.observe(node);
    update();
    return () => {
      surface.unregisterChild(uniqueId);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [constrainHeight, surface, uniqueId, update]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    update();
  }, [constrainHeight, surface.height, surface.element, update]);

  return (
    <AccordionCtx.Provider value={ctx}>
      <Wrapper
        ref={wrapRef}
        style={shouldConstrain ? { overflow: 'auto', maxHeight } : undefined}
      >
        <Root
          {...(() => {
            const { style: styleProp, ...rest } = divProps;
            const mergedStyle = { ...(sx || {}), ...(styleProp as React.CSSProperties) };
            return { ...rest, style: mergedStyle } as typeof divProps;
          })()}
          $pad={resolveSpace(padProp, theme, compact, 1)}
          className={[presetClasses, className].filter(Boolean).join(' ')}
          data-valet-component='Accordion'
        >
          {React.Children.map(children, (child, idx) =>
            React.isValidElement(child)
              ? React.cloneElement(
                  child as React.ReactElement<{ index?: number; unmountOnExit?: boolean }>,
                  {
                    index: idx,
                    unmountOnExit,
                  },
                )
              : child,
          )}
        </Root>
      </Wrapper>
    </AccordionCtx.Provider>
  );
};

/*───────────────────────────────────────────────────────────*/
/* Accordion.Item                                            */
const AccordionItem: React.FC<AccordionItemProps> = ({
  header,
  children,
  disabled = false,
  preset: p,
  className,
  index = 0,
  sx,
  ...divProps
}) => {
  const { theme, mode } = useTheme();
  const {
    open,
    toggle,
    headerTag,
    registerItem,
    updateDisabled,
    focusItem,
    focusNext,
    focusPrev,
    focusFirst,
    focusLast,
    activeIndex,
  } = useAccordion();

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wasLongPress = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [skipHover, setSkipHover] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moveHandler = useRef<((e: PointerEvent) => void) | null>(null);

  // Suppress hover after selection until pointer leaves and re-enters.
  // We intentionally do not re-enable on movement or timer.
  const disableHoverUntilMove = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (moveHandler.current) {
      window.removeEventListener('pointermove', moveHandler.current);
      moveHandler.current = null;
    }
    setSkipHover(true);
  };

  const isOpen = open.includes(index);

  // Measure content height precisely and keep it fresh. On first
  // paint fonts or async content can change the height after
  // layout, which previously caused clipped content until an
  // interaction triggered a re-measure. Use RO + a couple of
  // queued rAF passes to stabilize the initial value.
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const measure = () => setHeight(el.scrollHeight);

    // Initial measure + two rAF passes to catch font reflow
    measure();
    const raf1 = requestAnimationFrame(measure);
    const raf2 = requestAnimationFrame(() => requestAnimationFrame(measure));

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);

    const onResize = () => measure();
    window.addEventListener('resize', onResize);

    // If supported, update when fonts finish loading
    const fonts: unknown = (document as unknown as { fonts?: FontFaceSet }).fonts;
    const fontListener = () => measure();
    const cleanupFonts = () => {
      try {
        (fonts as FontFaceSet | undefined)?.removeEventListener?.('loadingdone', fontListener);
      } catch {
        /* ignore */
      }
    };
    try {
      (fonts as FontFaceSet | undefined)?.addEventListener?.('loadingdone', fontListener);
    } catch {
      /* ignore */
    }

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      cleanupFonts();
    };
  }, [children, isOpen]);
  const headerId = `acc-btn-${index}`;
  const panelId = `acc-panel-${index}`;

  /* ----- compute disabled colour (greyed-out, mode-aware) -- */
  const disabledColor = toHex(
    mix(toRgb(theme.colors.text), toRgb(mode === 'dark' ? '#000' : '#fff'), 0.4),
  );

  const presetClasses = p ? preset(p) : '';
  const HeaderTag = headerTag as keyof JSX.IntrinsicElements;

  const highlight = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.15));
  const hoverBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.6));
  const shift = theme.spacing(1);
  const padV = theme.spacing(2);

  // Register header button for roving focus and update disabled state
  const btnRef = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    registerItem(index, btnRef.current, disabled);
    return () => registerItem(index, null, disabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => {
    updateDisabled(index, !!disabled);
  }, [disabled, index, updateDisabled]);

  const onKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        focusNext(index);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        focusPrev(index);
        break;
      case 'Home':
        e.preventDefault();
        focusFirst();
        break;
      case 'End':
        e.preventDefault();
        focusLast();
        break;
      case ' ':
      case 'Spacebar': // older Safari/WebKit
        e.preventDefault();
        toggle(index);
        break;
      case 'Enter':
        e.preventDefault();
        toggle(index);
        break;
      default:
        break;
    }
  };

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Optionally unmount content when closed (internal prop injected by root)
  const shouldRenderContent =
    isOpen || !(divProps as unknown as { unmountOnExit?: boolean }).unmountOnExit;

  // Strip internal injected prop to avoid DOM warning
  const restDivProps = { ...(divProps as Record<string, unknown>) } as typeof divProps;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (restDivProps as any).unmountOnExit;

  return (
    <ItemWrapper
      {...(() => {
        const { style: styleProp, ...rest } = restDivProps as unknown as {
          style?: React.CSSProperties;
        } & typeof restDivProps;
        const mergedStyle = { ...(sx || {}), ...(styleProp as React.CSSProperties) };
        return { ...rest, style: mergedStyle } as typeof restDivProps;
      })()}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      $hoverDur={theme.motion.hover.duration}
      $hoverEase={theme.motion.hover.easing}
      data-state={isOpen ? 'open' : 'closed'}
      data-open={isOpen ? 'true' : 'false'}
      data-disabled={disabled ? 'true' : 'false'}
      data-skip-hover={skipHover ? 'true' : 'false'}
      data-valet-component='Accordion.Item'
    >
      <HeaderTag style={{ margin: 0 }}>
        <HeaderBtn
          ref={btnRef}
          id={headerId}
          type='button'
          aria-expanded={isOpen}
          aria-controls={panelId}
          disabled={disabled}
          tabIndex={disabled ? -1 : activeIndex === index ? 0 : -1}
          onFocus={() => {
            if (!disabled) focusItem(index); // mark this as active for roving tabIndex
          }}
          onClick={() => toggle(index)}
          onKeyDown={onKey}
          onContextMenu={(e: React.MouseEvent) => {
            e.preventDefault();
            if (!disabled && !wasLongPress.current) toggle(index);
            wasLongPress.current = false;
          }}
          onPointerDown={(e: React.PointerEvent) => {
            if (hoverTimer.current) {
              clearTimeout(hoverTimer.current);
              hoverTimer.current = null;
            }
            if (moveHandler.current) {
              window.removeEventListener('pointermove', moveHandler.current);
              moveHandler.current = null;
            }
            setSkipHover(true);
            if (e.pointerType === 'touch') {
              longPressTimer.current = setTimeout(() => {
                wasLongPress.current = true;
                if (!disabled) toggle(index);
              }, 500);
            }
          }}
          onPointerUp={() => {
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            wasLongPress.current = false;
            disableHoverUntilMove();
          }}
          onPointerLeave={() => {
            if (hoverTimer.current) {
              clearTimeout(hoverTimer.current);
              hoverTimer.current = null;
            }
            if (moveHandler.current) {
              window.removeEventListener('pointermove', moveHandler.current);
              moveHandler.current = null;
            }
            setSkipHover(false);
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            wasLongPress.current = false;
          }}
          onPointerCancel={() => {
            if (hoverTimer.current) {
              clearTimeout(hoverTimer.current);
              hoverTimer.current = null;
            }
            if (moveHandler.current) {
              window.removeEventListener('pointermove', moveHandler.current);
              moveHandler.current = null;
            }
            setSkipHover(false);
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            wasLongPress.current = false;
          }}
          $padV={padV}
          $open={isOpen}
          $primary={theme.colors.primary}
          $disabledColor={disabledColor}
          $highlight={highlight}
          $hoverBg={hoverBg}
          $shift={shift}
          $skipHover={skipHover}
        >
          {typeof header === 'string' || typeof header === 'number' ? (
            <Typography
              variant='h4'
              noSelect
            >
              {header}
            </Typography>
          ) : (
            header
          )}
          <Chevron
            aria-hidden
            $open={isOpen}
            viewBox='0 0 24 24'
          >
            <path
              d='M6 9l6 6 6-6'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </Chevron>
        </HeaderBtn>
      </HeaderTag>

      <Content
        role='region'
        id={panelId}
        aria-labelledby={headerId}
        $open={isOpen}
        $height={height}
        $reduced={reducedMotion}
      >
        {shouldRenderContent && (
          <div
            ref={contentRef}
            style={{ padding: `${theme.spacing(1.5)} 0` }}
          >
            {children}
          </div>
        )}
      </Content>
    </ItemWrapper>
  );
};
AccordionItem.displayName = 'Accordion.Item';
Accordion.Item = AccordionItem;

/*───────────────────────────────────────────────────────────*/
export default Accordion;
