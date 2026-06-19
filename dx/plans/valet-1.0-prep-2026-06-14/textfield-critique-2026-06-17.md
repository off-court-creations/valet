# TextField (+ FormControl) critique — decision record (2026-06-17)

> Output of a 13-agent workflow critique (recon: TextField+root-cause / FormControl+binding /
> valet conventions / MUI·Radix·Chakra·Ant — 3 stances each red-teamed → 2 judges → one spec).
> Ben: "a REDO isn't necessarily the move but a full workflow critique is warranted; it has a
> known issue, looks bad, never worked great. Consider FormControl at the same time."

## Verdict

| Subject | Verdict | Why |
| --- | --- | --- |
| **TextField** | **REWRITE** (render/styled layer only) | The whole presentation layer predates the intent contract and can't be patched in coherently. |
| **FormControl** | **NONE** (for 1.0) | Its binding contract is the untouchable invariant shared by 8+ fields; every TextField fix is TextField-local. |

**The split that makes this safe:** keep the control/event/a11y *plumbing* byte-for-byte —
`useFieldState` (precedence + mount-latch), `classifyInputSource`, the `ChangeInfo` phase/source
contract, `htmlFor`/`aria-describedby`. That's the only **gate-pinned** part (controlledContract
row 0 + the source-grep gate at `:850-895`). Rewrite everything *visual/structural* around it.

**Scope for 1.0:** ONE `outlined` variant + the width model + the intent-var color contract +
four reliability/a11y fixes. **Defer** `filled`/`underline`/`autoSize`/char-count to additive
fast-follows.

## Root causes (diagnosed, file:line)

- **Width (the logged blocker):** Wrapper is `flex-direction:column` with no width (`:119-123`);
  input is unconditionally `width:100%` (`:103`); `fullWidth` is the only escape (`:197`). As a
  flex *item* in a `Stack direction='row'`, the wrapper shrink-wraps to the input's UA `size=20`
  (~20ch) and neither grows nor shrinks — no `width` prop, no `min-inline-size:0`.
- **Looks:** zero `computeIntentVars`. Border is hex-alpha concat `(error?error:text)+'44'`
  (`:98`) — the exact anti-pattern intentVars was built to kill. Focus ring hardcodes `primary`
  (`:105`), so an invalid focused field's ring stays primary (reads valid). Helper color
  `+'AA'` (`:132`). Flat background == page (`:100`). No `:disabled` rule. Full-opacity label.
  No size scale.
- **Never worked great:** caller `onBlur`/`onKeyDown` are **silently dropped** (inline handlers
  sit after `...rest`, last-wins). `helperText` carries **always-on `aria-live`** even for
  neutral hints. No dev accessible-name guard. No coarse touch target. Callbacks read via ugly
  `(props as unknown as …)` casts.
- **Coverage gap (critical):** TextField is **absent** from `fieldsAccessibleName.a11y.dom.test.tsx`
  — its a11y wiring is currently **ungated**. The rewrite must land a new a11y test.

## The models (recommended)

- **Width:** default `width:100%` on the Wrapper + `min-inline-size:0` (and `min-width:0`) on
  Wrapper **and** control (so it shrinks below content in a flex/grid row). New `width?: number|string`
  escape (number→px, Iterator precedent). `fullWidth` redefined to `flex:1` (row stretch). Rejected
  P3's `min-inline-size:20ch` floor (re-introduces overflow in narrow containers).
- **Colors:** ONE `computeIntentVars` call (variant `'filled'` like Checkbox, explicit neutral
  border `makeMix(background,text,0.4)`), spread into the control's inline style; CSS reads only
  `var(--valet-intent-*)`. **Border AND focus ring both recolor to `error`** on error (today only
  the border does). Outlined surface `theme.colors.backgroundAlt`; hover border
  `makeMix(background,text,0.66)`; disabled dims the **control only** (`opacity:.5`), never the
  wrapper (would dim the error text). Autofill inset uses literal `backgroundAlt` (NOT intent-bg).
- **Label/error:** static top label (restyled: weight 500, muted, `required` → aria-hidden `*`).
  **Split helper vs error:** neutral `helperText` (no aria-live) + an error node with `role='alert'`
  rendered only on error; `aria-errormessage`→errorId; describedby joins the active one.
- **Sizing/a11y:** `size` scale `xs..xl` (md ≈ today) matching the sibling fields + Button height;
  coarse-pointer `min-height: max(minH, 44px)` on the **input arm only** (24px under compact);
  mobile chrome kit; add the `warnOnce` accessible-name guard.

## FormControl — NONE for 1.0 (the answer to "consider FormControl")

Verified untouchable: `FormCtx.Provider value={store}` is the raw store snapshot; `useFieldState`
reads `form.values[name]` / `form.setField` — the **same path used by Checkbox/Switch/Slider/
Select/RadioGroup/MetroSelect/Iterator/DateSelector**. Wrapping the context value (`{store, disabled}`)
breaks all of them at once. So every TextField fix is TextField-local; blast radius on sibling
bindings = **zero**.

The *real* FormControl wishlist (form-wide disabled/density, async submit + `isSubmitting`/aria-busy,
name-keyed error broadcast, focus-first-invalid) is a **post-1.0 epic**: ship it as a SECOND context
(`FormConfigCtx`) alongside `FormCtx`, never mutating the store snapshot, with errors in context not
the values store. Honest scope: the FormControl *file* change is additive, but the *feature* is an
8–9-component rollout (a `useFormConfig()` + effective-disabled/error line per field, each re-running
the controlledContract matrix). **Rejected** P3's `useStore()`→`getState()` "perf" change — verified
to break controlledContract Scenario 3 for every bound field.

## Implementation plan (14 steps in the spec) + double-gate

Add props to both `as` arms (not FieldBaseProps — that leaks to all fields); size map; one intent
call; rewrite `sharedFieldCSS`; width model; coarse min-height (input arm); compose caller handlers;
drop the cast indirection; split helper/error a11y; `required`; name-guard; one marker; **write the
new a11y + handler + aria-live + width + intent-var tests**; then the human visual pass → promote.

Promotion is double-gated: agent suite **+ a NEW TextField a11y test** (the wiring is currently
ungated) **+ the mandatory human visual pass**.

## Open questions for Ben

1. **Outlined surface:** `backgroundAlt` is only ~7% off the page bg — accept for 1.0, deepen the
   tint, or keep the field on `background` and rely on the border alone? *(visual-pass call)*
2. **Error API:** new `errorText` prop, or just re-role the existing `helperText` into `role=alert`
   on error (smaller surface, no new prop)?
3. **Scope:** full `size` scale (xs–xl) + forward-compat `variant` union now, or md-only / outlined-only?
   *(recommend full size scale; variant union for forward-compat)*
4. **FormControl:** confirm NONE for 1.0 and the `FormConfigCtx` improvements deferred to a post-1.0 epic?
5. **Width default flip** (UA ~20ch → `width:100%`) is a hard, no-alias behavior change — confirm
   (changelog + `width=`/`size` escapes for anyone relying on the narrow default).
