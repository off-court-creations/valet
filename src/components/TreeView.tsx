// ─────────────────────────────────────────────────────────────
// src/components/TreeView.tsx | valet
// accessible nested tree view component
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useRef,
  useCallback,
  ReactNode,
  KeyboardEvent,
} from 'react';
import { styled } from '../css/createStyled';
import { preset } from '../css/stylePresets';
import { useTheme } from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Context + helpers                                          */
interface Ctx {
  expanded: Set<string>;
  selected: Set<string>;
  toggle: (id: string) => void;
  select: (id: string) => void;
  multi: boolean;
  rootRef: React.RefObject<HTMLUListElement>;
}
const TreeCtx = createContext<Ctx | null>(null);

function getVisibleLabels(root: HTMLUListElement) {
  const labels: HTMLElement[] = [];
  root.querySelectorAll<HTMLElement>('li[role="treeitem"] > div').forEach((el) => {
    let parent = el.parentElement as HTMLElement | null;
    let visible = true;
    while (parent && parent !== root) {
      if (
        parent.getAttribute('role') === 'treeitem' &&
        parent.getAttribute('aria-expanded') === 'false'
      ) {
        visible = false;
        break;
      }
      parent = parent.parentElement as HTMLElement | null;
    }
    if (visible) labels.push(el);
  });
  return labels;
}

/*───────────────────────────────────────────────────────────*/
/* Public props                                               */
export interface TreeViewProps
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'onSelect'>,
    Presettable {
  multiSelect?: boolean;
  defaultExpanded?: string[];
  selected?: string[];
  onSelect?: (ids: string[]) => void;
}

export interface TreeItemProps
  extends React.HTMLAttributes<HTMLLIElement>,
    Presettable {
  itemId: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */
const Root = styled('ul')<{ $border: string }>`
  list-style: none;
  margin: 0;
  padding: 0.25rem;
  border: 1px solid ${({ $border }) => $border};
`;

const Group = styled('ul')<{ $indent: string }>`
  list-style: none;
  margin: 0;
  padding-left: ${({ $indent }) => $indent};
`;

const Label = styled('div')<{ $sel: boolean; $hover: string; $focus: string }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  outline: none;
  ${({ $sel, $hover }) => $sel && `background:${$hover}; font-weight:600;`}
  &:hover { background: ${({ $hover }) => $hover}; }
  &:focus-visible { outline: 2px solid ${({ $focus }) => $focus}; }
`;

/*───────────────────────────────────────────────────────────*/
export const TreeView: React.FC<TreeViewProps> & { Item: React.FC<TreeItemProps> } = ({
  multiSelect = false,
  defaultExpanded = [],
  selected,
  onSelect,
  preset: p,
  className,
  style,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const rootRef = useRef<HTMLUListElement>(null);

  const [expanded, setExpanded] = useState<Set<string>>(new Set(defaultExpanded));
  const [selfSel, setSelfSel] = useState<Set<string>>(new Set(selected ?? []));
  const controlledSel = selected !== undefined;
  const selSet = controlledSel ? new Set(selected) : selfSel;

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const select = useCallback(
    (id: string) => {
      let next: Set<string>;
      if (multiSelect) {
        next = new Set(selSet);
        next.has(id) ? next.delete(id) : next.add(id);
      } else {
        next = new Set([id]);
      }
      if (!controlledSel) setSelfSel(next);
      onSelect?.([...next]);
    },
    [multiSelect, selSet, controlledSel, onSelect],
  );

  const ctx = useMemo<Ctx>(
    () => ({ expanded, selected: selSet, toggle, select, multi: multiSelect, rootRef }),
    [expanded, selSet, toggle, select, multiSelect],
  );

  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ');

  return (
    <TreeCtx.Provider value={ctx}>
      <Root
        {...rest}
        ref={rootRef}
        role="tree"
        $border={theme.colors.backgroundAlt}
        className={cls || undefined}
        style={style}
      >
        {children}
      </Root>
    </TreeCtx.Provider>
  );
};

export const TreeItem: React.FC<TreeItemProps> = ({
  itemId,
  label,
  icon,
  children,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const ctx = useContext(TreeCtx);
  const { theme } = useTheme();
  if (!ctx) throw new Error('TreeItem must be inside TreeView');

  const hasKids = !!children;
  const open = ctx.expanded.has(itemId);
  const sel = ctx.selected.has(itemId);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    ctx.select(itemId);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    ctx.toggle(itemId);
  };

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const root = ctx.rootRef.current;
    if (!root) return;
    const labels = getVisibleLabels(root);
    const idx = labels.indexOf(e.currentTarget);
    switch (e.key) {
      case 'ArrowUp':
        if (idx > 0) labels[idx - 1].focus();
        e.preventDefault();
        break;
      case 'ArrowDown':
        if (idx >= 0 && idx < labels.length - 1) labels[idx + 1].focus();
        e.preventDefault();
        break;
      case 'ArrowLeft':
        if (hasKids && open) ctx.toggle(itemId);
        else {
          const parent =
            e.currentTarget.parentElement?.closest('li[role="treeitem"]')?.querySelector('div');
          if (parent) (parent as HTMLElement).focus();
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
        if (hasKids && !open) ctx.toggle(itemId);
        else if (hasKids) {
          const child = e.currentTarget.parentElement?.querySelector('ul li[role="treeitem"] div');
          if (child) (child as HTMLElement).focus();
        }
        e.preventDefault();
        break;
      case 'Home':
        labels[0]?.focus();
        e.preventDefault();
        break;
      case 'End':
        labels[labels.length - 1]?.focus();
        e.preventDefault();
        break;
      case 'Enter':
      case ' ': // space
        ctx.select(itemId);
        e.preventDefault();
        break;
      default:
        break;
    }
  };

  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ');

  return (
    <li
      {...rest}
      role="treeitem"
      aria-expanded={hasKids ? open : undefined}
      data-id={itemId}
    >
      <Label
        onClick={handleClick}
        onKeyDown={handleKey}
        tabIndex={sel ? 0 : -1}
        data-selected={sel || undefined}
        $sel={sel}
        $hover={theme.colors.backgroundAlt}
        $focus={theme.colors.primary}
        className={cls || undefined}
        style={style}
      >
        {hasKids && (
          <span
            onClick={handleToggle}
            aria-hidden
            style={{ display: 'inline-flex', width: '1rem', justifyContent: 'center' }}
          >
            {open ? '▼' : '▶'}
          </span>
        )}
        {icon && <span>{icon}</span>}
        <span>{label}</span>
      </Label>
      {hasKids && (
        <Group role="group" $indent={useTheme.getState().theme.spacing(1)}>
          {children}
        </Group>
      )}
    </li>
  );
};

TreeView.Item = TreeItem;

export default TreeView;
