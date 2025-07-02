// ─────────────────────────────────────────────────────────────
// src/system/themeStore.ts | valet
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeMode  = 'light' | 'dark';

export interface Theme {
  colors: Record<string, string>;
  /** Returns a CSS length for the given number of spacing units */
  spacing: (units: number) => string;
  /** Base unit used by the spacing helper */
  spacingUnit: string;
  breakpoints: Record<Breakpoint, number>;
  typography: Record<string, Record<Breakpoint, string>>;
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
}

interface ThemeStore {
  mode: ThemeMode;
  theme: Theme;

  setMode: (m: ThemeMode) => void;
  toggleMode: () => void;
  setTheme: (patch: Partial<Theme>) => void;
}

const spacingUnit = '1rem';
const unitSuffix = spacingUnit.replace(/^[0-9.]+/, '');
const common: Omit<Theme, 'colors'> = {
  spacing: (u: number) => `${u}${unitSuffix}`,
  spacingUnit,
  breakpoints: {
    xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920,
  },
  typography: {
    h1: { xs: '2rem',   sm: '2.5rem', md: '3rem',   lg: '3.5rem', xl: '4rem'  },
    h2: { xs: '1.5rem', sm: '2rem',   md: '2.5rem', lg: '3rem',   xl: '3.5rem'},
    h3: { xs: '1.25rem',sm: '1.5rem', md: '2rem',   lg: '2.5rem', xl: '3rem'  },
    h4: { xs: '1rem',   sm: '1.25rem',md: '1.5rem', lg: '2rem',   xl: '2.5rem'},
    h5: { xs: '0.875rem', sm: '1rem', md: '1.25rem',lg: '1.5rem', xl: '2rem'  },
    h6: { xs: '0.75rem', sm: '0.875rem',md: '1rem',lg: '1.25rem',xl: '1.5rem'},
    body     : { xs: '0.875rem', sm: '1rem', md: '1rem', lg: '1rem', xl: '1rem' },
    subtitle : { xs: '0.75rem',  sm: '0.875rem', md: '0.875rem', lg: '1rem', xl: '1rem' },
    button   : { xs: '0.875rem', sm: '0.875rem', md: '0.875rem', lg: '1rem', xl: '1rem' },
  },
  fonts: {
    heading: 'Roboto',
    body   : 'Roboto Serif',
    mono   : 'Roboto Mono',
  },
};

const lightColors = {
  primary              : '#8bb392',
  primaryText          : '#090909',
  secondary            : '#a7ccc4',
  secondaryText        : '#090909',
  tertiary             : '#d1e6dc',
  tertiaryText         : '#090909',
  primaryButtonText    : '#090909',
  secondaryButtonText  : '#090909',
  tertiaryButtonText   : '#090909',
  background           : '#eeeeee',
  backgroundAlt        : '#cccccc',
  text                 : '#090909',
} as const;

const darkColors = {
  primary              : '#608066',
  primaryText          : '#F7F7F7',
  secondary            : '#69807a',
  secondaryText        : '#F7F7F7',
  tertiary             : '#5d6662',
  tertiaryText         : '#F7F7F7',
  primaryButtonText    : '#F7F7F7',
  secondaryButtonText  : '#F7F7F7',
  tertiaryButtonText   : '#F7F7F7',
  background           : '#222222',
  backgroundAlt        : '#444444',
  text                 : '#F7F7F7',
} as const;

/*───────────────────────────────────────────────────────────*/
export const useTheme = create<ThemeStore>((set, get) => ({
  mode : 'dark',
  theme: {
    ...common,
    colors: darkColors,
  },

  setMode: (mode) =>
    set((state) => ({
      mode,
      theme: {
        ...common,
        colors: mode === 'dark' ? darkColors : lightColors,
        fonts : state.theme.fonts,
      },
    })),

  toggleMode: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),

  setTheme: (patch) =>
    set((state) => ({ theme: { ...state.theme, ...patch } })),
}));
