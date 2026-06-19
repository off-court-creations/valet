// ─────────────────────────────────────────────────────────────
// src/components/widgets/Tree.tsx | valet
// Accessible tree view — one unified recursive render path (WAI-ARIA tree
// with nested role=group across every variant), shared controlled-state hook,
// intent-contract colours, mobile chrome kit + ≥44px coarse hit floor,
// roving focus that never steals on mount, typeahead, and disabled nodes.
// 1.0 rewrite per dx/plans/valet-1.0-prep-2026-06-14/tree-analysis-2026-06-18.md
// ─────────────────────────────────────────────────────────────
import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from 'react';
import Icon from '../primitives/Icon';
import Typography from '../primitives/Typography';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { computeIntentVars, makeMix } from '../../system/intentVars';
import { useCompact } from '../../system/compactContext';
import { useControlledState } from '../../hooks/useControlledState';
import type { Presettable, SelectionProps, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface TreeNode<T> {
  id: string;
  data: T;
  children?: TreeNode<T>[];
  /** Disabled nodes are still navigable (arrows land on them) but never
   *  select/toggle and are announced `aria-disabled`. */
  disabled?: boolean;
}

export interface TreeProps<T>
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children' | 'style' | 'role' | 'onKeyDown'>,
    Presettable,
    /* Selection follows the canonical SelectionProps contract with K = the node
       id (string). `selected`/`defaultSelected` are arrays; single-select keeps
       only the last entry. `'multiple'` toggles ids in/out. */
    Pick<
      SelectionProps<string>,
      'selectionMode' | 'selected' | 'defaultSelected' | 'onSelectionChange'
    > {
  nodes: TreeNode<T>[];
  getLabel: (node: T) => React.ReactNode;
  /** Plain-text accessor for typeahead (since `getLabel` may return a node).
   *  Falls back to `getLabel` when it returns a string/number. */
  getTextValue?: (node: T) => string;
  /** Node ids that are expanded (canonical expansion trio, matches Accordion). */
  defaultExpanded?: string[];
  expanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  variant?: 'chevron' | 'list' | 'files';
  /** When true, only the disclosure glyph toggles expansion (not the whole row). */
  iconToggleOnly?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */
const Root = styled('ul')`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Branch = styled('ul')<{ $root: boolean; $indent: string }>`
  list-style: none;
  margin: 0;
  padding-inline-start: ${({ $root, $indent }) => ($root ? '0' : $indent)};
  position: relative;
  --valet-tree-indent: ${({ $indent }) => $indent};
`;

const BranchItem = styled('li')<{ $root: boolean; $lines: boolean; $line: string }>`
  position: relative;
  margin: 0;
  padding: 0;
  ${({ $lines, $root, $line }) =>
    $lines && !$root
      ? `
      &::before {
        content: '';
        position: absolute;
        top: 0.875rem;
        inset-inline-start: calc(-1 * var(--valet-tree-indent, 1rem) + 0.75em);
        width: calc(var(--valet-tree-indent, 1rem) + 0.25rem - 0.75em);
        border-top: var(--valet-divider-stroke, 1px) solid ${$line};
      }`
      : ''}
  ${({ $lines, $root, $line }) =>
    $lines && !$root
      ? `
      &::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        inset-inline-start: calc(-1 * var(--valet-tree-indent, 1rem) + 0.75em);
        border-inline-start: var(--valet-divider-stroke, 1px) solid ${$line};
      }`
      : ''}
`;

const Row = styled('div')<{
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
  border-radius: var(--valet-radius-sm, 4px);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
  user-drag: none;

  /* Mobile chrome kit + coarse-pointer ≥44px tap row. */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  @media (pointer: coarse) {
    min-height: var(--valet-tree-hit, 44px);
  }

  ${({ $hoverBg }) =>
    `@media(hover:hover){&:hover:not([aria-disabled='true']){background:${$hoverBg};}}`}
  ${({ $selected, $selectedBg }) => ($selected ? `background:${$selectedBg};` : '')}

  &[aria-disabled='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:focus-visible {
    outline: var(--valet-tree-outline, 2px) solid var(--valet-focus-ring-color, currentColor);
    outline-offset: var(--valet-tree-offset, 2px);
  }
`;

/* Toggle affordance — wraps the variant glyph, gives it a coarse ≥44px hit
   target (invisible ::before, like Chip's delete) so `iconToggleOnly` is usable
   on touch, and rotates the chevron with a reduced-motion guard. */
const Disclosure = styled('span')<{ $open: boolean; $rotate: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 1em;
  height: 1em;
  user-select: none;
  -webkit-user-drag: none;
  ${({ $rotate, $open }) => ($rotate ? `transform: rotate(${$open ? 90 : 0}deg);` : '')}
  transition: transform 150ms ease;
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
  @media (pointer: coarse) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      margin: auto;
      width: var(--valet-tree-hit, 44px);
      height: var(--valet-tree-hit, 44px);
    }
  }
`;

const BoxGlyph = styled('span')<{ $open: boolean; $line: string; $fill: string }>`
  display: inline-block;
  width: 0.75em;
  height: 0.75em;
  border: var(--valet-divider-stroke, 1px) solid ${({ $line }) => $line};
  background: ${({ $open, $fill }) => ($open ? $fill : 'transparent')};
  box-sizing: border-box;
`;

/*───────────────────────────────────────────────────────────*/
export function Tree<T>({
  nodes,
  getLabel,
  getTextValue,
  defaultExpanded = [],
  expanded: expandedProp,
  onExpandedChange,
  selectionMode = 'single',
  selected: selectedProp,
  defaultSelected = [],
  onSelectionChange,
  variant = 'chevron',
  iconToggleOnly = false,
  preset: p,
  className,
  sx,
  ...rest
}: TreeProps<T>) {
  const { theme } = useTheme();
  const effCompact = useCompact();

  /* Controlled/uncontrolled via the shared hook (no hand-rolled guards, no
     side-effects inside a setState updater). Both are id-arrays. */
  const [expandedArr, setExpandedArr] = useControlledState<string[]>(
    expandedProp,
    defaultExpanded,
    onExpandedChange,
    'Tree',
  );
  const [selectedArr, setSelectedArr] = useControlledState<string[]>(
    selectedProp,
    defaultSelected,
    onSelectionChange,
    'Tree',
  );
  const expanded = useMemo(() => new Set(expandedArr), [expandedArr]);
  const selectedSet = useMemo(() => new Set(selectedArr), [selectedArr]);

  const selectable = selectionMode !== 'none';
  const multiple = selectionMode === 'multiple';

  /* Colours — shared intent contract (matches the stable siblings). Selected is
     a subtle primary tint of the surface; hover is strictly lighter so its
     prominence stays below selected, and body text keeps AA contrast on both. */
  const intentVars = computeIntentVars({
    bg: theme.colors.primary,
    fg: theme.colors.text,
    focus: theme.colors.primary,
    disabledMixColor: theme.colors.background,
    variant: 'filled',
    border: makeMix(theme.colors.background, theme.colors.text, 0.4),
  });
  const selectedBg = makeMix(theme.colors.background, theme.colors.primary, 0.18);
  const hoverBg = makeMix(theme.colors.background, theme.colors.primary, 0.09);
  const line = theme.colors.backgroundAlt;
  const indent = theme.spacing(2);
  const padV = theme.spacing(0.5);
  const padH = theme.spacing(1);

  /* Flat (visible-order) projection — keyboard nav + parent lookups only; the
     render is recursive (below). aria-level/setsize/posinset come from the
     recursion's own index, so there is one O(1) source per metric. */
  const { flat, idToParent, idToNode } = useMemo(() => {
    const res: { node: TreeNode<T>; level: number }[] = [];
    const idToParent = new Map<string, string | null>();
    const idToNode = new Map<string, TreeNode<T>>();
    const walk = (items: TreeNode<T>[], level: number, parentId: string | null) => {
      for (const it of items) {
        idToParent.set(it.id, parentId);
        idToNode.set(it.id, it);
        res.push({ node: it, level });
        if (it.children && expanded.has(it.id)) walk(it.children, level + 1, it.id);
      }
    };
    walk(nodes, 0, null);
    return { flat: res, idToParent, idToNode };
  }, [nodes, expanded]);

  const visibleIds = useMemo(() => flat.map((f) => f.node.id), [flat]);
  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);
  const firstVisible = visibleIds[0] ?? null;

  /* Roving focus. Seed to a selected-and-visible id (or the first visible) so the
     tree is Tab-reachable via tabIndex=0 — but NEVER programmatically focus on
     mount. `.focus()` only runs after a real user move (userMovedRef). */
  const [focused, setFocused] = useState<string | null>(() => {
    const init = new Set(expandedProp ?? defaultExpanded);
    const vis: string[] = [];
    const walk = (items: TreeNode<T>[]) => {
      for (const it of items) {
        vis.push(it.id);
        if (it.children && init.has(it.id)) walk(it.children);
      }
    };
    walk(nodes);
    const seed = (selectedProp ?? defaultSelected).filter((id) => vis.includes(id)).slice(-1)[0];
    return seed ?? vis[0] ?? null;
  });
  const userMovedRef = useRef(false);
  const refs = useRef<Record<string, HTMLDivElement | null>>({});

  const focusItem = useCallback((id: string) => {
    userMovedRef.current = true;
    setFocused(id);
  }, []);

  // Programmatic focus ONLY after a user move — no mount focus-steal.
  useEffect(() => {
    if (userMovedRef.current && focused) refs.current[focused]?.focus();
  }, [focused]);

  // If the focused node becomes hidden (ancestor collapsed), retarget the
  // nearest visible ancestor (or first visible). setFocused only — the effect
  // above performs the actual .focus() when appropriate.
  const visibleKey = useMemo(() => visibleIds.join(' '), [visibleIds]);
  useEffect(() => {
    if (!focused || visibleSet.has(focused)) return;
    let pId: string | null | undefined = focused;
    while (pId) {
      pId = idToParent.get(pId);
      if (!pId) break;
      if (visibleSet.has(pId)) {
        setFocused(pId);
        return;
      }
    }
    if (firstVisible) setFocused(firstVisible);
  }, [visibleKey, focused, idToParent, visibleSet, firstVisible]);

  const setExpandedNext = (id: string, open?: boolean) => {
    const has = expanded.has(id);
    const want = open ?? !has;
    if (want === has) return;
    const next = want ? [...expandedArr, id] : expandedArr.filter((x) => x !== id);
    setExpandedArr(next);
  };

  const selectNode = (node: TreeNode<T>) => {
    if (!selectable || node.disabled) return;
    const id = node.id;
    let next: string[];
    if (multiple)
      next = selectedSet.has(id) ? selectedArr.filter((x) => x !== id) : [...selectedArr, id];
    else next = [id];
    setSelectedArr(next);
  };

  const textOf = useCallback(
    (node: TreeNode<T>): string => {
      if (getTextValue) return getTextValue(node.data) ?? '';
      const lbl = getLabel(node.data);
      return typeof lbl === 'string' || typeof lbl === 'number' ? String(lbl) : '';
    },
    [getLabel, getTextValue],
  );

  const typeahead = useRef({ buffer: '', at: 0 });

  const keyNav = (e: KeyboardEvent<HTMLUListElement>) => {
    let active = focused;
    if (!active) {
      active =
        (selectedArr.filter((id) => visibleSet.has(id)).slice(-1)[0] ?? firstVisible) || null;
      if (active) setFocused(active);
    }
    if (!active) return;
    const idx = visibleIds.indexOf(active);
    if (idx === -1) return;
    const current = flat[idx];
    const hasChildren = !!current.node.children?.length;

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
        if (hasChildren) {
          if (!expanded.has(current.node.id)) setExpandedNext(current.node.id, true);
          else focusItem(current.node.children![0].id);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (hasChildren && expanded.has(current.node.id)) setExpandedNext(current.node.id, false);
        else {
          for (let i = idx - 1; i >= 0; i--) {
            if (flat[i].level < current.level) {
              focusItem(flat[i].node.id);
              break;
            }
          }
        }
        break;
      case 'Home':
        e.preventDefault();
        if (visibleIds.length) focusItem(visibleIds[0]);
        break;
      case 'End':
        e.preventDefault();
        if (visibleIds.length) focusItem(visibleIds[visibleIds.length - 1]);
        break;
      case '*': {
        e.preventDefault();
        const parentId = idToParent.get(current.node.id) ?? null;
        const siblings = parentId ? (idToNode.get(parentId)?.children ?? []) : nodes;
        const next = new Set(expandedArr);
        siblings.forEach((sib) => {
          if (sib.children?.length) next.add(sib.id);
        });
        setExpandedArr([...next]);
        break;
      }
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectNode(current.node);
        break;
      default:
        // Typeahead — a single printable char (no modifiers) jumps to the next
        // visible node whose label starts with the typed buffer (500ms window).
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const now = Date.now();
          const ta = typeahead.current;
          ta.buffer = now - ta.at > 500 ? e.key.toLowerCase() : ta.buffer + e.key.toLowerCase();
          ta.at = now;
          const n = visibleIds.length;
          for (let off = 1; off <= n; off++) {
            const cand = flat[(idx + off) % n];
            if (cand.node.disabled) continue;
            if (textOf(cand.node).toLowerCase().startsWith(ta.buffer)) {
              focusItem(cand.node.id);
              break;
            }
          }
        }
        break;
    }
  };

  /*───────────────────────────────────────────────────────────*/
  const lines = variant !== 'chevron';

  const renderGlyph = (node: TreeNode<T>, open: boolean, hasChildren: boolean) => {
    const onToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!node.disabled && hasChildren) setExpandedNext(node.id);
    };
    if (variant === 'files') {
      return (
        <Disclosure
          $open={open}
          $rotate={false}
          aria-hidden
          draggable={false}
          onClick={hasChildren ? onToggle : undefined}
        >
          <Icon
            icon={hasChildren ? (open ? 'carbon:folder-open' : 'carbon:folder') : 'carbon:document'}
            size={16}
          />
        </Disclosure>
      );
    }
    if (!hasChildren) return null;
    if (variant === 'list') {
      return (
        <Disclosure
          $open={open}
          $rotate={false}
          aria-hidden
          draggable={false}
          onClick={onToggle}
        >
          <BoxGlyph
            $open={open}
            $line={line}
            $fill={theme.colors.tertiary}
          />
        </Disclosure>
      );
    }
    // chevron
    return (
      <Disclosure
        $open={open}
        $rotate
        aria-hidden
        draggable={false}
        onClick={onToggle}
      >
        <Icon
          icon='carbon:chevron-right'
          size={16}
        />
      </Disclosure>
    );
  };

  const renderBranch = (items: TreeNode<T>[], level: number): React.ReactNode => (
    <Branch
      role={level ? 'group' : undefined}
      $root={level === 0}
      $indent={indent}
    >
      {items.map((node, i) => {
        const hasChildren = !!node.children?.length;
        const open = expanded.has(node.id);
        const isSelected = selectable && selectedSet.has(node.id);
        return (
          <BranchItem
            key={node.id}
            role='none'
            $root={level === 0}
            $lines={lines}
            $line={line}
          >
            <Row
              ref={(el: HTMLDivElement | null) => {
                if (el) refs.current[node.id] = el;
                else delete refs.current[node.id];
              }}
              role='treeitem'
              aria-level={level + 1}
              aria-setsize={items.length}
              aria-posinset={i + 1}
              aria-expanded={hasChildren ? open : undefined}
              aria-selected={selectable ? isSelected : undefined}
              aria-disabled={node.disabled || undefined}
              tabIndex={focused === node.id ? 0 : -1}
              $hoverBg={hoverBg}
              $selectedBg={selectedBg}
              $selected={isSelected}
              $padV={padV}
              $padH={padH}
              onClick={() => {
                if (node.disabled) return;
                focusItem(node.id);
                selectNode(node);
                if (hasChildren && !iconToggleOnly) setExpandedNext(node.id);
              }}
            >
              {renderGlyph(node, open, hasChildren)}
              <Typography
                variant='body'
                family='mono'
                noSelect
                sx={{ display: 'inline' }}
              >
                {getLabel(node.data)}
              </Typography>
            </Row>
            {hasChildren && open && renderBranch(node.children!, level + 1)}
          </BranchItem>
        );
      })}
    </Branch>
  );

  return (
    <Root
      {...rest}
      data-valet-component='Tree'
      role='tree'
      aria-multiselectable={multiple || undefined}
      onKeyDown={keyNav}
      className={[p ? preset(p) : '', className].filter(Boolean).join(' ')}
      style={
        {
          ...intentVars,
          '--valet-tree-hit': effCompact ? '40px' : '44px',
          '--valet-tree-outline': theme.stroke(2),
          '--valet-tree-offset': theme.stroke(2),
          ...(sx as object),
        } as React.CSSProperties
      }
    >
      {renderBranch(nodes, 0)}
    </Root>
  );
}

export default Tree;
