// ─────────────────────────────────────────────────────────────
// src/components/layout/Tabs.tsx | valet
// spacing refactor: container pad + gap; rem→spacing – 2025‑08‑12
// patched: replace centered with Box-like alignX (no alias) – 2025‑08‑20
// patched: horizontal overflow scroll + drag with styled scrollbar – 2025‑08‑21
// ─────────────────────────────────────────────────────────────
/* eslint-disable react/prop-types */
import React, {
  createContext,
  forwardRef,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { Tooltip } from '../widgets/Tooltip';
import type { Presettable, SpacingProps, Sx } from '../../types';
import { Typography } from '../primitives/Typography';
import { resolveSpace } from '../../utils/resolveSpace';
import { withAlpha } from '../../helpers/color';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
interface Ctx {
  active: number;
  setActive: (i: number) => void;
  orientation: 'horizontal' | 'vertical';
  registerTab: (i: number, el: HTMLButtonElement | null) => void;
  totalTabs: number;
  placement: 'top' | 'bottom' | 'left' | 'right';
}
const TabsCtx = createContext<Ctx | null>(null);
const useTabs = () => {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error('Tabs.Tab / Tabs.Panel must be inside <Tabs>');
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
  $scrollbarH?: string;
  $thumb?: string;
  $track?: string;
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
      ? `padding-right: ${$edgeGap};`
      : ''}

  /* Aesthetic horizontal scrollbar styling */
  &::-webkit-scrollbar {
    /* Hover-reveal scrollbar: default hidden, visible on hover */
    height: var(--_sb-h, 0px);
  }
  &::-webkit-scrollbar-track {
    background: ${({ $track }) => $track ?? 'transparent'};
    border-radius: 999px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ $thumb }) => $thumb ?? 'rgba(127,127,127,0.35)'};
    border-radius: 999px;
    border: 2px solid transparent;
    background-clip: content-box;
  }
  /* Firefox */
  scrollbar-width: none;
  ${({ $thumb, $track }) =>
    $thumb || $track
      ? `
    &:hover{ scrollbar-width: thin; scrollbar-color: ${$thumb ?? '#808080'} ${$track ?? 'transparent'}; }
  `
      : `
    &:hover{ scrollbar-width: thin; }
  `}

  /* set hover height var */
  --_sb-hover-h: ${({ $scrollbarH }) => $scrollbarH ?? '8px'};
  &:hover {
    --_sb-h: var(--_sb-hover-h);
  }

  /* Fading edges to imply overflow */
  &::before,
  &::after {
    content: '';
    position: sticky;
    top: 0;
    bottom: 0;
    width: 24px;
    pointer-events: none;
    z-index: 1;
  }
  &::before {
    left: 0;
    display: ${({ $fadeLeft }) => ($fadeLeft ? 'block' : 'none')};
    background: linear-gradient(
      to right,
      ${({ $fadeCol }) => $fadeCol ?? 'rgba(0,0,0,0.18)'},
      rgba(0, 0, 0, 0)
    );
  }
  &::after {
    right: 0;
    display: ${({ $fadeRight }) => ($fadeRight ? 'block' : 'none')};
    background: linear-gradient(
      to left,
      ${({ $fadeCol }) => $fadeCol ?? 'rgba(0,0,0,0.18)'},
      rgba(0, 0, 0, 0)
    );
  }
`;

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
    outline: var(--valet-focus-width, 2px) solid ${({ $primary }) => $primary};
    outline-offset: var(--valet-focus-offset, 2px);
  }

  &::after {
    content: '';
    position: absolute;
    ${({ $orient, $place, $barW }) =>
      $orient === 'horizontal'
        ? `left: 0; right: 0; bottom: calc(-0.5 * var(--valet-underline-width, ${$barW})); height: var(--valet-underline-width, ${$barW});`
        : $place === 'left'
          ? `top: 0; bottom: 0; left: calc(-0.5 * var(--valet-underline-width, ${$barW})); width: var(--valet-underline-width, ${$barW});`
          : `top: 0; bottom: 0; right: calc(-0.5 * var(--valet-underline-width, ${$barW})); width: var(--valet-underline-width, ${$barW});`}
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
    Pick<SpacingProps, 'gap' | 'pad' | 'compact'> {
  active?: number;
  defaultActive?: number;
  onTabChange?: (i: number) => void;
  orientation?: 'horizontal' | 'vertical';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** Horizontal alignment of the tab strip (horizontal orientation). */
  alignX?: 'left' | 'right' | 'center' | 'centered';
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}
export interface TabProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, Presettable {
  index?: number;
  label?: ReactNode;
  tooltip?: ReactNode;
}
export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  index?: number;
  keepMounted?: boolean;
}

/*───────────────────────────────────────────────────────────*/
export const Tabs: React.FC<TabsProps> & {
  Tab: React.FC<TabProps>;
  Panel: React.FC<TabPanelProps>;
} = ({
  active: controlledActive,
  defaultActive = 0,
  orientation = 'horizontal',
  placement: placementProp,
  onTabChange,
  alignX,
  gap: gapProp,
  pad: padProp,
  compact = false,
  preset: p,
  className,
  children,
  sx,
  ...divProps
}) => {
  const { theme } = useTheme();
  const placement = placementProp ?? (orientation === 'horizontal' ? 'top' : 'left');

  const controlled = controlledActive !== undefined;
  const [self, setSelf] = useState(defaultActive);
  const active = controlled ? controlledActive! : self;

  const refs = useRef<Record<number, HTMLButtonElement | null>>({});
  const registerTab = useCallback((i: number, el: HTMLButtonElement | null) => {
    refs.current[i] = el;
  }, []);
  const setActive = useCallback(
    (i: number) => {
      if (!controlled) setSelf(i);
      onTabChange?.(i);
      refs.current[i]?.focus();
    },
    [controlled, onTabChange],
  );

  const tabs: ReactElement[] = [];
  const panels: ReactElement[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const name =
      typeof child.type === 'string'
        ? child.type
        : (child.type as { displayName?: string }).displayName;

    if (name === 'Tabs.Tab') {
      const el = child as React.ReactElement<TabProps>;
      tabs.push(
        React.cloneElement(el, {
          index: tabs.length,
          key: tabs.length,
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

  const ctx = useMemo<Ctx>(
    () => ({
      active,
      setActive,
      orientation,
      registerTab,
      totalTabs: tabs.length,
      placement,
    }),
    [active, orientation, placement, setActive, registerTab, tabs.length],
  );

  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ');
  const gap = resolveSpace(gapProp, theme, compact, 1);
  const pad = resolveSpace(padProp, theme, compact, 1);
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
  const normalizedAlign: 'left' | 'right' | 'center' = (() => {
    const raw = (alignX ?? 'left') as 'left' | 'right' | 'center' | 'centered';
    return raw === 'centered' ? 'center' : (raw as 'left' | 'right' | 'center');
  })();

  return (
    <TabsCtx.Provider value={ctx}>
      <Root
        {...divProps}
        $orientation={orientation}
        $placement={placement}
        $gap={gap}
        $pad={pad}
        className={cls}
        style={sx}
      >
        {stripFirst && (
          <TabList
            ref={listRef}
            $orientation={orientation}
            $place={placement}
            $edgeGap={edgeGap}
            $align={normalizedAlign}
            $fadeLeft={fadeL}
            $fadeRight={fadeR}
            $scrollbarH={theme.stroke(5)}
            $thumb={withAlpha(theme.colors.primary, 0.5)}
            $track={withAlpha(theme.colors.text, 0.06)}
            $fadeCol={withAlpha(theme.colors.text, 0.18)}
            $overflow={overflowing}
          >
            {tabs}
          </TabList>
        )}

        <Panel>{panels}</Panel>

        {!stripFirst && (
          <TabList
            ref={listRef}
            $orientation={orientation}
            $place={placement}
            $edgeGap={edgeGap}
            $align={normalizedAlign}
            $fadeLeft={fadeL}
            $fadeRight={fadeR}
            $scrollbarH={theme.stroke(5)}
            $thumb={withAlpha(theme.colors.primary, 0.5)}
            $track={withAlpha(theme.colors.text, 0.06)}
            $fadeCol={withAlpha(theme.colors.text, 0.18)}
            $overflow={overflowing}
          >
            {tabs}
          </TabList>
        )}
      </Root>
    </TabsCtx.Provider>
  );
};

/*───────────────────────────────────────────────────────────*/
const Tab: React.FC<TabProps> = forwardRef<HTMLButtonElement, TabProps>(
  ({ index = 0, label, tooltip, preset: p, className, onKeyDown, onClick, ...rest }, ref) => {
    const { theme } = useTheme();
    const { active, setActive, orientation, registerTab, totalTabs, placement } = useTabs();
    const selected = active === index;

    const nav = (e: KeyboardEvent<HTMLButtonElement>) => {
      const horiz = orientation === 'horizontal';
      const prev = horiz ? 'ArrowLeft' : 'ArrowUp';
      const next = horiz ? 'ArrowRight' : 'ArrowDown';
      if (e.key === prev || e.key === next) {
        e.preventDefault();
        setActive((active + (e.key === next ? 1 : -1) + totalTabs) % totalTabs);
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
        id={`tab-${index}`}
        aria-selected={selected}
        aria-controls={`panel-${index}`}
        tabIndex={selected ? 0 : -1}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          setActive(index);
          onClick?.(e);
        }}
        onKeyDown={nav}
        $active={selected}
        $primary={theme.colors.primary}
        $orient={orientation}
        $place={placement}
        $padV={theme.spacing(2)}
        $padH={theme.spacing(3)}
        $barW={theme.stroke(2)}
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
  const { active } = useTabs();
  if (active !== index && !keepMounted) return null;

  return (
    <div
      {...rest}
      role='tabpanel'
      id={`panel-${index}`}
      aria-labelledby={`tab-${index}`}
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
