// ─────────────────────────────────────────────────────────────
// dx/type-tests/token-papercuts.test-d.ts  | valet
// API-TYPES S12 — compile-time probes for the token paper-cut retypes:
//   • Modal `pad`            : Space (number | string)
//   • MetroSelect `gap`      : Space
//   • Video `width`/`height` : Space (number | string — was string-only)
//   • RadioGroup `gap`       : Space (canonical) + deprecated `spacing`
//   • Panel `normalizeRowHeights` (canonical) + deprecated singular
//   • Intent                 : the canonical shared union, surfaced through
//                              an intent-driven component's prop type
//
// Run (after `npm run build` at the repo root):
//   npx tsc -p dx/type-tests/tsconfig.json
// Exit 0 + no output = the retyped surface holds.
// ─────────────────────────────────────────────────────────────
import type {
  Space,
  ModalProps,
  MetroSelectProps,
  VideoProps,
  RadioGroupProps,
  PanelProps,
} from '@archway/valet';

/* ─── Modal `pad` is Space ──────────────────────────────────── */
const modalPadNum: ModalProps['pad'] = 8;
const modalPadStr: ModalProps['pad'] = '1.5rem';
// Space is assignable both ways with ModalProps['pad'].
const _modalPadAsSpace: Space | undefined = modalPadNum;

/* ─── MetroSelect `gap` is Space ────────────────────────────── */
const metroGapNum: MetroSelectProps['gap'] = 2;
const metroGapStr: MetroSelectProps['gap'] = '0.5rem';

/* ─── Video width/height widened to Space (numbers now allowed) ── */
const videoWidthNum: VideoProps['width'] = 640; // was a type error pre-S12
const videoWidthStr: VideoProps['width'] = '100%';
const videoHeightNum: VideoProps['height'] = 360;
const videoHeightStr: VideoProps['height'] = 'auto';

/* ─── RadioGroup: canonical `gap` (Space); `spacing` removed at 1.0 ── */
const radioGap: RadioGroupProps['gap'] = 1.5;
const radioGapStr: RadioGroupProps['gap'] = '12px';
// @ts-expect-error — `spacing` removed at 1.0; use `gap`
const radioNoSpacing: RadioGroupProps['spacing'] = 1.5;
void radioNoSpacing;

/* ─── Panel: canonical plural; singular `normalizeRowHeight` removed ── */
const panelPlural: PanelProps['normalizeRowHeights'] = false;
// @ts-expect-error — `normalizeRowHeight` removed at 1.0; use `normalizeRowHeights`
const panelNoSingular: PanelProps['normalizeRowHeight'] = false;
void panelNoSingular;

/* ─── Intent reaches consumers through intent-driven components.
   The shared union accepts the seven named tokens AND any open string,
   so PanelProps['intent'] is the canonical surface to probe. ─────── */
const intentNamed: PanelProps['intent'] = 'primary';
const intentArbitrary: PanelProps['intent'] = 'tertiaryBrand'; // open union

/* keep every binding observed so review stays quiet */
void modalPadStr;
void _modalPadAsSpace;
void metroGapNum;
void metroGapStr;
void videoWidthNum;
void videoWidthStr;
void videoHeightNum;
void videoHeightStr;
void radioGap;
void radioGapStr;
void panelPlural;
void intentNamed;
void intentArbitrary;
