// ─────────────────────────────────────────────────────────────
// src/components/TreeView.tsx | valet
// Accessible TreeView component with nested items
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
interface Ctx {
  open: string[];
  toggle: (id: string) => void;
  selected: string | null;
  setSelected: (id: string) => void;
  focused: string | null;
  setFocused: (id: string) => void;
  register: (id: string, el: HTMLDivElement | null) => void;
  unregister: (id: string) => void;
  getNext: (id: string) => string | undefined;
  getPrev: (id: string) => string | undefined;
}

const TreeCtx = createContext<Ctx | null>(null);
const useTree = () => {
  const ctx = useContext(TreeCtx);
  if (!ctx) throw new Error('TreeView.Item must be inside <TreeView>');
  return ctx;
};

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Root = styled('ul')<{ $pad: string }>`
  list-style: none;
  margin: 0;
  padding: ${({ $pad }) => $pad};
`;

const ItemLi = styled('li')`
  list-style: none;
`;

const ItemRow = styled('div')<{
  $selected: boolean;
  $primary: string;
  $pad: string;
}>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  user-select: none;
  padding: 0.25rem ${({ $pad }) => $pad};
  border-radius: 4px;
  background: ${({ $selected, $primary }) =>
    $selected ? `${$primary}33` : 'transparent'};

  @media (hover: hover) {
    &:hover { background: ${({ $primary }) => `${$primary}22`}; }
  }

  &:focus-visible {
    outline: 2px solid ${({ $primary }) => $primary};
    outline-offset: 2px;
  }
`;

const ExpandBtn = styled('button')<{ $open: boolean }>`
  border: none;
  background: transparent;
  padding: 0;
  margin-right: 0.25rem;
  cursor: pointer;
  width: 1em;
  height: 1em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
  transition: transform 120ms ease;
`;

const Group = styled('ul')<{ $indent: string }>`
  list-style: none;
  margin: 0;
  padding-left: ${({ $indent }) => $indent};
`;

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface TreeViewProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'onSelect'>,
    Presettable {
  defaultOpen?: string[];
  open?: string[];
  onOpenChange?: (open: string[]) => void;
  selected?: string | null | undefined;
  onSelect?: (id: string) => void;
}

export interface TreeItemProps
  extends React.HTMLAttributes<HTMLLIElement>,
    Presettable {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

/*───────────────────────────────────────────────────────────*/
/* TreeView root                                             */
export const TreeView: React.FC<TreeViewProps> & { Item: React.FC<TreeItemProps> } = ({
  defaultOpen,
  open: openProp,
  onOpenChange,
  selected: selProp,
  onSelect,
  preset: p,
  className,
  children,
  ...ulProps
}) => {
  const { theme } = useTheme();
  const pad = theme.spacing(0.5);

  const controlledOpen = openProp !== undefined;
  const [selfOpen, setSelfOpen] = useState<string[]>(defaultOpen ?? []);
  const open = controlledOpen ? openProp! : selfOpen;

  const toggle = (id: string) => {
    const isOpen = open.includes(id);
    const next = isOpen ? open.filter((x) => x !== id) : [...open, id];
    if (!controlledOpen) setSelfOpen(next);
    onOpenChange?.(next);
  };

  const controlledSel = selProp !== undefined;
  const [selfSel, setSelfSel] = useState<string | null>(selProp ?? null);
  const selected = controlledSel ? selProp! : selfSel;
  const setSelected = (id: string) => {
    if (!controlledSel) setSelfSel(id);
    onSelect?.(id);
  };

  const [focused, setFocused] = useState<string | null>(null);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const order = useRef<string[]>([]);

  const register = (id: string, el: HTMLDivElement | null) => {
    refs.current[id] = el;
    if (!order.current.includes(id)) order.current.push(id);
    if (focused === null) setFocused(id);
  };

  const unregister = (id: string) => {
    delete refs.current[id];
    order.current = order.current.filter((x) => x !== id);
    if (focused === id) setFocused(order.current[0] ?? null);
  };

  const getNext = (id: string) => {
    const idx = order.current.indexOf(id);
    return order.current[idx + 1];
  };
  const getPrev = (id: string) => {
    const idx = order.current.indexOf(id);
    return order.current[idx - 1];
  };

  const ctx = useMemo(
    () => ({
      open,
      toggle,
      selected,
      setSelected,
      focused,
      setFocused,
      register,
      unregister,
      getNext,
      getPrev,
    }),
    [open, selected, focused],
  );

  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ');

  return (
    <TreeCtx.Provider value={ctx}>
      <Root
        {...ulProps}
        role="tree"
        $pad={pad}
        className={cls}
      >
        {children}
      </Root>
    </TreeCtx.Provider>
  );
};

/*───────────────────────────────────────────────────────────*/
/* TreeView.Item                                             */
const TreeItem: React.FC<TreeItemProps> = ({
  id,
  label,
  icon,
  children,
  preset: p,
  className,
  ...liProps
}) => {
  const { theme } = useTheme();
  const ctx = useTree();
  const rowRef = useRef<HTMLDivElement>(null);
  const hasKids = !!children;
  const expanded = ctx.open.includes(id);
  const indent = theme.spacing(1);

  useLayoutEffect(() => {
    ctx.register(id, rowRef.current);
    return () => ctx.unregister(id);
  }, [ctx, id]);

  useEffect(() => {
    if (ctx.focused === id) rowRef.current?.focus();
  }, [ctx.focused, id]);

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowDown') {
      const next = ctx.getNext(id);
      if (next) {
        e.preventDefault();
        ctx.setFocused(next);
      }
    }
    if (e.key === 'ArrowUp') {
      const prev = ctx.getPrev(id);
      if (prev) {
        e.preventDefault();
        ctx.setFocused(prev);
      }
    }
    if (e.key === 'ArrowRight') {
      if (hasKids && !expanded) {
        e.preventDefault();
        ctx.toggle(id);
      } else {
        const next = ctx.getNext(id);
        if (next) {
          e.preventDefault();
          ctx.setFocused(next);
        }
      }
    }
    if (e.key === 'ArrowLeft') {
      if (hasKids && expanded) {
        e.preventDefault();
        ctx.toggle(id);
      } else {
        const el = rowRef.current?.parentElement?.parentElement as HTMLElement | null;
        const parentId = el?.dataset.id;
        if (parentId) {
          e.preventDefault();
          ctx.setFocused(parentId);
        }
      }
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasKids) ctx.toggle(id);
      ctx.setSelected(id);
    }
  };

  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ');

  return (
    <ItemLi {...liProps} data-id={id} role="none" className={cls}>
      <ItemRow
        role="treeitem"
        aria-selected={ctx.selected === id}
        aria-expanded={hasKids ? expanded : undefined}
        data-tree-id={id}
        data-haschildren={hasKids || undefined}
        ref={rowRef}
        tabIndex={ctx.focused === id ? 0 : -1}
        onFocus={() => ctx.setFocused(id)}
        onClick={() => ctx.setSelected(id)}
        onKeyDown={handleKey}
        $selected={ctx.selected === id}
        $primary={theme.colors.primary}
        $pad={indent}
      >
        {hasKids && (
          <ExpandBtn
            type="button"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={(e) => {
              e.stopPropagation();
              ctx.toggle(id);
            }}
            $open={expanded}
          >
            ▶
          </ExpandBtn>
        )}
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </ItemRow>
      {hasKids && expanded && (
        <Group role="group" $indent={indent}>
          {children}
        </Group>
      )}
    </ItemLi>
  );
};
TreeItem.displayName = 'TreeView.Item';

TreeView.Item = TreeItem;

export default TreeView;
