// ─────────────────────────────────────────────────────────────
// src/components/TreeView.tsx | valet
// Accessible tree view component with nested items
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  ReactNode,
  KeyboardEvent,
} from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
interface ItemEntry {
  id: string;
  parent: string | null;
  ref: React.RefObject<HTMLLIElement>;
  hasChildren: boolean;
  level: number;
}

interface TreeCtx {
  expanded: Set<string>;
  toggle: (id: string) => void;
  selected: string | null;
  select: (id: string) => void;
  active: string | null;
  setActive: (id: string) => void;
  register: (entry: ItemEntry) => void;
  unregister: (id: string) => void;
  indent: string;
  getVisibleOrder: () => string[];
  focusNode: (id: string) => void;
}
const TreeContext = createContext<TreeCtx | null>(null);
const useTree = () => {
  const ctx = useContext(TreeContext);
  if (!ctx) throw new Error('<TreeView.Item> must be inside <TreeView>');
  return ctx;
};

interface ParentCtxValue {
  parent: string | null;
  level: number;
}
const ParentCtx = createContext<ParentCtxValue>({ parent: null, level: 0 });

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Root = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ItemRow = styled('li')<{
  $level: number;
  $indent: string;
  $selected: boolean;
  $hoverBg: string;
}>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  padding-left: calc(${({ $level }) => $level} * ${({ $indent }) => $indent});
  cursor: pointer;
  user-select: none;
  ${({ $selected, $hoverBg }) =>
    $selected && `background:${$hoverBg};`}
  @media(hover:hover){
    &:hover{ background:${({ $hoverBg }) => $hoverBg}; }
  }
  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

const Arrow = styled('span')<{ $open: boolean }>`
  display: inline-block;
  width: 1em;
  transition: transform 120ms ease;
  transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
`;

/*───────────────────────────────────────────────────────────*/
/* Public API                                                 */
export interface TreeViewProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'onSelect'>,
    Presettable {
  expanded?: string[];
  defaultExpanded?: string[];
  selected?: string | null;
  defaultSelected?: string | null;
  onExpandedChange?: (ids: string[]) => void;
  onSelect?: (id: string | null) => void;
}

export interface TreeItemProps
  extends React.LiHTMLAttributes<HTMLLIElement>,
    Presettable {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
}

/*───────────────────────────────────────────────────────────*/
export const TreeView: React.FC<TreeViewProps> & { Item: React.FC<TreeItemProps> } = ({
  expanded: expandedProp,
  defaultExpanded = [],
  selected: selectedProp,
  defaultSelected = null,
  onExpandedChange,
  onSelect,
  preset: p,
  className,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const controlledExp = expandedProp !== undefined;
  const [selfExp, setSelfExp] = useState<string[]>(defaultExpanded);
  const expanded = controlledExp ? expandedProp! : selfExp;
  const setExpanded = (ids: string[]) => {
    if (!controlledExp) setSelfExp(ids);
    onExpandedChange?.(ids);
  };

  const controlledSel = selectedProp !== undefined;
  const [selfSel, setSelfSel] = useState<string | null>(defaultSelected);
  const selected = controlledSel ? selectedProp! : selfSel;
  const setSelected = (id: string | null) => {
    if (!controlledSel) setSelfSel(id);
    onSelect?.(id);
  };

  const [active, setActive] = useState<string | null>(null);

  const items = useRef<Record<string, ItemEntry>>({});
  const order = useRef<string[]>([]);

  const register = (entry: ItemEntry) => {
    items.current[entry.id] = entry;
    if (!order.current.includes(entry.id)) order.current.push(entry.id);
    if (active === null) setActive(entry.id);
  };
  const unregister = (id: string) => {
    delete items.current[id];
    order.current = order.current.filter((i) => i !== id);
    if (active === id) setActive(null);
  };

  const toggle = (id: string) => {
    const set = new Set(expanded);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setExpanded(Array.from(set));
  };

  const indent = theme.spacing(1.5);
  const focusNode = (id: string) => {
    setActive(id);
    const el = items.current[id]?.ref.current;
    el?.focus();
  };

  const getVisibleOrder = () => {
    const arr: string[] = [];
    const walk = (parent: string | null) => {
      order.current
        .filter((i) => items.current[i].parent === parent)
        .forEach((id) => {
          arr.push(id);
          if (items.current[id].hasChildren && expanded.includes(id)) {
            walk(id);
          }
        });
    };
    walk(null);
    return arr;
  };

  const ctx = useMemo<TreeCtx>(
    () => ({
      expanded: new Set(expanded),
      toggle,
      selected,
      select: setSelected,
      active,
      setActive,
      register,
      unregister,
      indent,
      getVisibleOrder,
      focusNode,
    }),
    [expanded, selected, active, indent],
  );

  const presetCls = p ? preset(p) : '';

  return (
    <TreeContext.Provider value={ctx}>
      <ParentCtx.Provider value={{ parent: null, level: 0 }}>
        <Root
          {...rest}
          role="tree"
          className={[presetCls, className].filter(Boolean).join(' ')}
        >
          {children}
        </Root>
      </ParentCtx.Provider>
    </TreeContext.Provider>
  );
};

/*───────────────────────────────────────────────────────────*/
const TreeItem: React.FC<TreeItemProps> = ({
  id,
  label,
  icon,
  children,
  preset: p,
  className,
  ...rest
}) => {
  const { theme } = useTheme();
  const tree = useTree();
  const parent = useContext(ParentCtx);
  const ref = useRef<HTMLLIElement>(null);
  const hasChildren = React.Children.count(children) > 0;

  useLayoutEffect(() => {
    tree.register({ id, parent: parent.parent, ref, hasChildren, level: parent.level + 1 });
    return () => tree.unregister(id);
  }, [id, parent, hasChildren, tree]);

  const expanded = tree.expanded.has(id);
  const selected = tree.selected === id;
  const active = tree.active === id;

  const handleKey = (e: KeyboardEvent<HTMLLIElement>) => {
    const order = tree.getVisibleOrder();
    const idx = order.indexOf(id);
    const next = (i: number) => {
      const nid = order[i];
      if (nid) tree.focusNode(nid);
    };
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        next(idx + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        next(idx - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (hasChildren && !expanded) tree.toggle(id);
        else next(idx + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (hasChildren && expanded) tree.toggle(id);
        else if (parent.parent) tree.focusNode(parent.parent);
        break;
      case 'Home':
        e.preventDefault();
        next(0);
        break;
      case 'End':
        e.preventDefault();
        next(order.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        tree.select(id);
        if (hasChildren) tree.toggle(id);
        break;
    }
  };

  const presetCls = p ? preset(p) : '';
  const hoverBg = tree.indent ? theme.colors.backgroundAlt : '#0002';

  return (
    <ItemRow
      {...rest}
      ref={ref}
      role="treeitem"
      aria-selected={selected || undefined}
      aria-expanded={hasChildren ? expanded : undefined}
      tabIndex={active ? 0 : -1}
      $level={parent.level}
      $indent={tree.indent}
      $selected={selected}
      $hoverBg={hoverBg}
      className={[presetCls, className].filter(Boolean).join(' ')}
      onKeyDown={handleKey}
      onClick={() => {
        tree.setActive(id);
        tree.select(id);
        if (hasChildren) tree.toggle(id);
      }}
    >
      {hasChildren && (
        <Arrow $open={expanded}>▶</Arrow>
      )}
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {hasChildren && expanded && (
        <ParentCtx.Provider value={{ parent: id, level: parent.level + 1 }}>
          <ul role="group" style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%' }}>
            {children}
          </ul>
        </ParentCtx.Provider>
      )}
    </ItemRow>
  );
};
TreeItem.displayName = 'TreeView.Item';
TreeView.Item = TreeItem;

export default TreeView;

