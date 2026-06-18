// ─────────────────────────────────────────────────────────────
// dx/type-tests/selection-props.test-d.ts  | valet
// API-TYPES S11 (Q11(a), ruling R12) — compile-time probes for the
// unified selection vocabulary `SelectionProps<K>` and its adoption
// across Table/List/Tree:
//   • SelectionProps<K> generic inference (keyed arrays + getItemKey)
//   • Table: canonical selectionMode/getItemKey + deprecated selectable/rowKey
//   • List : canonical selectionMode/getItemKey + deprecated selectable/getKey
//   • Tree : canonical selectionMode + the expanded/onExpandedChange trio
//
// Run (after `npm run build` at the repo root):
//   npx tsc -p dx/type-tests/tsconfig.json
// Exit 0 + no output = the unified selection surface holds.
// ─────────────────────────────────────────────────────────────
import type { SelectionProps, TableProps, ListProps, TreeProps } from '@archway/valet';

/* ─── SelectionProps<K> generic inference ───────────────────── */
interface Person {
  id: number;
  name: string;
}

/* `selected`/`defaultSelected` are arrays of the selection unit `K`. */
const personSelection: SelectionProps<Person> = {
  selectionMode: 'multiple',
  selected: [{ id: 1, name: 'Ada' }],
  defaultSelected: [],
  onSelectionChange: (sel) => {
    /* `sel` is inferred as Person[] */
    const first: Person | undefined = sel[0];
    void first;
  },
  getItemKey: 'id', // keyof Person
};
void personSelection;

/* the function form of getItemKey returns a string | number key */
const fnKeySelection: SelectionProps<Person> = {
  getItemKey: (p, i) => `${p.id}-${i}`,
};
void fnKeySelection;

/* a string-keyed selection unit (Tree's shape) ─────────────── */
const idSelection: SelectionProps<string> = {
  selectionMode: 'single',
  selected: ['node-1'],
  onSelectionChange: (ids) => {
    const id: string | undefined = ids[0];
    void id;
  },
};
void idSelection;

/* selectionMode is the closed three-member union ───────────── */
const modeNone: SelectionProps<string>['selectionMode'] = 'none';
const modeSingle: SelectionProps<string>['selectionMode'] = 'single';
const modeMultiple: SelectionProps<string>['selectionMode'] = 'multiple';
void modeNone;
void modeSingle;
void modeMultiple;

/* @ts-expect-error — 'multi' is the OLD Table value, not the canonical union */
const badMode: SelectionProps<string>['selectionMode'] = 'multi';
void badMode;

/* ─── Table: canonical vocabulary + deprecated aliases ──────── */
const tableCanonical: Partial<TableProps<Person>> = {
  selectionMode: 'multiple',
  getItemKey: 'id',
  onSelectionChange: (rows) => {
    /* Table's selection unit is the row type T */
    const row: Person | undefined = rows[0];
    void row;
  },
};
void tableCanonical;

/* Deprecated aliases were REMOVED at 1.0 (pre-1.0 policy) — the surface must
   now reject them. These probes fail the build if an alias is ever re-added. */
const tableNoSelectable: Partial<TableProps<Person>> = {
  // @ts-expect-error — `selectable` removed at 1.0; use `selectionMode`
  selectable: 'multi',
};
void tableNoSelectable;
const tableNoRowKey: Partial<TableProps<Person>> = {
  // @ts-expect-error — `rowKey` removed at 1.0; use `getItemKey`
  rowKey: (row: Person) => row.id,
};
void tableNoRowKey;

/* @ts-expect-error — Table's selectionMode does not accept the legacy 'multi' */
const tableBadMode: Partial<TableProps<Person>> = { selectionMode: 'multi' };
void tableBadMode;

/* ─── List: canonical vocabulary; deprecated aliases removed at 1.0 ── */
const listCanonical: Partial<ListProps<Person>> = {
  selectionMode: 'single',
  getItemKey: (item, i) => `${item.id}-${i}`,
};
void listCanonical;

const listNoSelectable: Partial<ListProps<Person>> = {
  // @ts-expect-error — `selectable` removed at 1.0; use `selectionMode`
  selectable: true,
};
void listNoSelectable;
const listNoGetKey: Partial<ListProps<Person>> = {
  // @ts-expect-error — `getKey` removed at 1.0; use `getItemKey`
  getKey: (item: Person) => item.id,
};
void listNoGetKey;

/* @ts-expect-error — List is single-select; 'multiple' is not in its mode union */
const listBadMode: Partial<ListProps<Person>> = { selectionMode: 'multiple' };
void listBadMode;

/* ─── Tree: canonical SelectionProps<string> + the expansion trio ────── */
const treeCanonical: Partial<TreeProps<Person>> = {
  selectionMode: 'multiple', // Tree now implements none | single | multiple
  expanded: ['a', 'b'],
  defaultExpanded: ['a'],
  onExpandedChange: (ids) => {
    const id: string | undefined = ids[0];
    void id;
  },
  selected: ['node-1'], // id arrays per SelectionProps<string>
  defaultSelected: ['node-1'],
  onSelectionChange: (ids) => {
    const id: string | undefined = ids[0];
    void id;
  },
};
void treeCanonical;

/* @ts-expect-error — selection is keyed by node id (string), not a scalar id */
const treeBadSelected: Partial<TreeProps<Person>> = { selected: 'node-1' };
void treeBadSelected;
