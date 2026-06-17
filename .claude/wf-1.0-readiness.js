export const meta = {
  name: 'valet-1.0-readiness',
  description: 'Assess @archway/valet 1.0 readiness across 14 dimensions, then adversarially verify every blocker/major finding',
  phases: [
    { title: 'Assess', detail: '14 agents, one per readiness dimension, graded + evidence-cited' },
    { title: 'Verify', detail: 'independent skeptic per blocker/major finding' },
  ],
}

const CONTEXT = `
PROJECT: @archway/valet v0.36.0 — a CSS-in-JS engine + React UI component kit + accessibility layer
("treats all humans and their AI proxies as first-class users"). Repo root is the cwd: /home/xbenc/occ/valet.
Layout: src/css (engine: compile/normalize/hash/sheet/presets/lru/styleRegistry/createStyled),
src/system (40 files: themeStore, compactContext, aiKeyStore, devErrors, etc.),
src/components/{primitives,layout,fields,widgets} (104 .tsx), src/hooks, src/helpers, src/utils, src/types,
src/index (barrel). Tests: 101 *.test.ts / *.dom.test.tsx colocated (vitest two-project: node + jsdom via *.dom.test suffix).
docs/ is a Vite docs app (78 pages). packages/valet-mcp (MCP corpus server) + packages/create-valet-app (scaffolder).
scripts/{checks,release,mcp}. Governance: AGENTS.md (17k, the project's own quality bar), CHANGELOG.md,
PROP_PATTERNS_AUDIT.md, COMPACT_REFACTOR_PLAN.md, dx/plans/, dx/RELEASING.md, CONTRIBUTING/SECURITY/LICENSE.
package.json is ESM-only (module/exports -> dist/index.mjs + .d.mts), type:commonjs, sideEffects:["*.css"],
peerDeps react 18/19 + react-dom + zustand (required).

PRE-1.0 POLICY (project's stated rule): hard-rename APIs, NO new aliases, ALL deprecations must be GONE before 1.0.
Note the existing *.deprecate.dom.test.tsx files (RadioGroup, Accordion, Panel, Pagination) — these likely encode
deprecations that this policy says must be removed before 1.0.

TASK: Evaluate readiness to cut a STABLE 1.0 (a SemVer commitment to API stability). Be rigorous and concrete.
Ground every finding in evidence: cite file:line and quote the relevant code. You may run read-only commands
(grep/find/cat) and the project's own check scripts (npm run typecheck / test / lint / check:package / check:bundle /
build) when they sharpen your judgment — but do not modify files. Prefer reading actual source over assuming.
Grade your dimension: "ready" (freeze it as-is), "minor-gaps" (ship 1.0, fix soon), "at-risk" (should fix before 1.0),
"blocker" (must fix before 1.0). A finding's severity: blocker = must-fix-before-1.0, major = strongly-should,
minor = nice-to-have, info = note. Distinguish a true 1.0 blocker from a generic improvement.
`

const DIMENSIONS = [
  {
    key: 'exports-api',
    title: 'Public API surface & export stability',
    prompt: `Assess the PUBLIC API surface that 1.0 would freeze. Read src/index.ts (the barrel) and trace what is
exported: components, hooks, system functions (theme, stores), types, helpers. Evaluate: (1) Is the export set
intentional and complete, or are internals leaking that we'd regret freezing? (2) Naming consistency across the
surface (component names, prop names, hook names, store names). (3) Are there exports that are clearly unstable /
experimental / undocumented but publicly reachable? (4) Polymorphic component API (PolymorphicProps/Ref/Component,
'as' prop) consistency. (5) Any default exports vs named-export inconsistency. (6) Anything exported that duplicates
or conflicts. List concrete items that should be added/removed/renamed BEFORE freezing the surface for 1.0.`,
  },
  {
    key: 'deprecations',
    title: 'Deprecation cleanup vs pre-1.0 policy',
    prompt: `The project's pre-1.0 policy is: ALL deprecations gone before 1.0, hard-rename, no aliases. Find every
remaining deprecation and alias. Grep the whole repo for: "@deprecated", "deprecat", "alias", "legacy", "TODO",
"FIXME", "remove before 1.0", "remove in", "back-compat", "backwards". Read the *.deprecate.dom.test.tsx files
(RadioGroup, Accordion, Panel, Pagination) and identify exactly what deprecated API each one exercises and whether
the deprecated path still exists in source. Produce the COMPLETE inventory of deprecated/aliased/legacy public API
that the policy requires removing before 1.0 — each as a finding with file:line. This is a direct policy-compliance
check; treat each surviving public deprecation as at least a major (likely blocker) finding.`,
  },
  {
    key: 'prop-consistency',
    title: 'Prop pattern & controlled-component consistency',
    prompt: `Read PROP_PATTERNS_AUDIT.md and assess how thoroughly its recommendations were carried out in current
source. Evaluate prop-shape consistency across components for 1.0 freeze: controlled/uncontrolled contract
(value/defaultValue/onChange), the ChangeInfo/OnValueChange/OnValueCommit/InputPhase/InputSource vocabulary in
src/types, size/variant/color prop conventions, boolean prop naming, spacing props (pad/gap/compact/density), sx /
preset patterns. Check src/components/fields/controlledContract.dom.test.tsx and fieldDomLeak test for the intended
contract, then verify components conform. Flag inconsistencies that would be painful to fix after 1.0 freezes them.`,
  },
  {
    key: 'engine',
    title: 'CSS-in-JS engine robustness',
    prompt: `Deeply assess the styling engine in src/css (compile.ts, normalize.ts, hash.ts, sheet.ts, lru.ts,
stylePresets.ts, styleRegistry.ts, createStyled.tsx) and its tests. This is the foundation 1.0 must stand on.
Evaluate: correctness of the template compiler (interpolation, falsy-drop, nested selectors), the quote/url()-aware
normalizer, hash determinism/collision risk, the LRU cache (eviction correctness, memory growth), stylesheet
insertion (insertRule failure handling, ordering, HMR/preset redefinition), and createStyled's prop filtering /
forwarding. Run 'npm run check:engine' and 'npm test -- src/css' if useful. Identify correctness bugs, edge cases,
or design fragilities that should be resolved before freezing the engine API + behavior for 1.0.`,
  },
  {
    key: 'a11y',
    title: 'Accessibility (core value proposition)',
    prompt: `Accessibility is valet's explicit core promise. Audit it for 1.0. Check the *.a11y.dom.test.tsx files
(Accordion, Tabs, LLMChat, Tooltip) and labelsWiring.dom.test.tsx, then audit interactive components across
src/components/{fields,layout,widgets} for: correct ARIA roles/states/properties, label association (htmlFor/
aria-labelledby/aria-describedby), keyboard operability (Tab/arrow/Esc/Enter/Space), focus management & focus trap
(Modal/Drawer/Select — check the focus-trap implementation in src/system or helpers), prefers-reduced-motion support
(usePrefersReducedMotion + reducedMotion styled test), and roving tabindex / listbox / menu / dialog semantics.
Identify components with missing or incorrect a11y semantics. Given a11y is the headline feature, weight gaps heavily.`,
  },
  {
    key: 'tests',
    title: 'Test coverage & quality',
    prompt: `Assess test coverage and quality. There are ~104 component .tsx and ~101 test files. Determine which
components and which src/system & src/css & src/hooks & src/helpers modules have NO colocated test (list them).
Run 'npm test' and report pass/fail and any flakiness/skips. Optionally enable coverage if the config supports it.
Evaluate test QUALITY, not just presence: are tests asserting behavior/contracts or just smoke-rendering? Are
critical paths (focus trap, controlled contract, SSR, engine normalize, aiKeyStore crypto) covered with real cases?
Identify the riskiest UNTESTED or under-tested surfaces that 1.0 should not ship without.`,
  },
  {
    key: 'types-packaging',
    title: 'TypeScript types & npm packaging',
    prompt: `Assess type quality and npm packaging for 1.0. Build if needed ('npm run build') then run
'npm run check:package' (publint + attw esm-only) and 'npm run verify:pack', and 'npm run typecheck'. Read
package.json exports/files/types/module/sideEffects, tsup.config.ts, tsconfig*.json, dx/type-tests probes.
Evaluate: exports map correctness (ESM-only intentional? any CJS consumer left stranded?),
.d.mts type emission quality, "are the types wrong" (attw) results, tree-shaking (sideEffects accuracy — only
*.css?), peerDependency ranges (react 18/19, zustand required — is required-zustand the right call for 1.0?),
whether public types are exported vs inferred-only, and any 'any'/'unknown' leakage in the public type surface.
Flag packaging issues that would break real consumers or be hard to change post-1.0.`,
  },
  {
    key: 'ssr',
    title: 'SSR & non-DOM environment robustness',
    prompt: `Assess server-side-rendering / non-DOM safety for 1.0. Read src/ssr-import.test.ts, src/css/sheet.ts
(document-guarded lazy init, pending-rule flush), and grep the whole src tree for unguarded browser-global access
at module scope or in render: document, window, navigator, localStorage, matchMedia, IntersectionObserver,
ResizeObserver, requestAnimationFrame, crypto. Run 'npm run check:engine' (import-no-throw in Node). Evaluate:
does importing valet in Node throw? Does renderToString work and emit deterministic classes? Do components that
touch browser APIs guard them or use effects? Is hydration-safe (no class mismatch)? Identify any SSR-breaking
or hydration-mismatch risks that a 1.0 used in Next.js/Remix would hit.`,
  },
  {
    key: 'security',
    title: 'Security posture',
    prompt: `Security audit for 1.0. Read SECURITY.md, src/helpers/svgSafe.ts (+ test), src/system/aiKeyStore.ts
(WebCrypto key storage, +test), the Icon component's svg vs dangerouslySetSvg handling, and LLMChat/RichChat
(API key handling, model calls, any secret exposure). Run 'npm audit --omit=dev' and report real vulns in the
shipped dependency tree (@iconify/react, highlight.js, marked, react-dropzone). Evaluate: XSS surface (svg/markdown
rendering via marked + highlight.js — is sanitization correct?), the dangerouslySetSvg escape hatch naming/docs,
crypto correctness in aiKeyStore, and whether any AI-key/secret can leak. Flag exploitable or risky issues; note
that valet renders potentially AI-generated/untrusted content (svg, markdown) as a design goal.`,
  },
  {
    key: 'docs',
    title: 'Documentation & MCP corpus accuracy',
    prompt: `Assess documentation completeness/accuracy for 1.0. Compare the exported public components/APIs against
docs coverage: list docs/src/pages/components/*.tsx and concepts/getting-started pages; determine which public
components or major APIs have NO docs page. Spot-check 4-5 docs pages against current source for accuracy (stale
prop names, removed APIs, the recent density 'compact'->'tight' rename, fonts-no-autoload breaking change). Read
README.md for accuracy. Assess the MCP corpus pipeline (scripts/mcp + mcp-data/components): does mcp:check /
mcp:schema:check pass, is the corpus fresh vs source, and is it accurate (recall the 0.35.0 absolute-path leak that
0.35.1 fixed)? Flag undocumented public surface and stale/inaccurate docs that 1.0 shouldn't ship with.`,
  },
  {
    key: 'ci-release',
    title: 'Build / CI / release maturity',
    prompt: `Assess CI and release engineering for 1.0. Read .github/workflows/ci.yml + validate-cva.yml,
scripts/release/{check-changelog,check-pins}.mjs, scripts/verify-pack.mjs, scripts/check-bundle.mjs, dx/RELEASING.md,
dx/PUBLISH_ORDER.md, amplify.yml. Evaluate: do the CI gates (lint, typecheck, test, build, mcp:schema:check,
verify:pack, check:engine on Node 20/22) adequately protect a 1.0? Gaps: no coverage gate? no a11y CI? no bundle-size
gate in PR CI? CVA validation only weekly (acceptable?). Is the release process reproducible and documented? Is
CHANGELOG discipline enforced (Keep a Changelog + SemVer)? Is there a deprecation/breaking-change policy doc suitable
for a post-1.0 world (how will breaking changes be handled after the stability commitment)? Flag process gaps that
make a confident 1.0 cut risky.`,
  },
  {
    key: 'ecosystem',
    title: 'create-valet-app & valet-mcp quality',
    prompt: `Assess the ecosystem packages for 1.0 alignment. packages/create-valet-app (the scaffolder): read its
templates and validate logic; do generated apps use CURRENT (non-deprecated) APIs, current font-loading (explicit,
post-breaking-change), and lint/typecheck/build cleanly? packages/valet-mcp (the MCP server that serves the corpus):
read its tooling and tests (scripts/mcp/*.test.mjs, serverTools.test, selfcheck) — is it version-pinned/consistent
with @archway/valet@0.36.0 and reproducible? Evaluate version-pinning discipline between the three packages (the
recent lockfile-resync commits suggest friction). Flag anything in these packages that would embarrass or mislead a
1.0 adopter (e.g. scaffolds using deprecated props, stale MCP corpus).`,
  },
  {
    key: 'perf-bundle',
    title: 'Performance & bundle size',
    prompt: `Assess runtime performance and bundle size for 1.0. Build ('npm run build') then run
'npm run check:bundle' and 'npm run check:bench' and read scripts/check-bundle.mjs + scripts/checks/engine-bench.mjs.
Read src/components/renderCount.dom.test.tsx and stylePrecedence test for render-cost expectations. Evaluate: total
+ per-entry bundle size and whether heavy deps (highlight.js, marked, @iconify/react, react-dropzone) are
tree-shakeable / lazy-loaded or always pulled in; the engine's per-render cost (cache hit path, class generation);
any obvious re-render hotspots (context usage — note the new compact React context that crosses portals; does it
cause broad re-renders?). Flag perf/size issues that a 1.0 should address or at least document.`,
  },
  {
    key: 'project-bar',
    title: "Project's own 1.0 bar & roadmap gaps",
    prompt: `Establish the PROJECT'S OWN definition of done for 1.0 and measure remaining distance. Read AGENTS.md
fully (the project's quality bar/conventions), dx/plans/ (valet-overhaul-2026-06-10 and valet-mcp-upgrade-2026-06-12 —
look for plan.md/execution.md, open decisions, veto registers, hand-off lists), COMPACT_REFACTOR_PLAN.md, the
PROP_PATTERNS_AUDIT.md status, and the CHANGELOG "Unreleased" section + recent releases to infer trajectory and what
the maintainer still considers open. Extract: (1) any explicit 1.0 criteria or "before 1.0" notes the project states
about itself, (2) open/unresolved items in the plans, (3) the gap between current state and the maintainer's stated
intent. Report these as findings (the maintainer's own stated blockers carry blocker severity). This grounds the
readiness verdict in the project's own standards rather than generic ones.`,
  },
]

const ASSESSMENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['dimension', 'grade', 'summary', 'findings', 'strengths'],
  properties: {
    dimension: { type: 'string' },
    grade: { type: 'string', enum: ['ready', 'minor-gaps', 'at-risk', 'blocker'] },
    summary: { type: 'string', description: '2-4 sentence verdict for this dimension' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'severity', 'evidence', 'recommendation'],
        properties: {
          title: { type: 'string' },
          severity: { type: 'string', enum: ['blocker', 'major', 'minor', 'info'] },
          evidence: { type: 'string', description: 'file:line citation(s) + quoted/paraphrased proof' },
          recommendation: { type: 'string', description: 'concrete fix' },
        },
      },
    },
    strengths: { type: 'array', items: { type: 'string' }, description: 'what is genuinely 1.0-solid here' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'confidence', 'reasoning', 'adjustedSeverity'],
  properties: {
    verdict: { type: 'string', enum: ['confirmed', 'refuted', 'partial'] },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    reasoning: { type: 'string', description: 'what you checked in source and concluded' },
    adjustedSeverity: {
      type: 'string',
      enum: ['blocker', 'major', 'minor', 'info', 'not-a-blocker'],
      description: 'severity after independent verification',
    },
  },
}

phase('Assess')
log(`Assessing ${DIMENSIONS.length} dimensions; each blocker/major finding then gets an independent skeptic.`)

const results = await pipeline(
  DIMENSIONS,
  (d) =>
    agent(`${CONTEXT}\n\nYOUR DIMENSION: ${d.title}\n\n${d.prompt}\n\nReturn a structured assessment. Set dimension="${d.key}".`, {
      label: `assess:${d.key}`,
      phase: 'Assess',
      schema: ASSESSMENT_SCHEMA,
    }),
  (assessment, dimension) => {
    if (!assessment) return null
    const toVerify = (assessment.findings || []).filter((f) => f.severity === 'blocker' || f.severity === 'major')
    if (toVerify.length === 0) return { assessment, verifications: [] }
    return parallel(
      toVerify.map((f) => () =>
        agent(
          `${CONTEXT}\n\nYou are an INDEPENDENT SKEPTIC verifying a claimed 1.0-readiness ${f.severity} for the "${dimension.key}" dimension.\n` +
            `CLAIM: ${f.title}\nSTATED EVIDENCE: ${f.evidence}\nPROPOSED FIX: ${f.recommendation}\n\n` +
            `Open the cited files yourself and check whether this is REALLY a 1.0 blocker/major issue. Try to REFUTE it: ` +
            `is the evidence accurate, is it actually public/shipped (not internal/dev-only), is it truly must-fix-before-1.0 ` +
            `or just a nice-to-have, and is the severity right? Default toward downgrading if the case is weak or speculative. ` +
            `Return your verdict with the severity you'd actually assign.`,
          { label: `verify:${dimension.key}:${f.title.slice(0, 28)}`, phase: 'Verify', schema: VERDICT_SCHEMA },
        ).then((v) => ({ finding: f, dimension: dimension.key, verdict: v })),
      ),
    ).then((verifications) => ({ assessment, verifications: verifications.filter(Boolean) }))
  },
)

const clean = results.filter(Boolean)

const verifiedFindings = []
for (const r of clean) {
  for (const v of r.verifications || []) {
    verifiedFindings.push({
      dimension: v.dimension,
      title: v.finding.title,
      claimedSeverity: v.finding.severity,
      evidence: v.finding.evidence,
      recommendation: v.finding.recommendation,
      verdict: v.verdict?.verdict ?? 'unknown',
      confidence: v.verdict?.confidence ?? 'unknown',
      adjustedSeverity: v.verdict?.adjustedSeverity ?? v.finding.severity,
      verifierReasoning: v.verdict?.reasoning ?? '',
    })
  }
}

const assessments = clean.map((r) => r.assessment)

const unverifiedMinor = []
for (const a of assessments) {
  for (const f of a.findings || []) {
    if (f.severity !== 'blocker' && f.severity !== 'major') {
      unverifiedMinor.push({ dimension: a.dimension, ...f })
    }
  }
}

const confirmedBlockers = verifiedFindings.filter(
  (f) => f.verdict !== 'refuted' && f.adjustedSeverity === 'blocker',
)
const confirmedMajors = verifiedFindings.filter(
  (f) => f.verdict !== 'refuted' && f.adjustedSeverity === 'major',
)

log(
  `Done. ${assessments.length} dimensions assessed; ${verifiedFindings.length} blocker/major findings verified ` +
    `-> ${confirmedBlockers.length} confirmed blockers, ${confirmedMajors.length} confirmed majors.`,
)

return {
  gradeByDimension: assessments.map((a) => ({ dimension: a.dimension, grade: a.grade, summary: a.summary })),
  assessments,
  verifiedFindings,
  confirmedBlockers,
  confirmedMajors,
  unverifiedMinor,
}
