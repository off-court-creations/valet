// ─────────────────────────────────────────────────────────────
// src/system/highlight.ts | valet
// Curated highlight.js registry (PACKAGING S6, ruling Q22(a)).
// `highlight.js/lib/core` + 13 registered languages replaces the
// full ~190-language build (≈306KB gzip → ≈40KB for Markdown
// users, zero for everyone else once the dist is per-module).
// 'plaintext' is MANDATORY — Markdown's fenced-code renderer
// falls back to it for unregistered languages. Consumers add
// further languages via registerHighlightLanguage(name, fn).
// ─────────────────────────────────────────────────────────────
import hljs from 'highlight.js/lib/core';
import type { LanguageFn } from 'highlight.js';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import python from 'highlight.js/lib/languages/python';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import sql from 'highlight.js/lib/languages/sql';
import plaintext from 'highlight.js/lib/languages/plaintext';

/* Canonical names; each grammar registers its own aliases
   (ts/tsx, js/jsx/mjs/cjs, html/svg via xml, sh via bash,
   console via shell, py, yml, md, patch via diff, text/txt). */
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('python', python);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('plaintext', plaintext);

/**
 * Register an additional highlight.js grammar on valet's shared
 * instance — the escape hatch for languages outside the curated set.
 * Fences using `name` (or any alias the grammar declares) highlight
 * from the next render.
 *
 * ```ts
 * import rust from 'highlight.js/lib/languages/rust';
 * registerHighlightLanguage('rust', rust);
 * ```
 */
export const registerHighlightLanguage = (name: string, lang: LanguageFn): void => {
  hljs.registerLanguage(name, lang);
};

export default hljs;
