# Widget review — 1.0 readiness + one-by-one fix order (2026-06-18)

Fan-out workflow (`widget-review`, 70 agents): 9 parallel reviews → adversarial
verification → synthesis. **48 / 60 findings confirmed** (7 major, 23 minor, 18 nit).
Verdicts hold after source verification.

## Scorecard

| # | Widget | Verdict | Effort | Headline 1.0 needs |
|---|---|---|---|---|
| 1 | **Panel** | improve | S | `computeIntentVars` (fixes non-hex defensive-black for rgb/hsl/token `color`); + `intent` meta example |
| 2 | **Parallax** (trio) | improve | S | preset double-apply bug; gate video autoplay on reduced-motion; demo ZeroUI→valet rebrand |
| 3 | **CodeBlock** | improve | S/M | guard `navigator.clipboard?` + honest reject toast; copy button ≥44px; code region `role=region`+label; `title`→`copyLabel` |
| 4 | **Markdown** | improve | S/M | link `rel=noopener` + chrome kit/≥44px on `<a>`; code-bg via theme tokens; meta. (XSS already safe ✓) |
| 5 | **Table** | improve | M | controlled selection (`selected`/`defaultSelected` accepted then **voided** — implement or drop); intent colours; ≥44px rows/checkbox; strip false `selectable`/`rowKey` alias docs |
| 6 | **Dropzone** | improve | M | drag-over colour state (class applied, styled nowhere); chrome kit + ≥44px on root + per-file remove buttons; unconditional live region; paste support |
| 7 | **RichChat** | improve | M | accessible name on the composer textarea (**a11y blocker**); autoscroll bug (only keys on `messages.length` → misses streaming); input safe-area inset |
| 8 | **KeyModal** | **rewrite** | L | the one genuine blocker — Modal has **no accessible name**; raw unthemed `<input>`/`<select>`/`<checkbox>` → rebuild on TextField/Select/Checkbox; swallowed async errors (try/catch + disable-while-pending) |
| 9 | **LLMChat** | improve | M | invalid nested span-in-button status control → real IconButton + aria-live; model selection via `useControlledState`; retired Anthropic default model id |

## Recommended order (dependency-first, momentum-aware)

**Panel → Parallax → CodeBlock → Markdown → Table → Dropzone → RichChat → KeyModal → LLMChat.**

- **Panel first** — the shared surface every other widget renders, and it carries the
  same intent-contract bug class, so landing `computeIntentVars` there sets the pattern.
- **Parallax + CodeBlock** — quick standalone wins for momentum.
- **Markdown** before the chat widgets (settles the code-bg token; CodeBlock/RichChat/LLMChat render its output).
- **Table, Dropzone** — self-contained mid-tier.
- **RichChat → KeyModal → LLMChat last** — LLMChat composes Select/Markdown/KeyModal/
  TextField/IconButton/Panel and embeds KeyModal, so everything it leans on is fixed by then.

## Cross-cutting themes (fix consistently as we go)

- Route **every colour** through `computeIntentVars`/`makeMix` (kills hand-rolled
  hex-only `toRgb`/`mix`/`toHex`).
- Add the **mobile chrome kit + ≥44px coarse hit targets** on every interactive element.
- Give every **interactive/scrollable region a real accessible name**.
- **De-stale meta/tests** (Table's fake alias docs, RichChat's line citation, demo rebrands).

Each widget gets Ben's visual pass to promote past `experimental` (the both-gates rule);
agent work stops at the code+test bar. Effort is light-to-medium except KeyModal (L).
