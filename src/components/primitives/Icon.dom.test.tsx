// ─────────────────────────────────────────────────────────────
// src/components/primitives/Icon.dom.test.tsx | valet
// SECURITY S5 (Q6) — Icon `svg`-string hardening THROUGH THE COMPONENT.
//
// svgSafe.test.ts proves the parser in isolation; this suite proves the
// wiring: the `svg` string branch now renders real <svg>/<path> React
// elements (never innerHTML), rejected strings render nothing + dev-warn,
// the named `dangerouslySetSvg` escape hatch reproduces the old raw
// innerHTML behavior, and the adversarial vectors that the OLD code would
// have injected as live DOM are inert when fed through the new prop.
// ─────────────────────────────────────────────────────────────
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Icon } from './Icon';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TRIANGLE = 'M12 2L2 22h20z';

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

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/* The icon wrapper is a styled <span data-valet-component="Icon">. */
const iconSpan = (c: HTMLElement) => c.querySelector('[data-valet-component="Icon"]');

/*──────────── safe `svg` string → real elements ────────────*/
describe('Icon svg string — safe rendering', () => {
  it('renders bare d-data as a real <svg><path d=…> (not innerHTML)', () => {
    const c = render(
      <Icon
        svg={TRIANGLE}
        aria-label='triangle'
      />,
    );
    const svg = c.querySelector('svg');
    expect(svg).not.toBeNull();
    const paths = svg!.querySelectorAll('path');
    expect(paths).toHaveLength(1);
    expect(paths[0].getAttribute('d')).toBe(TRIANGLE);
    /* the path is a genuine SVGElement, i.e. it came from React.createElement
       and not from an innerHTML string assignment */
    expect(paths[0]).toBeInstanceOf(SVGElement);
    expect(svg!.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('renders multi-path <path>-only markup with allowlisted paint', () => {
    const c = render(
      <Icon
        svg={`<path d="${TRIANGLE}" fill="currentColor"/><path d="M5 5h4v4H5z" fill="#fff"/>`}
      />,
    );
    const paths = c.querySelectorAll('svg path');
    expect(paths).toHaveLength(2);
    expect(paths[1].getAttribute('fill')).toBe('#fff');
  });

  it('honours an allowlisted <svg> wrapper viewBox', () => {
    const c = render(<Icon svg={`<svg viewBox="0 0 48 48"><path d="${TRIANGLE}"/></svg>`} />);
    expect(c.querySelector('svg')!.getAttribute('viewBox')).toBe('0 0 48 48');
  });
});

/*──────────── adversarial vectors THROUGH the component ────────────*/
describe('Icon svg string — adversarial vectors render nothing + dev-warn', () => {
  /* Each vector is exactly what the pre-0.35 dangerouslySetInnerHTML branch
     would have parsed into live DOM (event handlers, <image>, <script>, …).
     Through the new parsed `svg` prop every one must yield no icon span,
     no svg, and a dev warning. */
  const vectors: Record<string, string> = {
    'image onerror': `<svg><image href="x" onerror="alert(1)"/></svg>`,
    'set onbegin': `<svg><set onbegin="alert(1)"/><path d="${TRIANGLE}"/></svg>`,
    foreignObject: `<svg><foreignObject><img src=x onerror="alert(1)"/></foreignObject></svg>`,
    'nested svg onload': `<svg><svg onload="alert(1)"><path d="${TRIANGLE}"/></svg></svg>`,
    'script tag': '<script>alert(1)</script>',
    'script inside svg': `<svg><path d="${TRIANGLE}"/><script>alert(1)</script></svg>`,
    'onclick on path': `<path d="${TRIANGLE}" onclick="alert(1)"/>`,
    'onload on svg wrapper': `<svg onload="alert(1)"><path d="${TRIANGLE}"/></svg>`,
    'javascript: href on path': `<path d="${TRIANGLE}" href="javascript:alert(1)"/>`,
    'data: url in fill': `<path d="${TRIANGLE}" fill="data:text/html,alert(1)"/>`,
    'url() func-IRI in fill': `<path d="${TRIANGLE}" fill="url(#evil)"/>`,
    'style attribute (CSS injection)': `<path d="${TRIANGLE}" style="background:url(javascript:alert(1))"/>`,
    'use xlink:href': '<use xlink:href="#evil"/>',
    'entity smuggling': `<path d="${TRIANGLE}" fill="&#106;avascript:red"/>`,
    'DOCTYPE entity trick':
      '<!DOCTYPE svg [<!ENTITY xx "<script>alert(1)</script>">]><svg>&xx;</svg>',
    'comment smuggling': `<svg><!-- evil --><path d="${TRIANGLE}"/></svg>`,
    'mixed-case PaTh': `<PaTh d="${TRIANGLE}"/>`,
    'trailing script after valid path': `<path d="${TRIANGLE}"/><script>alert(1)</script>`,
    'bare d-data with spliced markup': `${TRIANGLE}<img src=x onerror=alert(1)>`,
  };

  for (const [label, vector] of Object.entries(vectors)) {
    it(`rejects ${label}: no DOM, no script node, dev-warn`, () => {
      const c = render(<Icon svg={vector} />);
      /* Whole component returns null → no wrapper, no svg, no injected nodes. */
      expect(iconSpan(c)).toBeNull();
      expect(c.querySelector('svg')).toBeNull();
      expect(c.querySelector('script')).toBeNull();
      expect(c.querySelector('image')).toBeNull();
      expect(c.querySelector('foreignObject')).toBeNull();
      expect(c.querySelector('use')).toBeNull();
      expect(c.querySelector('img')).toBeNull();
      expect(c.innerHTML).toBe('');
      expect(warnSpy).toHaveBeenCalled();
      expect(String(warnSpy.mock.calls[0][0])).toContain('rejected');
    });
  }

  it('never carries an event-handler attribute onto a rendered element', () => {
    /* A would-be-valid path with an extra on* attribute must reject wholesale —
       the path is not rendered with the handler stripped, it is not rendered. */
    const c = render(<Icon svg={`<path d="${TRIANGLE}" onclick="alert(1)"/>`} />);
    expect(c.querySelector('path')).toBeNull();
    expect(iconSpan(c)).toBeNull();
  });
});

/*──────────── dangerouslySetSvg escape hatch ────────────*/
describe('Icon dangerouslySetSvg — trusted raw innerHTML escape hatch', () => {
  it('reproduces the pre-0.35 raw injection for trusted markup', () => {
    /* A full-SVG string the parsed `svg` prop now rejects (it has <g>/<rect>) —
       the escape hatch injects it verbatim via innerHTML, as the old prop did. */
    const c = render(
      <Icon
        dangerouslySetSvg='<g><rect x="2" y="2" width="20" height="20" rx="4"/></g>'
        aria-label='brand'
      />,
    );
    const svg = c.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.querySelector('rect')).not.toBeNull();
    expect(svg!.querySelector('g')).not.toBeNull();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not divert trusted markup through the parser (escape hatch is verbatim)', () => {
    const c = render(<Icon dangerouslySetSvg={`<circle cx="12" cy="12" r="10"/>`} />);
    /* <circle> would be rejected by the allowlist parser, proving this path
       bypasses it entirely. */
    expect(c.querySelector('svg circle')).not.toBeNull();
  });
});

/*──────────── prop precedence ────────────*/
describe('Icon prop precedence', () => {
  it('svg string is parsed even when dangerouslySetSvg is also present (svg wins)', () => {
    const c = render(
      <Icon
        svg={TRIANGLE}
        dangerouslySetSvg='<g><rect/></g>'
      />,
    );
    /* svg branch comes first: real parsed path, and the dangerous markup
       (the <rect>) is never injected. */
    expect(c.querySelector('svg path')!.getAttribute('d')).toBe(TRIANGLE);
    expect(c.querySelector('rect')).toBeNull();
  });

  it('a rejected svg string returns null without falling through to children', () => {
    const c = render(
      <Icon svg='<script>alert(1)</script>'>
        <svg data-fallback='1'>
          <path d={TRIANGLE} />
        </svg>
      </Icon>,
    );
    /* The svg branch owns the render: rejection is terminal, the child
       fallback must NOT render. */
    expect(c.querySelector('[data-fallback]')).toBeNull();
    expect(iconSpan(c)).toBeNull();
  });
});
