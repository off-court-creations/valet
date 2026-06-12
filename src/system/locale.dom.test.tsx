// ─────────────────────────────────────────────────────────────
// src/system/locale.dom.test.tsx | valet
// Locale core (A11Y S7) regression suite — no-provider defaults,
// provider resolution (strings merge, dir derivation/override),
// mergeStrings depth semantics, isRtlLocale (Intl path + static
// fallback), and context-value identity stability across
// re-renders (no fresh objects).
// ─────────────────────────────────────────────────────────────
import { afterEach, describe, expect, it } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  enStrings,
  isRtlLocale,
  mergeStrings,
  useComponentStrings,
  useValetLocale,
  ValetLocaleProvider,
  type PartialValetStrings,
  type ValetLocaleContextValue,
  type ValetStrings,
} from './locale';

/* react-dom warns unless act usage is announced ----------------------- */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/* Helpers -------------------------------------------------------------- */
const roots: Array<{ root: Root; container: HTMLDivElement }> = [];

function makeRoot() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  roots.push({ root, container });
  return root;
}

/** Render under StrictMode into a fresh container; tracked for cleanup. */
function renderStrict(node: React.ReactNode) {
  const root = makeRoot();
  act(() => {
    root.render(<React.StrictMode>{node}</React.StrictMode>);
  });
  return root;
}

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
});

/** Probe that records every context value it renders with. */
function Probe({ log }: { log: ValetLocaleContextValue[] }) {
  log.push(useValetLocale());
  return null;
}

const last = (log: ValetLocaleContextValue[]) => log[log.length - 1];

/* Suite ----------------------------------------------------------------- */

describe('useValetLocale without a provider (jsdom)', () => {
  it("defaults to locale 'en-US', enStrings, dir 'ltr'", () => {
    const log: ValetLocaleContextValue[] = [];
    renderStrict(<Probe log={log} />);
    expect(last(log).locale).toBe('en-US');
    expect(last(log).strings).toBe(enStrings); // identity, not a copy
    expect(last(log).dir).toBe('ltr');
  });

  it('returns the same frozen default object across separate consumers', () => {
    const logA: ValetLocaleContextValue[] = [];
    const logB: ValetLocaleContextValue[] = [];
    renderStrict(
      <>
        <Probe log={logA} />
        <Probe log={logB} />
      </>,
    );
    expect(last(logA)).toBe(last(logB));
    expect(Object.isFrozen(last(logA))).toBe(true);
  });
});

describe('ValetLocaleProvider resolution (jsdom)', () => {
  it('provides defaults when rendered with no props', () => {
    const log: ValetLocaleContextValue[] = [];
    renderStrict(
      <ValetLocaleProvider>
        <Probe log={log} />
      </ValetLocaleProvider>,
    );
    expect(last(log).locale).toBe('en-US');
    expect(last(log).strings).toBe(enStrings); // mergeStrings(base, undefined) → base identity
    expect(last(log).dir).toBe('ltr');
  });

  it('merges partial strings over built-in English (provider > built-in)', () => {
    const overrides: PartialValetStrings = {
      chip: { remove: 'Entfernen' },
      drawer: { closeDrawer: 'Schublade schließen' },
    };
    const log: ValetLocaleContextValue[] = [];
    renderStrict(
      <ValetLocaleProvider
        locale='de-DE'
        strings={overrides}
      >
        <Probe log={log} />
      </ValetLocaleProvider>,
    );
    const { strings } = last(log);
    expect(strings.chip.remove).toBe('Entfernen');
    expect(strings.drawer.closeDrawer).toBe('Schublade schließen');
    /* sibling key in a touched group keeps its English default */
    expect(strings.drawer.openDrawer).toBe('Open drawer');
    /* untouched groups keep enStrings reference identity */
    expect(strings.pagination).toBe(enStrings.pagination);
    expect(strings.dateSelector).toBe(enStrings.dateSelector);
  });

  it("derives dir 'rtl' from an RTL locale when dir is omitted", () => {
    const log: ValetLocaleContextValue[] = [];
    renderStrict(
      <ValetLocaleProvider locale='ar-EG'>
        <Probe log={log} />
      </ValetLocaleProvider>,
    );
    expect(last(log).dir).toBe('rtl');
    expect(last(log).locale).toBe('ar-EG');
  });

  it('an explicit dir prop overrides the locale-derived direction', () => {
    const log: ValetLocaleContextValue[] = [];
    renderStrict(
      <ValetLocaleProvider
        locale='ar-EG'
        dir='ltr'
      >
        <Probe log={log} />
      </ValetLocaleProvider>,
    );
    expect(last(log).dir).toBe('ltr');
  });
});

describe('context value stability across re-renders', () => {
  const stableOverrides: PartialValetStrings = { chip: { remove: 'Quitar' } };

  function App({ log }: { log: ValetLocaleContextValue[] }) {
    return (
      <ValetLocaleProvider
        locale='es-ES'
        strings={stableOverrides}
      >
        <Probe log={log} />
      </ValetLocaleProvider>
    );
  }

  it('re-rendering the provider with identical props yields the SAME context object', () => {
    const log: ValetLocaleContextValue[] = [];
    const root = makeRoot();
    act(() => {
      root.render(
        <React.StrictMode>
          <App log={log} />
        </React.StrictMode>,
      );
    });
    const first = last(log);
    act(() => {
      root.render(
        <React.StrictMode>
          <App log={log} />
        </React.StrictMode>,
      );
    });
    const second = last(log);
    expect(second).toBe(first); // no fresh object per render
    expect(second.strings.chip.remove).toBe('Quitar');
  });

  it('the no-provider default is identity-stable across re-renders', () => {
    const log: ValetLocaleContextValue[] = [];
    const root = makeRoot();
    act(() => {
      root.render(<Probe log={log} />);
    });
    const first = last(log);
    act(() => {
      root.render(<Probe log={log} />);
    });
    expect(last(log)).toBe(first);
  });
});

describe('mergeStrings', () => {
  it('returns the base by reference when no partial is given', () => {
    expect(mergeStrings(enStrings)).toBe(enStrings);
    expect(mergeStrings(enStrings, undefined)).toBe(enStrings);
  });

  it('deep-merges nested leaves without dropping siblings and never mutates inputs', () => {
    const partial: PartialValetStrings = {
      pagination: { nextPage: 'Página siguiente' },
    };
    const merged = mergeStrings(enStrings, partial);
    expect(merged.pagination.nextPage).toBe('Página siguiente');
    /* siblings of the overridden leaf survive */
    expect(merged.pagination.previousPage).toBe('Previous page');
    expect(merged.pagination.root).toBe('pagination');
    /* function leaves in a touched group are preserved */
    expect(merged.pagination.pageLabel(3, true)).toBe('Page 3, current page');
    expect(merged.pagination.goToPage(7)).toBe('Go to page 7');
    /* fresh objects on the merged path, base untouched */
    expect(merged).not.toBe(enStrings);
    expect(merged.pagination).not.toBe(enStrings.pagination);
    expect(enStrings.pagination.nextPage).toBe('Next page');
  });

  it('replaces formatter-function leaves wholesale', () => {
    const merged = mergeStrings(enStrings, {
      pagination: { goToPage: (page: number) => `Ir a la página ${page}` },
    });
    expect(merged.pagination.goToPage(5)).toBe('Ir a la página 5');
    /* sibling formatter untouched */
    expect(merged.pagination.pageLabel(5, false)).toBe('Page 5');
  });

  it('skips undefined values instead of clobbering defaults', () => {
    const merged = mergeStrings(enStrings, {
      chip: { remove: undefined },
      iterator: { increment: 'plus one' },
    } as PartialValetStrings);
    expect(merged.chip.remove).toBe('Remove');
    expect(merged.iterator.increment).toBe('plus one');
    expect(merged.iterator.decrement).toBe('decrement');
  });
});

describe('enStrings verbatim seeds', () => {
  it('matches the hardcoded literals it replaces (S8 wiring contract)', () => {
    expect(enStrings.chip.remove).toBe('Remove'); // Chip.tsx:241
    expect(enStrings.drawer.openDrawer).toBe('Open drawer'); // Drawer.tsx:338
    expect(enStrings.drawer.closeDrawer).toBe('Close drawer'); // Drawer.tsx:393
    expect(enStrings.pagination.root).toBe('pagination'); // Pagination.tsx:993
    expect(enStrings.pagination.scrollPagesLeft).toBe('Scroll pages left'); // :1017
    expect(enStrings.pagination.scrollPagesRight).toBe('Scroll pages right'); // :1206
    expect(enStrings.pagination.previousPage).toBe('Previous page'); // :1028
    expect(enStrings.pagination.nextPage).toBe('Next page'); // :1194
    expect(enStrings.pagination.pageLabel(2, false)).toBe('Page 2'); // :1148
    expect(enStrings.pagination.pageLabel(2, true)).toBe('Page 2, current page'); // :1148
    expect(enStrings.pagination.goToPage(2)).toBe('Go to page 2'); // :1150
    expect(enStrings.iterator.decrement).toBe('decrement'); // Iterator.tsx:277
    expect(enStrings.iterator.increment).toBe('increment'); // Iterator.tsx:303
    expect(enStrings.speedDial.mainButton).toBe('Speed dial'); // SpeedDial.tsx FAB
    expect(enStrings.speedDial.actions).toBe('Speed dial actions'); // SpeedDial group label
    expect(enStrings.dropzone.removeFile('a.txt')).toBe('Remove a.txt'); // Dropzone.tsx:263/:311
    expect(enStrings.dropzone.removeFileTitle).toBe('Remove file'); // :264/:312
    expect(enStrings.dropzone.remove).toBe('Remove'); // Dropzone file-list visible text
    expect(enStrings.dropzone.instructionsActive).toBe('Drop files here…'); // :341
    expect(enStrings.dropzone.instructionsIdle).toBe('Drag files or click to browse'); // :341
    expect(enStrings.dropzone.fileRejected).toBe('File rejected'); // :422
    expect(enStrings.loadingBackdrop.loading).toBe('Loading'); // LoadingBackdrop.tsx:64
    expect(enStrings.llmChat.setApiKey).toBe('Set API key'); // LLMChat.tsx:314
    expect(enStrings.llmChat.send).toBe('Send'); // LLMChat.tsx:424
    expect(enStrings.richChat.send).toBe('Send'); // RichChat.tsx:557
    expect(enStrings.dateSelector.previousYear).toBe('Previous year'); // DateSelector.tsx:371
    expect(enStrings.dateSelector.previousMonth).toBe('Previous month'); // :387
    expect(enStrings.dateSelector.nextMonth).toBe('Next month'); // :437
    expect(enStrings.dateSelector.nextYear).toBe('Next year'); // :447
  });

  it('is deeply frozen (consumers cannot mutate the shared defaults)', () => {
    expect(Object.isFrozen(enStrings)).toBe(true);
    expect(Object.isFrozen(enStrings.pagination)).toBe(true);
    expect(() => {
      (enStrings.chip as { remove: string }).remove = 'X';
    }).toThrow();
  });
});

describe('useComponentStrings (A11Y S8 resolution contract)', () => {
  const lastOf = <T,>(log: T[]): T => log[log.length - 1];

  /** Probe that resolves a slice with an optional instance override. */
  function SliceProbe<K extends keyof ValetStrings>({
    sliceKey,
    labels,
    log,
  }: {
    sliceKey: K;
    labels?: Parameters<typeof useComponentStrings<K>>[1];
    log: ValetStrings[K][];
  }) {
    log.push(useComponentStrings(sliceKey, labels));
    return null;
  }

  it('falls back to built-in English with no provider and no labels', () => {
    const log: ValetStrings['chip'][] = [];
    renderStrict(
      <SliceProbe
        sliceKey='chip'
        log={log}
      />,
    );
    expect(lastOf(log).remove).toBe('Remove');
    /* untouched slice keeps enStrings identity */
    expect(lastOf(log)).toBe(enStrings.chip);
  });

  it('resolves provider strings over built-in English (provider tier)', () => {
    const log: ValetStrings['chip'][] = [];
    renderStrict(
      <ValetLocaleProvider strings={{ chip: { remove: 'Entfernen' } }}>
        <SliceProbe
          sliceKey='chip'
          log={log}
        />
      </ValetLocaleProvider>,
    );
    expect(lastOf(log).remove).toBe('Entfernen');
  });

  it('resolves the instance labels prop over the provider (prop tier wins)', () => {
    const log: ValetStrings['chip'][] = [];
    renderStrict(
      <ValetLocaleProvider strings={{ chip: { remove: 'Entfernen' } }}>
        <SliceProbe
          sliceKey='chip'
          labels={{ remove: 'Dismiss' }}
          log={log}
        />
      </ValetLocaleProvider>,
    );
    expect(lastOf(log).remove).toBe('Dismiss');
  });

  it('lets the instance prop win over built-in English with no provider', () => {
    const log: ValetStrings['pagination'][] = [];
    renderStrict(
      <SliceProbe
        sliceKey='pagination'
        labels={{ root: 'navigation', nextPage: 'Forward' }}
        log={log}
      />,
    );
    expect(lastOf(log).root).toBe('navigation');
    expect(lastOf(log).nextPage).toBe('Forward');
    /* untouched leaves keep their English default */
    expect(lastOf(log).previousPage).toBe('Previous page');
    /* formatter leaves still work */
    expect(lastOf(log).pageLabel(3, true)).toBe('Page 3, current page');
  });

  it('overrides interpolated formatter leaves at the instance tier', () => {
    const log: ValetStrings['dropzone'][] = [];
    renderStrict(
      <SliceProbe
        sliceKey='dropzone'
        labels={{ removeFile: (n: string) => `Entferne ${n}` }}
        log={log}
      />,
    );
    expect(lastOf(log).removeFile('a.txt')).toBe('Entferne a.txt');
    /* sibling default survives */
    expect(lastOf(log).removeFileTitle).toBe('Remove file');
  });
});

describe('isRtlLocale', () => {
  it('classifies RTL languages: ar, he, fa (bare and region-qualified)', () => {
    expect(isRtlLocale('ar')).toBe(true);
    expect(isRtlLocale('ar-EG')).toBe(true);
    expect(isRtlLocale('he')).toBe(true);
    expect(isRtlLocale('he-IL')).toBe(true);
    expect(isRtlLocale('fa')).toBe(true);
    expect(isRtlLocale('fa-IR')).toBe(true);
  });

  it('classifies LTR languages: en, ja', () => {
    expect(isRtlLocale('en')).toBe(false);
    expect(isRtlLocale('en-US')).toBe(false);
    expect(isRtlLocale('ja')).toBe(false);
    expect(isRtlLocale('ja-JP')).toBe(false);
  });

  it('returns false for malformed tags instead of throwing', () => {
    expect(isRtlLocale('')).toBe(false);
    expect(isRtlLocale('not a locale!!')).toBe(false);
  });

  it('falls back to the static script/language lists when Intl.Locale is unavailable', () => {
    const intl = globalThis.Intl as { Locale?: typeof Intl.Locale };
    const original = intl.Locale;
    try {
      // simulate an environment without Intl.Locale (static fallback path)
      delete intl.Locale;
      expect(isRtlLocale('ar')).toBe(true);
      expect(isRtlLocale('he-IL')).toBe(true);
      expect(isRtlLocale('fa')).toBe(true);
      expect(isRtlLocale('en-US')).toBe(false);
      expect(isRtlLocale('ja')).toBe(false);
      /* explicit script subtag wins over the language list */
      expect(isRtlLocale('ar-Latn')).toBe(false);
      expect(isRtlLocale('az-Arab')).toBe(true);
    } finally {
      intl.Locale = original;
    }
  });
});
