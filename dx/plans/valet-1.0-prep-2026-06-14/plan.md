# Valet 1.0 Readiness — Prep Plan — 2026-06-14

> **Status: PLANNED** — grounded in the 14-dimension, adversarially-verified 1.0
> readiness evaluation run against `@archway/valet` **v0.36.0** (2026-06-14).
> This plan turns that evaluation into the work needed to cut a **defensible
> stable 1.0** — a SemVer commitment to API stability. Live tracker:
> [`execution.md`](execution.md).

## 1. North Star

Cut **1.0 on the project's own terms.** The bar is not "generically good" — it is
the bar valet already wrote for itself: every alias gone (`deprecate.ts:6-7`,
`CHANGELOG.md:75-85`, `AGENTS.md:126-134`), accessibility honoured (the headline
promise), and nothing frozen into the stability contract that we'd want back. The
engine, security, packaging, perf, and test discipline are already 1.0-grade and
are **not** reopened by this plan.

## 2. Distance to 1.0

Release-candidate quality, **~85%.** Scorecard from the eval:

| Grade | Dimensions |
| --- | --- |
| 🟢 Ready | perf-bundle |
| 🟡 Minor gaps | engine · tests · security · docs · ci-release · ecosystem |
| 🟠 At-risk | prop-consistency · a11y · types-packaging · ssr · project-bar |
| 🔴 Blocker | exports-api · deprecations |

**The key insight:** all 10 "confirmed blockers" are the *same root cause seen
from five angles* — the pre-1.0 deprecation-removal sweep was never executed. There
is exactly **one blocking workstream** (W1). Everything else is a tight, distinct
major list (W2–W5) plus a minor tail (W6) — and per the 2026-06-14 ruling, **W6 is
in 1.0 scope** (full clean sweep before the cut, no 1.0.x fast-follow).

## 3. Decisions taken (verified during eval, 2026-06-14)

These were settled by reading source during the evaluation; they scope the work.

1. **Tree is NOT in the deprecation sweep.** `Tree.tsx` exposes no deprecated
   prop alias — its `selectable` is an internal derived const (`Tree.tsx:231`
   `const selectable = selectionMode !== 'none'`) and item identity is the
   structural `TreeNode.id` (no `getItemKey`). The eval's types-dimension mention
   of "Tree selectable/getItemKey" was a d.mts misread. **Exclude Tree.**
2. **`SurfaceState.children` stays at 1.0 (veto-register exception).** It carries
   `@deprecated Kept for compatibility (do not remove — veto register); slated to
   leave the public surface in a future major` (`surfaceStore.ts`, shipped at
   `dist/index.d.mts:617`). This is a **ruled exception** to "remove all
   deprecations" — an accepted 1.0-shipping deprecation targeted at a *post-1.0*
   major. The sweep does **not** touch it. (Ben to re-confirm — see §7.)
3. **Overlay registry-v1 is out of scope.** Its `@deprecated-internal` API is
   unexported from `src/index.ts`, so it carries no SemVer obligation; cleanup is
   optional, not a 1.0 gate.
4. **Bundle-size is already gated in PR CI** (via `npm test` → `check-bundle`).
   The eval's "bundle gate missing" finding was **refuted**; do not re-add it.
5. **Scope line — RULED 2026-06-14: 1.0 = W1–W6 (everything).** Ben chose the full
   clean sweep: the blocker (W1) + all confirmed majors (W2–W5) **and** the minor
   tail (W6) all land before the cut — no 1.0.x fast-follow. W6 is on the critical
   path, not opportunistic.

## 4. Workstreams

### W1 — DEPREC — the deprecation removal sweep  🔴 *the only blocker*

The policy (`deprecate.ts:6-9`) is "aliases removed at 1.0." Remove the **11
deprecated prop members across 7 components** (canonical names already exist and
are tested — this is mechanical):

| Component | Remove (file:line) | Canonical kept |
| --- | --- | --- |
| Accordion | `defaultOpen` `Accordion.tsx:224`, `open` `:230`, `onOpenChange` `:236` (resolved `:309-317`) | `defaultExpanded` / `expanded` / `onExpandedChange` |
| Pagination | `onChange` `Pagination.tsx:28` (resolved `:241`) | `onPageChange` |
| Switch | `onChange` `Switch.tsx:123` (warned `:195`) — **not a pure rename** (raw `MouseEvent`) | `onValueChange` |
| RadioGroup | `spacing` `RadioGroup.tsx:163` (resolved `:282`) | `gap` |
| Panel | `normalizeRowHeight` `Panel.tsx:44` (resolved `:163`) | `normalizeRowHeights` |
| Table | `selectable` `Table.tsx:60`, `rowKey` `:67` (resolved `:341` / `:352`) | `selectionMode` / `getItemKey` |
| List | `selectable` `List.tsx:37`, `getKey` `:66` (resolved `:220` / `:229`) | `selectionMode` / `getItemKey` |

Then:
- Delete the `resolveDeprecatedProp`/`deprecateProp` call sites; use the canonical
  prop directly.
- Delete the four `*.deprecate.dom.test.tsx` suites (Accordion, Panel, Pagination,
  RadioGroup) and the deprecation `describe` blocks inside `Switch.dom.test.tsx`,
  `Table.selection.dom.test.tsx`, `List.selection.dom.test.tsx`.
- Once no consumer remains, delete `src/system/deprecate.ts` + `deprecate.test.ts`
  (keep `warnOnce`/`devErrors` — used elsewhere).
- **Straggler decisions (block W1 close — see §7):** `Typography.bold`
  (`Typography.tsx:27`, silent — comment not `@deprecated` tag, still dogfooded),
  `Progress.showLabel` (`Progress.tsx:415`, doc says "Deprecated", no tag), and
  `Tabs.tabAlign` (`Tabs.tsx:306-307`, un-deprecated permanent alias of `alignX`).

### W2 — A11Y-NAMES — accessible names for core form controls  🟠 *headline-feature major*

Four field controls accept the documented `label` prop (`FieldBaseProps`,
`src/types.ts:122-123`: *"Visual label rendered by the component or its wrapper"*)
and silently discard it — so `role="switch"`/`role="slider"` ship with **no
accessible name (WCAG 4.1.2)**. This is the **same bug** as the prop-consistency
"FieldBaseProps compiles-but-does-nothing" major — one fix clears both.

- Wire `label` → accessible name in **Switch** (`Switch.tsx:166` `void _label`),
  **Slider** (`Slider.tsx:250`), **Select** (`Select.tsx:232`), **Iterator**
  (`Iterator.tsx:132`). Mirror RadioGroup's pattern (`RadioGroup.tsx:329-353`:
  rendered label div + `aria-labelledby`); use `htmlFor` for Iterator's native
  number input, `aria-labelledby` for the Select combobox trigger.
- Add a dev-time accessible-name guard (like `IconButton`/`Modal` already have).
- Add accessible-name regression tests for all four; close the eval's
  "no automated a11y coverage for field-control names" minor at the same time.

### W3 — SSR — server-render & hydration hardening  🟠 *major (Next/Remix adopters hit immediately)*

Two app-shell primitives crash `renderToString`; one hydrates mismatched.

- **AppBar** — `createPortal(bar, document.body)` runs in render and `fixed`/`portal`
  default true (`AppBar.tsx:394-395`, `:147`) → crashes **by default**. Guard:
  `const canPortal = typeof document !== 'undefined'`, render inline on server and
  portal after mount.
- **Drawer** — bare `HTMLElement instanceof` in a `useState` initializer
  (`Drawer.tsx:251-252`) → crashes **always** in Node. Guard the global (or test
  `if (!element) return 0` since `element` is already typed `HTMLDivElement | null`).
- **Accordion** — reads `matchMedia` directly in render (`Accordion.tsx:696-699`,
  fed to `$reduced` at `:846`) → hydration class mismatch under reduced-motion.
  Replace with the existing `usePrefersReducedMotion()` hook (server snapshot
  `false`, agrees with first client render).
- Add an SSR/hydration regression gate over the component layer (renderToString
  smoke of all default-rendered exports — the eval already built one ad-hoc;
  productionize it into `scripts/checks/`).

### W4 — TYPES — curate the public type surface before freeze  🟠 *major*

- **Type `sendChat`** — currently `Promise<any>` (`dist/index.d.mts:1505`; root
  cause `aiKeyStore.ts:245` untyped `res.json()`). Give it a named
  `ChatCompletion` return type. Narrowing a return type is non-breaking; widening
  later is.
- **Kill `export *` leaks** in `src/index.ts`: the bare `Variant` (`:6`, from
  `Typography.tsx:23`) collides with the intended `TypographyVariant` (`:86`); the
  `aiKeyStore` star (`:70`) leaks a colliding `ChatMessage` and `encrypt`/`decrypt`.
  Replace export-stars with curated named re-exports.
- Gate the `dx/type-tests/` probes in CI (currently exist but ungated).

### W5 — RELEASE-POLICY — process & positioning for a stable line  🟠 *major*

- **Enable GitHub Private Vulnerability Reporting** — currently `{"enabled":false}`,
  so `SECURITY.md:35-41`'s entire reporting flow is dead. *(Operator — §6.)*
- **Write `VERSIONING.md`** — the only deprecation contract today is "removed at
  1.0," which says nothing about *post*-1.0. Define: what's in the public surface
  (the `src/index.ts` barrel), minor-vs-major meaning, and the post-1.0 deprecation
  window (e.g. "a renamed prop ships an alias + dev-warn for ≥1 minor"). This is
  what makes the deprecation machinery (kept as `warnOnce`) reusable after 1.0.
- **Resolve the 10 `experimental` corpus flags** — DateSelector, Accordion(+Item),
  LLMChat, RichChat, Table, KeyModal, ParallaxBackground/Layer/Scroll are public
  exports flagged `experimental` while cutting *stable*. Per-component: promote to
  `stable` (commit to the API) **or** explicitly carve out of the 1.0 SemVer
  guarantee in README. *(Ben — §7.)*
- **Flip `injectRemote` default `true → false`** at the cut, per ruling Q13(a)
  (`fontLoader.ts:177`, `:23`; promised at `FontsPrivacy.tsx:166`). Add a CHANGELOG
  **BREAKING** entry. *(Ben to confirm timing — §7.)*
- **Add `check:package` (publint + attw) to PR CI** — today it lives only in the
  release runbook, so ESM-only resolution / type-condition correctness is not
  continuously protected (`ci.yml` runs `verify:pack`/`check:engine` but not
  `check:package`). Optionally add `mcp:check` freshness to PR CI.

### W6 — TAIL — minor cleanups  🟡 *in 1.0 scope (RULED 2026-06-14)*

- **Engine:** prod hash-collision guard is a no-op; insert-failure permanently
  marks a rule injected (no retry, silent in prod). Both minor, both documented.
- **Security:** bump PBKDF2 iterations `120k → 600k` (`aiKeyStore.ts:75`, OWASP
  current); add a Markdown-XSS regression test (the defense is strong but untested).
- **Tests:** 12 public components with no colocated test (Progress, Chip, Video,
  KeyModal, Grid, Stack, CodeBlock, Divider, Image, FormControl, LoadingBackdrop,
  Parallax); configure a coverage tool.
- **Docs:** add a KeyModal docs page (only public export with none); refresh stale
  illustrative numbers on the MCP docs page.
- **Ecosystem:** bring `valet-mcp`'s lockfile + `optionalDependencies` range into
  the `check-pins` gate (`check-pins.mjs:39-63` reads neither today — the friction
  behind the recent manual resync, commit `7ef568b`); fix the dead docs path in
  `create-valet-app/scripts/bump.mjs:58`.
- **CI:** add a coverage gate and a perf-regression baseline (engine-bench is a
  reporter with no thresholds).

## 5. Phase / wave plan

| Wave | Contents | Parallelism |
| --- | --- | --- |
| **0 — Decisions** | Ben rules the §7 register (stragglers, experimental set, scope line, injectRemote timing, veto carve-out) | blocks W1 close + W5 |
| **1 — Blocker** | W1 deprecation sweep | per-component lanes parallel; barrier = delete `deprecate.ts` + green suite |
| **2 — Majors** | W2, W3, W4 | fully parallel (disjoint files) |
| **3 — Policy/process** | W5 (code parts parallel with wave 2; PVR + experimental rulings gated on §6/§7) | mixed |
| **3.5 — Tail** | W6 (now in scope) — minors, new tests, coverage/perf gates | mostly parallel |
| **4 — Release cut** | integrate the epic branch, CHANGELOG `[1.0.0]` (BREAKING for W1 removals + injectRemote), version bump, full green on Node 20/22, **the only PR(s)** → `development`/`main`, tag, publish | serial, last |

**Branch strategy (per house convention — mirrors
[`../valet-overhaul-2026-06-10/execution.md`](../valet-overhaul-2026-06-10/execution.md)):**
one cumulative **`feat/valet-1.0`** epic branch off `development`. Every wave lands
on the epic line, each building on the last — **no PRs / no merges to `development`
or `main` without Ben.** Integration and the PR(s) happen **once, in Wave 4, near
the 1.0.0 cut** — not per workstream. Waves are commit groupings on the epic branch,
not separate PRs.

## 6. Operator inputs (cannot be done from the working tree)

- **Enable Private Vulnerability Reporting** — repo Settings → Code security →
  "Private vulnerability reporting" (or change `SECURITY.md` to a working channel).
- **Publish hardening** — enforce npm 2FA + provenance; address the bus-factor-1 /
  fully-manual release noted by ci-release (roadmap item, not a hard 1.0 gate).
- **The version tag / go-live** decision and the actual `npm publish`.

## 7. Decisions register

> House rule: rulings live here, not pre-resolved. **Items 1–4 and 8 RULED
> 2026-06-14; 5 stands; 6–7 land in W5.**

1. ✅ **RULED — Switch.onChange: REMOVE.** It's a *raw `MouseEvent`* passthrough,
   not a rename. Drop it; document migration (read `event` off the `onValueChange`
   `ChangeInfo` payload, or attach native `onClick`). The loudest BREAKING entry.
2. ✅ **RULED — `Typography.bold`: REMOVE.** Migrate dogfooded usages to
   `weight`/`fontWeight`; delete the prop + the misleading comment.
3. ✅ **RULED — `Progress.showLabel` (+ back-compat wrapper): REMOVE.** Treat the
   transitional `variant`/`mode`/`showLabel` wrapper as a shim; migrate to
   `label`/children on `ProgressRing`.
4. ✅ **RULED — `Tabs.tabAlign`: COLLAPSE to `alignX`.** Hard rename, no alias.
5. **`SurfaceState.children` veto carve-out** — holds (the one accepted exception;
   ships 1.0, leaves in a future major). See §3.2.
6. **The 10 `experimental` components** (W5) — promote to stable vs carve out.
   **Recommend:** promote the mature ones (Accordion, Table, DateSelector); carve
   out LLMChat/RichChat/Parallax/KeyModal in README. *(Ruling at W5.)*
7. **`injectRemote` flip timing** (W5) — flip to `false` at the 1.0 cut (Q13).
8. ✅ **RULED — Scope: 1.0 = W1–W6 (everything).** Full clean sweep before the cut;
   no 1.0.x fast-follow. See §3.5.

## 8. Explicitly NOT doing (verified non-issues)

So no one re-chases ghosts the adversarial pass already killed:

- ❌ Bundle-size PR-CI gate — already gated via `npm test` (refuted).
- ❌ Drawer orientation hydration mismatch — server returns deterministic `false`
  (refuted); only the *reduced-motion* path (W3) is real.
- ⬇️ Polymorphic-API "inconsistency" — framing inaccurate; minor at most.
- ⬇️ `^0.x` caret ranges "won't resolve 1.0.0" — cva range helpers are 0.x-aware;
  handled by the normal bump flow, not a blocker.
- ❌ Tree deprecated aliases — none exist (see §3.1).

## 9. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Switch.onChange removal breaks real consumers (raw event, not a rename) | Loudest CHANGELOG **BREAKING** entry + explicit migration recipe; it's the one non-mechanical removal |
| Deleting `deprecate.ts` orphans an import | Remove call-sites first; delete the module only when grep is clean; full suite green is the barrier |
| Promoting `experimental` components freezes an immature API | Per-component ruling (§7.6); carve-out in README is a valid answer for the AI-chat/parallax set |
| `injectRemote` flip surprises zero-config apps | It's a documented, planned breaking change; CHANGELOG + the existing FontsPrivacy docs already telegraph it |
| Scope creep — W6 minors balloon the cut | Hard scope line (§3.5): W6 is 1.0.x unless trivially bundled |
| SSR fixes regress client behavior | Each guard is `typeof`-narrowed (no client path change); add the renderToString gate to lock it |

## 10. Definition of done

- **W1:** zero `@deprecated` prop aliases in `src/components` and in shipped
  `dist/index.d.mts` (except the §3.2 veto carve-out); `deprecate.ts` removed; the
  four `*.deprecate.dom.test.tsx` + the inline deprecation blocks gone; full suite
  green. Stragglers (§7.1-4) ruled and executed.
- **W2:** Switch/Slider/Select/Iterator render an accessible name from `label`;
  dev guard + regression tests; the FieldBaseProps type surface is honest.
- **W3:** `renderToString` of every default-rendered export is crash-free; no
  hydration class mismatch on Accordion reduced-motion; SSR gate in `scripts/checks`.
- **W4:** no `any` and no bare-`Variant`/`ChatMessage`/`encrypt`/`decrypt` leak in
  the public surface; type-probes gated in CI.
- **W5:** PVR enabled; `VERSIONING.md` published; every public export is `stable`
  or explicitly carved out; `injectRemote` flipped with a BREAKING entry;
  `check:package` in PR CI.
- **Release (Wave 4):** the `feat/valet-1.0` epic branch integrates cleanly; the
  first and only PR(s) merge it to `development`/`main`; CHANGELOG `[1.0.0]` section
  with all BREAKING entries + migration notes; green on Node 20/22;
  `check:package`/`verify:pack`/`check:bundle`/`check:engine` all pass; version
  tagged + published.

## 11. References

- Readiness evaluation (this prep's source) — 14-dimension multi-agent workflow,
  adversarially verified, run 2026-06-14 against v0.36.0. Workflow re-runnable via
  `.claude/wf-1.0-readiness.js`.
- `src/system/deprecate.ts:6-9` — the "removed at 1.0" policy, verbatim.
- `CHANGELOG.md:75-85`, `AGENTS.md:126-134` — the same contract.
- [`../valet-overhaul-2026-06-10/`](../valet-overhaul-2026-06-10/) — the overhaul
  that landed the canonical APIs these aliases shadow (Q12/API-TYPES rulings).
- [`execution.md`](execution.md) — live tracker for this prep.
