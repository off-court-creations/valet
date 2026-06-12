// ─────────────────────────────────────────────────────────────
// src/helpers/gravatar.ts | valet
// Gravatar URL/hash construction (SECURITY S6, gated Q7(a)).
//
// Privacy note: building a Gravatar URL embeds a reversible md5 of
// the email; *loading* that URL discloses the hash plus the viewer's
// IP/UA to Automattic. These helpers only construct the string — the
// network request is the caller's explicit, opt-in decision. They
// never emit a URL for an empty / whitespace-only email (the prior
// Avatar default hashed `''`, which still resolved to a real request).
// ─────────────────────────────────────────────────────────────
import { md5 } from './md5';

export interface GravatarUrlOptions {
  /** Requested square size in pixels (Gravatar `s` param). */
  size?: number;
  /** Default-image strategy when the address has no Gravatar (`d` param). */
  defaultImage?: string;
}

/**
 * Canonicalize an email the way Gravatar specifies: trim surrounding
 * whitespace, then lower-case. Returns `''` for empty input.
 */
export function canonicalizeEmail(email: string | undefined | null): string {
  return (email ?? '').trim().toLowerCase();
}

/**
 * Stable Gravatar hash for `email`, or `undefined` when the address is
 * empty / whitespace-only. Never returns the md5 of `''`.
 */
export function gravatarHash(email: string | undefined | null): string | undefined {
  const canon = canonicalizeEmail(email);
  if (!canon) return undefined;
  return md5(canon);
}

/**
 * Construct a Gravatar avatar URL, or `undefined` when there is no
 * usable email. Callers must treat a non-`undefined` return as a
 * third-party network disclosure and gate it behind explicit consent.
 */
export function gravatarUrl(
  email: string | undefined | null,
  opts: GravatarUrlOptions = {},
): string | undefined {
  const hash = gravatarHash(email);
  if (!hash) return undefined;
  const params = new URLSearchParams();
  if (opts.size != null) params.set('s', String(opts.size));
  if (opts.defaultImage != null) params.set('d', opts.defaultImage);
  const query = params.toString();
  return `https://www.gravatar.com/avatar/${hash}${query ? `?${query}` : ''}`;
}

export default gravatarUrl;
