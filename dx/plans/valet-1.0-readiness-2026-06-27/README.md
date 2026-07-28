# Valet 1.0 Readiness — Deep Analysis (2026-06-27)

> **Status: ANALYSIS COMPLETE — roadmap PLANNED.** A deep recursive analysis of
> every subsystem of `@archway/valet` at **v0.37.0**, scoped to one question:
> *what is needed to cut a terrific **1.0.0**?* Framed by the four products that
> will be built on valet — a brand website (**W**), a react-three-fiber game HUD
> (**G**), internal dashboards (**D**), and ad campaigns (**A**).
>
> Produced by a 38-agent workflow (15 subsystem deep-reads + 4 product probes,
> every blocker adversarially verified, synthesized + completeness-critiqued),
> then hand-verified against the live tree. ~2.4M tokens of analysis.

## TL;DR

**You are much closer than the prior plan docs say.** The `valet-1.0-prep` plan was
written at v0.36.0 ("~85%, blocker = deprecation sweep"). That entire W1–W6 epic
**has since shipped in `main` at 0.37.0** — `deprecate.ts` is gone, zero
`@deprecated` props remain, and **~95% of components are already promoted to
`stable`** (60/63 on disk; only `KeyModal`/`LLMChat`/`RichChat` remain experimental,
deliberately carved out of SemVer). 0.37.0 is an intentional *dogfood-before-1.0*
minor.

So the engineering is essentially done. The real gap is **downstream-product
readiness (~60%)**, not the library's frozen surface (~80%).

**The one idea that makes a confident 1.0 reachable soon:** the freeze only locks
*removals, renames, narrowings, and existing default behavior.* **Adding** exports,
props, components, or an SSR API in a 1.x minor is non-breaking. So the
must-fix-before-1.0 list is **exactly the irreversible items** (~20, overwhelmingly
S/M, no XL → ~2–4 weeks + a soak). Everything additive — SSR style collection, table
virtualization, R3F HUD primitives, charts — is a legitimate **1.x fast-follow** and
must not be allowed to gate the cut.

## Scorecards

**Subsystems** (maturity for a frozen 1.0, /100): plan-state 87 · engine 83 ·
primitives 82 · layout 82 · public-API 82 · perf/bundle 82 · a11y 80 · tests 80 ·
MCP 76 · CI/release 75 · widgets 74 · fields 72 · theme 71 · docs 70 ·
**create-valet-app 58**. *The drag sits in surfaces that freeze (theme, fields) and
consumer edges (scaffolder, docs).*

**Products** (readiness to build today, /100): **W** brand site 55 · **G** R3F game
65 · **D** dashboards 60 · **A** ad campaigns 60.

## What's left (the irreversibles) — top of the list

1. **Named-export snapshot test** in CI + remove 2 leaked symbol sets — the barrel
   is 50 `export *` lines with no snapshot; it silently grows and leaks freeze. *(M)*
2. **`Intent` ↔ palette reconciliation** — `success`/`warning`/`info` render the
   wrong color across Button/Chip/IconButton/Panel/AppBar; type + palette freeze. *(M)*
3. **Narrow `SelectOptionProps`**; resolve `equalize`/`normalizeRowHeights`,
   `thickness` units, `alignX` RTL meaning, `icon`/`data`/`title` overloads,
   `motion.underline`/`hover`, `Video.onError` type — the frozen-vocabulary batch. *(S each)*
4. **SSR carve-out in `VERSIONING.md`** + honest FOUC position (the additive fix
   ships in 1.x). *(S)*
5. **`FormControl` error message on all 9 fields** (today 1/9). *(M)*
6. **a11y bar:** Avatar name, field helper/error `aria-live`+color-bug fixes, the 3
   experimental widgets fixed-or-carved, **remove `user-scalable=no`** (4 files). *(S–M)*
7. **Release ceremony:** enable PVR, root `prepublishOnly`/`engines`, 1.0 runbook +
   a **dated dogfood→1.0 exit checklist**, reconcile the trackers to one source. *(S–M)*

Full ranked P0/P1 tables, per-product gaps, the sequenced 4-phase roadmap, and the
1.x fast-follow schedule are in **[`plan.md`](plan.md)**.

## Document map

| Doc | What's in it |
|---|---|
| **[`plan.md`](plan.md)** | The synthesis: executive verdict, Definition of Done, ranked P0/P1 blockers, per-product (W/G/D/A) readiness, sequenced roadmap, risks. §0 carries the hand-verified corrections. |
| **[`findings.md`](findings.md)** | Unabridged per-subsystem deep-reads (15) — every blocker with its adversarial verdict, gaps, strengths, recommendations. |
| **[`product-readiness.md`](product-readiness.md)** | The 4 product probes in full — capability tables (present/partial/missing) + blockers. |
| **[`critique.md`](critique.md)** | Completeness-critic corrections to the synthesis. |
| **[`verification.md`](verification.md)** | Independent ground-truth spot-checks + what the adversarial pass refuted. |

## Decisions reserved for Ben

1. **R3F primitives — into the freeze or 1.x?** Recommendation: pull the transparent
   overlay `Surface` mode, `modal={false}`, and an exported `Presence`/HUD-layer
   *into* 1.0 (G is the named highest-risk product; additive-into-fresh-barrel is
   clean, bolt-on-after-freeze forces the game onto ≥1.x). See plan §0.7.
2. **The 3 experimental widgets** (`KeyModal`/`LLMChat`/`RichChat`) — fix-and-promote
   or ship as documented "preview"? They're the AI-key-entry surface behind the
   "AI proxies as first-class users" headline.
3. **The dogfood→1.0 exit gate is unwritten** — define the soak window, acceptance
   criteria, and date. Biggest risk to *when* the cut happens.

## Relationship to prior plans

- Supersedes the scoping in
  [`../valet-1.0-prep-2026-06-14/`](../valet-1.0-prep-2026-06-14/) (v0.36.0, now
  shipped). That plan's W1–W6 are done; this one is the **post-sweep, product-driven**
  re-assessment of the surface that 1.0 will actually freeze.
- See also [`../valet-overhaul-2026-06-10/`](../valet-overhaul-2026-06-10/) (the
  overhaul that landed the canonical APIs) and
  [`../valet-mcp-upgrade-2026-06-12/`](../valet-mcp-upgrade-2026-06-12/).
