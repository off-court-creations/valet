// ─────────────────────────────────────────────────────────────
// src/system/events.ts  | valet
// canonical event trio types for value components
// ─────────────────────────────────────────────────────────────
import type * as React from 'react';

/**
 * Which stage of a value interaction an event represents.
 *
 * - `'input'` — a transient, in-progress value (e.g. a slider mid-drag, a
 *   keystroke before the field is committed). Fires through `onValueChange`.
 * - `'commit'` — a settled value the consumer should treat as final (e.g.
 *   blur, Enter, an option chosen). Fires through both `onValueChange` (with
 *   `phase: 'input'`) and `onValueCommit` (with `phase: 'commit'`).
 *
 * Contract: every `onValueCommit` payload carries `phase: 'commit'`. Every
 * `onValueChange` payload carries `phase: 'input'` (a commit emits the change
 * with `'input'` first, then the commit with `'commit'`).
 */
export type InputPhase = 'input' | 'commit';

/**
 * The honest origin of a value change — what the *user* (or program) actually
 * did, not how the component happens to wire its handlers. This is the
 * agent-facing promise of the library: a tool reading `ChangeInfo.source`
 * learns whether a value came from typing, a click, a paste, a scroll wheel,
 * or a programmatic write.
 *
 * Vocabulary (every member is emitted by at least one component — see the
 * classification table below; none is vestigial, so the union is not narrowed):
 *
 * - `'keyboard'` — typing into a text field, Space/Enter activation of a
 *   toggle/option, and arrow/Page/Home/End navigation that changes a value.
 * - `'pointer'` — a genuine mouse/touch/pen click, tap, or drag.
 * - `'clipboard'` — paste or drag-and-drop of text into a field
 *   (`InputEvent.inputType` of `insertFromPaste*` or `insertFromDrop`).
 * - `'wheel'` — a scroll-wheel gesture that steps a value (Iterator).
 * - `'programmatic'` — a value written by code (a dispatched synthetic event
 *   with no real user input, or a commit path with no associated DOM event,
 *   e.g. TextField blur).
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  CANONICAL CLASSIFICATION TABLE (ruling R10)
 *
 *  This is the contract the FIELDS migrations implement and the cross-field
 *  matrix in `events.contract.dom.test.tsx` gates uniformly. A field whose
 *  emitted `source` disagrees with this table is a FIELDS bug — the matrix
 *  flags it; this contract is not edited to match a drifting field.
 *
 *  Component     Interaction                         phase           source
 *  ───────────   ─────────────────────────────────   ─────────────   ────────────
 *  TextField     typing                              input           keyboard
 *  TextField     paste / drop                        input           clipboard
 *  TextField     Enter (commit)                      commit          keyboard
 *  TextField     blur (commit)                       commit          programmatic
 *  TextField     programmatic value + dispatch       input           programmatic
 *  Checkbox      pointer click (detail ≥ 1)          input + commit  pointer
 *  Checkbox      keyboard activation (detail 0)      input + commit  keyboard
 *  Checkbox      programmatic change (non-Mouse)     input + commit  programmatic
 *  Switch        pointer click (detail ≥ 1)          input + commit  pointer
 *  Switch        keyboard activation (detail 0)      input + commit  keyboard
 *  RadioGroup    pointer click (detail ≥ 1)          input + commit  pointer
 *  RadioGroup    keyboard activation (detail 0)      input + commit  keyboard
 *  RadioGroup    programmatic change (non-Mouse)     input + commit  programmatic
 *  Select        option pointer click                input + commit  pointer
 *  Select        option keyboard (Enter/Space)       input + commit  keyboard
 *  MetroSelect   tile pointer click                  input + commit  pointer
 *  MetroSelect   tile keyboard (Enter/Space)         input + commit  keyboard
 *  Slider        pointer drag / click                input + commit  pointer
 *  Slider        arrow / Page / Home / End keys      commit          keyboard
 *  Slider        programmatic commit (no event)      *               programmatic
 *  Iterator      +/- buttons                         commit          pointer
 *  Iterator      arrow/Page/Home/End/Enter/blur/type input + commit  keyboard
 *  Iterator      wheel step                          commit          wheel
 *  Iterator      programmatic commit (default)       *               programmatic
 *  DateSelector  day-cell click                      input + commit  pointer
 *  Tabs          tab pointer click                   input + commit  pointer
 *  Tabs          arrow-key navigation                input + commit  keyboard
 *
 *  Classification primitives (how fields derive `source` from a native event):
 *  - A synthesized `MouseEvent` with `detail === 0` is keyboard activation
 *    (Space/Enter on a focused button/checkbox/radio); `detail >= 1` is a
 *    genuine pointer press. (Checkbox/Switch/RadioGroup, and Tabs clicks.)
 *  - A text `InputEvent` whose `inputType` starts with `insertFromPaste` or is
 *    `insertFromDrop` is `'clipboard'`; any other `inputType` is `'keyboard'`.
 *    A non-`InputEvent` native event on a text control is `'programmatic'`.
 *    (TextField.)
 *  - Components with no native DOM event in the path (Select/MetroSelect/
 *    Slider/Iterator/DateSelector/Tabs) pass `source` explicitly per handler.
 * ─────────────────────────────────────────────────────────────────────────
 */
export type InputSource = 'keyboard' | 'pointer' | 'programmatic' | 'clipboard' | 'wheel';

/**
 * Metadata that accompanies every canonical value event.
 *
 * @typeParam T - the component's value type.
 *
 * @property name          The field's form `name`, when bound to a FormControl.
 * @property previousValue The value before this change (for diffing/undo).
 * @property phase         {@link InputPhase} — `'input'` (transient) or `'commit'`.
 * @property source        {@link InputSource} — the honest origin of the change.
 * @property event         The originating React synthetic event, when one exists
 *                          (absent for programmatic and pointer-drag paths).
 * @property index         The option/item index, for collection components.
 * @property id            A stable id for the changed element, when available.
 */
export interface ChangeInfo<T> {
  name?: string;
  previousValue?: T;
  phase: InputPhase;
  source: InputSource;
  event?: React.SyntheticEvent;
  index?: number;
  id?: string;
}

/**
 * The canonical transient-change handler. Called on every in-progress value
 * with `info.phase === 'input'`. A committing interaction fires this first
 * (phase `'input'`) and then {@link OnValueCommit} (phase `'commit'`).
 */
export type OnValueChange<T> = (value: T, info: ChangeInfo<T>) => void;

/**
 * The canonical commit handler. Called when a value settles, always with
 * `info.phase === 'commit'`.
 */
export type OnValueCommit<T> = (value: T, info: ChangeInfo<T>) => void;
