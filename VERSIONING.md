# Versioning & Stability Policy

`@archway/valet` follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).
This document defines **what the version number promises** — the public API
surface, what a major/minor/patch bump means for it, how deprecations work after
1.0, and what is explicitly *not* covered by the stability guarantee.

> **Status:** effective at **1.0.0**. Before 1.0 the project hard-renamed APIs
> with no back-compat aliases (every 0.x alias was removed at the 1.0 cut). The
> lifecycle below governs changes **from 1.0 onward**.

## The public API surface

The public API is **exactly what the package barrel exports** — i.e. the named
exports of `@archway/valet` (and the `@archway/valet/styles.css` entry). Nothing
else is public:

- **Deep imports are not API.** The package is ESM-only with a curated `exports`
  map; importing internal paths (e.g. `@archway/valet/dist/...`) is unsupported
  and blocked at runtime (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Internal modules may
  change in any release.
- **Generated CSS class names are not API.** The engine emits content-hashed
  class names (e.g. `z-div-…`); they are deterministic for a given input but are
  an implementation detail and may change in any release. Never select on them.
- **CSS custom properties** documented as theming tokens (the `--valet-*` vars a
  component's docs/`cssVars` list) *are* part of the surface; undocumented
  internal vars are not.
- **`dev`-only diagnostics** (the `valetError`/`warnOnce` messages) may change
  wording freely; their *presence* as a failure signal is intentional but the
  exact text is not a contract.

The barrel is the single source of truth and is gated: `verify:pack`,
`check:package` (publint + are-the-types-wrong, ESM-only profile), and the
`dx/type-tests` probes (run in CI via `typecheck:types`) protect it.

## What each version bump means (1.0+)

| Bump | Meaning for the public surface |
| --- | --- |
| **patch** (`1.0.x`) | Bug fixes and internal changes. No public API change; no prop added or removed; no behavior change a correct consumer would notice. Generated class-name churn is allowed. |
| **minor** (`1.x.0`) | Backward-compatible additions: new components, new optional props, new exports, additive type widening. May **introduce** a deprecation (see below) but never removes one. |
| **major** (`x.0.0`) | Breaking changes: removing/renaming a prop or export, narrowing a type, changing default behavior, raising the minimum React/peer version. Removal of any prior deprecation happens here. |

Every behavior or breaking change is recorded in
[`CHANGELOG.md`](./CHANGELOG.md) (Keep a Changelog 1.1.0) with a migration note;
`release:check` enforces that the changelog moves before a tag.

## Deprecation lifecycle (post-1.0)

Pre-1.0 the project renamed aggressively with no aliases. **From 1.0 onward, a
public rename/removal follows a deprecation window:**

1. **Introduce (a minor):** the new (canonical) name lands. The old name keeps
   working as an **alias** that resolves to the canonical value and emits a
   one-time dev warning (`warnOnce`); the canonical name wins when both are
   supplied. The old name's type carries an `@deprecated` JSDoc tag so editors
   and the MCP corpus flag it.
2. **Soak (≥ 1 minor):** the alias ships through at least one minor release so
   consumers have a release to migrate. The MCP corpus surfaces a
   `deprecation: { replacement }` view and a `deprecatedProps` rollup.
3. **Remove (the next major):** the alias is deleted. The `CHANGELOG` major
   entry lists every removed alias with its replacement.

This mirrors the (now-removed) 0.x `deprecate.ts` shim; reintroduce that pattern
when the first post-1.0 deprecation is needed. The MCP validation gate asserts
the **1.0 invariant** that the surface currently carries *zero* deprecated props
— it fails the build if an alias is added without going through this lifecycle.

## Not covered by the 1.0 guarantee (experimental surface)

Components flagged **`experimental`** in their `status` (visible in the docs and
the MCP corpus) are **carved out of the SemVer guarantee**: their props/behavior
may change in a **minor** release while they stabilize. They are safe to use, but
pin a minor range if you depend on their exact shape.

**Pre-1.0 verification pass:** because the 1.0 prep made broad, cross-cutting
changes (the deprecation sweep, accessibility rewiring, SSR guards, type-surface
curation, and the spacing/density retune), **every component is currently flagged
`experimental`** while each is re-verified. Components are promoted back to
`stable` as they pass that review, and each promotion is noted in the CHANGELOG.
The set of `stable` components at the 1.0 cut is whatever has been verified by
then; check a component's `status` (docs or MCP corpus) for its current standing.

## Peer dependencies

`react`/`react-dom` (`^18 || ^19`) and `zustand` (required — the public store
types reference it directly) are peer dependencies. Raising a minimum peer
version is a **major** change.

## Security

Security issues follow [`SECURITY.md`](./SECURITY.md) — report privately, not via
public issues. Security fixes ship as promptly as the lifecycle allows and are
backported to the current major where feasible.
