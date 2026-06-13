// ─────────────────────────────────────────────────────────────
// src/system/deprecate.ts | valet
// Deprecation shim (ruling R30, Q12(a)) — built ON devErrors'
// `warnOnce`. Carries the 0.35.0 renames as additive aliases:
// the deprecated prop keeps working but dev-warns once, and the
// canonical prop wins when both are supplied. Aliases are removed
// at 1.0 (Q12(a)); every consumer should migrate to the canonical
// name — IDEs flag the old names via the `@deprecated` JSDoc tags
// on the component prop types.
// ─────────────────────────────────────────────────────────────
import { warnOnce } from './devErrors';

/*───────────────────────────────────────────────────────────*/
/* deprecateProp                                                */

/**
 * **deprecateProp** — warn exactly once (per `component`+`oldName`+`newName`)
 * that a prop has been renamed. Dev-only and memoised through the shared
 * {@link warnOnce} core, so a noisy render loop logs the migration notice a
 * single time; production builds are silent.
 *
 * @param component Component display name (e.g. `'Accordion'`).
 * @param oldName   The deprecated prop name (e.g. `'open'`).
 * @param newName   The canonical replacement (e.g. `'expanded'`).
 *
 * @remarks The deprecated name is removed at 1.0 (Q12(a)); this is a
 *          migration aid, not a permanent alias.
 */
export function deprecateProp(component: string, oldName: string, newName: string): void {
  warnOnce(
    `deprecate:${component}:${oldName}->${newName}`,
    `valet: ${component}: the \`${oldName}\` prop is deprecated — use \`${newName}\` instead. ` +
      `\`${oldName}\` keeps working through 0.x and is removed at 1.0.`,
  );
}

/*───────────────────────────────────────────────────────────*/
/* resolveDeprecatedProp                                        */

/**
 * **resolveDeprecatedProp** — resolve a single renamed prop, warning once if
 * the deprecated alias is in play and letting the canonical value win when
 * both are supplied.
 *
 * Precedence (matches the field-hook house rule — explicit wins):
 * 1. `canonical` if it is not `undefined` (a deprecated value present
 *    alongside it still warns — "both given → canonical wins + warn");
 * 2. otherwise the `deprecated` value (warns);
 * 3. otherwise `undefined`.
 *
 * The warn fires whenever the deprecated alias is `!== undefined`, regardless
 * of which value ends up winning, so a consumer passing the old name always
 * hears about the rename.
 *
 * @returns The value to use for the canonical prop.
 */
export function resolveDeprecatedProp<T>(
  component: string,
  canonicalName: string,
  canonical: T | undefined,
  deprecatedName: string,
  deprecated: T | undefined,
): T | undefined {
  if (deprecated !== undefined) {
    deprecateProp(component, deprecatedName, canonicalName);
  }
  return canonical !== undefined ? canonical : deprecated;
}
