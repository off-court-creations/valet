# VALIGNMENT archive — closure note

> Archived **2026-06-11** by the valet overhaul, Wave 0.4 (GOVERNANCE S5, plan
> §3.12). Moved here via `git mv` from the repo root: `VALIGNMENT.md`,
> `VALIGNMENT_ISSUES.md`, `VALIGNMENT_PROGRESS.md`. Nothing in these files was
> edited — they are preserved verbatim as the historical record of the
> pre-0.34.0 vNext "hard pivot" alignment effort (Nov 2025).

## Why archived

The vNext alignment effort these docs tracked shipped as 0.34.0/0.34.1 and was
then superseded by the 2026-06-10 overhaul
(`dx/plans/valet-overhaul-2026-06-10/`). The audit flagged the docs as stale
governance debt:

- `VALIGNMENT_ISSUES.md:16` — "three High-severity regressions left at
  hypothesis stage with no closure, despite later commits apparently fixing
  them." (audit, Governance & docs, medium)
- `VALIGNMENT_PROGRESS.md:64` — "directly contradicts itself (and the code) on
  whether polymorphism is implemented; the code proves line 64 false." (audit,
  Governance & docs, medium)

This note adjudicates every open item against current code
(post-Wave-0.3, branch `feat/valet-overhaul`, base `9318dc1`).

## Adjudication of the 3 open regressions (VALIGNMENT_ISSUES.md)

All three were recorded at commit `3653f44` (2025-11-14) as smoke-test
regressions with hypotheses (`[~]`) and were never closed in the file.

### Issue 1 — "Clicks scroll page to top; action doesn't fire unless at top" (High) → RESOLVED (no surviving mechanism)

No single commit names this regression and the doc's own exit criterion ("one
concrete root cause … with an isolated repro and proof") was never met — but
every recorded hypothesis surface has since been fixed or verified safe:

- **Tabs focus hijack (the "Vertical Tabs jumps to top" case):** fixed inside
  `3653f44` itself — the same commit that recorded the issue. The root
  `onFocus` now bails unless the root itself is focused and uses
  `preventScroll`. Current code: `src/components/layout/Tabs.tsx:603-614`
  ("Do NOT hijack focus when a child within the tabs … otherwise the page may
  scroll to the tab strip"; `e.target === e.currentTarget` guard;
  `focus({ preventScroll: true })`). Wave 0.3 (FIELDS S3, `9318dc1`)
  additionally fixed the Tabs first-render value mismatch with regression
  tests.
- **Click-swallowing layer ("action doesn't fire"):** the audit independently
  confirmed Select's `PortalWrap` was "a `position:fixed; inset:0` div with no
  `pointer-events:none` [that] intercepts every pointer event page-wide while
  open" (audit, Select.tsx:123, high). Fixed Wave 0.3 (OVERLAY S2, `9318dc1`):
  `src/components/fields/Select.tsx:132` (`pointer-events: none` on
  PortalWrap) and `:160` (`pointer-events: auto` on Menu).
- **Implicit form submit:** ruled out — Button/IconButton default
  `type="button"` since `3653f44` (see VALIGNMENT_PROGRESS.md:304).
- **Overlay capture listeners:** the `pointerdown` capture handler never calls
  `preventDefault` (`src/system/overlay.ts:189-196`); the focus trap's
  unconditional `preventDefault` (a different bug) was deleted Wave 0.1
  (OVERLAY S1, `162741b`) with a jsdom keydown suite.

Residual: no regression test pins the umbrella symptom — covered by the
Phase-0 gate's manual docs-app sweep (see "Open items carried forward").

### Issue 2 — "TextFields: cannot place caret / cannot click inside" (High) → RESOLVED (no surviving mechanism)

Root cause was never proven in-repo. The leading hypothesis — "a fullscreen,
zero-opacity layer intercepting pointer events" — matches exactly one audited
mechanism: Select's full-viewport `PortalWrap` (audit: "intercepts every
pointer event page-wide while open; outside clicks are eaten before mouseup"),
fixed Wave 0.3 (OVERLAY S2, `9318dc1`) at `src/components/fields/Select.tsx:123-160`.
The 246-agent audit (2026-06-10) swept every component and found **no**
TextField-interaction blocker, and no other always-on fullscreen layer exists
in current `src/components/**` (Modal/Drawer/LoadingBackdrop backdrops render
only while open). The symptom was not reproducible by audit time.

Residual: same as Issue 1 — confirm at the Phase-0 manual sweep.

### Issue 3 — "AppBar usage: overlapping text in hero/title area" (Medium) → RESOLVED (commit `a53ea33`, 2025-11-16)

Fixed two days after being recorded, by "fixed appbar bug" (`a53ea33`):
AppBar gained `fixed` (default `true`) and `portal` props, and the docs AppBar
page now renders its examples inline. CHANGELOG entry (verbatim): "AppBar: add
`fixed` (default `true`) and `portal` props to allow inline rendering in
docs/demos. Docs AppBar page now renders examples inline to avoid overlapping
the page hero and top bar." Current code: `src/components/layout/AppBar.tsx:47-50`
(props), `:277` (`$pos={fixed ? 'fixed' : 'relative'}`);
`docs/src/pages/components/layout/AppBarDemo.tsx:38` ff. (`fixed={false}` on
all 8 demo bars). Subsequent AppBar work (`31ee72c`, `d5fb059`, `f48172b`)
built on this without regressing it.

## Adjudication of the progress-report contradiction (VALIGNMENT_PROGRESS.md:64)

Line 64 ("No components currently consume the polymorphic helper; `Box`,
`Typography`, `Button`, and `IconButton` do not expose `as`. Status: not
implemented.") is a stale duplicate bullet contradicted by lines 51-53 of the
same file and **proven false by code**: all four components consume
`createPolymorphicComponent` today (`src/components/fields/Button.tsx`,
`src/components/fields/IconButton.tsx`, `src/components/layout/Box.tsx`,
`src/components/primitives/Typography.tsx`). Wave 0.3 (API-TYPES S2/S3,
`9318dc1`) made the polymorphic typing sound with 7 `@ts-expect-error`
negative probes. Lines 51-53 were correct; line 64 was not. No code action
needed — closed by this note.

## Open items carried forward

No GitHub issues were created (no network access to the repo's GitHub from
this lane). **Flagged for Ben:**

1. **Phase-0 gate manual sweep should explicitly confirm Issues 1 and 2 are
   dead** — neither ever got a proven root cause or a pinned regression test.
   Checklist additions for the already-planned manual docs-app sweep
   (execution.md, Wave 0.4 / phase gate row): (a) click Buttons/Accordion
   toggles/vertical-Tabs tabs mid-scroll on the docs app — no scroll-to-top,
   actions fire; (b) place a caret in every TextField on the form demos, with
   and without an open Select menu nearby.
2. **VALIGNMENT.md spec deltas that remain live work are already owned by
   overhaul slices** — no orphaned scope found: ESM-only packaging
   (VALIGNMENT.md:316-353, still unshipped; `package.json` ships dual
   ESM/CJS today) is PACKAGING S4 gated Q1 (ruled (a), Wave 1.1); overlay
   z-index tokens are OVERLAY S7 gated Q3 (ruled (a)); RTL/`dir`-awareness
   (VALIGNMENT_PROGRESS.md:321) has no dedicated overhaul slice — it remains
   future work and is intentionally **not** re-tracked here.

## Reading order for the archive

1. `VALIGNMENT.md` — the locked vNext spec (events trio, intent/variant/color,
   density, overlay baseline, polymorphism, ESM packaging goals).
2. `VALIGNMENT_PROGRESS.md` — the 2025-11-14 status report against that spec.
3. `VALIGNMENT_ISSUES.md` — the three smoke-test regressions, adjudicated
   above.
