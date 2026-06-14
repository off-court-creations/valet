// ─────────────────────────────────────────────────────────────
// src/components/layout/Tabs.tsx | valet
// spacing refactor: container pad + gap; rem→spacing – 2025‑08‑12
// patched: replace centered with Box-like alignX (no alias) – 2025‑08‑20
// patched: horizontal overflow scroll + drag with styled scrollbar – 2025‑08‑21
// ─────────────────────────────────────────────────────────────

import React, {
  createContext,
  forwardRef,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { Tooltip } from '../widgets/Tooltip';
import type { Presettable, SpacingProps, Sx } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';
import { Typography } from '../primitives/Typography';
import { resolveSpace } from '../../utils/resolveSpace';
import { withAlpha } from '../../helpers/color';
import { valetError } from '../../system/devErrors';
import { useControlledState } from '../../hooks/useControlledState';
import { CompactCtx, useCompact } from '../../system/compactContext';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
interface Ctx {
  activeIndex: number;
  /** `source` is the honest activation origin (ruling R10): a tab click is
      `'pointer'` (synthetic detail-0 clicks from keyboard activation map to
      `'keyboard'`), arrow-key navigation is `'keyboard'`. */
  setActiveIndex: (i: number, source: InputSource, phase?: 'input' | 'commit') => void;
  orientation: 'horizontal' | 'vertical';
  registerTab: (i: number, el: HTMLButtonElement | null) => void;
  totalTabs: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
  /** `useId()`-derived prefix (A11Y S6): tab/panel DOM ids are namespaced
      per <Tabs> instance so `id`/`aria-controls`/`aria-labelledby` never
      collide when two Tabs render on the same page. */
  idBase: string;
}
const TabsCtx = createContext<Ctx | null>(null);
const useTabs = () => {
  const ctx = useContext(TabsCtx);
  if (!ctx)
    throw valetError(
      'Tabs',
      '<Tabs.Tab> / <Tabs.Panel> must be inside <Tabs> — they read the active index from its context. Move them under a <Tabs> parent.',
      'tabs-demo',
    );
  return ctx;
};

/*───────────────────────────────────────────────────────────*/
/* Grid container                                            */
const Root = styled('div')<{
  $orientation: 'horizontal' | 'vertical';
  $placement: 'top' | 'bottom' | 'left' | 'right';
  $gap: string;
  $pad: string;
}>`
  width: 100%;
  display: grid;
  padding: ${({ $pad }) => $pad};

  ${({ $orientation, $gap }) =>
    $orientation === 'horizontal' ? `row-gap: ${$gap};` : `column-gap: ${$gap};`}

  ${({ $orientation, $placement }) =>
    $orientation === 'horizontal'
      ? `
    /* rows: tab-strip + panel */
    grid-template-rows: ${$placement === 'top' ? 'auto 1fr' : '1fr auto'};
  `
      : `
    /* cols: tab-strip + panel */
    grid-template-columns: ${$placement === 'left' ? 'max-content 1fr' : '1fr max-content'};
    align-items: start; /* keep panel aligned to top of tabs */
  `}
`;

/*───────────────────────────────────────────────────────────*/
const TabList = styled('div')<{
  $orientation: 'horizontal' | 'vertical';
  $align: 'left' | 'right' | 'center';
  $place: 'top' | 'bottom' | 'left' | 'right';
  $edgeGap?: string;
  $fadeLeft?: boolean;
  $fadeRight?: boolean;
  $fadeCol?: string;
  $overflow?: boolean;
}>`
  /* Ensure horizontal tab strip takes the full grid track width */
  ${({ $orientation }) => ($orientation === 'horizontal' ? 'width: 100%;' : '')}

  /* Always render as a single-row flex strip; enable horizontal scrolling */
  display: flex;
  flex-direction: ${({ $orientation }) => ($orientation === 'vertical' ? 'column' : 'row')};
  gap: 0;

  /* Horizontal scrolling behavior with smooth momentum */
  ${({ $orientation }) =>
    $orientation === 'horizontal'
      ? `
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
    position: relative;
    /* Improve drag hint */
    cursor: grab;
  `
      : ''}

  /* No extra padding for custom scrollbar; gradients imply overflow */

  ${({ $orientation, $align, $overflow }) => {
    if ($orientation === 'vertical') {
      // For vertical tabs, treat center as vertical centering for parity with before.
      return $align === 'center'
        ? 'align-self: stretch; height: 100%; justify-content: center;'
        : 'width: max-content;';
    }
    // Horizontal alignment for non-wrapping mode
    // If the strip overflows, force flex-start to avoid negative scroll origins
    // that can clip the leftmost tab off-screen.
    if ($overflow) return 'justify-content: flex-start;';
    if ($align === 'right') return 'justify-content: flex-end;';
    if ($align === 'center') return 'justify-content: center;';
    return '';
  }}

  /* Extra breathing room for right-placed vertical tabs:
     push the indicator away from the container edge */
  ${({ $orientation, $place, $edgeGap }) =>
    $orientation === 'vertical' && $place === 'right' && $edgeGap
      ? /* rtl: physical-by-design — gap pushes the indicator off the physical $place='right' container edge */
        `padding-right: ${$edgeGap};`
      : ''}

  /* Hide native scrollbars for a clean gradient-only affordance */
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none; /* Firefox */

  /* Fading edges to imply overflow */
  /* Edge fades handled by outer wrapper for broader compatibility */
`;

/* Wrapper that hosts non-scrolling edge fades so they stay pinned */
const TabStripWrap = styled('div')<{
  $fadeLeft?: boolean;
  $fadeRight?: boolean;
  $fadeCol?: string;
  $dur?: string;
  $ease?: string;
  $slide?: string;
}>`
  position: relative;
  width: 100%;
  overflow: hidden;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 40px;
    pointer-events: none;
    z-index: 5;
    transition:
      opacity ${({ $dur }) => $dur ?? '160ms'}
        ${({ $ease }) => $ease ?? 'cubic-bezier(0.2, 0.7, 0.1, 1)'},
      transform ${({ $dur }) => $dur ?? '160ms'}
        ${({ $ease }) => $ease ?? 'cubic-bezier(0.2, 0.7, 0.1, 1)'};
    will-change: opacity, transform;
  }
  &::before {
    left: 0; /* rtl: physical-by-design — horizontal-scroll overflow fade pinned to the physical scroll origin */
    opacity: ${({ $fadeLeft }) => ($fadeLeft ? 1 : 0)};
    transform: translateX(${({ $fadeLeft, $slide }) => ($fadeLeft ? '0' : `-${$slide ?? '8px'}`)});
    background: linear-gradient(
      to left,
      rgba(0, 0, 0, 0) 0%,
      ${({ $fadeCol }) => ($fadeCol ? withAlpha($fadeCol, 0.35) : 'rgba(0,0,0,0.35)')} 60%,
      ${({ $fadeCol }) => ($fadeCol ? withAlpha($fadeCol, 0.5) : 'rgba(0,0,0,0.5)')} 100%
    );
  }
  &::after {
    right: 0; /* rtl: physical-by-design — horizontal-scroll overflow fade pinned to the physical scroll end */
    opacity: ${({ $fadeRight }) => ($fadeRight ? 1 : 0)};
    transform: translateX(${({ $fadeRight, $slide }) => ($fadeRight ? '0' : `${$slide ?? '8px'}`)});
    background: linear-gradient(
      to right,
      rgba(0, 0, 0, 0) 0%,
      ${({ $fadeCol }) => ($fadeCol ? withAlpha($fadeCol, 0.35) : 'rgba(0,0,0,0.35)')} 60%,
      ${({ $fadeCol }) => ($fadeCol ? withAlpha($fadeCol, 0.5) : 'rgba(0,0,0,0.5)')} 100%
    );
  }
`;

/* Custom scroll hint removed: edge fades imply scrollability */

/*───────────────────────────────────────────────────────────*/
/* Added -webkit-tap-highlight-color + touch-action to kill blue flash
   Flex no-shrink is critical: it preserves intrinsic tab widths so text
   stays on one line while the container scrolls horizontally. */
const TabBtn = styled('button')<{
  $active: boolean;
  $primary: string;
  $orient: 'horizontal' | 'vertical';
  $place: 'top' | 'bottom' | 'left' | 'right';
  $padV: string;
  $padH: string;
  $barW: string;
}>`
  /* Do not let tabs shrink in the horizontal strip; size to content */
  flex: 0 0 auto;
  flex-shrink: 0;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
  cursor: pointer;
  appearance: none;

  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  ${({ $orient }) => ($orient === 'vertical' ? 'width: 100%;' : 'min-width: 4rem;')}

  position: relative;
  text-align: center;
  white-space: nowrap; /* keep labels on one line for reliable wrap behavior */

  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid
      var(--valet-focus-ring-color, ${({ $primary }) => $primary});
    outline-offset: var(--valet-focus-offset, 2px);
  }

  &::after {
    content: '';
    position: absolute;
    ${({ $orient, $place, $barW }) =>
      $orient === 'horizontal'
        ? `inset-inline: 0; bottom: calc(-0.5 * var(--valet-underline-width, ${$barW})); height: var(--valet-underline-width, ${$barW});`
        : // vertical strip indicator hugs the physical $place edge (left/right placement is physical, not inline)
          $place === 'left'
          ? /* rtl: physical-by-design */ `top: 0; bottom: 0; left: calc(-0.5 * var(--valet-underline-width, ${$barW})); width: var(--valet-underline-width, ${$barW});`
          : /* rtl: physical-by-design */ `top: 0; bottom: 0; right: calc(-0.5 * var(--valet-underline-width, ${$barW})); width: var(--valet-underline-width, ${$barW});`}
    background: ${({ $primary, $active }) => ($active ? $primary : 'transparent')};
    transition: background 150ms ease;
  }
`;

const Panel = styled('div')`
  padding: 0;

  /* Strictly vertical scrolling */
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE & Edge */
  &::-webkit-scrollbar {
    display: none;
  }

  box-sizing: border-box;
  min-height: 0;
  max-height: 100%;
  max-width: 100%;
`;

/*───────────────────────────────────────────────────────────*/
export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'style'>,
    Presettable,
    Pick<SpacingProps, 'gap' | 'pad' | 'compact' | 'density'> {
  value?: string | number;
  defaultValue?: string | number;
  /** Canonical value trio (API-TYPES S4 / ruling R10): the inline lookalike
      payloads were replaced with {@link OnValueChange}/{@link OnValueCommit},
      so `info` is now the full {@link ChangeInfo} — including the honest
      `source` (tab click ⇒ `'pointer'`, arrow-key nav ⇒ `'keyboard'`). */
  onValueChange?: OnValueChange<string | number>;
  onValueCommit?: OnValueCommit<string | number>;
  orientation?: 'horizontal' | 'vertical';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Horizontal alignment of the tab strip (horizontal orientation). */
  alignX?: 'left' | 'right' | 'center';
  /** Alias for alignX for clarity. */
  tabAlign?: 'left' | 'right' | 'center';
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}
export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, Presettable {
  index?: number;
  value?: string | number;
  label?: ReactNode;
  tooltip?: ReactNode;
}
export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  index?: number;
  value?: string | number;
  keepMounted?: boolean;
}

/*───────────────────────────────────────────────────────────*/
const TabsBase = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      value: valueProp,
      defaultValue,
      orientation = 'horizontal',
      placement: placementProp,
      onValueChange,
      onValueCommit,
      alignX,
      tabAlign,
      gap: gapProp,
      pad: padProp,
      compact,
      density,
      preset: p,
      className,
      children,
      sx,
      ...divProps
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const placement = placementProp ?? (orientation === 'horizontal' ? 'top' : 'left');
    /* Per-instance id namespace (A11Y S6). `useId()` returns a stable,
       SSR-safe, collision-free token; sanitise its `:` delimiters so the
       resulting ids stay valid CSS selectors for downstream tooling. */
    const rawId = useId();
    const idBase = `valet-tabs-${rawId.replace(/:/g, '')}`;

    /* Controlled/uncontrolled value tracking via the shared hook
       (ruling R9/R13). Tabs is NOT a form field, so it uses
       `useControlledState` rather than `useFieldState`. The hook owns
       the single definition of "controlled" (value !== undefined,
       latched at mount, dev-warn-once on a post-mount flip), replacing
       the old hand-rolled `initialCtl` guard. Tabs layers its own
       richer event semantics (previousValue + phase) on top in
       `setActiveIndex`, so it does NOT hand its callbacks to the hook. */
    const [currentValue, setCurrentValue] = useControlledState<string | number | undefined>(
      valueProp,
      defaultValue,
      undefined,
      'Tabs',
    );

    const refs = useRef<Record<number, HTMLButtonElement | null>>({});
    const registerTab = useCallback((i: number, el: HTMLButtonElement | null) => {
      refs.current[i] = el;
    }, []);

    /* Build tabs / panels / values BEFORE deriving activeIndex so
       `value` / `defaultValue` resolve on the very first render.
       (Previously the values lived in a ref populated later in the
       render body; the first paint always showed tab 0 — masked in
       dev by StrictMode's double render.) */
    const tabs: ReactElement[] = [];
    const panels: ReactElement[] = [];
    const values: (string | number)[] = [];
    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const name =
        typeof child.type === 'string'
          ? child.type
          : (child.type as { displayName?: string }).displayName;

      if (name === 'Tabs.Tab') {
        const el = child as React.ReactElement<TabProps>;
        const i = tabs.length;
        const childValue = el.props.value ?? el.props.index ?? i;
        values.push(childValue as string | number);
        tabs.push(
          React.cloneElement(el, {
            index: i,
            value: childValue,
            key: i,
          }),
        );
      }
      if (name === 'Tabs.Panel') {
        const el = child as React.ReactElement<TabPanelProps>;
        panels.push(
          React.cloneElement(el, {
            index: panels.length,
            key: panels.length,
          }),
        );
      }
    });

    const activeIndexFromValue = (val: string | number | undefined) => {
      if (val == null) return 0;
      const idx = values.findIndex((v) => v === val);
      return idx >= 0 ? idx : 0;
    };
    /* `currentValue` is the hook's resolved value: the latched-controlled
       `value` prop, or internal state when uncontrolled. The first paint
       sees the correct value because `values` is built above before this
       line (Wave-0.3 first-render fix — tabValuesRef is never read here). */
    const activeIndex = activeIndexFromValue(currentValue);

    /* Event handlers need the latest values without re-memoising on
       every render; sync the ref in an effect — it is never read or
       mutated during render. */
    const tabValuesRef = useRef<(string | number)[]>([]);
    useEffect(() => {
      tabValuesRef.current = values;
    });
    const setActiveIndex = useCallback(
      (i: number, source: InputSource, phase: 'input' | 'commit' = 'commit') => {
        const nextVal = tabValuesRef.current[i];
        const prevVal = currentValue;
        /* `setCurrentValue` is a state no-op while controlled (the hook
           never mutates internal state in that mode), so this is safe to
           call unconditionally — it mirrors the old `if (!controlled)`. */
        setCurrentValue(nextVal);
        /* Canonical ChangeInfo trio (API-TYPES S4 / ruling R10). `source` is
           the honest activation origin supplied by each Tab handler. */
        const info: ChangeInfo<string | number> = {
          previousValue: prevVal,
          phase: 'input',
          source,
        };
        onValueChange?.(nextVal, info);
        if (phase === 'commit') onValueCommit?.(nextVal, { ...info, phase: 'commit' });
        refs.current[i]?.focus();
      },
      [setCurrentValue, onValueChange, onValueCommit, currentValue],
    );

    const ctx = useMemo<Ctx>(
      () => ({
        activeIndex,
        setActiveIndex,
        orientation,
        registerTab,
        totalTabs: tabs.length,
        placement,
        idBase,
      }),
      [activeIndex, orientation, placement, setActiveIndex, registerTab, tabs.length, idBase],
    );

    const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ');
    const effectiveCompact = useCompact(compact);
    const gap = resolveSpace(gapProp, theme, effectiveCompact, 1);
    const pad = resolveSpace(padProp, theme, effectiveCompact, 1);
    /* V1 density-scales-the-subtree: when density is explicitly provided,
       set --valet-space locally so the strip/panel (and descendants)
       scale. density never zeroes — that is compact's job. */
    const densityScale =
      density === 'comfortable'
        ? 1.15
        : density === 'tight'
          ? 0.9
          : density === 'standard'
            ? 1.0
            : undefined;
    const stripFirst =
      (orientation === 'horizontal' && placement === 'top') ||
      (orientation === 'vertical' && placement === 'left');
    const edgeGap = theme.spacing(1);

    // Horizontal overflow handling and UX affordances
    const listRef = useRef<HTMLDivElement | null>(null);
    const [fadeL, setFadeL] = useState(false);
    const [fadeR, setFadeR] = useState(false);
    const [overflowing, setOverflowing] = useState(false);

    useEffect(() => {
      // Manage overflow fades based on scroll position
      const el = listRef.current;
      if (!el || orientation !== 'horizontal') {
        setFadeL(false);
        setFadeR(false);
        return;
      }
      const update = () => {
        const ov = el.scrollWidth > el.clientWidth + 1;
        setOverflowing(ov);
        const canL = el.scrollLeft > 0;
        const canR = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
        setFadeL(canL);
        setFadeR(canR);
      };
      update();
      const onScroll = () => update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      el.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', update);
      return () => {
        ro.disconnect();
        el.removeEventListener('scroll', onScroll as EventListener);
        window.removeEventListener('resize', update);
      };
    }, [orientation, tabs.length]);

    // When becoming overflowing, reset scroll to show the first tab
    useEffect(() => {
      const el = listRef.current;
      if (!el || orientation !== 'horizontal') return;
      if (overflowing) {
        el.scrollLeft = 0;
      }
    }, [overflowing, orientation]);

    // Drag-to-scroll behaviour for the horizontal strip
    useEffect(() => {
      const el = listRef.current;
      if (!el || orientation !== 'horizontal') return;

      let dragging = false;
      let maybeDrag = false;
      let moved = false;
      let startX = 0;
      let startScroll = 0;

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return; // only primary
        if (el.scrollWidth <= el.clientWidth + 1) return; // no overflow

        // Ignore pointer downs in the scrollbar hover band to prevent
        // fighting with the native scrollbar interaction.
        const rect = el.getBoundingClientRect();
        const scrollbarBandPx = 24; // conservative band to match hover-reveal height
        const inScrollbar = e.clientY >= rect.bottom - scrollbarBandPx;
        if (inScrollbar) return;

        maybeDrag = true;
        moved = false;
        startX = e.clientX;
        startScroll = el.scrollLeft;
      };
      const onPointerMove = (e: PointerEvent) => {
        if (!maybeDrag && !dragging) return;
        const dx = e.clientX - startX;
        if (!dragging) {
          if (Math.abs(dx) <= 5) return; // threshold before initiating drag
          dragging = true;
          el.setPointerCapture?.(e.pointerId);
          el.style.cursor = 'grabbing';
        }
        moved = true;
        el.scrollLeft = startScroll - dx;
        e.preventDefault();
      };
      const endDrag = (e: PointerEvent) => {
        if (!maybeDrag && !dragging) return;
        maybeDrag = false;
        if (!dragging) return;
        dragging = false;
        el.releasePointerCapture?.(e.pointerId);
        el.style.cursor = '';
      };
      const onClickCapture = (e: MouseEvent) => {
        // If we moved during this pointer interaction, swallow the click
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
          moved = false;
        }
      };

      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', endDrag);
      el.addEventListener('pointercancel', endDrag);
      el.addEventListener('click', onClickCapture, true);
      const onWheel = (e: WheelEvent) => {
        if (el.scrollWidth <= el.clientWidth) return; // no overflow
        // Convert vertical wheel to horizontal scroll for mouse users
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
          e.preventDefault();
          e.stopPropagation();
          el.scrollLeft += e.deltaY;
        }
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => {
        el.removeEventListener('pointerdown', onPointerDown);
        el.removeEventListener('pointermove', onPointerMove);
        el.removeEventListener('pointerup', endDrag);
        el.removeEventListener('pointercancel', endDrag);
        el.removeEventListener('click', onClickCapture, true);
        el.removeEventListener('wheel', onWheel as unknown as EventListener);
      };
    }, [orientation]);

    // Normalize alignX with Box semantics.
    // Note: alignment resolved inline when rendering TabList via (tabAlign ?? alignX ?? 'left')

    // Root ref + focusable contract: focusing Tabs focuses the active tab button.
    const rootRef = useRef<HTMLDivElement | null>(null);
    const setRootRef = useCallback(
      (node: HTMLDivElement | null) => {
        rootRef.current = node;
        if (!ref) return;
        if (typeof ref === 'function') ref(node);
        else (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref],
    );

    return (
      <TabsCtx.Provider value={ctx}>
        <Root
          {...divProps}
          ref={setRootRef}
          tabIndex={-1}
          data-valet-component='Tabs'
          $orientation={orientation}
          $placement={placement}
          $gap={gap}
          $pad={pad}
          className={cls}
          style={
            densityScale != null
              ? { ...sx, '--valet-space': `calc(${theme.spacingUnit} * ${densityScale})` }
              : sx
          }
          onFocus={(e) => {
            // Only redirect focus when the root itself receives focus.
            // Do NOT hijack focus when a child within the tabs (e.g., inputs, buttons)
            // is focused, otherwise the page may scroll to the tab strip.
            if (e.target === e.currentTarget) {
              const btn = refs.current[activeIndex];
              try {
                // Prevent scroll jumping when moving focus to the active tab
                (btn as unknown as HTMLElement | undefined)?.focus?.({
                  preventScroll: true,
                } as FocusOptions);
              } catch {
                btn?.focus();
              }
            }
          }}
        >
          <CompactCtx.Provider value={effectiveCompact}>
            {stripFirst && (
              <TabStripWrap
                $fadeLeft={fadeL}
                $fadeRight={fadeR}
                $fadeCol={theme.colors.primary}
                $dur={theme.motion.duration.xlong}
                $ease={theme.motion.easing.emphasized}
                $slide={theme.spacing(2)}
              >
                <TabList
                  ref={listRef}
                  role='tablist'
                  aria-orientation={orientation}
                  $orientation={orientation}
                  $place={placement}
                  $edgeGap={edgeGap}
                  $align={(tabAlign ?? alignX ?? 'left') as 'left' | 'right' | 'center'}
                  $fadeLeft={fadeL}
                  $fadeRight={fadeR}
                  $fadeCol={theme.colors.primary}
                  $overflow={overflowing}
                >
                  {tabs}
                </TabList>
                {/* Custom scroll hint removed */}
              </TabStripWrap>
            )}

            <Panel>{panels}</Panel>

            {!stripFirst && (
              <TabStripWrap
                $fadeLeft={fadeL}
                $fadeRight={fadeR}
                $fadeCol={theme.colors.primary}
                $dur={theme.motion.duration.xlong}
                $ease={theme.motion.easing.emphasized}
                $slide={theme.spacing(2)}
              >
                <TabList
                  ref={listRef}
                  role='tablist'
                  aria-orientation={orientation}
                  $orientation={orientation}
                  $place={placement}
                  $edgeGap={edgeGap}
                  $align={(tabAlign ?? alignX ?? 'left') as 'left' | 'right' | 'center'}
                  $fadeLeft={fadeL}
                  $fadeRight={fadeR}
                  $fadeCol={theme.colors.primary}
                  $overflow={overflowing}
                >
                  {tabs}
                </TabList>
                {/* Custom scroll hint removed */}
              </TabStripWrap>
            )}
          </CompactCtx.Provider>
        </Root>
      </TabsCtx.Provider>
    );
  },
);

TabsBase.displayName = 'Tabs';

export const Tabs = TabsBase as unknown as React.FC<TabsProps> & {
  Tab: React.FC<TabProps>;
  Panel: React.FC<TabPanelProps>;
};

/*───────────────────────────────────────────────────────────*/
const Tab: React.FC<TabProps> = forwardRef<HTMLButtonElement, TabProps>(
  ({ index = 0, label, tooltip, preset: p, className, onKeyDown, onClick, ...rest }, ref) => {
    const { theme } = useTheme();
    const { activeIndex, setActiveIndex, orientation, registerTab, totalTabs, placement, idBase } =
      useTabs();
    const selected = activeIndex === index;

    const nav = (e: KeyboardEvent<HTMLButtonElement>) => {
      const horiz = orientation === 'horizontal';
      const prev = horiz ? 'ArrowLeft' : 'ArrowUp';
      const next = horiz ? 'ArrowRight' : 'ArrowDown';
      if (e.key === prev || e.key === next) {
        e.preventDefault();
        setActiveIndex(
          (activeIndex + (e.key === next ? 1 : -1) + totalTabs) % totalTabs,
          'keyboard',
        );
      }
      onKeyDown?.(e);
    };

    const content = label ?? rest.children;

    const btn = (
      <TabBtn
        {...rest}
        ref={(el: HTMLButtonElement | null) => {
          registerTab(index, el);
          if (typeof ref === 'function') ref(el);
          else if (ref) {
            (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
          }
        }}
        role='tab'
        id={`${idBase}-tab-${index}`}
        aria-selected={selected}
        aria-controls={`${idBase}-panel-${index}`}
        tabIndex={selected ? 0 : -1}
        data-state={selected ? 'active' : 'inactive'}
        data-selected={selected ? 'true' : 'false'}
        data-disabled={(rest as Record<string, unknown>)['disabled'] ? 'true' : 'false'}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          /* Honest source (ruling R10): a synthesized click from keyboard
             activation (Space/Enter on the focused tab) carries detail 0;
             a genuine pointer press carries detail >= 1. */
          setActiveIndex(index, e.detail === 0 ? 'keyboard' : 'pointer');
          onClick?.(e);
        }}
        onKeyDown={nav}
        $active={selected}
        $primary={theme.colors.primary}
        $orient={orientation}
        $place={placement}
        $padV={theme.spacing(2)}
        $padH={theme.spacing(3)}
        $barW={theme.stroke(4)}
        className={[p ? preset(p) : '', className].filter(Boolean).join(' ')}
      >
        {typeof content === 'string' || typeof content === 'number' ? (
          <Typography
            variant='button'
            noSelect
          >
            {content}
          </Typography>
        ) : (
          content
        )}
      </TabBtn>
    );

    return tooltip ? <Tooltip title={tooltip}>{btn}</Tooltip> : btn;
  },
);
Tab.displayName = 'Tabs.Tab';

/*───────────────────────────────────────────────────────────*/
const TabPanel: React.FC<TabPanelProps> = ({
  index = 0,
  keepMounted = false,
  preset: p,
  className,
  children,
  ...rest
}) => {
  const { activeIndex, idBase } = useTabs();
  if (activeIndex !== index && !keepMounted) return null;

  return (
    <div
      {...rest}
      role='tabpanel'
      id={`${idBase}-panel-${index}`}
      aria-labelledby={`${idBase}-tab-${index}`}
      className={[p ? preset(p) : '', className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
};
TabPanel.displayName = 'Tabs.Panel';

/*───────────────────────────────────────────────────────────*/
Tabs.Tab = Tab;
Tabs.Panel = TabPanel;

export default Tabs;
