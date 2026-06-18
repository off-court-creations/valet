# Foundation audit — 1.0 contract verification (2026-06-18)

Fan-out workflow (`foundation-audit`, 29 agents): 6 parallel audits → adversarial
verification of every finding → synthesis. **18 / 22 findings confirmed — all
minor (10) or nit (8). ZERO blockers, ZERO majors.**

## Verdict: all six foundations **VERIFIED** for 1.0

These are contract/infra systems (no visual pass). With no confirmed blocker/major
on any, all six boxes are checked. The confirmed minors/nits are cheap pre-tag
polish, not gates.

| Foundation | Status | Note |
|---|---|---|
| CSS engine | ✅ verified | Atomic minting, dedup, never-re-inject, render purity, dual-package registry, the 256-cardinality tripwire — all enforced + tested (154 tests). |
| theme + spacing/density | ✅ verified | Theme model, `resolveSpace`, compact cascade pure + exhaustively tested; continuous-value discipline enforced via the CSS-var route. |
| surfaceStore | ✅ verified | Per-surface store, shallow selectors, O(1) microtask-batched child registry, SSR-safe lazy RO, correct unmount/StrictMode cleanup. |
| overlay + z-index | ✅ verified | LIFO stack, ref-callback reconcile, top-layer Escape, refcounted inert/aria-hidden, live restore-focus, source-policed z-scale (94 tests). |
| Form store + controlled hook | ✅ verified | Values-only store (no errors/touched leak); `useControlledState` latches at mount, never writes on mount, prop>form>internal, SSR-safe (26 tests). |
| events vocabulary | ✅ verified | Pure type module; `InputSource`/`InputPhase`/`ChangeInfo` well-designed, consumed by all 10 value components, gated by a real-DOM contract test. |

## Pre-tag polish — **ALL DONE 2026-06-18** (Ben: "pre-freeze + all hardening")

Landed: removed dead `ChangeInfo.index`/`.id`; added the `keyframes()` cardinality
tripwire + `as?: ElementType` on `StyledProps` (+ dom test); `densityScale.test.ts`
pins 0.8/0.9/1.0 + the catch-all now degrades to standard `0.9`; `styles.css`
`--valet-space` fallback reconciled to `0.45rem` (standard default); surfaceStore
rounds all metrics + releases the old node on id-rebind; overlay guards restore-focus
with `isConnected` + documents the post-lock inert limitation + a key-passthrough test.
Green: typecheck×4, lint, 1497 tests, build, RTL, mcp, check:examples, check:engine,
docs tsc. (Form-store items were type-only — no change needed.) Original list below.

### Pre-tag polish (non-blocking) — priority order

**1. events — settle `index`/`id` before the type freezes (the one public-surface call).**
`ChangeInfo.index` + `.id` (events.ts:114-115) are documented but emitted by **zero**
components. Decision: **remove them** (clean freeze; re-adding optional fields later
is non-breaking, removing them post-1.0 is breaking) — or populate + assert them.

**2. CSS engine —**
- `keyframes()` has no cardinality tripwire (createStyled.ts:315); the guard exists on
  `styled()` only. Add the same per-call-site counter, or document keyframes() as
  module-scope-constant-only.
- `as` is runtime-honored (createStyled.ts:268) but absent from `StyledProps` (TS error
  to pass it) + untested. Add `as?: React.ElementType` + a dom test, or document as
  internal-only.
- SSR style-extraction is a **disclosed** roadmap item (README "SSR: not yet"); class
  names are deterministic so no hydration mismatch. No action for 1.0.

**3. theme/spacing —**
- Add `densityScale.test.ts` pinning all three tiers (0.8 / 0.9 / 1.0) — magic constants
  with no direct test.
- Flip the catch-all branch (densityScale.ts:18-19) to return standard `0.9`, not tight
  `0.8`, so a malformed density degrades to the documented default.
- Reconcile `styles.css` `--valet-space` fallback (0.5rem ≈ comfortable) with the store
  default (standard, 0.45rem) — or document the bare-token baseline.

**4. surfaceStore (edge-case; no current consumer triggers it) —** harden the
id-rebind path (unobserve old node + delete stale `byNode`); round width/top/left to
match height; add the offset + rebind tests.

**5. overlay (lowest) —** assert non-Escape/non-Tab passthrough; `isConnected` guard on
restore-focus; document (or `MutationObserver` for) the post-lock inert limitation.

**6. Form store —** type-only items: the public zustand `setState` is an unguarded
escape hatch; `reset()` restores a live initial ref (documented sharp edge). No change
needed.

## Recommendation

Check all six boxes now. Treat **#1 (events) and #2 (keyframes guard + `as` typing)** as
strongly-recommended pre-tag polish on freezing public surfaces; **#3** as a fast,
contract-freezing test+fix; **#4–#6** as fast-follow hardening that does not gate 1.0.
