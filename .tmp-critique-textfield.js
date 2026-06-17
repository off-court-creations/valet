export const meta = {
  name: 'critique-textfield',
  description: 'Full workflow critique of TextField (+ FormControl) — diagnose, then recommend improve/rewrite/overhaul with a concrete spec',
  phases: [
    { title: 'Recon', detail: 'TextField + root-causes, FormControl + binding, valet conventions, MUI/Radix/Chakra/Ant' },
    { title: 'Design', detail: '3 stances critique + propose (TextField AND FormControl), each red-teamed' },
    { title: 'Judge', detail: '2 judges rank + extract the best fixes' },
    { title: 'Spec', detail: 'one verdict + concrete spec for TextField (+ FormControl changes)' },
  ],
}

const DESIGN_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['stance','summary','textFieldVerdict','formControlVerdict','fixKnownIssue','fixLooks','fixReliability','formControlChanges','spec','proposedApi','apiCompatibility','risks'],
  properties: {
    stance: { type: 'string' },
    summary: { type: 'string' },
    textFieldVerdict: { type: 'string', enum: ['improve','rewrite','overhaul'] },
    formControlVerdict: { type: 'string', enum: ['none','improve','rewrite','overhaul'] },
    fixKnownIssue: { type: 'string', description: 'How it fixes the known width issue (bare TextField at UA-default ~20ch, not content/row-aware) and any other diagnosed known bug.' },
    fixLooks: { type: 'string', description: 'How it fixes the visuals (variant/border/label/focus/helperText) to look good and consistent with Button/Checkbox/Switch via the intent contract.' },
    fixReliability: { type: 'string', description: 'How it fixes the it-never-worked-great problems (controlled contract, focus/blur, autofill, a11y, SSR).' },
    formControlChanges: { type: 'string', description: 'Concrete FormControl changes proposed (or why none) — binding, error/helperText propagation, layout, submission.' },
    spec: { type: 'string', description: 'Full implementation approach as markdown: styled structure, label model, width/sizing, color via intentVars, a11y, controlled/FormControl wiring, reduced-motion, marker.' },
    proposedApi: { type: 'string', description: 'TextField (and any FormControl) prop table with TS types + defaults. Prefer preserving the public API; call out changes.' },
    apiCompatibility: { type: 'string', description: 'What stays identical vs changes for existing consumers, + any codemod.' },
    risks: { type: 'array', items: { type: 'string' } },
  },
}
const CRITIQUE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['weaknesses','stillBroken','inconsistencies','formControlRisk','overengineered','verdictChallenge','score'],
  properties: {
    weaknesses: { type: 'array', items: { type: 'string' } },
    stillBroken: { type: 'array', items: { type: 'string' }, description: 'Where the known issue / looks / reliability would STILL be wrong under this design.' },
    inconsistencies: { type: 'array', items: { type: 'string' }, description: 'Divergence from valet conventions (intentVars, sibling fields, useFieldState/FormControl, a11y wiring).' },
    formControlRisk: { type: 'string', description: 'Does the proposed FormControl change break other bound fields (Checkbox/Switch/Slider/Select)? How risky?' },
    overengineered: { type: 'array', items: { type: 'string' } },
    verdictChallenge: { type: 'string', description: 'Is the improve/rewrite/overhaul verdict honest? Argue.' },
    score: { type: 'number', description: '0-10.' },
  },
}
const JUDGE_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['ranking','bestIssueFixes','bestLooksFixes','bestFormControlIdeas','recommendedTextFieldVerdict','recommendedFormControlVerdict','rationale'],
  properties: {
    ranking: { type: 'array', items: { type: 'string' } },
    bestIssueFixes: { type: 'array', items: { type: 'string' } },
    bestLooksFixes: { type: 'array', items: { type: 'string' } },
    bestFormControlIdeas: { type: 'array', items: { type: 'string' } },
    recommendedTextFieldVerdict: { type: 'string', enum: ['improve','rewrite','overhaul'] },
    recommendedFormControlVerdict: { type: 'string', enum: ['none','improve','rewrite','overhaul'] },
    rationale: { type: 'string' },
  },
}
const SPEC_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['headline','textFieldVerdict','formControlVerdict','rootCauses','widthModel','visualModel','labelModel','sizingA11y','controlledFormControl','formControlChanges','styledStructure','proposedApi','apiCompatibility','testPlan','implementationSteps','risks','openQuestions'],
  properties: {
    headline: { type: 'string', description: 'One-paragraph executive answer: what to do with TextField and FormControl and why.' },
    textFieldVerdict: { type: 'string', enum: ['improve','rewrite','overhaul'] },
    formControlVerdict: { type: 'string', enum: ['none','improve','rewrite','overhaul'] },
    rootCauses: { type: 'string', description: 'Diagnosed actual causes (file:line) of the known width issue, the bad looks, and the never-worked-great reliability problems.' },
    widthModel: { type: 'string', description: 'The recommended width/row-awareness model (default width, fullWidth, content-aware, how it sits in a Stack row). Markdown.' },
    visualModel: { type: 'string', description: 'Variant/border/label/focus/helperText visuals via the intent contract, consistent with the sibling fields. Markdown.' },
    labelModel: { type: 'string', description: 'Label pattern (static vs floating), helperText + error, placeholder. Markdown.' },
    sizingA11y: { type: 'string', description: 'Size scale, mobile touch comfort, and a11y (native input, label association, aria-describedby/invalid, focus ring).' },
    controlledFormControl: { type: 'string', description: 'Controlled/uncontrolled via useFieldState + FormControl name-binding + the ChangeInfo event contract.' },
    formControlChanges: { type: 'string', description: 'The recommended FormControl changes (or none), and why — keeping the other bound fields working.' },
    styledStructure: { type: 'string', description: 'The concrete styled() structure + transient props + reduced-motion guard + data-valet-component marker.' },
    proposedApi: { type: 'string', description: 'Final TextField (+ FormControl) prop table with TS types + defaults.' },
    apiCompatibility: { type: 'string', description: 'What stays vs changes for consumers + codemod needs.' },
    testPlan: { type: 'array', items: { type: 'string' } },
    implementationSteps: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    openQuestions: { type: 'array', items: { type: 'string' }, description: 'Decisions for Ben.' },
  },
}

phase('Recon')
log('Recon: TextField + root-causes, FormControl + binding, valet conventions, MUI/Radix/Chakra/Ant')

const CONVENTIONS = [
  'valet conventions the TextField critique must honor (and may propose changing for FormControl):',
  '- Colors via computeIntentVars (src/system/intentVars.ts) like Button/Checkbox/Switch — border/focus/disabled from one shared contract, not ad-hoc literals.',
  '- Styling via the in-house css engine: styled()/keyframes() from src/css; reduced-motion guard via @media (prefers-reduced-motion: reduce); carry the data-valet-component marker.',
  '- Controlled/uncontrolled via useFieldState (src/hooks/useControlledState.ts); FormControl binding by name (src/components/fields/FormControl.tsx); events follow the ChangeInfo source/phase contract (onChange / onValueChange / onValueCommit).',
  '- label + helperText rendered visibly and associated (W2 a11y) via native htmlFor / aria-describedby + aria-invalid; dev accessible-name guard (warnOnce).',
  '- The just-stabilized sibling fields (Checkbox, Switch, Slider) share these patterns + a coarse-pointer >=44px touch target where relevant; TextField should feel like their sibling.',
  '- KNOWN ISSUE logged in the verification tracker: a bare <TextField> sits at the UA default width (~20ch), not content/row-aware, so in a <Stack direction=row> it leaves dead space; fullWidth is the only current escape (TextField.tsx ~197 wrapper width; ~103 input width:100%).',
  '- 1.0 policy: NO deprecated/alias props (hard renames only). Promotion to stable gates on BOTH an agent test pass AND a human visual pass. FormControl changes must not break Checkbox/Switch/Slider/Select binding.',
].join('\n')

const reconTextField = await agent(
  [
    'You are diagnosing the valet TextField, reported as: a KNOWN width issue, it LOOKS BAD, and it has NEVER WORKED GREAT. Read in full:',
    '- src/components/fields/TextField.tsx (~384 lines)',
    '- src/components/fields/TextField.dom.test.tsx, TextField.meta.json',
    'Produce a precise, root-cause report (markdown):',
    '1. The exact current public API (every prop, type, default, behavior) — variants, label, helperText, sizing, width, multiline?, controlled wiring.',
    '2. The KNOWN WIDTH ISSUE: quote the wrapper/input width code with file:line and explain WHY a bare TextField renders at the UA ~20ch default and leaves dead space in a row; what fullWidth does.',
    '3. LOOKS: how it currently renders border/background/label/focus/helperText/disabled (file:line) and why it looks bad / inconsistent with Button/Checkbox/Switch (does it use computeIntentVars? ad-hoc colors? label placement?).',
    '4. NEVER WORKED GREAT: concrete reliability problems — controlled/uncontrolled, focus/blur, autofill, multiline, SSR, a11y (label/helperText association, aria-invalid).',
    '5. How it wires useFieldState + FormControl + the ChangeInfo events.',
    'Be exact and root-cause-oriented.',
    '',
    CONVENTIONS,
  ].join('\n'),
  { phase: 'Recon', label: 'recon:textfield+rootcause' },
)

const reconFormControl = await agent(
  [
    'You are evaluating valet FormControl as a CO-SUBJECT of the TextField critique (Ben: consider changes to FormControl at the same time). Read:',
    '- src/components/fields/FormControl.tsx (~87 lines) + FormControl.dom.test.tsx + FormControl.meta.json',
    '- src/system/createFormStore.ts and src/hooks/useControlledState.ts (useFieldState) — the binding/precedence contract.',
    '- How the now-stable bound fields integrate: src/components/fields/Checkbox.tsx, Switch.tsx, Slider.tsx (and Select.tsx if present) — what they pass to/expect from FormControl.',
    'Produce a markdown report:',
    '1. What FormControl currently does (API, store binding, submission, layout, context it provides).',
    '2. Pain points / gaps: does it propagate error/helperText/disabled to fields? does it own layout/spacing? validation? labels? what is awkward for a TextField specifically (the field most tied to forms)?',
    '3. The binding contract every bound field relies on (so any change keeps Checkbox/Switch/Slider/Select working) — cite file:line.',
    '4. Concrete candidate changes to FormControl that would unlock a better TextField, ranked by value vs blast-radius.',
    '',
    CONVENTIONS,
  ].join('\n'),
  { phase: 'Recon', label: 'recon:formcontrol' },
)

const reconConventions = await agent(
  [
    'You are documenting the valet field CONVENTIONS the TextField critique must match for consistency. Read and summarize the patterns to mirror:',
    '- src/system/intentVars.ts (computeIntentVars / makeMix) and how Button.tsx uses it for border/focus/disabled.',
    '- The just-stabilized sibling fields: src/components/fields/Checkbox.tsx, Switch.tsx, Slider.tsx — their color model (intent vars), size scale, mobile touch pattern (coarse-pointer >=44px), controlled state, and label/helperText a11y wiring. TextField should be their sibling.',
    '- src/hooks/useControlledState.ts (useFieldState) and the ChangeInfo contract (src/system/events.ts).',
    '- src/components/fields/fieldsAccessibleName.a11y.dom.test.tsx + controlledContract.dom.test.tsx (the contracts a stable field must satisfy).',
    'Produce a markdown conventions-to-mirror doc with the exact intentVars usage shape, the sibling size/label/a11y pattern, and the controlled+FormControl wiring TextField must reproduce. Cite file:line.',
    '',
    CONVENTIONS,
  ].join('\n'),
  { phase: 'Recon', label: 'recon:valet-conventions' },
)

const reconBest = await agent(
  [
    'You are a forms/a11y/design expert. Produce a concise best-practices reference for TEXT INPUT (TextField/Input) so valet beats MUI/shadcn. Use WebSearch/WebFetch to verify current guidance if available (load via ToolSearch select:WebSearch,WebFetch); otherwise rely on training knowledge (MUI, Radix, Chakra, Ant, React Aria, react-hook-form).',
    'Cover concretely:',
    '1. Variants and looks: outlined vs filled vs underline; border/background/focus-ring done with theme tokens; how the best libs keep inputs looking crisp and consistent with buttons in light AND dark.',
    '2. Label patterns: static top label vs floating/notched label vs placeholder-as-label (and why placeholder-as-label is an a11y anti-pattern); required/optional; helperText + error text + error color; character count.',
    '3. WIDTH/sizing: why inputs should usually be full-width of their container or explicitly sized (the ~20ch UA default is a known footgun); how MUI/Chakra default (fullWidth opt-in vs default), and content/row-aware sizing.',
    '4. a11y: native <input>/<textarea>, label association (htmlFor), aria-describedby for helper/error, aria-invalid, autocomplete, focus-visible ring, error announcement (aria-live / role=alert).',
    '5. Form integration: how libraries connect inputs to form state/validation (controlled vs uncontrolled, register pattern, error propagation from a form context) — relevant to valet FormControl.',
    '6. The 8-12 best concrete patterns valet should adopt.',
    'Markdown, specific, with code-shaped guidance.',
  ].join('\n'),
  { phase: 'Recon', label: 'recon:best-practices' },
)

const CONTEXT = [
  CONVENTIONS,
  '',
  '================= RECON A: CURRENT TextField + diagnosed root causes =================',
  reconTextField,
  '',
  '================= RECON B: FormControl + binding contract =================',
  reconFormControl,
  '',
  '================= RECON C: valet field conventions to mirror =================',
  reconConventions,
  '',
  '================= RECON D: text-input best practices =================',
  reconBest,
].join('\n')

phase('Design')
log('Design: 3 stances critique + propose (TextField AND FormControl), each red-teamed')

const STANCES = [
  { key: 'surgical-improve',
    angle: 'STANCE: SURGICAL IMPROVE. Argue TextField is fundamentally sound and the right move is targeted: fix the width footgun (sensible default + fullWidth/sizing), restyle via computeIntentVars to look like a sibling of Button/Checkbox/Switch, fix the reliability bugs, and add the label/helperText a11y wiring — WITHOUT a rewrite and with minimal/zero FormControl change. Make the strongest case that improve beats rewrite.' },
  { key: 'clean-rewrite',
    angle: 'STANCE: CLEAN REWRITE. The looks + never-worked-great signal a structural rewrite: a clean styled structure (outlined/filled variants, a proper static or floating label, notch/focus done right), a correct width model, full a11y, and an honest controlled/FormControl contract. Likely verdict rewrite. Be concrete about the new structure.' },
  { key: 'formcontrol-coupled',
    angle: 'STANCE: FORMCONTROL-COUPLED. The biggest win may be at the TextField<->FormControl seam: propose FormControl changes (error/helperText/disabled propagation, a field-shell/layout, validation surface) that let TextField (and the other fields) be simpler and more consistent. Be explicit about how the change keeps Checkbox/Switch/Slider/Select working, and the migration cost.' },
]

const designs = await pipeline(
  STANCES,
  (s) => agent(
    [
      'You are critiquing and redesigning valet TextField (and considering FormControl changes) to fix: a known width issue, bad looks, and never-worked-great reliability — and to be a consistent sibling of Button/Checkbox/Switch, better than MUI/shadcn. ' + s.angle,
      '',
      'Give an honest verdict (improve/rewrite/overhaul for TextField; none/improve/rewrite/overhaul for FormControl) and a CONCRETE, implementable spec: styled structure, the width model, the color model via computeIntentVars, the label/helperText model, a11y, the controlled+FormControl wiring, and any FormControl changes (with their blast radius on the other bound fields). Preserve the public API where possible; call out changes. Ground every decision in the recon below. Be specific enough to implement.',
      '',
      CONTEXT,
    ].join('\n'),
    { schema: DESIGN_SCHEMA, phase: 'Design', label: 'design:' + s.key },
  ),
  (design, s) => design && agent(
    [
      'Ruthlessly red-team this TextField (+ FormControl) proposal. Default to skepticism. Where would the width issue / looks / reliability STILL be wrong? Where does it diverge from valet conventions? Is the improve/rewrite/overhaul verdict honest? CRITICALLY: does the proposed FormControl change break other bound fields (Checkbox/Switch/Slider/Select)? What is overengineered? Score 0-10.',
      '',
      'PROPOSAL (stance ' + s.key + '):',
      JSON.stringify(design, null, 2),
      '',
      'RECON for grounding:',
      CONTEXT,
    ].join('\n'),
    { schema: CRITIQUE_SCHEMA, phase: 'Critique', label: 'critique:' + s.key },
  ).then((critique) => ({ stance: s.key, design, critique })),
)

const proposals = designs.filter(Boolean).filter((d) => d.design && d.critique)
log(proposals.length + '/3 proposals designed + red-teamed')

const block = proposals.map((p, i) => [
  '### Proposal ' + (i + 1) + ' — ' + p.stance,
  'Verdicts: TextField=' + p.design.textFieldVerdict + ', FormControl=' + p.design.formControlVerdict,
  'Summary: ' + p.design.summary,
  'Fix known issue: ' + p.design.fixKnownIssue,
  'Fix looks: ' + p.design.fixLooks,
  'Fix reliability: ' + p.design.fixReliability,
  'FormControl changes: ' + p.design.formControlChanges,
  'Spec:',
  p.design.spec,
  'Proposed API:',
  p.design.proposedApi,
  'API compatibility: ' + p.design.apiCompatibility,
  'Risks: ' + p.design.risks.join(' | '),
  '--- RED TEAM (score ' + p.critique.score + '/10) ---',
  'Weaknesses: ' + p.critique.weaknesses.join(' | '),
  'Still broken: ' + p.critique.stillBroken.join(' | '),
  'Inconsistencies: ' + p.critique.inconsistencies.join(' | '),
  'FormControl risk: ' + p.critique.formControlRisk,
  'Overengineered: ' + p.critique.overengineered.join(' | '),
  'Verdict challenge: ' + p.critique.verdictChallenge,
].join('\n')).join('\n\n=====================\n\n')

phase('Judge')
log('Judge: 2 judges rank + extract the best fixes')

const JUDGE_LENSES = [
  'CORRECTNESS & CONSISTENCY — which proposal best fixes the width issue + looks + reliability AND makes TextField a true sibling of Button/Checkbox/Switch; which FormControl stance is right; which is most clearly correct and safe for the other bound fields.',
  'VALUE vs RISK — which proposal delivers the most user-visible improvement for the least blast radius (especially any FormControl change), and is realistically shippable for 1.0 with a stable public API.',
]
const judgments = await parallel(JUDGE_LENSES.map((lens, i) => () => agent(
  [
    'Judge ' + (i + 1) + ' choosing the TextField (+ FormControl) direction through this lens:',
    lens,
    '',
    'Rank the proposals best-to-worst (by stance) with a one-line why each. Extract the strongest known-issue/width fixes, looks fixes, and FormControl ideas across ALL proposals. Recommend a verdict for TextField and for FormControl.',
    '',
    'PROPOSALS (with red-team):',
    block,
    '',
    'RECON:',
    CONTEXT,
  ].join('\n'),
  { schema: JUDGE_SCHEMA, phase: 'Judge', label: 'judge:' + (i + 1) },
)))

const judgesBlock = judgments.filter(Boolean).map((j, i) => [
  '### Judge ' + (i + 1) + ' (' + ['CORRECTNESS','VALUE/RISK'][i] + ')',
  'Ranking: ' + j.ranking.join(' > '),
  'Best issue/width fixes: ' + j.bestIssueFixes.join(' | '),
  'Best looks fixes: ' + j.bestLooksFixes.join(' | '),
  'Best FormControl ideas: ' + j.bestFormControlIdeas.join(' | '),
  'Recommends: TextField=' + j.recommendedTextFieldVerdict + ', FormControl=' + j.recommendedFormControlVerdict,
  'Why: ' + j.rationale,
].join('\n')).join('\n\n')

phase('Spec')
log('Spec: one verdict + concrete spec for TextField (+ FormControl changes)')

const spec = await agent(
  [
    'You are the lead architect making the FINAL call on valet TextField and FormControl. Synthesize the proposals + judges into one coherent recommendation — graft the best fixes. Give an honest verdict (improve/rewrite/overhaul for TextField; none/improve/rewrite/overhaul for FormControl) and pick the smallest hammer that actually fixes: the known width issue, the bad looks (consistent with Button/Checkbox/Switch via computeIntentVars, correct light+dark), and the never-worked-great reliability — with the label/helperText a11y wiring and a coarse-pointer-comfortable touch target. Any FormControl change MUST keep Checkbox/Switch/Slider/Select binding working; state the blast radius. Preserve the public API where possible.',
    '',
    'Fill every schema field concretely — rootCauses with file:line, the width/visual/label/sizing-a11y/controlled-FormControl models, the FormControl changes (or none), the styled structure, the prop table, API-compatibility, a test plan, ordered implementation steps, risks, and open questions for Ben.',
    '',
    'PROPOSALS (red-teamed):',
    block,
    '',
    'JUDGES:',
    judgesBlock,
    '',
    'RECON:',
    CONTEXT,
  ].join('\n'),
  { schema: SPEC_SCHEMA, phase: 'Spec', label: 'synthesis', effort: 'high' },
)

return {
  spec,
  proposals: proposals.map((p) => ({ stance: p.stance, textField: p.design.textFieldVerdict, formControl: p.design.formControlVerdict, score: p.critique.score })),
  judges: judgments.filter(Boolean).map((j, i) => ({ judge: ['CORRECTNESS','VALUE/RISK'][i], textField: j.recommendedTextFieldVerdict, formControl: j.recommendedFormControlVerdict, ranking: j.ranking })),
}
