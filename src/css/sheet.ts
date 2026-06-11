// ─────────────────────────────────────────────────────────────
// src/css/sheet.ts | valet
// Lazy, guarded access to the single global stylesheet shared by
// `styled`, `keyframes` and style presets.
//
// • The CSSStyleSheet is created on first injection in a DOM
//   environment – never at module scope – so importing valet in
//   Node (SSR, RSC, vitest, scripts) can never throw
// • Non-DOM environments record pending rule text instead, keeping
//   class names deterministic and letting tests assert exactly what
//   would have been injected
// • Pending rules are flushed (in order) the moment a DOM becomes
//   available and the sheet is created
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────

/* Single global stylesheet for all rules (lazy) ------------------------ */
export let globalSheet: CSSStyleSheet | undefined;

/* Rule text recorded while no DOM was available (insertion order) ------ */
const pendingRules: string[] = [];

function ensureSheet(): CSSStyleSheet | undefined {
  if (globalSheet) return globalSheet;
  if (typeof document === 'undefined') return undefined;
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);
  globalSheet = styleEl.sheet as CSSStyleSheet;
  /* Flush anything recorded before the DOM existed ------------------- */
  for (const ruleText of pendingRules) {
    insertIntoSheet(globalSheet, ruleText);
  }
  pendingRules.length = 0;
  return globalSheet;
}

function insertIntoSheet(sheet: CSSStyleSheet, ruleText: string): CSSRule | undefined {
  try {
    const index = sheet.insertRule(ruleText, sheet.cssRules.length);
    return sheet.cssRules[index];
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('valet: failed to insert CSS rule:\n%s', ruleText, err);
    }
    return undefined;
  }
}

/*───────────────────────────────────────────────────────────*/
/**
 * Append one rule to the global sheet. In non-DOM environments the rule
 * text is recorded instead so a later DOM flush (or a test) can observe
 * what would have been injected. Returns the live CSSRule when available.
 */
export function insertRuleText(ruleText: string): CSSRule | undefined {
  const sheet = ensureSheet();
  if (!sheet) {
    pendingRules.push(ruleText);
    return undefined;
  }
  return insertIntoSheet(sheet, ruleText);
}

/* Snapshot of rules recorded while no DOM was available (test hook) ---- */
export function getPendingRules(): readonly string[] {
  return pendingRules;
}
