# Valet Overhaul — Execution Log

> Living tracker for executing [`plan.md`](./plan.md). Started **2026-06-10**.
> Driven by an AI agent (Claude Fable 5, ultracode mode). This file records what
> was done, in what order, what was verified, and every issue/flag raised along
> the way. **Plan §5's Phase-0 waves are the master checklist below.** Phase 0 is
> decision-free by construction (plan §2.4); the §9 decision batches are ruled by
> Ben at phase boundaries (Q4 first — it shapes the release plan).

## How to read this

- **Master checklist** mirrors plan §5's wave order for the current phase.
- Each wave gets a section: status, what the plan says, research/discrepancies,
  design choices made, files, verification results, flags.
- **Flags & Issues** at the bottom is the running log of anything surprising,
  any plan/code discrepancy, and any decision/assumption made in-flight.
- Status legend: ⬜ not started · 🔬 researching · 🛠️ implementing ·
  ✅ done+verified · ⏸️ blocked/paused · ⚠️ done with caveats.

## Branch strategy

- **`feat/valet-overhaul`** = the single cumulative epic branch, off
  `development` (clean tree at `0a31fee`). Plan docs + audit + execution log +
  every overhaul wave land here, each building on the last.
- **No PRs / no merges** to `development` or `main` without Ben.
- `development` is **6 commits ahead of `main`** (post-0.34.1 fixes, never
  published) — that is the Q4 hotfix payload; nothing here rewrites it.
- Per Q4's ruling a `fix/0.34.2-hotfix` branch may later cherry-pick
  OVERLAY S1/S2 + those 6 commits; until ruled, everything lands on the epic
  line only.

---

## Master checklist (plan §5 — Phase 0)

| #   | Wave | Contents (plan §3 slice ids)                                                                                                                                                                   | Status |
| --- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | 0.0  | **Keystone (solo):** ENGINE S1 lazy guarded sheet init (`createStyled.ts`, new `sheet.ts`, `stylePresets.ts`)                                                                                    | ⬜     |
| 2   | 0.1  | **Pure cores (parallel, disjoint new files):** TEST-CI S1 harness (fast-tracked) · FIELDS S1 dateUtils + S2 sliderMath · THEMING S1 themeUtils + S2 createInitialTheme recovery · SECURITY S2/S3 aiKeyStore + S4 svgSafe · GOVERNANCE S6 gate scripts + S9 devErrors (module only) · MCP-TRUTH S1/S2/S5 extractor fixes · OVERLAY S1 focus trap · TEST-CI S2/S4 suites | ⬜     |
| 3   | 0.2  | **Serialized shared-file lanes:** (a) root package.json: TEST-CI S1 scripts → PACKAGING S2 prepack/verify-pack → PACKAGING S1 metadata → ENGINE S5 check:engine · (b) css lane: ENGINE S2 compile → TEST-CI S3 normalize extraction → ENGINE S4 presets · (c) index.ts: MCP-TRUTH S3 KeyModal move → API-TYPES S1 exports · (d) valet-mcp package.json: MCP-TRUTH S6 · TEST-CI S5 TZ suite (after FIELDS S1) | ⬜     |
| 4   | 0.3  | **Component edits (parallel disjoint; serialized within contended files):** ENGINE S3 prefixes → PERF S3 Table · OVERLAY S2 Select · FIELDS S3 Tabs + S4 Accordion · PERF S1 Surface, S2 surfaceStore, S4 List, S5 effect hygiene + Markdown/RichChat fixes (PERF S11 part) · API-TYPES S2 Box/Typography, S3 Button/IconButton · THEMING S6 docs snippet · wave end: GOVERNANCE S9 throw-site sweep | ⬜     |
| 5   | 0.4  | **Docs/config (one writer), then the phase gate:** GOVERNANCE S1 changelog → S2 README/AGENTS → S3 WAG sweep → S5 VALIGNMENT archive · SECURITY S9 amplify pin (S1 ⏸️ until Ben enables PVR) · MCP-TRUTH S11 glossary truth · TEST-CI S8 CI workflow + S10 SSR regression | ⬜     |
| —   | gate | **Phase-0 gate:** CI green on Node 20/22 (lint, typecheck, test, build, mcp:schema:check, verify:pack, check:engine) + manual docs-app sweep                                                     | ⬜     |

## Decisions awaiting Ben

Plan §9 Q1–Q22. **Batch 1** (rule before Phase 1): Q1, Q2, Q3, Q5, Q6, Q7, Q9,
Q13, Q16, Q17, Q20, Q21, Q22 — plus **Q4 (release plan) which should be ruled
first**. **Batch 2** (before Phase 2): Q8, Q10, Q11, Q12, Q14, Q15, Q18, Q19.
The §9 veto-candidate register ships-as-specified unless vetoed; review it with
the batch-1 rulings.

Two Phase-0 items have human dependencies and are tracked ⏸️ rather than
blocking the gate:

- **SECURITY S1** (SECURITY.md rewrite) — merges only after Ben enables GitHub
  Private Vulnerability Reporting on the repo (Settings → Security).
- **Q17 branch protection** — `gh api` commands will be supplied once CI lands.

---

## Wave log

(appended as waves execute)

---

## Flags & Issues

1. **2026-06-10 — audit collateral repaired before branching.** A packaging
   verification agent from the 246-agent audit overwrote root `tsconfig.json`
   with a `nodenext`/`test.mts` probe config and left it dirty. Restored
   byte-for-byte (CRLF endings included) and verified `git diff --quiet` clean
   before creating the epic branch. No other working-tree damage found.
2. **2026-06-10 — plan synthesis recovered from transcript.** The plan workflow's
   synthesis agent emitted the 75KB document as two text blocks; the harness
   returned only the second. Both blocks were recovered from the agent
   transcript and joined at a verified clean mid-sentence seam
   (`…visibleWindow vs` + `paginationWindow)…`). `plan.md` is complete (all 10
   sections present).
3. **Q5 scope note (assumption).** Plan §3.5 S1 says "behavior flip gated Q5;
   extraction + pinned tests land regardless." Phase 0 therefore creates
   `dateUtils.ts` (correct local-date implementations) + TZ-parameterized tests
   proving them, but leaves DateSelector.tsx's three buggy call sites untouched
   until Q5 is ruled (rec: fix now → the swap is then a Phase-1 one-liner with
   tests already green).
