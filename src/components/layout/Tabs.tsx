// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tabs.tsx | valet
// Grid-based valet <Tabs> — bullet-proof placement: top / bottom / left / right
// ─────────────────────────────────────────────────────────────
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
import { styled }           from '../../css/createStyled';
import { useTheme }         from '../../system/themeStore';
import { preset }           from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
interface Ctx {
  active      : number;
  setActive   : (i: number) => void;
  orientation : 'horizontal' | 'vertical';
  registerTab : (i: number, el: HTMLButtonElement | null) => void;
  totalTabs   : number;
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
  $placement : 'top' | 'bottom' | 'left' | 'right';
  $gap: string;
}>`
  box-sizing: border-box;
  width: 100%;
  display: grid;
  margin: ${({ $gap }) => `${$gap} 0`};
  & > * {
    padding: ${({ $gap }) => $gap};
  }

  ${({ $orientation, $placement }) =>
    $orientation === 'horizontal'
      ? `
    /* rows: tab-strip + panel */
    grid-template-rows: ${$placement === 'top' ? 'auto 1fr' : '1fr auto'};
  `
      : `
    /* cols: tab-strip + panel */
    grid-template-columns: ${
      $placement === 'left' ? 'max-content 1fr' : '1fr max-content'
    };
    align-items: start; /* keep panel aligned to top of tabs */
  `}

  /* Gutter only for vertical-left layout */
  ${({ $orientation, $placement }) =>
    $orientation === 'vertical' && $placement === 'left'
      ? 'column-gap: 1rem;'
      : ''}
`;

/*───────────────────────────────────────────────────────────*/
const TabList = styled('div')<{
  $orientation: 'horizontal' | 'vertical';
}>`
  display: flex;
  flex-direction: ${({ $orientation }) =>
    $orientation === 'vertical' ? 'column' : 'row'};
  gap: 0;

  ${({ $orientation }) =>
    $orientation === 'vertical' && 'width: max-content;'}
`;

/*───────────────────────────────────────────────────────────*/
/* Added -webkit-tap-highlight-color + touch-action to kill blue flash */
const TabBtn = styled('button')<{
  $active  : boolean;
  $primary : string;
  $orient  : 'horizontal' | 'vertical';
}>`
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  appearance: none;

  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  ${({ $orient }) =>
    $orient === 'vertical' ? 'width: 100%;' : 'min-width: 4rem;'}

  position: relative;
  text-align: center;

  &:focus-visible {
    outline: 2px solid ${({ $primary }) => $primary};
    outline-offset: 2px;
  }

  &::after {
    content: '';
    position: absolute;
    ${({ $orient }) =>
      $orient === 'horizontal'
        ? `left: 0; right: 0; bottom: -1px; height: 2px;`
        : `top: 0; bottom: 0; right: -1px; width: 2px;`}
    background: ${({ $primary, $active }) => ($active ? $primary : 'transparent')};
    transition: background 150ms ease;
  }
`;

const Panel = styled('div')`
  padding: 1rem 0;
  overflow: visible;
  box-sizing: border-box;
  min-height: 0;
`;

/*───────────────────────────────────────────────────────────*/
export interface TabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  active?: number;
  defaultActive?: number;
  onTabChange?: (i: number) => void;
  orientation?: 'horizontal' | 'vertical';
  placement?: 'top' | 'bottom' | 'left' | 'right';
}
export interface TabProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Presettable {
  index?: number;
  label?: ReactNode;
}
export interface TabPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
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
  preset: p,
  className,
  children,
  ...divProps
}) => {
  const { theme } = useTheme();
  const placement =
    placementProp ?? (orientation === 'horizontal' ? 'top' : 'left');

  const controlled      = controlledActive !== undefined;
  const [self, setSelf] = useState(defaultActive);
  const active          = controlled ? controlledActive! : self;

  const refs = useRef<Record<number, HTMLButtonElement | null>>({});
  const registerTab = useCallback(
    (i: number, el: HTMLButtonElement | null) => (refs.current[i] = el),
    [],
  );
  const setActive = useCallback(
    (i: number) => {
      if (!controlled) setSelf(i);
      onTabChange?.(i);
      refs.current[i]?.focus();
    },
    [controlled, onTabChange],
  );

  const tabs: ReactElement[]   = [];
  const panels: ReactElement[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const name = (child.type as any).displayName;
    if (name === 'Tabs.Tab')
      tabs.push(
        React.cloneElement(child, { index: tabs.length, key: tabs.length } as any),
      );
    if (name === 'Tabs.Panel')
      panels.push(
        React.cloneElement(child, { index: panels.length, key: panels.length } as any),
      );
  });

  const ctx = useMemo<Ctx>(
    () => ({
      active,
      setActive,
      orientation,
      registerTab,
      totalTabs: tabs.length,
    }),
    [active, orientation, setActive, tabs.length],
  );

  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ');
  const gap = theme.spacing(1);
  const stripFirst =
    (orientation === 'horizontal' && placement === 'top') ||
    (orientation === 'vertical'   && placement === 'left');

  return (
    <TabsCtx.Provider value={ctx}>
      <Root
        {...divProps}
        $orientation={orientation}
        $placement={placement}
        $gap={gap}
        className={cls}
      >
        {stripFirst && <TabList $orientation={orientation}>{tabs}</TabList>}

        <Panel>{panels}</Panel>

        {!stripFirst && <TabList $orientation={orientation}>{tabs}</TabList>}
      </Root>
    </TabsCtx.Provider>
  );
};

/*───────────────────────────────────────────────────────────*/
const Tab: React.FC<TabProps> = forwardRef<HTMLButtonElement, TabProps>(
  ({ index = 0, label, preset: p, className, onKeyDown, onClick, ...rest }, ref) => {
    const { theme } = useTheme();
    const { active, setActive, orientation, registerTab, totalTabs } = useTabs();
    const selected = active === index;

    const nav = (e: KeyboardEvent<HTMLButtonElement>) => {
      const horiz = orientation === 'horizontal';
      const prev  = horiz ? 'ArrowLeft'  : 'ArrowUp';
      const next  = horiz ? 'ArrowRight' : 'ArrowDown';
      if (e.key === prev || e.key === next) {
        e.preventDefault();
        setActive((active + (e.key === next ? 1 : -1) + totalTabs) % totalTabs);
      }
      onKeyDown?.(e);
    };

    return (
      <TabBtn
        {...rest}
        ref={(el) => {
          registerTab(index, el);
          if (typeof ref === 'function') ref(el);
          else if (ref) (ref as any).current = el;
        }}
        role="tab"
        id={`tab-${index}`}
        aria-selected={selected}
        aria-controls={`panel-${index}`}
        tabIndex={selected ? 0 : -1}
        onClick={(e) => {
          setActive(index);
          onClick?.(e);
        }}
        onKeyDown={nav}
        $active={selected}
        $primary={theme.colors.primary}
        $orient={orientation}
        className={[p ? preset(p) : '', className].filter(Boolean).join(' ')}
      >
        {label ?? rest.children}
      </TabBtn>
    );
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
      role="tabpanel"
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
Tabs.Tab   = Tab;
Tabs.Panel = TabPanel;

export default Tabs;
