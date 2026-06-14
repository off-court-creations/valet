// ─────────────────────────────────────────────────────────────
// scripts/mcp/validate.mjs | valet
// MCP corpus validator (MCP-TRUTH S7; ruling Q16a — HARD gates).
//
// Structure:
// • validateCorpus(corpus) — pure; returns { ok, errors, warnings, stats }
// • loadCorpus(root)       — reads mcp-data/ + src/**/*.meta.json sidecars
// • thin CLI (`npm run mcp:schema:check`) — load → validate → print → exit 1
//
// Content gates (every one a hard failure, exit 1):
// • zero placeholder summaries — the literal '<Name> component' pattern —
//   and zero empty summaries
// • glossary ≥ GLOSSARY_FLOOR (10) entries
// • coverage floors: docsUrl ≥80%, examples ≥35%, bestPractices ≥70%
//   (floors sit below the measured actuals: 80.7% / 38.6% / 73.7%)
// • every docsUrl must be a real route in mcp-data/_routes.json
// • orphan sidecars (a .meta.json naming no corpus component) fail
//
// Content-correctness gates (B1 — assert correctness, not just consistency;
// the freshness guard only proves the extractor reproduced its own output):
// • no prop description equals or contains '[object Object]' (the ts-morph
//   getComment() array-coercion bug — A1 fixed the extractor; this gate keeps
//   the bug class permanently dead even if the extractor regresses)
// • no PUBLIC prop carries type 'unknown' unless it is on UNKNOWN_TYPE_ALLOW
//   (empty on the corrected corpus — A2 dropped the phantom unknown props
//   Drawer.anchorProp / Avatar.loading; see that const for the rationale)
// • every known deprecated alias (DEPRECATED_ALIAS_FLOOR) is present and
//   carries `deprecated`; a corpus-wide consistency note flags any prop whose
//   name matches a flagged alias on the SAME component but is itself unflagged
// ─────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';

export const GLOSSARY_FLOOR = 10;

export const COVERAGE_FLOORS = Object.freeze({
  docsUrl: 0.8,
  examples: 0.35,
  bestPractices: 0.7,
});

/**
 * Public props whose extracted `type` is allowed to be the literal 'unknown'.
 *
 * DECISION (2026-06-12, on the corrected corpus): EMPTY. The regenerated
 * mcp-data has 621 props, ZERO of them 'unknown' and zero 'any' — the
 * extractor now resolves every public prop to a concrete type, and A2's
 * phantom-prop filter removed the only two 'unknown' offenders the assessment
 * found (Drawer.anchorProp, Avatar.loading — destructured-param-with-default
 * artifacts that were never in the public type). So the strictest correct
 * floor is an empty allow-list: any 'unknown' that appears is, by construction,
 * either a phantom prop the filter missed or a genuine extractor regression,
 * and either way it is a lie the agent should not see.
 *
 * This is kept as an explicit, documented escape hatch rather than removed
 * outright: a future genuinely-untyped public render prop (e.g. a `render`
 * callback typed `(...args: unknown[]) => ReactNode`) can be allow-listed here
 * — by exact `Component.prop` key — with a one-line justification, instead of
 * weakening the gate to permit 'unknown' globally.
 * @type {ReadonlySet<string>}
 */
export const UNKNOWN_TYPE_ALLOW = Object.freeze(new Set([]));

/**
 * The known-deprecated-alias floor: `Component.oldName -> newCanonicalName`.
 *
 * **Intentionally EMPTY as of 1.0.** The pre-1.0 policy (deprecate.ts,
 * CHANGELOG, AGENTS.md) removed every prop alias at the 1.0 cut, so there are
 * no deprecated aliases left to assert present. The gate that consumed this
 * list is now INVERTED (see validateCorpus): instead of asserting these aliases
 * EXIST + carry `deprecated`, it asserts the corpus carries ZERO `deprecated`
 * props. If a new alias is ever introduced before a future major, add it here
 * AND restore the presence assertion; until then the 1.0 invariant is "no
 * deprecated props on the public surface."
 * @type {ReadonlyArray<{ component: string, name: string, replacement: string }>}
 */
export const DEPRECATED_ALIAS_FLOOR = Object.freeze([]);

/** True when a prop's extracted `type` is the literal 'unknown'. */
export function isUnknownType(type) {
  return typeof type === 'string' && type.trim() === 'unknown';
}

/** True when a prop description has been corrupted to the array-coerce sentinel. */
export function hasObjectObjectDescription(description) {
  return typeof description === 'string' && description.includes('[object Object]');
}

/** The historical merge fallback wrote exactly `${name} component`. */
export function isPlaceholderSummary(name, summary) {
  return typeof summary === 'string' && summary.trim() === `${name} component`;
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readOptionalJSON(p) {
  return fs.existsSync(p) ? readJSON(p) : undefined;
}

// ── per-component schema checks (pre-gate, unchanged behavior) ─
function validateComponent(c) {
  const problems = [];
  if (!c.name || typeof c.name !== 'string') problems.push('missing name');
  if (!c.slug || typeof c.slug !== 'string') problems.push('missing slug');
  if (!Array.isArray(c.props)) problems.push('props not array');
  if (c.aliases && !Array.isArray(c.aliases)) problems.push('aliases must be an array');
  // status validation (REQUIRED and constrained)
  {
    const allowedStatus = new Set([
      'production',
      'stable',
      'experimental',
      'unstable',
      'deprecated',
    ]);
    if (!c.status) {
      problems.push('missing status');
    } else if (!allowedStatus.has(c.status)) {
      problems.push(`invalid status: ${c.status}`);
    }
  }
  // usage validation (optional, non-fatal)
  if (c.usage && typeof c.usage !== 'object') problems.push('usage must be an object');
  if (c.usage && typeof c.usage === 'object') {
    const u = c.usage;
    if (u.purpose && !(typeof u.purpose === 'string' || Array.isArray(u.purpose)))
      problems.push('usage.purpose must be string or string[]');
    if (Array.isArray(u.purpose)) {
      for (const p of u.purpose)
        if (typeof p !== 'string' || !p.trim())
          problems.push('usage.purpose contains invalid entry');
    }
    if (u.whenToUse && !Array.isArray(u.whenToUse))
      problems.push('usage.whenToUse must be string[]');
    if (Array.isArray(u.whenToUse))
      for (const it of u.whenToUse)
        if (typeof it !== 'string' || !it.trim())
          problems.push('usage.whenToUse contains invalid entry');
    if (u.whenNotToUse && !Array.isArray(u.whenNotToUse))
      problems.push('usage.whenNotToUse must be string[]');
    if (Array.isArray(u.whenNotToUse))
      for (const it of u.whenNotToUse)
        if (typeof it !== 'string' || !it.trim())
          problems.push('usage.whenNotToUse contains invalid entry');
    if (u.alternatives && !Array.isArray(u.alternatives))
      problems.push('usage.alternatives must be string[]');
    if (Array.isArray(u.alternatives))
      for (const it of u.alternatives)
        if (typeof it !== 'string' || !it.trim())
          problems.push('usage.alternatives contains invalid entry');
  }
  if (Array.isArray(c.aliases)) {
    const seen = new Set();
    for (const a of c.aliases) {
      if (typeof a !== 'string' || !a.trim()) problems.push('alias must be non-empty string');
      const low = String(a).trim().toLowerCase();
      if (seen.has(low)) problems.push(`duplicate alias: ${a}`);
      seen.add(low);
      if (/\s/.test(low)) problems.push(`alias should not contain spaces: ${a}`);
    }
  }
  const seen = new Set();
  let requiredCount = 0;
  let anyCount = 0;
  let hasDefaultAndRequired = false;
  let hasHtmlishProps = false;
  for (const p of c.props || []) {
    if (!p || typeof p.name !== 'string') problems.push('prop missing name');
    if (seen.has(p.name)) problems.push(`duplicate prop: ${p.name}`);
    seen.add(p.name);
    if (p.required) requiredCount++;
    if (typeof p.type === 'string' && p.type.trim() === 'any') anyCount++;
    if (p.required && p.default != null) hasDefaultAndRequired = true;
    if (['onClick', 'id', 'className', 'style', 'role', 'aria-label'].includes(p.name))
      hasHtmlishProps = true;
  }
  const allowedCats = new Set(['primitives', 'fields', 'layout', 'widgets']);
  if (c.category && !allowedCats.has(c.category)) {
    // Allow unknown but flag it
    problems.push(`unknown category: ${c.category}`);
  }
  // Heuristics/warnings
  if ((c.props || []).length === 0 && c.category && c.category !== 'primitives') {
    problems.push('warn: no props extracted (suspicious for non-primitive component)');
  }
  if ((c.props || []).length >= 4) {
    const ratio = requiredCount / (c.props || []).length;
    if (ratio > 0.7)
      problems.push(`warn: unusually high required prop ratio (${Math.round(ratio * 100)}%)`);
  }
  if (hasDefaultAndRequired)
    problems.push(
      'warn: some props are marked required but have defaults (likely optional at callsite)',
    );
  if ((c.props || []).length > 0 && anyCount >= Math.ceil((c.props || []).length / 2)) {
    problems.push('warn: many props have type any');
  }
  if (!c.domPassthrough && hasHtmlishProps) {
    problems.push('warn: html-like props present but domPassthrough is missing');
  }
  return problems;
}

// ── corpus loading (disk → plain data; validation stays pure) ──
function findSidecarFiles(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) findSidecarFiles(fp, out);
    else if (e.isFile() && /\.meta\.json$/.test(e.name)) out.push(fp);
  }
  return out;
}

/**
 * Read everything validateCorpus needs from disk.
 * @returns {{
 *   index: Array<object>,
 *   meta: object,
 *   components: Record<string, object|null>,  // keyed by slug; null = file missing
 *   synonyms: object|undefined,
 *   glossary: object|undefined,
 *   routes: object|undefined,                 // mcp-data/_routes.json
 *   sidecars: Array<{ file: string, name: string|null }>,
 * }}
 */
export function loadCorpus(root = process.cwd()) {
  const dir = path.join(root, 'mcp-data');
  const index = readJSON(path.join(dir, 'index.json'));
  const meta = readJSON(path.join(dir, '_meta.json'));
  const components = {};
  for (const item of index) {
    const file = path.join(dir, 'components', `${String(item.slug).replace(/\//g, '_')}.json`);
    components[item.slug] = fs.existsSync(file) ? readJSON(file) : null;
  }
  const synonyms = readOptionalJSON(path.join(dir, 'component_synonyms.json'));
  const glossary = readOptionalJSON(path.join(dir, 'glossary.json'));
  const routes = readOptionalJSON(path.join(dir, '_routes.json'));
  const sidecars = findSidecarFiles(path.join(root, 'src')).map((file) => {
    let name = null;
    try {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (raw && typeof raw.name === 'string' && raw.name.trim()) name = raw.name.trim();
    } catch {
      /* unreadable sidecar reported as orphan below */
    }
    return { file: path.relative(root, file).split(path.sep).join('/'), name };
  });
  return { index, meta, components, synonyms, glossary, routes, sidecars };
}

// ── pure validation ────────────────────────────────────────────
/**
 * Validate an in-memory corpus. Pure: no fs, no process, no logging.
 * @param {ReturnType<typeof loadCorpus>} corpus
 * @returns {{ ok: boolean, errors: string[], warnings: string[], stats: object }}
 */
export function validateCorpus(corpus) {
  const errors = [];
  const warnings = [];
  const error = (msg) => errors.push(msg);
  const warn = (msg) => warnings.push(msg);

  const {
    index = [],
    meta = {},
    components = {},
    synonyms,
    glossary,
    routes,
    sidecars = [],
  } = corpus ?? {};

  const compNames = new Set(index.map((i) => i.name));
  const allowedStatus = new Set(['production', 'stable', 'experimental', 'unstable', 'deprecated']);

  // Coverage + placeholder accounting
  const total = index.length;
  let docsUrlCount = 0;
  let examplesCount = 0;
  let bestPracticesCount = 0;
  let placeholderSummaries = 0;
  const missing = { docsUrl: [], examples: [], bestPractices: [] };
  const docsUrls = []; // { name, url } for the routes cross-check

  // Content-correctness accounting (B1)
  let objectObjectDescriptions = 0;
  let unknownTypeProps = 0;
  // { [component]: Set<flaggedAliasName> } — props that DO carry `deprecated`,
  // used by gate (3)'s corpus-derived consistency check after the loop.
  const flaggedDeprecatedByComponent = {};

  for (const item of index) {
    const doc = components[item.slug];
    if (!doc) {
      error(`missing component doc: ${item.slug}`);
      missing.docsUrl.push(item.name);
      missing.examples.push(item.name);
      missing.bestPractices.push(item.name);
      continue;
    }

    // Cross-validate index vs document
    if (item.name !== doc.name) {
      error(`index/doc name mismatch: index='${item.name}' doc='${doc.name}'`);
    }
    if (item.slug !== doc.slug) {
      error(`index/doc slug mismatch: index='${item.slug}' doc='${doc.slug}'`);
    }
    if (item.category !== doc.category) {
      error(`index/doc category mismatch: index='${item.category}' doc='${doc.category}'`);
    }
    if (doc.status && !allowedStatus.has(doc.status)) {
      error(`doc status invalid: ${doc.status}`);
    }
    if (item.status && !allowedStatus.has(item.status)) {
      error(`index status invalid: ${item.status}`);
    }
    if (!doc.status && !item.status) {
      error(`${item.name}: missing status (doc and index)`);
    }
    if (doc.status && !item.status) {
      error(`index missing status for ${item.name}`);
    }
    if (item.status && !doc.status) {
      error(`doc missing status for ${item.name}`);
    }
    if (item.status && doc.status && item.status !== doc.status) {
      error(
        `index/doc status mismatch for ${item.name}: index='${item.status}' doc='${doc.status}'`,
      );
    }

    for (const p of validateComponent(doc)) {
      const isWarnPrefix = typeof p === 'string' && p.startsWith('warn:');
      if (p.startsWith('unknown category') || isWarnPrefix) {
        warn(`${item.name}: ${isWarnPrefix ? p.replace(/^warn:\s*/, '') : p}`);
      } else {
        error(`${item.name}: ${p}`);
      }
    }

    // ── content-correctness gates: per-prop (B1, hard) ──────────
    // Walk the props once, asserting (1) no '[object Object]' description and
    // (2) no public 'unknown' type outside the allow-list, and recording which
    // props carry `deprecated` for the gate-(3) consistency check below.
    for (const p of Array.isArray(doc.props) ? doc.props : []) {
      if (!p || typeof p.name !== 'string') continue;
      // (1) corrupted description — the ts-morph getComment() array-coerce bug.
      if (hasObjectObjectDescription(p.description)) {
        objectObjectDescriptions++;
        error(
          `${item.name}.${p.name}: description contains '[object Object]' — JSDoc {@link} ` +
            `array-coercion bug; the extractor must flatten getComment() arrays (see A1)`,
        );
      }
      // (2) public prop typed 'unknown' (the phantom-prop / unresolved-type
      // tell) — fail unless explicitly allow-listed by exact Component.prop key.
      if (isUnknownType(p.type) && !UNKNOWN_TYPE_ALLOW.has(`${item.name}.${p.name}`)) {
        unknownTypeProps++;
        error(
          `${item.name}.${p.name}: public prop has type 'unknown' (not on the documented ` +
            `allow-list) — likely a phantom prop or an unresolved type; fix the extractor ` +
            `or allow-list it in UNKNOWN_TYPE_ALLOW with a justification`,
        );
      }
      // (2b) machine-specific type leak: ts-morph prints cross-module types it
      // can't name in scope as `import("<absolute path>").Name`. The absolute
      // path is host-specific (dev /home/xbenc vs CI /home/runner), so it makes
      // the corpus non-reproducible (check-fresh "stale" on another machine).
      // The extractor must strip the import() qualifier to the bare type name.
      if (typeof p.type === 'string' && /import\(\s*['"]/.test(p.type)) {
        error(
          `${item.name}.${p.name}: type contains an \`import("…")\` qualifier with an ` +
            `absolute path — non-reproducible across machines; the extractor must strip it`,
        );
      }
      // record `deprecated`-carrying props for the consistency check
      if (p.deprecated != null) {
        (flaggedDeprecatedByComponent[item.name] ||= new Set()).add(p.name);
      }
    }

    if (doc.schemaVersion && meta.schemaVersion && doc.schemaVersion !== meta.schemaVersion) {
      warn(`${item.name}: schemaVersion ${doc.schemaVersion} != meta ${meta.schemaVersion}`);
    }
    // Curated examples policy
    if (doc.docsUrl) {
      const hasExamples = Array.isArray(doc.examples) && doc.examples.length > 0;
      if (!hasExamples) {
        warn(`${item.name}: docsUrl present but no examples`);
      }
    }

    // ── content gate: placeholder / empty summaries (hard) ────
    const summary = typeof doc.summary === 'string' ? doc.summary.trim() : '';
    if (!summary) {
      error(
        `${item.name}: summary is empty — the sidecar or header comment must supply a real summary`,
      );
    } else if (isPlaceholderSummary(item.name, summary)) {
      placeholderSummaries++;
      error(
        `${item.name}: placeholder summary '${item.name} component' — write a real summary (sidecar or component header comment)`,
      );
    }
    if (
      isPlaceholderSummary(item.name, item.summary) &&
      !isPlaceholderSummary(item.name, doc.summary)
    ) {
      error(`${item.name}: index.json summary is the '<Name> component' placeholder (stale index)`);
    }

    // Coverage accounting
    if (typeof doc.docsUrl === 'string' && doc.docsUrl.trim()) {
      docsUrlCount++;
      docsUrls.push({ name: item.name, url: doc.docsUrl });
    } else {
      missing.docsUrl.push(item.name);
    }
    if (Array.isArray(doc.examples) && doc.examples.length > 0) examplesCount++;
    else missing.examples.push(item.name);
    if (Array.isArray(doc.bestPractices) && doc.bestPractices.length > 0) bestPracticesCount++;
    else missing.bestPractices.push(item.name);
  }

  // ── content gate: no deprecated prop aliases (1.0 invariant, hard) ─
  // Pre-1.0 policy (deprecate.ts header, CHANGELOG, AGENTS.md): every prop alias
  // is REMOVED at 1.0. The served corpus must therefore carry ZERO `deprecated`
  // props. This is the inverse of the old 0.x gate (which asserted the known
  // aliases were present + flagged): with DEPRECATED_ALIAS_FLOOR now empty, this
  // fails the build if any deprecated alias ever reappears on the public surface
  // (the extractor sets `deprecated` from a live deprecate.ts call site / JSDoc).
  {
    for (const item of index) {
      const doc = components[item.slug];
      const props = doc && Array.isArray(doc.props) ? doc.props : [];
      for (const p of props) {
        if (p && p.deprecated != null) {
          error(
            `deprecation gate (1.0): ${doc.name}.${p.name} carries a \`deprecated\` flag — ` +
              `all prop aliases must be removed before 1.0 (pre-1.0 policy). Remove the prop ` +
              `and its deprecate.ts call site, or (for a post-1.0 alias) add it to ` +
              `DEPRECATED_ALIAS_FLOOR and restore the presence assertion.`,
          );
        }
      }
    }
  }

  // ── content gate: coverage floors (hard) ────────────────────
  if (total === 0) {
    error('index.json lists zero components — empty corpus');
  } else {
    /** @type {Array<[string, number, number, string[]]>} */
    const floorChecks = [
      ['docsUrl', docsUrlCount, COVERAGE_FLOORS.docsUrl, missing.docsUrl],
      ['examples', examplesCount, COVERAGE_FLOORS.examples, missing.examples],
      ['bestPractices', bestPracticesCount, COVERAGE_FLOORS.bestPractices, missing.bestPractices],
    ];
    for (const [field, count, floor, miss] of floorChecks) {
      const ratio = count / total;
      if (ratio < floor) {
        const head = miss.slice(0, 10).join(', ');
        const more = miss.length > 10 ? `, … +${miss.length - 10} more` : '';
        error(
          `coverage gate: ${field} ${count}/${total} (${(ratio * 100).toFixed(1)}%) below floor ${floor * 100}% — missing: ${head}${more}`,
        );
      }
    }
  }

  // ── content gate: docsUrl ↔ _routes.json cross-check (hard) ─
  const routeTable =
    routes && typeof routes === 'object' && routes.routes && typeof routes.routes === 'object'
      ? routes.routes
      : null;
  if (docsUrls.length > 0 && !routeTable) {
    error(
      `docsUrl cross-check impossible: mcp-data/_routes.json missing or malformed while ${docsUrls.length} components declare a docsUrl`,
    );
  } else if (routeTable) {
    for (const { name, url } of docsUrls) {
      if (!(url in routeTable)) {
        error(
          `${name}: docsUrl '${url}' is not a route in _routes.json (${routes.source || 'route table'})`,
        );
      }
    }
  }

  // ── component synonyms ───────────────────────────────────────
  if (synonyms === undefined) {
    warn('component_synonyms.json missing');
  } else if (!synonyms || typeof synonyms !== 'object') {
    error('component_synonyms.json must be an object');
  } else {
    for (const [alias, targets] of Object.entries(synonyms)) {
      if (!/^[a-z0-9-]+$/.test(alias)) {
        warn(`component_synonyms alias '${alias}' contains unusual characters`);
      }
      if (!Array.isArray(targets) || targets.length === 0) {
        error(`alias '${alias}' must map to a non-empty array of component names`);
        continue;
      }
      const seen = new Set();
      for (const t of targets) {
        if (seen.has(t)) {
          warn(`alias '${alias}' has duplicate target '${t}'`);
        }
        seen.add(t);
        if (!compNames.has(t)) {
          error(`alias '${alias}' references missing component '${t}'`);
        }
      }
      if (targets.length > 3) {
        warn(`alias '${alias}' maps to ${targets.length} components; consider narrowing`);
      }
    }
  }

  // ── glossary: schema checks + ≥GLOSSARY_FLOOR gate (hard) ───
  let glossaryEntries = 0;
  if (glossary === undefined) {
    warn('glossary.json missing');
  } else {
    const entries = Array.isArray(glossary.entries) ? glossary.entries : [];
    glossaryEntries = entries.length;
    if (!Array.isArray(glossary.entries)) {
      error('glossary.json: entries must be an array');
    } else {
      const termSet = new Set();
      const allTermsLower = new Set();
      for (const e of entries) {
        if (!e || typeof e.term !== 'string' || !e.term.trim()) {
          error('glossary entry missing term');
          continue;
        }
        if (!e.definition || typeof e.definition !== 'string' || !e.definition.trim()) {
          error(`glossary ${e.term}: missing definition`);
        }
        const key = e.term.trim().toLowerCase();
        if (allTermsLower.has(key)) {
          error(`glossary duplicate term: ${e.term}`);
        }
        termSet.add(e.term);
        allTermsLower.add(key);
        if (e.aliases && !Array.isArray(e.aliases)) {
          error(`glossary ${e.term}: aliases must be an array`);
        }
        if (Array.isArray(e.aliases)) {
          const aliasSet = new Set();
          for (const a of e.aliases) {
            if (typeof a !== 'string' || !a.trim()) {
              error(`glossary ${e.term}: invalid alias value`);
              continue;
            }
            if (aliasSet.has(a.toLowerCase())) {
              warn(`glossary ${e.term}: duplicate alias '${a}'`);
            }
            aliasSet.add(a.toLowerCase());
            if (allTermsLower.has(a.toLowerCase()) && a.toLowerCase() !== key) {
              warn(`glossary ${e.term}: alias '${a}' conflicts with another term`);
            }
          }
        }
        if (e.seeAlso && !Array.isArray(e.seeAlso)) {
          error(`glossary ${e.term}: seeAlso must be an array`);
        }
      }
      // Validate seeAlso references if possible
      // Accept references to either other glossary terms OR component names OR known MCP tool ids
      const knownTools = new Set([
        'get_component',
        'search_components',
        'get_glossary',
        'define_term',
        'list_components',
      ]);
      const allowedRefs = (ref) => termSet.has(ref) || compNames.has(ref) || knownTools.has(ref);
      for (const e of entries) {
        if (!Array.isArray(e.seeAlso)) continue;
        for (const ref of e.seeAlso) {
          if (typeof ref !== 'string') continue;
          if (!allowedRefs(ref)) {
            warn(`glossary ${e.term}: seeAlso '${ref}' not found`);
          }
        }
      }
      // Check sorted order (optional warn)
      const sorted = [...entries].map((x) => x.term).sort((a, b) => a.localeCompare(b));
      const actual = entries.map((x) => x.term);
      if (sorted.join('\n') !== actual.join('\n')) {
        warn('glossary entries not sorted by term');
      }
    }
  }
  if (glossaryEntries < GLOSSARY_FLOOR) {
    error(
      `glossary gate: ${glossaryEntries} entries below floor ${GLOSSARY_FLOOR} (mcp-data/glossary.json)`,
    );
  }

  // ── content gate: orphan sidecars (hard) ────────────────────
  // Doc-only family sidecars: a .meta.json that intentionally documents a
  // component FAMILY (rendered as a docs overview page) rather than a single
  // exported component. `Progress` is one such: the unified `Progress` wrapper
  // was removed at 1.0 (the components are `ProgressBar`/`ProgressRing`), but
  // the docs keep a "Progress" overview page. merge.mjs already ignores these
  // for corpus generation; the orphan gate allows them so they don't read as a
  // stale/typo sidecar. Every other unattached sidecar still hard-fails.
  const DOC_ONLY_SIDECARS = new Set(['Progress']);
  let orphanSidecars = 0;
  for (const sc of sidecars) {
    if (!sc || typeof sc !== 'object') continue;
    if (!sc.name || typeof sc.name !== 'string' || !sc.name.trim()) {
      orphanSidecars++;
      error(
        `orphan sidecar: ${sc.file} has no readable 'name' field — it can never attach to a component`,
      );
    } else if (!compNames.has(sc.name) && !DOC_ONLY_SIDECARS.has(sc.name)) {
      orphanSidecars++;
      error(
        `orphan sidecar: ${sc.file} names '${sc.name}' but no such component exists in the corpus`,
      );
    }
  }

  const deprecatedFlaggedProps = Object.values(flaggedDeprecatedByComponent).reduce(
    (n, set) => n + set.size,
    0,
  );

  const ok = errors.length === 0;
  return {
    ok,
    errors,
    warnings,
    stats: {
      components: total,
      schemaVersion: meta?.schemaVersion,
      buildHash: meta?.buildHash,
      glossaryEntries,
      placeholderSummaries,
      coverage: {
        docsUrl: { count: docsUrlCount, total, floor: COVERAGE_FLOORS.docsUrl },
        examples: { count: examplesCount, total, floor: COVERAGE_FLOORS.examples },
        bestPractices: { count: bestPracticesCount, total, floor: COVERAGE_FLOORS.bestPractices },
      },
      content: {
        objectObjectDescriptions,
        unknownTypeProps,
        deprecatedFlaggedProps,
        deprecatedAliasFloor: DEPRECATED_ALIAS_FLOOR.length,
      },
      sidecars: { total: sidecars.length, orphans: orphanSidecars },
    },
  };
}

// ── thin CLI ───────────────────────────────────────────────────
function main() {
  const corpus = loadCorpus(process.cwd());
  const { ok, errors, warnings, stats } = validateCorpus(corpus);
  for (const w of warnings) console.warn(`[warn] ${w}`);
  for (const e of errors) console.error(`[error] ${e}`);
  console.log(
    JSON.stringify({ ok, errors: errors.length, warnings: warnings.length, ...stats }, null, 2),
  );
  process.exit(ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
