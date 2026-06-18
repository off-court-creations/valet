# Tree — deep-analysis verdict (2026-06-18)

Adversarial wide+deep workflow (`tree-deep-analysis`, 75 agents): 6 lenses
(a11y / mobile / api-dx / visual-theming / code-bugs / benchmark) →
per-finding adversarial verification → synthesis. **57 / 68 findings confirmed**
(14 major, 30 minor, 13 nit). Tree is `experimental`.

## Verdict: **REWRITE** (same public API, new internals)

The `TreeProps` *intent* is sound (nodes/getLabel, the canonical
`expanded`/`defaultExpanded`/`onExpandedChange` trio, `selectionMode`, `variant`)
and worth preserving. The *internals* are structurally broken in ways point-fixes
can't cleanly address, and the defects share roots — so converging on one path
fixes the whole cluster at once with less risk than patching ~8 overlapping sites.

Effort: **~2–3 focused days, moderate risk**, contained because Tree is still
`experimental` (a11y/type contract not frozen) and `TreeProps` stays
shape-compatible (forward-compatible widening only). Colour + the unified-render
visual change need Ben's visual pass before stable promotion.

## Why not "improve": the roots are shared

- **Two divergent render paths** — `variant='chevron'` (the default) maps a FLAT
  `treeitem` list with **zero `role=group`**; `list`/`files` recurse with proper
  nested `ul[role=group]`. Same data → two different ARIA trees, the default is
  the weaker one, and every fix must be written twice + kept in sync (posinset is
  even computed two ways, one O(n²)).
- **Mount focus-steal** — `focused` is seeded non-null and an unguarded
  `useEffect([focused])` calls `.focus()` on first commit → the tree grabs page
  focus + scrolls into view on mount; multiple Trees fight. Same effect
  double-`.focus()`es per keystroke.
- **Hand-rolled controlled state (twice)** → `onExpandedChange` fired **inside**
  the `setState` updater (impure reducer, StrictMode double-fire) + no
  controlled-flip warning the siblings have.
- **Bespoke `toRgb/mix/toHex` colours** with a "distort" step that **inverts**
  the hover/selected hierarchy and **fails WCAG AA text contrast (3.39:1)** on the
  default theme — off the shared `computeIntentVars`/`makeMix` contract.
- **No mobile** — ~28–30px rows, no coarse `≥44px` floor, no chrome kit; Tree is
  the only interactive widget missing the house pattern.
- **Selection can't round-trip** — `onNodeSelect` returns `T` (node.data) but
  `selected` is keyed by id; diverges from sibling `List` + the repo's own
  `SelectionProps<K>`; scalar `selected?: string` isn't forward-compatible with
  multi-select before the 1.0 type freeze.

## 1.0 blockers (must-fix to ship)

1. **Fix the mount focus-steal** — gate the focus effect behind a real
   user-interaction flag (`userMovedRef`) or drop it and rely on the synchronous
   `.focus()` in `focusItem`. No Tree grabs focus / scrolls on mount.
2. **Unify both variants on the recursive `renderBranch`** so the default chevron
   variant emits proper nested `ul[role=group]` (chevron = just the ExpandIcon/CSS).
   Removes the flat-no-group violation + the divergent posinset/level logic.
3. **Replace the colour math with `computeIntentVars`/`makeMix`** — hover strictly
   lighter/subtler than selected in BOTH modes; resting text clears AA 4.5:1 on
   both states.
4. **Stop firing `onExpandedChange` inside the `setState` updater** — adopt
   `useControlledState` for both `expanded` and `selected` (compute next, then set
   + fire separately). Kills the StrictMode double-fire; adds the flip warning.
5. **Make controlled selection round-trippable + forward-compatible** — emit the
   node **id** (keep `T` available) and widen `selected`/`defaultSelected`/
   `selectionMode` to the array/`'multiple'` shape per `SelectionProps<K>`.
   Single-select stays the only *implemented* mode for 1.0; the type just won't
   break at 1.1.
6. **House mobile pattern on the row** — `-webkit-tap-highlight-color:transparent;
   touch-action:manipulation;` + `@media(pointer:coarse){min-height:var(--valet-tree-hit,44px)}`
   wired through `useCompact()` (40px compact / 44px default), mirroring Accordion.
7. **Resolve the click/dblclick double-toggle** — remove `onDoubleClick` (row click
   already toggles; a real dblclick net-flips + fires `onExpandedChange` 3×) and
   respect `iconToggleOnly` on every toggle affordance.

## Ordered spec (the rewrite)

1. Pre-work: collapse the duplicate file-header banner; delete the unused
   `$border` styled prop + the three dead `--valet-tree-*` CSS vars on Root.
2. Adopt `useControlledState` for `expanded` (Set↔array via `toArray`, like
   Accordion) and `selected`; delete the hand-rolled controlled/self branches.
3. One render path: `renderBranch` for all three variants, switching the glyph by
   variant (chevron→ExpandIcon, list→BoxIcon, files→Icon) inside nested
   `Branch role='group'`. Delete the flat `flat.map` block. Keep `flat`/idToNode/
   idToParent as the single source of posinset/setsize/level for nav + ARIA (no
   per-row `findIndex`).
4. Focus: a `userMovedRef` set in keyNav/focusItem; the effect `.focus()`es only
   when true (no-op on mount). Keep `tabIndex=0` on the active row. One focus
   mechanism, exactly one `.focus()` per nav step.
5. Colours: `selected = makeMix(primary, background, w_sel)`, `hover` a strictly
   lighter mix; verify AA 4.5:1; drop the distort-toward-black/white step.
6. Mobile: chrome kit + coarse `≥44px` floor on the unified row; wire
   `--valet-tree-hit` from `useCompact()`; adopt `useCompact`/`resolveSpace` for
   pad/indent; derive the connector-stub offset from row metrics (not magic 0.875rem).
7. Remove `onDoubleClick`; give the icon toggle a padded `≥44px` coarse hit area
   (focusable `<button aria-label>` or a `::before` hit box like Chip); replace the
   literal `▶` with an `<Icon>`; guard the rotation with `prefers-reduced-motion`.
8. Widen selection toward `SelectionProps<K=string>` (`'multiple'` in the type,
   single implemented); gate `aria-selected` to selectable rows only (omit, not
   `false`, under `selectionMode='none'`); add `aria-label`/`labelledby` guidance.
9. Typeahead in keyNav (single printable key, ~500ms window) matching the next
   visible node by label; add `getTextValue?(node)` (since getLabel returns
   ReactNode); add `disabled?: boolean` to TreeNode (aria-disabled + skip in
   roving focus + suppress select/toggle) **or** explicitly scope it out in the
   meta. Pull `role`/`onKeyDown` out of `{...rest}` so author props can't clobber
   core ARIA/handlers.
10. Tests + docs: keyboard matrix (Up/Down/Left/Right/Home/End/`*`, Enter/Space),
    refocus-on-ancestor-collapse, per-variant `role=group`, aria-level/setsize/
    posinset on a nested fixture, the mount-focus-steal regression (focus stays on
    an outside button after mount), StrictMode single-fire of `onExpandedChange`.
    Prune `refs.current` on null ref callback; document the non-virtualized scale
    ceiling. Run the stable gate.

## Explicitly DEFERRED post-1.0 (reserve prop names, don't implement)

Lazy/async children (`hasChildren` + `onExpand` + `aria-busy`), virtualization,
drag-drop, imperative ref, custom `renderNode`. These are correctly out of the 1.0
bar; reserving the names now keeps the type from locking eager-only.

## Open question for Ben

The one **API-surface** change is the selection widening (blocker 5 / spec 8):
array shape + `'multiple'` in the type + emitting the node id. It's
forward-compatible (single-select stays the only behaviour) but it does touch the
public type — worth a yes before the 1.0 freeze. Everything else is internals.
