// ─────────────────────────────────────────────────────────────
// src/helpers/svgSafe.test.ts | valet
// SECURITY S4 — svgSafe grammar + adversarial XSS vector suite
//
// Node environment (R28: *.test.ts): the parser is hand-rolled string
// processing with no DOMParser/document dependency, so jsdom would add
// nothing — running in plain Node also proves the module stays pure.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { parseSvgString } from './svgSafe';

const TRIANGLE = 'M12 2L2 22h20z';

describe('parseSvgString — bare path d-data', () => {
  it('accepts simple d-data as a single path with empty root', () => {
    expect(parseSvgString(TRIANGLE)).toEqual({ root: {}, paths: [{ d: TRIANGLE }] });
  });

  it('accepts a lowercase moveto start', () => {
    expect(parseSvgString('m10 10 l5 5 z')).toEqual({
      root: {},
      paths: [{ d: 'm10 10 l5 5 z' }],
    });
  });

  it('accepts commas, negatives, decimals, and exponents', () => {
    const d = 'M0,0 c-1.5e2,3 4.25,-6 7,8 Z';
    expect(parseSvgString(d)).toEqual({ root: {}, paths: [{ d }] });
  });

  it('trims surrounding whitespace', () => {
    expect(parseSvgString(`  ${TRIANGLE}\n`)).toEqual({ root: {}, paths: [{ d: TRIANGLE }] });
  });

  it('rejects data not starting with a moveto command', () => {
    expect(parseSvgString('L10 10z')).toBeNull();
  });

  it('rejects d-data containing markup', () => {
    expect(parseSvgString('M0 0h1<script>alert(1)</script>')).toBeNull();
  });

  it('rejects empty and whitespace-only input', () => {
    expect(parseSvgString('')).toBeNull();
    expect(parseSvgString('   \n\t')).toBeNull();
  });
});

describe('parseSvgString — path-only markup', () => {
  it('accepts a single self-closing <path>', () => {
    expect(parseSvgString(`<path d="${TRIANGLE}"/>`)).toEqual({
      root: {},
      paths: [{ d: TRIANGLE }],
    });
  });

  it('accepts the open/close form with no children', () => {
    expect(parseSvgString(`<path d="${TRIANGLE}"></path>`)).toEqual({
      root: {},
      paths: [{ d: TRIANGLE }],
    });
  });

  it('accepts multiple sibling paths without a wrapper', () => {
    const out = parseSvgString(`<path d="M0 0h10"/>\n<path d="M0 5h10"/>`);
    expect(out).toEqual({
      root: {},
      paths: [{ d: 'M0 0h10' }, { d: 'M0 5h10' }],
    });
  });

  it('accepts single-quoted attribute values', () => {
    expect(parseSvgString(`<path d='${TRIANGLE}' fill='red'/>`)).toEqual({
      root: {},
      paths: [{ d: TRIANGLE, fill: 'red' }],
    });
  });

  it('maps hyphenated attributes to React prop names', () => {
    const out = parseSvgString(
      `<path d="${TRIANGLE}" stroke="currentColor" stroke-width="2" fill-rule="evenodd" clip-rule="evenodd"/>`,
    );
    expect(out).toEqual({
      root: {},
      paths: [
        {
          d: TRIANGLE,
          stroke: 'currentColor',
          strokeWidth: '2',
          fillRule: 'evenodd',
          clipRule: 'evenodd',
        },
      ],
    });
  });

  it('accepts hex and rgb()/hsl() paint values', () => {
    expect(parseSvgString(`<path d="${TRIANGLE}" fill="#1a2b3c"/>`)).not.toBeNull();
    expect(parseSvgString(`<path d="${TRIANGLE}" fill="rgb(10, 20, 30)"/>`)).not.toBeNull();
    expect(
      parseSvgString(`<path d="${TRIANGLE}" stroke="hsla(120, 50%, 50%, 0.5)"/>`),
    ).not.toBeNull();
  });

  it('rejects a <path> without d', () => {
    expect(parseSvgString('<path fill="red"/>')).toBeNull();
  });

  it('rejects <path> with children', () => {
    expect(parseSvgString(`<path d="${TRIANGLE}">text</path>`)).toBeNull();
  });

  it('rejects unquoted attribute values', () => {
    expect(parseSvgString('<path d=M0/>')).toBeNull();
  });

  it('rejects duplicate attributes', () => {
    expect(parseSvgString('<path d="M0 0h1" d="M5 5h1"/>')).toBeNull();
  });

  it('rejects malformed/unterminated markup', () => {
    expect(parseSvgString('<path d="M0 0h1"')).toBeNull();
    expect(parseSvgString(`<path d="${TRIANGLE}"></path`)).toBeNull();
  });
});

describe('parseSvgString — svg-wrapped markup', () => {
  it('accepts a full wrapper and validates-then-drops xmlns', () => {
    const out = parseSvgString(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none">
         <path d="${TRIANGLE}" fill="currentColor"/>
       </svg>`,
    );
    expect(out).toEqual({
      root: { viewBox: '0 0 24 24', width: '24', height: '24', fill: 'none' },
      paths: [{ d: TRIANGLE, fill: 'currentColor' }],
    });
  });

  it('accepts paint/stroke attributes on the root', () => {
    const out = parseSvgString(
      `<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" fill-rule="nonzero"><path d="${TRIANGLE}"/></svg>`,
    );
    expect(out?.root).toEqual({
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      strokeWidth: '1.5',
      fillRule: 'nonzero',
    });
  });

  it('rejects an empty <svg> (nothing renderable)', () => {
    expect(parseSvgString('<svg viewBox="0 0 24 24"></svg>')).toBeNull();
    expect(parseSvgString('<svg viewBox="0 0 24 24"/>')).toBeNull();
  });

  it('rejects a wrapper with an invalid viewBox', () => {
    expect(parseSvgString(`<svg viewBox="0 0 24"><path d="${TRIANGLE}"/></svg>`)).toBeNull();
  });

  it('rejects trailing content after the wrapper', () => {
    expect(
      parseSvgString(
        `<svg viewBox="0 0 24 24"><path d="${TRIANGLE}"/></svg><script>alert(1)</script>`,
      ),
    ).toBeNull();
  });
});

/*──────────── adversarial vectors — every one must return null ────────────*/

describe('parseSvgString — adversarial vectors', () => {
  const vectors: Record<string, string> = {
    'image onerror': '<image href="x" onerror="alert(1)"/>',
    'image onerror inside svg': `<svg><path d="${TRIANGLE}"/><image href="x" onerror="alert(1)"/></svg>`,
    'set onbegin': '<set onbegin="alert(1)" attributeName="x" to="0"/>',
    'set onbegin beside a valid path': `<svg><path d="${TRIANGLE}"/><set onbegin="alert(1)"/></svg>`,
    'animate onbegin': `<svg><animate onbegin="alert(1)" attributeName="fill"/><path d="${TRIANGLE}"/></svg>`,
    foreignObject:
      '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></body></foreignObject></svg>',
    'nested svg': `<svg><svg onload="alert(1)"><path d="${TRIANGLE}"/></svg></svg>`,
    'script tag': '<script>alert(1)</script>',
    'script inside svg': `<svg><path d="${TRIANGLE}"/><script>alert(1)</script></svg>`,
    'onclick on path': `<path d="${TRIANGLE}" onclick="alert(1)"/>`,
    'onload on svg': `<svg onload="alert(1)"><path d="${TRIANGLE}"/></svg>`,
    'javascript: href on a': `<a href="javascript:alert(1)"><path d="${TRIANGLE}"/></a>`,
    'javascript: href on path': `<path d="${TRIANGLE}" href="javascript:alert(1)"/>`,
    'data: href on use': '<use href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="/>',
    'data: in fill': `<path d="${TRIANGLE}" fill="data:text/html,alert(1)"/>`,
    'xlink:href on use': '<use xlink:href="#evil"/>',
    'xlink:href on path': `<path d="${TRIANGLE}" xlink:href="javascript:alert(1)"/>`,
    CDATA: `<svg><![CDATA[<script>alert(1)</script>]]><path d="${TRIANGLE}"/></svg>`,
    'entity in attribute value': `<path d="${TRIANGLE}" fill="&#106;avascript:red"/>`,
    'DOCTYPE entity trick':
      '<!DOCTYPE svg [<!ENTITY xx "<script>alert(1)</script>">]><svg>&xx;</svg>',
    'namespace smuggling via xmlns': `<svg xmlns="http://www.w3.org/1999/xhtml"><path d="${TRIANGLE}"/></svg>`,
    'xmlns:xlink declaration': `<svg xmlns:xlink="http://www.w3.org/1999/xlink"><path d="${TRIANGLE}"/></svg>`,
    'mixed-case SvG wrapper': `<SvG><path d="${TRIANGLE}"/></SvG>`,
    'mixed-case PaTh tag': `<PaTh d="${TRIANGLE}"/>`,
    'uppercase PATH tag': `<PATH d="${TRIANGLE}"/>`,
    'fullwidth confusable attr name (ｄ)': `<path ｄ="${TRIANGLE}"/>`,
    'cyrillic confusable attr name (ԁ)': `<path ԁ="${TRIANGLE}"/>`,
    'uppercase D attribute': `<path D="${TRIANGLE}"/>`,
    'style attribute (CSS injection)': `<path d="${TRIANGLE}" style="fill:url('javascript:alert(1)')"/>`,
    'url() func-IRI in fill': `<path d="${TRIANGLE}" fill="url(#evil)"/>`,
    'class attribute': `<path d="${TRIANGLE}" class="x"/>`,
    'id attribute': `<path d="${TRIANGLE}" id="x"/>`,
    'transform attribute': `<path d="${TRIANGLE}" transform="translate(1)"/>`,
    'prototype-pollution probe (constructor)': `<path d="${TRIANGLE}" constructor="x"/>`,
    'comment smuggling': `<svg><!-- --><path d="${TRIANGLE}"/></svg>`,
    'processing instruction': `<?xml version="1.0"?><path d="${TRIANGLE}"/>`,
    'whitespace inside tag name': `<sv\ng><path d="${TRIANGLE}"/></svg>`,
    'null byte inside tag': `<path\u0000 d="${TRIANGLE}"/>`,
  };

  for (const [label, vector] of Object.entries(vectors)) {
    it(`rejects ${label}`, () => {
      expect(parseSvgString(vector)).toBeNull();
    });
  }

  it('rejects every vector even when prefixed by valid bare d-data shape', () => {
    // markup parsing only triggers on '<' — splicing d-data ahead of a
    // vector must not smuggle it through the bare-data branch
    expect(parseSvgString(`${TRIANGLE}<script>alert(1)</script>`)).toBeNull();
  });
});
