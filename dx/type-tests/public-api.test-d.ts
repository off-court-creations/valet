// ─────────────────────────────────────────────────────────────
// dx/type-tests/public-api.test-d.ts  | valet
// compile-time probe: the public vocabulary types are importable
// from the BUILT package entry (dist/index.d.ts via the paths
// mapping in ./tsconfig.json).
//
// Run (after `npm run build` at the repo root):
//   npx tsc -p dx/type-tests/tsconfig.json
// Exit 0 + no output = the public type surface holds.
// ─────────────────────────────────────────────────────────────
import type {
  // src/types.ts vocabulary
  Sx,
  Presettable,
  Space,
  SpacingProps,
  FieldBaseProps,
  // src/system/events.ts vocabulary
  ChangeInfo,
  OnValueChange,
  OnValueCommit,
  InputPhase,
  InputSource,
  // src/system/polymorphic.ts vocabulary (factory + MergeProps stay internal)
  PolymorphicProps,
  PolymorphicRef,
  PolymorphicComponent,
  PropsOf,
} from '@archway/valet';

/* ─── Exercise: Sx accepts CSS properties and --vars ─────────── */
const sx: Sx = {
  display: 'flex',
  paddingInline: '1rem',
  '--valet-probe': 1,
  '--valet-accent': '#abc',
};

/* ─── Exercise: spacing + preset vocabulary compose ──────────── */
const spacing: SpacingProps & Presettable = {
  gap: 2,
  pad: '0.5rem',
  compact: false,
  density: 'comfortable',
  preset: ['cardSurface', 'tightStack'],
};
const gap: Space = spacing.gap ?? 0;

/* ─── Exercise: field base props reference the Sx vocabulary ─── */
const field: FieldBaseProps = {
  name: 'email',
  label: 'Email',
  helperText: 'Work address preferred',
  error: false,
  fullWidth: true,
  sx,
};

/* ─── Exercise: the canonical change-event trio ──────────────── */
const onValueChange: OnValueChange<string> = (value, info) => {
  const v: string = value;
  const prev: string | undefined = info.previousValue;
  const phase: InputPhase = info.phase;
  const source: InputSource = info.source;
  void v;
  void prev;
  void phase;
  void source;
};
const onValueCommit: OnValueCommit<string> = (value, info) => {
  const committed: ChangeInfo<string> = info;
  void value;
  void committed;
};

/* ─── Exercise: polymorphic helpers resolve element props ────── */
type AnchorProps = PropsOf<'a'>;
const href: AnchorProps['href'] = 'https://example.com';

type ProbeOwnProps = { tone?: 'info' | 'danger' };
type AnchorPolyProps = PolymorphicProps<'a', ProbeOwnProps>;
const polyProps: AnchorPolyProps = { as: 'a', href, tone: 'info' };

type AnchorRef = PolymorphicRef<'a'>;
declare const anchorRef: AnchorRef;

declare const ProbeComponent: PolymorphicComponent<'button', ProbeOwnProps>;
void ProbeComponent;

/* keep every binding observed so noUnusedLocals-style review stays quiet */
void sx;
void spacing;
void gap;
void field;
void onValueChange;
void onValueCommit;
void polyProps;
void anchorRef;
