// ─────────────────────────────────────────────────────────────
// src/components/primitives/Avatar.dom.test.tsx | valet
// SECURITY S6 (gated Q7(a)) — Gravatar is opt-in THROUGH THE COMPONENT.
//
// gravatar.test.ts proves the URL builder in isolation; this suite
// proves the wiring: a src-less Avatar renders NO <img> (no third-party
// request) by default, `gravatar` opt-in renders the Gravatar <img>,
// opt-in with an empty/whitespace email still falls back (the old
// default hashed '' and fetched anyway), explicit `src` always wins,
// and `preferFallback` overrides the opt-in.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Avatar } from './Avatar';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  act(() => {
    root.render(node);
  });
  return container;
}

beforeEach(() => {
  // Silence unrelated react-dom act chatter; this suite asserts on DOM, not warnings.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

const img = (c: HTMLElement) => c.querySelector('img');
const fallback = (c: HTMLElement) => c.querySelector('div[data-valet-component="Avatar"]');

/*──────────── default: no network, offline fallback ────────────*/
describe('Avatar gravatar opt-in (default false)', () => {
  it('renders the offline fallback with NO <img> for a src-less email avatar', () => {
    const c = render(
      <Avatar
        email='support@gravatar.com'
        name='Sam Support'
      />,
    );
    expect(img(c)).toBeNull();
    const fb = fallback(c);
    expect(fb).not.toBeNull();
    // initials fallback derives "SS" from the name
    expect(fb!.textContent).toBe('SS');
  });

  it('does not put any gravatar.com URL in the DOM by default', () => {
    const c = render(<Avatar email='support@gravatar.com' />);
    expect(c.innerHTML).not.toContain('gravatar.com');
  });
});

/*──────────── opt-in: renders the Gravatar image ────────────*/
describe('Avatar gravatar opt-in (gravatar=true)', () => {
  it('renders an <img> pointing at the known Gravatar hash', () => {
    const c = render(
      <Avatar
        email='support@gravatar.com'
        gravatar
      />,
    );
    const el = img(c);
    expect(el).not.toBeNull();
    expect(el!.getAttribute('src')).toContain(
      'https://www.gravatar.com/avatar/84991830db6f52c0a36a85d452311203',
    );
    // size + default-image query params survive
    expect(el!.getAttribute('src')).toContain('d=identicon');
  });

  it('forwards a custom gravatarDefault into the URL', () => {
    const c = render(
      <Avatar
        email='support@gravatar.com'
        gravatar
        gravatarDefault='retro'
      />,
    );
    expect(img(c)!.getAttribute('src')).toContain('d=retro');
  });

  it('falls back (no <img>, no request) when opted-in but the email is empty', () => {
    const c = render(
      <Avatar
        email='   '
        gravatar
        name='No Email'
      />,
    );
    expect(img(c)).toBeNull();
    expect(c.innerHTML).not.toContain('gravatar.com');
    expect(fallback(c)).not.toBeNull();
  });

  it('falls back when opted-in with no email at all (never hashes "")', () => {
    const c = render(
      <Avatar
        gravatar
        aria-label='Anon'
      />,
    );
    expect(img(c)).toBeNull();
    expect(c.innerHTML).not.toContain('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('preferFallback overrides the opt-in', () => {
    const c = render(
      <Avatar
        email='support@gravatar.com'
        gravatar
        preferFallback
        name='Sam Support'
      />,
    );
    expect(img(c)).toBeNull();
    expect(fallback(c)).not.toBeNull();
  });
});

/*──────────── explicit src always wins ────────────*/
describe('Avatar explicit src', () => {
  it('renders the provided src regardless of the gravatar flag', () => {
    const url = 'https://example.com/me.png';
    const c = render(
      <Avatar
        src={url}
        email='support@gravatar.com'
      />,
    );
    expect(img(c)!.getAttribute('src')).toBe(url);
  });
});

/*──────────── initials scale with the size token ────────────*/
describe('Avatar fallback initials sizing', () => {
  /** cssText of the single-class styled rule applied to `el`. */
  const styledRuleText = (el: HTMLElement) =>
    Array.from(document.querySelectorAll('style'))
      .flatMap((s) => Array.from((s.sheet?.cssRules ?? []) as Iterable<CSSRule>))
      .find((r) => el.classList.contains((r as CSSStyleRule).selectorText?.slice(1) ?? ''))
      ?.cssText ?? '';

  it('anchors the fallback font-size to the avatar diameter so 0.45em initials scale (not a fixed ~7px)', () => {
    /* The bug: Initials is 0.45em but the container had no font-size, so the
       em resolved against the inherited body font — initials never scaled with
       `size`. The fix sets the Fallback font-size to the avatar diameter. */
    const lg = fallback(
      render(
        <Avatar
          name='Ada Lovelace'
          preferFallback
          size='lg'
        />,
      ),
    ) as HTMLElement;
    const css = styledRuleText(lg);
    expect(css).toMatch(/width:\s*4rem/); // matched the real Fallback rule (lg = 4rem)
    expect(css).toMatch(/font-size:\s*4rem/); // em now resolves against the avatar
  });

  it('the fallback font-size tracks the size token (xs ≠ lg)', () => {
    const xs = fallback(
      render(
        <Avatar
          name='Ada Lovelace'
          preferFallback
          size='xs'
        />,
      ),
    ) as HTMLElement;
    expect(styledRuleText(xs)).toMatch(/font-size:\s*1.5rem/); // xs = 1.5rem
  });
});
