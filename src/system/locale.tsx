// ─────────────────────────────────────────────────────────────
// src/system/locale.tsx | valet
// Locale core (A11Y S7) — dependency-free i18n foundation:
// typed `ValetStrings` table seeded VERBATIM from today's
// hardcoded component literals, `enStrings` defaults,
// `mergeStrings` deep-merge, `isRtlLocale`, and a React-context
// `ValetLocaleProvider` (NOT zustand — per the A11y/i18n veto
// register) + `useValetLocale` hook with no-provider defaults.
//
// Label resolution contract (wired by A11Y S8 in Wave 1.2):
//   instance `labels` prop  >  provider `strings`  >  built-in English
// Components must read strings via useValetLocale() and let an
// instance-level prop win over the provider value.
//
// Scope notes:
// • KeyModal strings are intentionally EXCLUDED pending Q8 (the
//   AI-runtime posture ruling) — do not add them here without a
//   Q8-scoped slice.
// • Month/weekday names are NOT strings — they are S9's Intl
//   domain (src/helpers/dateLocale.ts). Only DateSelector's
//   navigation aria-labels live here.
// • Locale default is 'en-US'; `locale:'auto'` is a deliberate
//   post-1.0 opt-in (deterministic, agent-predictable — veto
//   register).
// ─────────────────────────────────────────────────────────────
import React, { createContext, useContext, useMemo } from 'react';

/*───────────────────────────────────────────────────────────────*/
/* String table                                                  */

/**
 * Every internal user-facing string valet renders without a prop
 * escape hatch today, grouped by component. Values are either plain
 * strings or formatter functions for interpolated labels — both are
 * treated as replace-whole leaves by {@link mergeStrings}.
 *
 * Each default in {@link enStrings} is the verbatim literal from the
 * component source cited next to it.
 */
export interface ValetStrings {
  /** Chip.tsx:241–242 — delete affordance (aria-label + title). */
  chip: {
    remove: string;
  };
  /** Drawer.tsx:338 / :393 — persistent-toggle + close buttons. */
  drawer: {
    openDrawer: string;
    closeDrawer: string;
  };
  /** Pagination.tsx:993–1206 — page-navigation labels. */
  pagination: {
    /** :993 — aria-label on the <nav> root. */
    root: string;
    /** :1017 — window-scroll « button. */
    scrollPagesLeft: string;
    /** :1206 — window-scroll » button. */
    scrollPagesRight: string;
    /** :1028/:1031 — single-step ‹ button (aria-label + title). */
    previousPage: string;
    /** :1194/:1197 — single-step › button (aria-label + title). */
    nextPage: string;
    /** :1148 — per-page-button aria-label. */
    pageLabel: (page: number, isCurrent: boolean) => string;
    /** :1150 — per-page-button title. */
    goToPage: (page: number) => string;
  };
  /** Iterator.tsx:277 / :303 — stepper buttons (verbatim lowercase). */
  iterator: {
    decrement: string;
    increment: string;
  };
  /** SpeedDial.tsx — main FAB aria-label + actions-group aria-label. */
  speedDial: {
    mainButton: string;
    /** Disclosure `role='group'` actions-container aria-label. */
    actions: string;
  };
  /** Dropzone.tsx — instructions + per-file remove + live region. */
  dropzone: {
    /** per-file remove button aria-label. */
    removeFile: (fileName: string) => string;
    /** per-file remove button title. */
    removeFileTitle: string;
    /** file-list visible remove button text (short form). */
    remove: string;
    /** instruction while a drag is active. */
    instructionsActive: string;
    /** idle instruction. */
    instructionsIdle: string;
    /** rejection live-region fallback message. */
    fileRejected: string;
    /** rejection message for files dropped past the cumulative `maxFiles` limit. */
    tooManyFiles: string;
  };
  /** LoadingBackdrop.tsx:64 — spinner aria-label. */
  loadingBackdrop: {
    loading: string;
  };
  /**
   * LLMChat.tsx:314 / :424. The adjacent 'Connected'/'Disconnected'
   * status text (:312) is key-flow UI deferred with KeyModal to Q8.
   */
  llmChat: {
    setApiKey: string;
    send: string;
  };
  /** RichChat.tsx:557 — send button aria-label. */
  richChat: {
    send: string;
  };
  /** DateSelector.tsx:371–447 — month/year navigation aria-labels. */
  dateSelector: {
    previousYear: string;
    previousMonth: string;
    nextMonth: string;
    nextYear: string;
  };
}

/** Deep-partial of a string table; formatter leaves stay whole. */
export type DeepPartialStrings<T> = {
  [K in keyof T]?: T[K] extends (...args: never[]) => unknown
    ? T[K]
    : T[K] extends object
      ? DeepPartialStrings<T[K]>
      : T[K];
};

/** Partial override shape accepted by the provider / mergeStrings. */
export type PartialValetStrings = DeepPartialStrings<ValetStrings>;

const deepFreeze = <T extends object>(obj: T): T => {
  for (const value of Object.values(obj)) {
    if (value && typeof value === 'object') deepFreeze(value as object);
  }
  return Object.freeze(obj);
};

/**
 * Complete built-in English defaults — every value verbatim from the
 * component literal it replaces (citations on {@link ValetStrings}).
 */
export const enStrings: ValetStrings = deepFreeze({
  chip: {
    remove: 'Remove',
  },
  drawer: {
    openDrawer: 'Open drawer',
    closeDrawer: 'Close drawer',
  },
  pagination: {
    root: 'pagination',
    scrollPagesLeft: 'Scroll pages left',
    scrollPagesRight: 'Scroll pages right',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    pageLabel: (page: number, isCurrent: boolean) =>
      `Page ${page}${isCurrent ? ', current page' : ''}`,
    goToPage: (page: number) => `Go to page ${page}`,
  },
  iterator: {
    decrement: 'decrement',
    increment: 'increment',
  },
  speedDial: {
    mainButton: 'Speed dial',
    actions: 'Speed dial actions',
  },
  dropzone: {
    removeFile: (fileName: string) => `Remove ${fileName}`,
    removeFileTitle: 'Remove file',
    remove: 'Remove',
    instructionsActive: 'Drop files here…',
    instructionsIdle: 'Drag files or click to browse',
    fileRejected: 'File rejected',
    tooManyFiles: 'Too many files',
  },
  loadingBackdrop: {
    loading: 'Loading',
  },
  llmChat: {
    setApiKey: 'Set API key',
    send: 'Send',
  },
  richChat: {
    send: 'Send',
  },
  dateSelector: {
    previousYear: 'Previous year',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    nextYear: 'Next year',
  },
});

/*───────────────────────────────────────────────────────────────*/
/* mergeStrings                                                  */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Deep-merges a partial string table over a complete base.
 *
 * • Plain-object branches merge recursively; string/function leaves
 *   replace wholesale.
 * • `undefined` values in the partial are skipped (never clobber).
 * • Returns `base` by reference when `partial` is absent; untouched
 *   branches keep their `base` reference identity.
 * • Never mutates either argument.
 */
export function mergeStrings<T extends object>(base: T, partial?: DeepPartialStrings<T>): T {
  if (!partial) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(partial as Record<string, unknown>)) {
    if (value === undefined) continue;
    const baseValue = (base as Record<string, unknown>)[key];
    out[key] =
      isPlainObject(value) && isPlainObject(baseValue)
        ? mergeStrings(baseValue, value as DeepPartialStrings<typeof baseValue>)
        : value;
  }
  return out as T;
}

/*───────────────────────────────────────────────────────────────*/
/* isRtlLocale                                                   */

/** ISO 15924 scripts written right-to-left (static fallback list). */
const RTL_SCRIPTS = new Set([
  'Adlm', // Adlam
  'Arab', // Arabic
  'Aran', // Arabic (Nastaliq)
  'Hebr', // Hebrew
  'Mand', // Mandaic
  'Mend', // Mende Kikakui
  'Nkoo', // N'Ko
  'Rohg', // Hanifi Rohingya
  'Samr', // Samaritan
  'Syrc', // Syriac
  'Thaa', // Thaana
  'Yezi', // Yezidi
]);

/** Languages whose default script is RTL (last-resort fallback). */
const RTL_LANGS = new Set([
  'ar', // Arabic
  'arc', // Aramaic
  'ckb', // Central Kurdish (Sorani)
  'dv', // Divehi
  'fa', // Persian
  'glk', // Gilaki
  'he', // Hebrew
  'iw', // Hebrew (legacy tag)
  'khw', // Khowar
  'ks', // Kashmiri
  'lrc', // Northern Luri
  'mzn', // Mazanderani
  'nqo', // N'Ko
  'pnb', // Western Punjabi
  'ps', // Pashto
  'sd', // Sindhi
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
]);

interface LocaleWithTextInfo extends Intl.Locale {
  getTextInfo?: () => { direction?: string };
  textInfo?: { direction?: string };
}

/**
 * True when the locale's writing direction is right-to-left.
 *
 * Resolution order: `Intl.Locale` textInfo (spec `getTextInfo()`
 * method, then the legacy `textInfo` accessor) → script subtag
 * (explicit or via `maximize()`) against a static RTL-script list →
 * primary-language fallback list. Malformed tags return `false`.
 */
export function isRtlLocale(locale: string): boolean {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.Locale === 'function') {
      const loc = new Intl.Locale(locale) as LocaleWithTextInfo;
      const direction = loc.getTextInfo?.().direction ?? loc.textInfo?.direction;
      if (direction) return direction === 'rtl';
      const script = loc.script ?? loc.maximize?.().script;
      if (script) return RTL_SCRIPTS.has(script);
      if (loc.language) return RTL_LANGS.has(loc.language);
      return false;
    }
  } catch {
    /* malformed tag or partial Intl — fall through to manual parse */
  }
  /* Static fallback: hand-parse BCP-47 subtags. */
  const subtags = locale.split(/[-_]/).filter(Boolean);
  const lang = (subtags[0] ?? '').toLowerCase();
  const rawScript = subtags.slice(1).find((s) => /^[A-Za-z]{4}$/.test(s));
  if (rawScript) {
    const script = rawScript[0].toUpperCase() + rawScript.slice(1).toLowerCase();
    return RTL_SCRIPTS.has(script);
  }
  return RTL_LANGS.has(lang);
}

/*───────────────────────────────────────────────────────────────*/
/* Provider + hook                                               */

export type ValetDir = 'ltr' | 'rtl';

/** Context payload: resolved locale, complete string table, direction. */
export interface ValetLocaleContextValue {
  locale: string;
  strings: ValetStrings;
  dir: ValetDir;
}

/** No-provider defaults: 'en-US', built-in English, LTR. Frozen. */
const DEFAULT_LOCALE_VALUE: ValetLocaleContextValue = Object.freeze({
  locale: 'en-US',
  strings: enStrings,
  dir: 'ltr' as ValetDir,
});

const ValetLocaleContext = createContext<ValetLocaleContextValue>(DEFAULT_LOCALE_VALUE);
ValetLocaleContext.displayName = 'ValetLocaleContext';

export interface ValetLocaleProviderProps {
  /** BCP-47 tag. Default 'en-US' ('auto' is a post-1.0 opt-in). */
  locale?: string;
  /** Deep-partial overrides merged over the built-in English table. */
  strings?: PartialValetStrings;
  /** Explicit direction; derived from `locale` via isRtlLocale when omitted. */
  dir?: ValetDir;
  children?: React.ReactNode;
}

/**
 * Supplies `{ locale, strings, dir }` to every valet component below
 * it. Plain React context — deliberately not a zustand store.
 *
 * Overrides always resolve against the built-in English table
 * (provider > built-in); nesting providers does not chain-merge —
 * the innermost provider wins wholesale. Pass stable `strings`
 * references: the context value is memoised on
 * `[locale, strings, dir]`, so a fresh object literal per render
 * defeats the memo.
 */
export const ValetLocaleProvider: React.FC<ValetLocaleProviderProps> = ({
  locale = 'en-US',
  strings,
  dir,
  children,
}) => {
  const value = useMemo<ValetLocaleContextValue>(
    () => ({
      locale,
      strings: mergeStrings(enStrings, strings),
      dir: dir ?? (isRtlLocale(locale) ? 'rtl' : 'ltr'),
    }),
    [locale, strings, dir],
  );
  return <ValetLocaleContext.Provider value={value}>{children}</ValetLocaleContext.Provider>;
};

/**
 * Read the active locale context. Without a provider this returns the
 * frozen default (`locale: 'en-US'`, `enStrings`, `dir: 'ltr'`) — the
 * same object on every call, safe for dependency arrays.
 */
export function useValetLocale(): ValetLocaleContextValue {
  return useContext(ValetLocaleContext);
}

/*───────────────────────────────────────────────────────────────*/
/* Per-component label resolution (A11Y S8)                      */

/**
 * Resolves one component's slice of the string table following the
 * documented three-tier contract:
 *
 *   instance `labels` prop  >  provider `strings`  >  built-in English
 *
 * The provider value (`useValetLocale().strings`) already merges its
 * overrides over the built-in English table, so this hook only needs to
 * layer the instance-level `labels` prop on top of the resolved provider
 * slice. Untouched leaves keep the provider/English reference.
 *
 * @param key    the {@link ValetStrings} slice this component renders.
 * @param labels optional instance-level deep-partial override.
 *
 * @example
 *   const t = useComponentStrings('chip', labels);
 *   // t.remove === labels?.remove ?? provider.chip.remove ?? 'Remove'
 */
export function useComponentStrings<K extends keyof ValetStrings>(
  key: K,
  labels?: DeepPartialStrings<ValetStrings[K]>,
): ValetStrings[K] {
  const { strings } = useValetLocale();
  const base = strings[key];
  return useMemo(() => mergeStrings(base as ValetStrings[K] & object, labels), [base, labels]);
}
