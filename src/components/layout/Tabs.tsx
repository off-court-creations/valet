// ─────────────────────────────────────────────────────────────
// src/components/layout/Tabs.tsx | valet
// spacing refactor: container pad + gap; rem→spacing – 2025‑08‑12
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
  $center?: boolean;
  $place: 'top' | 'bottom' | 'left' | 'right';
  $edgeGap?: string;
}>`
  display: flex;
  flex-direction: ${({ $orientation }) => ($orientation === 'vertical' ? 'column' : 'row')};
  gap: 0;

  ${({ $orientation, $center }) => {
    if ($orientation === 'vertical')
      return $center
        ? 'align-self: stretch; height: 100%; justify-content: center;'
        : 'width: max-content;';
    return $center ? 'justify-content: center;' : '';
  }}

  /* Extra breathing room for right-placed vertical tabs:
     push the indicator away from the container edge */
  ${({ $orientation, $place, $edgeGap }) =>
    $orientation === 'vertical' && $place === 'right' && $edgeGap
      ? `padding-right: ${$edgeGap};`
      : ''}
`;

/*───────────────────────────────────────────────────────────*/
/* Added -webkit-tap-highlight-color + touch-action to kill blue flash */
const TabBtn = styled('button')<{
  $active: boolean;
  $primary: string;
  $orient: 'horizontal' | 'vertical';
  $place: 'top' | 'bottom' | 'left' | 'right';
  $padV: string;
  $padH: string;
  $barW: string;
}>`
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
  centered?: boolean;
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
  centered = false,
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
            $orientation={orientation}
            $place={placement}
            $edgeGap={edgeGap}
            $center={centered}
          >
            {tabs}
          </TabList>
        )}

        <Panel>{panels}</Panel>

        {!stripFirst && (
          <TabList
            $orientation={orientation}
            $place={placement}
            $edgeGap={edgeGap}
            $center={centered}
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
