# Completeness-Critic Corrections

> **Status: REFERENCE** — the completeness/correctness critic's pass over the draft
> roadmap (2026-06-27, v0.37.0). It flags verified findings the synthesis omitted or
> under-weighted, factual contradictions, and sequencing corrections. The
> load-bearing items here are folded into [`plan.md`](plan.md) §0 (verified
> corrections) and the blocker tables. Preserved in full for traceability.

---

Verified the load-bearing claims. Here is my critique.

# Critique of the Draft 1.0 Report — Corrections & Additions

## What is strongest (keep as-is)
- The **irreversible-vs-additive framing** is the right organizing principle and is applied correctly to the big items (SSR, virtualization, R3F primitives → fast-follow; Intent/SelectOptionProps/thickness → freeze-gating).
- The draft **correctly dropped the two refuted blockers** (FieldBaseProps `fullWidth`/helperText over-promise — only `fullWidth` is a no-op; AI-proxy marker source-scan — 41/47 have runtime root assertions) and downgraded the committed-`coverage/` and dogfood-criteria items to hygiene. This matches the verifier verdicts.
- The **named-export snapshot + leak curation (P0 #1)** and **Intent↔palette (P0 #2)** are the two genuinely correct top-priority irreversibles.

## Factual contradictions in the draft to fix
- **Component count is wrong/unreconciled.** The draft repeatedly says "60 of 63 stable." The *shipped MCP corpus* (`mcp-data/index.json`) serves **62 components: 59 stable / 3 experimental**. The 62-vs-63 and 59-vs-60 split is itself the tracker drift risk #7 warns about — the final report should not assert a confident number until the trackers + corpus agree. (The corpus is also missing `ValetLocaleProvider`, so the served count is structurally short — draft #23 addresses adding it but doesn't connect it to the count discrepancy.)
- **`VERSIONING.md` itself still carries the "stale" premise the exec summary mocks.** VERSIONING.md:78-79 literally reads *"every component is currently flagged `experimental` while each is re-verified."* That is factually false against the 59-stable corpus and self-contradicts the same paragraph. DoD item B says "re-affirm the carve-out" but misses that **the current wording must be rewritten** at the cut to state the final disposition (the 3 that remain experimental), not just re-affirmed.
- **Library readiness "85%" is over-stated.** The frozen-vocabulary subsystems sit much lower — Theme 71, Fields 72, Widgets 74, Docs 70, MCP 76, Scaffolder 58. The subsystem mean is ~76, and the lowest ones are exactly the *frozen* surfaces (theme tokens, field types). "85%" should be tempered to ~78-80 and explicitly note the drag is concentrated in frozen-vocabulary areas.

## Verified findings the draft omitted or under-weighted
- **The WCAG 1.4.4 pinch-zoom fix is in the WRONG/incomplete location.** Draft #18 only names the create-valet-app templates. `docs/index.html:8` **also** ships `maximum-scale=1, user-scalable=no`, as do **all three** scaffold templates (ts/js/hybrid). The fix is 4 files, and the docs-site instance is the more visible a11y-first credibility hit. Add docs/index.html explicitly.
- **`icon` prop-type collision is a missing freeze-gating vocabulary item.** Verified: `Icon`/`IconButton`/`Chip` declare `icon?: string`; `SpeedDial` declares `icon: React.ReactNode` (required). Same prop name, incompatible type *and* optionality, all frozen at 1.0. The public-API data also flags `data`, `title`, `size`, `variant` overloads. The draft's Phase-0 frozen-vocabulary batch lists 7 items but **omits this entire PROP_PATTERNS class** — at minimum it needs a recorded accept-or-fix decision per item before the cut (the data's P2), not silent freezing.
- **Frozen JSDoc/type drift ships in the published `.d.mts`.** Theme motion comments are wrong (`xshort` "~120ms" actual 100ms; `long` "~420ms" actual 380ms) and `Button.tsx:30`/`Chip.tsx:30` JSDoc claims intent "maps to theme tokens" while 4/7 don't. These comments freeze into the shipped types. Cheap, belongs in the Phase-0 batch.
- **CHANGELOG gate is not enforced in CI** (only at release time). A PR adding public API without an `## Unreleased` entry passes CI — directly undermines the "frozen surface stays documented" discipline at the exact moment it matters. Add `check-changelog` in `--warn` to CI. Not mentioned in the draft.
- **Root package missing `engines` + `publishConfig`** (both sub-packages have them). For an ESM-only es2020 package, consumers/tooling can't read a Node floor. Pair it with the `prepublishOnly` item (#16); the draft mentions only `prepublishOnly`.
- **`primer.ts:64` advertises a data source the server doesn't implement** (`@archway/valet-mcp-data`) — misinformation served to *every* agent calling `get_primer`. Cheap fix, omitted from the draft's MCP items.
- **Corpus example coverage (~47% of components have zero examples)** including `Surface` — the central mental model the primer tells agents to start from — plus Modal/Drawer/Image/Video/WebGLCanvas. For an "AI-build-first / better than docs" positioning this is a real DX gap, not captured anywhere in the draft (DoD E covers *pages*, not *examples*). Add as P2/fast-follow.
- **Typography/ProgressRing raw `useLayoutEffect`** emits the SSR console warning for every Typography on a server render (W/A). Minor but real and absent from the draft's SSR discussion.

## Sequencing / weighting corrections
- **R3F (G) — the named highest-risk lens — has ALL its primitives deferred to fast-follow, which contradicts the data's own guidance** that "G is where pre-freeze additive investment pays the most." The draft reserves the SSR per-request context shape pre-freeze (risk #2) but applies *no equivalent reasoning to G*. Recommendation: land the **Surface transparent/pass-through overlay mode, `modal={false}`, and exported `Presence`/HUD-layer primitive INTO the frozen 1.0 surface**, not after — so the headline novel lens is guaranteed first-class at 1.0 rather than depending on a consumer guaranteed to be on ≥1.x. At minimum, reserve their shapes pre-freeze exactly as SSR is.
- **The production immortal-rule leak (engine medium blocker) is presented only as a G *strength* in the draft.** The dev cardinality tripwire is `NODE_ENV==='production' ? null` — so in production a continuous value baked into a `styled` template leaks unbounded CSSOM rules with **zero warning**, precisely in the rAF/HUD path. The R3F doc (#19) carries the CSS-var mitigation, but the draft should also surface the engine rec to add a **production-observable cardinality signal** (or at least flag the leak as a known production footgun), not just frame the dev tripwire as de-risking.
- **DateSelector is a structural exception to "render errors on all 9 fields" (P0 #5).** It doesn't extend `FieldBaseProps`, has no `helperText`, and renders no error text at all. "All 9 fields" needs an explicit carve/decision for DateSelector (align to FieldBaseProps or document the divergence), or the DoD item is unmeetable as written.
- **Intent fix scope is understated.** It freezes across `Button`, `Chip`, **`IconButton`, `Panel`, `AppBar`** (all share `Intent`), not just Button/Chip. The fix and its WCAG-hue verification must cover all five fallback paths.

## Net
The draft is solid and the priority ranking is largely correct. The most important concrete fixes: (1) reconcile the **62/59** corpus reality and rewrite the stale `VERSIONING.md:78-79` "every component experimental" sentence; (2) add the **`icon`/data/title/size/variant** collision triage to the Phase-0 frozen-vocabulary batch; (3) extend the pinch-zoom fix to **docs/index.html**; (4) reconsider deferring **all** R3F primitives — put the overlay/Presence surface into the freeze, since G is the named highest-risk lens and additive-into-a-frozen-barrel is cleaner than bolt-on; (5) add the CHANGELOG-in-CI, root `engines`/`publishConfig`, and `primer.ts` data-source corrections.