// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tree.tsx | valet
// Basic accessible tree view component
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState, useRef, KeyboardEvent } from 'react';
import Icon from '../primitives/Icon';
import Typography from '../primitives/Typography';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface TreeNode<T> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
}

export interface TreeProps<T>
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children' | 'style'>,
    Presettable {
  nodes: TreeNode<T>[];
  getLabel: (node: T) => React.ReactNode;
  defaultExpanded?: string[];
  expanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  /** Active selection (controlled). */
  selected?: string;
  /** Default selection for uncontrolled usage. */
  defaultSelected?: string;
  onNodeSelect?: (node: T) => void;
  variant?: 'chevron' | 'list' | 'files';
  /**
   * If true, expanding/collapsing is only triggered by clicking the icon.
   * Defaults to false: clicking anywhere on the row toggles when the node has children.
   */
  iconToggleOnly?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('ul')<{ $border: string }>`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const ItemRow = styled('div')<{
  $level: number;
  $hoverBg: string;
  $selectedBg: string;
  $selected: boolean;
  $padV: string;
  $padH: string;
  $indent: string;
}>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding-top: ${({ $padV }) => $padV};
  padding-bottom: ${({ $padV }) => $padV};
  padding-right: ${({ $padH }) => $padH};
  padding-left: ${({ $level, $indent }) => `calc(${$indent} * ${$level})`};
  cursor: pointer;
  user-select: none;
  -webkit-user-drag: none;
  user-drag: none;
  ${({ $hoverBg }) => `@media(hover:hover){&:hover{background:${$hoverBg};}}`}
  ${({ $selected, $selectedBg }) => ($selected ? `background:${$selectedBg};` : '')}
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid currentColor;
    outline-offset: var(--valet-focus-offset, 2px);
  }
`;

const ExpandIcon = styled('span')<{ $open: boolean }>`
  display: inline-block;
  width: 1em;
  height: 1em;
  transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
  transition: transform 150ms ease;
  user-select: none;
  -webkit-user-drag: none;
  user-drag: none;
`;

const Branch = styled('ul')<{ $line: string; $root?: boolean; $indent: string }>`
  list-style: none;
  margin: 0;
  padding-left: ${({ $root, $indent }) => ($root ? 0 : $indent)};
  position: relative;
  --indent: ${({ $indent }) => $indent};
`;

const BranchItem = styled('li')<{ $line: string; $root?: boolean; $indent: string }>`
  position: relative;
  margin: 0;
  padding: 0;
  --indent: ${({ $indent }) => $indent};
  ${({ $root, $line }) =>
    !$root &&
    `
      &::before {
        content: '';
        position: absolute;
        top: 0.875rem; /* minor visual tweak left as rem */
        left: calc(-1 * var(--indent, 1rem) + 0.75em);
        width: calc(var(--indent, 1rem) + 0.25rem - 0.75em);
        border-top: var(--valet-divider-stroke, 1px) solid ${$line};
      }
    `}
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(-1 * var(--indent, 1rem) + 0.75em);
    border-left: var(--valet-divider-stroke, 1px) solid ${({ $line }) => $line};
  }
`;

const ListRow = styled('div')<{
  $hoverBg: string;
  $selectedBg: string;
  $selected: boolean;
  $padV: string;
  $padH: string;
}>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
  cursor: pointer;
  user-select: none;
  -webkit-user-drag: none;
  user-drag: none;
  ${({ $hoverBg }) => `@media(hover:hover){&:hover{background:${$hoverBg};}}`}
  ${({ $selected, $selectedBg }) => ($selected ? `background:${$selectedBg};` : '')}
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid currentColor;
    outline-offset: var(--valet-focus-offset, 2px);
  }
`;

const BoxIcon = styled('span')<{
  $open: boolean;
  $line: string;
  $fill: string;
}>`
  display: inline-block;
  width: 0.75em;
  height: 0.75em;
  border: var(--valet-divider-stroke, 1px) solid ${({ $line }) => $line};
  background: ${({ $open, $fill }) => ($open ? $fill : 'transparent')};
  margin-right: 0.25rem;
  box-sizing: border-box;
  user-select: none;
  -webkit-user-drag: none;
  user-drag: none;
`;

/*───────────────────────────────────────────────────────────*/
export function Tree<T>({
  nodes,
  getLabel,
  defaultExpanded = [],
  expanded: expandedProp,
  onExpandedChange,
  selected: selectedProp,
  defaultSelected,
  onNodeSelect,
  variant = 'chevron',
  iconToggleOnly = false,
  preset: p,
  className,
  sx,
  ...rest
}: TreeProps<T>) {
  const { theme, mode } = useTheme();
  const controlledExpand = expandedProp !== undefined;
  const [selfExpanded, setSelfExpanded] = useState(() => new Set(defaultExpanded));

  // Ensure a stable Set for `expanded` so hooks depending on it can list it safely
  const expanded = useMemo<Set<string>>(
    () => (controlledExpand ? new Set(expandedProp ?? []) : selfExpanded),
    [controlledExpand, expandedProp, selfExpanded],
  );

  const [focused, setFocused] = useState<string | null>(null);
  const controlled = selectedProp !== undefined;
  const [selfSelected, setSelfSelected] = useState<string | null>(defaultSelected ?? null);
  const selected = controlled ? selectedProp! : selfSelected;

  // Hover: subtly distort primary (mix with background, then nudge toward contrast color)
  const hoverBase = mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.22);
  const hoverDistorted = mix(hoverBase, toRgb(mode === 'dark' ? '#ffffff' : '#000000'), 0.22);
  const hoverBg = toHex(hoverDistorted);
  // Selected: primary-tinted
  const selectedBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.2));

  const flat = useMemo(() => {
    const res: { node: TreeNode<T>; level: number }[] = [];
    const walk = (items: TreeNode<T>[], level: number) => {
      for (const it of items) {
        res.push({ node: it, level });
        if (it.children && expanded.has(it.id)) walk(it.children, level + 1);
      }
    };
    walk(nodes, 0);
    return res;
  }, [nodes, expanded]);

  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const focusItem = (id: string) => {
    setFocused(id);
    refs.current[id]?.focus();
  };

  const toggle = (id: string) => {
    const apply = (prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    };
    if (controlledExpand) {
      const next = apply(expanded);
      onExpandedChange?.([...next]);
    } else {
      setSelfExpanded((prev) => {
        const next = apply(prev);
        onExpandedChange?.([...next]);
        return next;
      });
    }
  };

  const line = theme.colors.backgroundAlt;

  const visibleIds = flat.map((f) => f.node.id);

  const keyNav = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!focused) return;
    const idx = visibleIds.indexOf(focused);
    if (idx === -1) return;
    const current = flat[idx];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (idx < visibleIds.length - 1) focusItem(visibleIds[idx + 1]);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (idx > 0) focusItem(visibleIds[idx - 1]);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (current.node.children) {
          if (!expanded.has(current.node.id)) toggle(current.node.id);
          else if (current.node.children.length) focusItem(current.node.children[0].id);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (expanded.has(current.node.id)) toggle(current.node.id);
        else {
          for (let i = idx - 1; i >= 0; i--) {
            const candidate = flat[i];
            if (candidate.level < current.level) {
              focusItem(candidate.node.id);
              break;
            }
          }
        }
        break;
      case 'Enter':
      case ' ': // Space
        e.preventDefault();
        if (!controlled) setSelfSelected(current.node.id);
        onNodeSelect?.(current.node.data);
        break;
    }
  };

  const renderBranch = (items: TreeNode<T>[], level: number): React.ReactNode => (
    <Branch
      role={level ? 'group' : undefined}
      $line={line}
      $root={level === 0}
      $indent={theme.spacing(2)}
    >
      {items.map((node) => (
        <BranchItem
          key={node.id}
          $line={line}
          $root={level === 0}
          $indent={theme.spacing(2)}
          role='none'
        >
          <ListRow
            ref={(el: HTMLDivElement | null) => {
              refs.current[node.id] = el;
            }}
            role='treeitem'
            aria-expanded={node.children ? expanded.has(node.id) : undefined}
            aria-selected={selected === node.id}
            tabIndex={focused === node.id ? 0 : -1}
            $hoverBg={hoverBg}
            $selectedBg={selectedBg}
            $selected={selected === node.id}
            $padV={theme.spacing(0.5)}
            $padH={theme.spacing(1)}
            onClick={() => {
              focusItem(node.id);
              if (!controlled) setSelfSelected(node.id);
              onNodeSelect?.(node.data);
              if (node.children && !iconToggleOnly) toggle(node.id);
            }}
            onDoubleClick={() => node.children && toggle(node.id)}
          >
            {variant === 'list' && node.children && (
              <BoxIcon
                draggable={false}
                aria-hidden
                $open={expanded.has(node.id)}
                $line={line}
                $fill={theme.colors.tertiary}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  toggle(node.id);
                }}
              />
            )}
            {variant === 'files' && (
              <Icon
                draggable={false}
                icon={
                  node.children
                    ? expanded.has(node.id)
                      ? 'carbon:folder-open'
                      : 'carbon:folder'
                    : 'carbon:document'
                }
                size={16}
                sx={{ marginRight: '0.25rem' }}
                aria-hidden
                onClick={
                  node.children
                    ? (e: React.MouseEvent) => {
                        e.stopPropagation();
                        toggle(node.id);
                      }
                    : undefined
                }
              />
            )}
            <Typography
              variant='body'
              family='mono'
              noSelect
              sx={{ display: 'inline' }}
            >
              {getLabel(node.data)}
            </Typography>
          </ListRow>
          {node.children && expanded.has(node.id) && renderBranch(node.children, level + 1)}
        </BranchItem>
      ))}
    </Branch>
  );

  return (
    <Root
      {...rest}
      role='tree'
      tabIndex={0}
      onKeyDown={keyNav}
      $border={theme.colors.backgroundAlt}
      className={[p ? preset(p) : '', className].filter(Boolean).join(' ')}
      style={
        {
          '--valet-tree-stroke': theme.stroke(1),
          '--valet-tree-outline': theme.stroke(2),
          '--valet-tree-offset': theme.stroke(2),
          ...(sx as object),
        } as React.CSSProperties
      }
    >
      {variant === 'chevron'
        ? flat.map(({ node, level }) => (
            <li
              key={node.id}
              role='none'
            >
              <ItemRow
                ref={(el: HTMLDivElement | null) => {
                  refs.current[node.id] = el;
                }}
                role='treeitem'
                aria-expanded={node.children ? expanded.has(node.id) : undefined}
                aria-selected={selected === node.id}
                tabIndex={focused === node.id ? 0 : -1}
                $level={level}
                $hoverBg={hoverBg}
                $selectedBg={selectedBg}
                $selected={selected === node.id}
                $padV={theme.spacing(0.5)}
                $padH={theme.spacing(1)}
                $indent={theme.spacing(2)}
                onClick={() => {
                  focusItem(node.id);
                  if (!controlled) setSelfSelected(node.id);
                  onNodeSelect?.(node.data);
                  if (node.children && !iconToggleOnly) toggle(node.id);
                }}
                onDoubleClick={() => node.children && toggle(node.id)}
              >
                {node.children && (
                  <ExpandIcon
                    draggable={false}
                    aria-hidden
                    $open={expanded.has(node.id)}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      toggle(node.id);
                    }}
                  >
                    ▶
                  </ExpandIcon>
                )}
                <Typography
                  variant='body'
                  family='mono'
                  noSelect
                  sx={{ display: 'inline' }}
                >
                  {getLabel(node.data)}
                </Typography>
              </ItemRow>
            </li>
          ))
        : renderBranch(nodes, 0)}
    </Root>
  );
}

export default Tree;
