// ─────────────────────────────────────────────────────────────
// src/system/themeStore.ts
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  colors: Record<string, string>;
  spacing: Record<string, string>;
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

const common: Omit<Theme, 'colors'> = {
  spacing: {
    xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem', xl: '2rem',
  },
  breakpoints: {
    xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920,
  },
  typography: {
    h1: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.5rem', xl: '4rem' },
    h2: { xs: '1.5rem', sm: '2rem', md: '2.5rem', lg: '3rem', xl: '3.5rem' },
    h3: { xs: '1.25rem', sm: '1.5rem', md: '2rem', lg: '2.5rem', xl: '3rem' },
    h4: { xs: '1rem', sm: '1.25rem', md: '1.5rem', lg: '2rem', xl: '2.5rem' },
    h5: { xs: '0.875rem', sm: '1rem', md: '1.25rem', lg: '1.5rem', xl: '2rem' },
    h6: { xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.25rem', xl: '1.5rem' },
    body: { xs: '0.875rem', sm: '1rem', md: '1rem', lg: '1rem', xl: '1rem' },
    subtitle: { xs: '0.75rem', sm: '0.875rem', md: '0.875rem', lg: '1rem', xl: '1rem' },
  },
  fonts: {
    heading: 'Roboto', body: 'Roboto Serif', mono: 'Roboto Mono',
  },
};

const lightColors = {
  primary:'#62AEE4',   primaryText:'#FFFFFF',
  secondary:'#F7C0A1', secondaryText:'#111111',
  tertiary:'#9AE5E6',  tertiaryText:'#111111',
  background:'#FFFFFF',
  backgroundAlt:'#CCCCCC',
  text:'#111111',
} as const;

const darkColors = {
  primary:'#0D324D',   primaryText:'#FFFFFF',
  secondary:'#EF8243', secondaryText:'#111111',
  tertiary:'#4BD0D2',  tertiaryText:'#111111',
  background:'#222222',
  backgroundAlt:'#444444',
  text:'#EEEEEE',
} as const;

export const useTheme = create<ThemeStore>((set, get) => ({
  mode: 'dark',
  theme: { ...common, colors: darkColors },

  setMode: (mode: ThemeMode) =>
    set((state) => ({
      mode,
      theme: {
        ...common,
        colors: mode === 'dark' ? darkColors : lightColors,
        fonts: state.theme.fonts,  // ← FIX: preserve fonts explicitly
      },
    })),

  toggleMode: () => get().setMode(get().mode === 'dark' ? 'light' : 'dark'),

  setTheme: (patch: Partial<Theme>) => set((state) => ({
    theme: { ...state.theme, ...patch },
  })),
}));
