# Valet 1.0 Prep — Execution Tracker

> Live progress log for [`plan.md`](plan.md). **Last updated: 2026-06-14.
> Status: W1–W6 CODE-COMPLETE & GREEN on `feat/valet-1.0` (7 commits off
> `development`). Every CI-equivalent gate passes — lint, typecheck×4, build,
> 1345 tests, check:package (publint+attw), verify:pack, check:engine,
> check:bundle, mcp:schema:check + mcp:check, docs tsc. Ready for Ben's 1.0.0
> cut. Remaining is operator/human-elevation only (Wave 4 + PVR) — see hand-off.**

## Status at a glance

The 1.0 readiness evaluation is complete (v0.36.0, ~85%, release-candidate
quality). There is exactly **one blocking workstream** — the deprecation removal
sweep (W1) — that the project's own policy mandates; the 10 "confirmed blockers"
all reduce to it. The foundation (engine, security, packaging, perf, test
discipline) is 1.0-grade and is **not** reopened. Remaining work is W2–W5
(confirmed majors) plus a W6 minor tail slated for 1.0.x.

## Branch strategy

- **`feat/valet-1.0`** = the single cumulative epic branch, off `development`.
  Plan + execution log + every 1.0-prep wave (W1–W5) land here, each building on
  the last. Waves are commit groupings, **not** separate PRs.
- **No PRs / no merges** to `development` or `main` without Ben. The first and only
  PR(s) come in **Wave 4, near the 1.0.0 cut**, integrating the whole epic line.
- W6 (minor tail) stays off the critical path — opportunistic commits on the epic
  branch or a 1.0.x fast-follow after the cut.

## Workstream progress

| WS | Title | State | Notes |
| --- | --- | --- | --- |
| **W1** | DEPREC — remove all alias props (7 components) + 3 stragglers | ✅ done + verified | Blocker cleared. 11 alias props + `deprecate.ts` removed; `Typography.bold`→`weight`, `Progress` wrapper→`ProgressBar`/`ProgressRing`, `Tabs.tabAlign`→`alignX`. MCP alias-floor gate inverted to the 1.0 invariant (corpus carries 0 deprecated props). **Tree excluded** (no aliases); `SurfaceState.children` veto carve-out preserved. Green: lint 0 err, typecheck (src+scripts+mcp), 1247/1247 tests, check:engine/verify:pack/check:bundle/check:package, mcp:schema:check + mcp:check, docs tsc. |
| **W2** | A11Y-NAMES — wire `label` into Switch/Slider/Select/Iterator | ✅ done + verified | Major cleared (+ the prop-consistency "FieldBaseProps does nothing" finding). All four render `label`+`helperText` visibly and associate them (aria-labelledby / native htmlFor); dev accessible-name guards added; new `fieldsAccessibleName.a11y.dom.test.tsx` (15 tests). Also fixed a pre-existing WCAG defect: `DateSelector`'s internal month/year Selects were unnamed → `aria-label`. Green: tsc, lint, 1262/1262 tests, build. |
| **W3** | SSR — guard AppBar/Drawer crashes + Accordion hydration | ✅ done + verified | Major cleared. AppBar portal now mounted-gated (SSR-safe, no hydration mismatch); Drawer's `HTMLElement` useState init guarded; Accordion reduced-motion now via `usePrefersReducedMotion` (server snapshot false). New `src/ssr-render.test.ts` renderToString gate (CI runs post-build). Green: tsc, lint, 1265/1265, build. Note: an OPEN overlay Drawer/Modal portals to the overlay root — a client-only scenario by design. |
| **W4** | TYPES — curate barrel, type `sendChat`, kill `export *` leaks | ✅ done + verified | Major cleared. `sendChat` → `Promise<ChatCompletion>` (new named type); aiKeyStore barrel curated (dropped `encrypt`/`decrypt` from the public surface; explicit `useAIKey`/`sendChat`/`AIProvider`/`ChatMessage`/`ChatCompletion`); bare `Variant` un-exported (only `TypographyVariant` public). Type-probes now **gated** (`typecheck:types`) and inverted to assert the 1.0 surface rejects removed aliases. Green: typecheck×4, check:package (publint+attw), 1265/1265, build. |
| **W5** | RELEASE-POLICY — PVR, VERSIONING.md, experimental flags, injectRemote, PR-CI check:package | 🟦 mostly done | `VERSIONING.md` written (+ README/CONTRIBUTING pointers); `injectRemote` flipped true→false (Q13, +tests/docs/CHANGELOG); experimental→stable for Accordion/Table/DateSelector, the rest (LLMChat/RichChat/KeyModal/Parallax×3) carved out in VERSIONING.md; `check:package` + `mcp:check` added to PR CI. Green: 1266/1266, docs tsc, mcp gates. **Remaining: [operator] enable GitHub Private Vulnerability Reporting** (§6 — agent cannot). |
| **W6** | TAIL — minors (PBKDF2, MD-XSS test, untested components, coverage, mcp pins, bump.mjs) | ✅ done + verified | PBKDF2 120k→600k (OWASP); Markdown XSS regression suite (5 cases); `create-valet-app` bump.mjs dead docs-path removed; `check-pins` now gates `valet-mcp` (+optionalDependencies); coverage tooling wired (`@vitest/coverage-v8` + `test:coverage`, measurement-only); KeyModal docs page added + routed; **12 untested components now tested (74 new tests)**; Chip got the missing `data-valet-component` marker; FontsPrivacy docs reconciled to default-false. Green: lint, typecheck×4, **1345/1345**, check:package, mcp gates, docs tsc, build. **Deferred (info-level / by-design):** engine hash-collision-guard & insert-retry are accepted tradeoffs; coverage-CI + engine-bench perf thresholds need a committed baseline first. |

State key: ⬜ not started · 🟦 in progress · ✅ done + verified · ⛔ blocked.

## W1 — deprecation sweep checklist

- [ ] Accordion — remove `open` / `defaultOpen` / `onOpenChange` (`Accordion.tsx:224/230/236`); drop resolves `:309-317`; delete `Accordion.deprecate.dom.test.tsx`.
- [ ] Pagination — remove `onChange` (`:28`); drop resolve `:241`; delete `Pagination.deprecate.dom.test.tsx`.
- [ ] RadioGroup — remove `spacing` (`:163`); drop resolve `:282`; delete `RadioGroup.deprecate.dom.test.tsx`.
- [ ] Panel — remove `normalizeRowHeight` (`:44`); drop resolve `:163`; delete `Panel.deprecate.dom.test.tsx`.
- [ ] Switch — remove `onChange` (`:123`); drop warn `:195`; rewrite the deprecation block in `Switch.dom.test.tsx`; **document migration** (raw-event → onValueChange / native onClick).
- [ ] Table — remove `selectable` + `rowKey` (`:60/:67`); drop resolves `:341/:352`; trim `Table.selection.dom.test.tsx`.
- [ ] List — remove `selectable` + `getKey` (`:37/:66`); drop resolves `:220/:229`; trim `List.selection.dom.test.tsx`.
- [ ] Delete `src/system/deprecate.ts` + `deprecate.test.ts` once grep for `resolveDeprecatedProp|deprecateProp` is clean (keep `warnOnce`).
- [ ] Stragglers per §7: Typography.bold, Progress.showLabel (+ wrapper), Tabs.tabAlign.
- [ ] Verify: `grep -rn '@deprecated' src/components` returns nothing; rebuild; `dist/index.d.mts` carries no alias `@deprecated` except `SurfaceState.children`; full suite green.

## W2–W5 checklists

**W2:** [ ] Switch `:166` · [ ] Slider `:250` · [ ] Select `:232` · [ ] Iterator `:132` wire `label` → name · [ ] dev accessible-name guard · [ ] 4 regression tests.

**W3:** [ ] AppBar portal guard (`:394-395`) · [ ] Drawer `HTMLElement` guard (`:251-252`) · [ ] Accordion → `usePrefersReducedMotion` (`:696-699`) · [ ] productionize renderToString gate in `scripts/checks/`.

**W4:** [ ] type `sendChat` return (`aiKeyStore.ts:245`) · [ ] curate `src/index.ts:6` (drop bare `Variant`) · [ ] curate `:70` aiKeyStore star (`ChatMessage`/`encrypt`/`decrypt`) · [ ] gate `dx/type-tests` in CI.

**W5:** [ ] enable PVR (operator) · [ ] write `VERSIONING.md` · [ ] rule + apply the 10 experimental flags · [ ] flip `injectRemote` + CHANGELOG BREAKING · [ ] add `check:package` to `ci.yml` (and optionally `mcp:check`).

## Hand-off — the [Ben] / operator list

Things the agent cannot or should not do:

1. **[operator]** Enable **Private Vulnerability Reporting** in repo settings (or
   repoint `SECURITY.md` to a working channel). Blocks W5.
2. **[operator]** Publish hardening — npm 2FA + provenance; bus-factor. Roadmap,
   not a hard 1.0 gate.
3. **[Ben]** Rule the §7 register — the four stragglers, the experimental set, the
   veto carve-out, the injectRemote timing, and the scope line. Blocks W1 close + W5.
4. **[Ben]** Final go/no-go + the `1.0.0` version tag and `npm publish`.

## Decisions register (pending Ben — mirrors plan §7)

| # | Decision | Ruling | State |
| --- | --- | --- | --- |
| 1 | Switch.onChange removal (raw event, not rename) | **Remove** + document migration | ✅ ruled 2026-06-14 |
| 2 | Typography.bold | **Remove** (migrate to weight) | ✅ ruled 2026-06-14 |
| 3 | Progress.showLabel + back-compat wrapper | **Remove** (transitional shim) | ✅ ruled 2026-06-14 |
| 4 | Tabs.tabAlign | **Collapse to `alignX`**, no alias | ✅ ruled 2026-06-14 |
| 5 | SurfaceState.children veto carve-out | Hold (ships 1.0, leaves in a future major) | ✅ holds |
| 6 | 10 experimental components | **Promoted Accordion/Table/DateSelector → stable; carved out LLMChat/RichChat/KeyModal/Parallax×3** in VERSIONING.md | ✅ done W5 (Ben can veto via meta `status`) |
| 7 | injectRemote flip timing | **Flipped true→false** (Q13) on the epic branch (lands at the 1.0 cut) | ✅ done W5 |
| 8 | Scope line | **1.0 = W1–W6 (everything); no 1.0.x fast-follow** | ✅ ruled 2026-06-14 |

## Flags & issues

- **The one non-mechanical removal** in W1 is `Switch.onChange` — it's a raw
  `MouseEvent`, so removing it is a genuine behavior change, not a rename. Treat it
  as the headline BREAKING entry with a migration recipe.
- **Veto register vs "remove all deprecations":** the policy has exactly one ruled
  exception (`SurfaceState.children`). Keep them reconciled so a future "why is this
  `@deprecated` still here at 1.0?" has a written answer.
- **8 `npm test` failures on a clean checkout** are a `validate-jsx` env artifact
  (green once `packages/valet-mcp` deps install, as CI does) — not a product bug,
  not a 1.0 task.

## Next step — Ben's 1.0.0 cut (Wave 4, human-elevation only)

W1–W6 are code-complete and green on `feat/valet-1.0`. Everything left is the
release ceremony / operator actions the agent deliberately did **not** perform:

1. **Review the epic branch** (7 commits; the CHANGELOG `## Unreleased` block holds
   the full 1.0 entry set, ready to become `## [1.0.0]`).
2. **Cut 1.0.0:** flip `## Unreleased` → `## [1.0.0] — <date>`, bump `package.json`
   0.36.0 → 1.0.0 (+ the valet-mcp / docs / template pins per `dx/RELEASING.md`),
   confirm `release:check` is green.
3. **Integrate + publish:** open the PR(s) `feat/valet-1.0` → `development`/`main`
   (the first/only PRs), tag, and `npm publish` per the runbook + PUBLISH_ORDER.
4. **[operator] Enable GitHub Private Vulnerability Reporting** so `SECURITY.md`'s
   reporting flow works (the one W5 item the agent cannot do).

Deferred, non-blocking (need a committed baseline first, by design): a coverage-CI
threshold gate and an engine-bench perf-threshold gate. Engine hash-collision-guard
and insert-retry are accepted info-level tradeoffs.
