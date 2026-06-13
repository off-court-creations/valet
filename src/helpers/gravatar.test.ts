// ─────────────────────────────────────────────────────────────
// src/helpers/gravatar.test.ts | valet
// SECURITY S6 (gated Q7(a)) — gravatar URL/hash construction.
// Known-md5 vectors + the empty-email no-URL guarantee that the
// Avatar opt-in relies on (the prior default hashed '').
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { canonicalizeEmail, gravatarHash, gravatarUrl } from './gravatar';

describe('canonicalizeEmail', () => {
  it('trims and lower-cases', () => {
    expect(canonicalizeEmail('  MyEmailAddress@example.com ')).toBe('myemailaddress@example.com');
  });

  it('treats nullish/blank as empty', () => {
    expect(canonicalizeEmail(undefined)).toBe('');
    expect(canonicalizeEmail(null)).toBe('');
    expect(canonicalizeEmail('   ')).toBe('');
  });
});

describe('gravatarHash', () => {
  it('matches the canonical Gravatar md5 vectors', () => {
    // Reference: md5(trim+lowercase(email)) — verified against node:crypto.
    expect(gravatarHash('support@gravatar.com')).toBe('84991830db6f52c0a36a85d452311203');
    expect(gravatarHash('  MyEmailAddress@example.com ')).toBe('0bc83cb571cd1c50ba6f3e8a78ef1346');
  });

  it('returns undefined for an empty/whitespace email — never md5("")', () => {
    const emptyMd5 = 'd41d8cd98f00b204e9800998ecf8427e';
    expect(gravatarHash('')).toBeUndefined();
    expect(gravatarHash('   ')).toBeUndefined();
    expect(gravatarHash(undefined)).toBeUndefined();
    expect(gravatarHash('')).not.toBe(emptyMd5);
  });
});

describe('gravatarUrl', () => {
  it('builds a www.gravatar.com URL with size + default-image params', () => {
    expect(gravatarUrl('support@gravatar.com', { size: 48, defaultImage: 'identicon' })).toBe(
      'https://www.gravatar.com/avatar/84991830db6f52c0a36a85d452311203?s=48&d=identicon',
    );
  });

  it('omits params when none are supplied', () => {
    expect(gravatarUrl('support@gravatar.com')).toBe(
      'https://www.gravatar.com/avatar/84991830db6f52c0a36a85d452311203',
    );
  });

  it('returns undefined (no third-party URL) when the email is empty', () => {
    expect(gravatarUrl('', { size: 48 })).toBeUndefined();
    expect(gravatarUrl('   ')).toBeUndefined();
    expect(gravatarUrl(undefined)).toBeUndefined();
  });
});
