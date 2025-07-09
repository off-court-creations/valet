// ─────────────────────────────────────────────────────────────
// src/components/TreeView.tsx | valet
// Basic accessible tree view component
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState, useRef, KeyboardEvent } from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import { toRgb, mix, toHex } from '../helpers/color';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export interface TreeNode<T> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
}

export interface TreeViewProps<T>
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children'>,
    Presettable {
  nodes: TreeNode<T>[];
  getLabel: (node: T) => React.ReactNode;
  defaultExpanded?: string[];
  onNodeSelect?: (node: T) => void;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('ul')<{ $border: string }>`
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid ${({ $border }) => $border};
`;

const ItemRow = styled('div')<{
  $level: number;
  $hoverBg: string;
  $selectedBg: string;
  $selected: boolean;
}>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem 0.25rem ${({ $level }) => $level * 1.25}rem;
  cursor: pointer;
  user-select: none;
  ${({ $hoverBg }) =>
    `@media(hover:hover){&:hover{background:${$hoverBg};}}`}
  ${({ $selected, $selectedBg }) =>
    $selected ? `background:${$selectedBg};` : ''}
  &:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }
`;

const ExpandIcon = styled('span')<{ $open: boolean }>`
  display: inline-block;
  width: 1em;
  height: 1em;
  transform: rotate(${({ $open }) => ($open ? 90 : 0)}deg);
  transition: transform 150ms ease;
`;

/*───────────────────────────────────────────────────────────*/
export function TreeView<T>({
  nodes,
  getLabel,
  defaultExpanded = [],
  onNodeSelect,
  preset: p,
  className,
  ...rest
}: TreeViewProps<T>) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const [focused, setFocused] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  // Swap hover and active intensity per design feedback
  const hoverBg = toHex(
    mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.4)
  );
  const selectedBg = toHex(
    mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.2)
  );

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
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          else if (current.node.children.length)
            focusItem(current.node.children[0].id);
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
        setSelected(current.node.id);
        onNodeSelect?.(current.node.data);
        break;
    }
  };

  return (
    <Root
      {...rest}
      role="tree"
      tabIndex={0}
      onKeyDown={keyNav}
      $border={theme.colors.backgroundAlt}
      className={[p ? preset(p) : '', className].filter(Boolean).join(' ')}
    >
      {flat.map(({ node, level }) => (
        <li key={node.id} role="none">
          <ItemRow
            ref={(el) => (refs.current[node.id] = el)}
            role="treeitem"
            aria-expanded={node.children ? expanded.has(node.id) : undefined}
            aria-selected={selected === node.id}
            tabIndex={focused === node.id ? 0 : -1}
            $level={level}
            $hoverBg={hoverBg}
            $selectedBg={selectedBg}
            $selected={selected === node.id}
            onClick={() => {
              focusItem(node.id);
              setSelected(node.id);
              onNodeSelect?.(node.data);
            }}
            onDoubleClick={() => node.children && toggle(node.id)}
          >
            {node.children && (
              <ExpandIcon
                aria-hidden
                $open={expanded.has(node.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(node.id);
                }}
              >
                ▶
              </ExpandIcon>
            )}
            {getLabel(node.data)}
          </ItemRow>
        </li>
      ))}
    </Root>
  );
}

export default TreeView;
