# Verification Record

> **Status: REFERENCE** — two layers of verification sit behind this analysis:
> (1) the workflow's **adversarial pass** (each claimed blocker handed to an
> independent skeptic agent told to refute it), recorded inline per-blocker in
> [`findings.md`](findings.md) and [`product-readiness.md`](product-readiness.md);
> and (2) **independent hand spot-checks** against the live `main` tree at
> v0.37.0, transcribed below so the load-bearing claims are reproducible.

## 1. Independent ground-truth spot-checks (2026-06-27, `main` @ 0.37.0)

Run directly against the working tree, not relayed from agents.

| # | Claim | Command (abbreviated) | Result |
|---|---|---|---|
| 1 | W1 deprecation sweep landed | `ls src/system/deprecate.ts`; `grep -rln '@deprecated' src/components` | ✅ `deprecate.ts` **absent**; **0** `@deprecated` in `src/components` |
| 2 | Experimental→stable nearly done (on disk) | `grep -rho '"status"...' src/components \| sort \| uniq -c` | **60 `stable` / 3 `experimental`** across 63 `*.meta.json` |
| 3 | The 3 still-experimental | `grep -rl '"status".*"experimental"' src/components` | `RichChat`, `LLMChat`, `KeyModal` |
| 4 | Served corpus disagrees with disk | `node -e '…mcp-data/index.json'` | **62 components → 59 stable / 3 experimental** (drift vs #2; `ValetLocaleProvider` missing from corpus) |
| 5 | `Intent` ↔ palette mismatch | `grep "type Intent" src/types.ts`; grep `success\|warning\|info` in `themeUtils.ts` | ✅ `Intent` at `types.ts:61` advertises them; palette defines **none** |
| 6 | `icon` prop type collision | `grep "icon\??:" Icon.tsx SpeedDial.tsx Chip.tsx` | ✅ `Icon.tsx:18 icon?: string` (vs `SpeedDial` required `ReactNode`) |
| 7 | WCAG 1.4.4 pinch-zoom shipped | `grep -rln 'user-scalable=no\|maximum-scale=1' docs packages/create-valet-app` | ✅ **4 files**: `docs/index.html` + `templates/{ts,js,hybrid}/index.html` |
| 8 | `VERSIONING.md` stale line | `grep -n "every component is currently flagged" VERSIONING.md` | ✅ `VERSIONING.md:78` still asserts "every component is currently flagged `experimental`" |
| 9 | injectRemote flipped privacy-default | changelog + `grep -rn injectRemote src` | ✅ default `false` (privacy-by-default), per `[0.37.0]` BREAKING entry |
| 10 | 0.37.0 is an intentional dogfood minor | `CHANGELOG.md` `[0.37.0]` header | ✅ "1.0.0 follows as the stability declaration once it is proven in use" |

All ten checks **confirmed** the corresponding analysis claims. Items #4, #6, #7, #8
were *added by the completeness critic* (not in the workflow's own verify pass) and
are confirmed here.

## 2. Adversarial pass — what was refuted or downgraded

The workflow handed every `blocker`/`high` finding to an independent skeptic. Per
the synthesis, these were **dropped from the prioritized list** as refuted or
downgraded (full per-finding verdicts in [`findings.md`](findings.md)):

- **"FieldBaseProps over-promises `fullWidth`/`helperText`/`error`"** → only
  `fullWidth` is a no-op; additive to fix. Downgraded.
- **"AI-proxy marker is a defeatable source-scan"** → 41/47 components carry
  *runtime* root assertions. Refuted.
- **"No SSR/SSG template" as a freeze blocker** → separate package, outside the
  frozen barrel. Downgraded to fast-follow.
- **"Committed coverage report" / "no written dogfood exit criteria" as *high***
  → real but hygiene / intentionally human-reserved. Downgraded to low.
- The **dogfood→1.0 exit-criteria** finding was itself downgraded `high → low` by
  its verifier (an intentional human release decision, not a code/API/a11y defect),
  but is retained in the roadmap as risk #3 because it gates *when* the cut happens.

## 3. Method & reproducibility

- Workflow: 38 agents, ~2.4M tokens, 781 tool calls, ~18 min wall-clock.
  Script persisted at
  `.claude/projects/.../workflows/scripts/valet-1-0-readiness-wf_fc0c4911-518.js`;
  re-runnable / resumable.
- The prior 14-dimension eval (v0.36.0) is re-runnable via
  `.claude/wf-1.0-readiness.js` per `../valet-1.0-prep-2026-06-14/plan.md:275-277`.
- **Recommendation:** re-run this analysis against the post-fix surface immediately
  before the freeze (roadmap Phase 3) to confirm no regression and a moved score.
