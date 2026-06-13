// ─────────────────────────────────────────────────────────────
// src/system/devErrors.ts | valet
// dev error/warning primitives (ruling R30): `valetError` enriches
// throw-site messages (component + fix hint + docs link); `warnOnce`
// is the single memoised dev-only warning core consumed by
// deprecate.ts, field flip warnings and theming notices
// ─────────────────────────────────────────────────────────────

/* Live docs app base; relative docsHint paths resolve against it ------- */
export const VALET_DOCS_BASE = 'https://main.db2j7e5kim3gg.amplifyapp.com';

/* Absolute hints pass through; anything else is a docs-app path -------- */
function docsLink(hint: string): string {
  if (/^https?:\/\//.test(hint)) return hint;
  return `${VALET_DOCS_BASE}/${hint.replace(/^\/+/, '')}`;
}

/*───────────────────────────────────────────────────────────*/
/**
 * Build an enriched Error for component misuse. The message carries the
 * component name, the fix hint and (optionally) a docs link so the throw
 * sites stay one-liners: `throw valetError('Surface', '…', 'components/…')`.
 */
export function valetError(component: string, message: string, docsHint?: string): Error {
  let text = `valet: ${component}: ${message}`;
  if (docsHint) text += `\nDocs: ${docsLink(docsHint)}`;
  const err = new Error(text);
  err.name = 'ValetError';
  return err;
}

/* Keys already warned this session (dev only) --------------------------- */
const warned = new Set<string>();

/**
 * Warn exactly once per key. Dev-only: production builds return before
 * logging or memoising, so the key can never leak a warning later.
 */
export function warnOnce(key: string, message: string): void {
  if (process.env.NODE_ENV === 'production') return;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

/** Test-only: forget memoised keys so suites stay independent. */
export function resetWarnOnce(): void {
  warned.clear();
}
