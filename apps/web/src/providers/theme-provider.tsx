'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/**
 * Light/Dark only — the Figma "Change Theme" menu offers exactly these two.
 * There is deliberately no "System" option; the brief is to implement the
 * theme as designed.
 */
export const THEMES = ['light', 'dark'] as const;

/** Order matches the "Color Mode" submenu. */
export const ACCENTS = ['amber', 'blue', 'pink', 'rose', 'emerald', 'black'] as const;

export type Theme = (typeof THEMES)[number];
export type Accent = (typeof ACCENTS)[number];

export const THEME_KEY = 'pyramid.theme';
export const ACCENT_KEY = 'pyramid.accent';

export const DEFAULT_THEME: Theme = 'light';
/** "Blue" carries the checkmark in the design. */
export const DEFAULT_ACCENT: Accent = 'blue';

/** Swatch colours for the Color Mode menu dots and the Settings › Color grid. */
export const ACCENT_SWATCHES: Record<Accent, string> = {
  amber: 'hsl(38 92% 50%)',
  blue: 'hsl(258 90% 66%)',
  pink: 'hsl(330 81% 60%)',
  rose: 'hsl(347 77% 50%)',
  emerald: 'hsl(160 84% 39%)',
  black: 'hsl(0 0% 9%)',
};

export const ACCENT_LABELS: Record<Accent, string> = {
  amber: 'Amber',
  blue: 'Blue',
  pink: 'Pink',
  rose: 'Rose',
  emerald: 'Emerald',
  black: 'Black',
};

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Writes the choice to <html>. Kept in sync with the boot script below. */
function applyTheme(theme: Theme, accent: Accent): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.dataset.accent = accent;
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial state matches the boot script's defaults so the first client render
  // agrees with the server-rendered markup.
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [accent, setAccentState] = useState<Accent>(DEFAULT_ACCENT);

  // Adopt whatever the boot script already applied before paint.
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const storedAccent = localStorage.getItem(ACCENT_KEY) as Accent | null;

    if (storedTheme && THEMES.includes(storedTheme)) setThemeState(storedTheme);
    if (storedAccent && ACCENTS.includes(storedAccent)) setAccentState(storedAccent);
  }, []);

  /** Repaints without animating every token at once, which reads as a smear. */
  const commit = useCallback((nextTheme: Theme, nextAccent: Accent) => {
    const root = document.documentElement;
    root.classList.add('theme-transitions-off');
    applyTheme(nextTheme, nextAccent);
    // Two frames: one to paint with transitions off, one to re-enable them.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove('theme-transitions-off')),
    );
  }, []);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      localStorage.setItem(THEME_KEY, next);
      commit(next, accent);
    },
    [accent, commit],
  );

  const setAccent = useCallback(
    (next: Accent) => {
      setAccentState(next);
      localStorage.setItem(ACCENT_KEY, next);
      commit(theme, next);
    },
    [theme, commit],
  );

  const value = useMemo(
    () => ({ theme, accent, setTheme, setAccent }),
    [theme, accent, setTheme, setAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

/**
 * Runs before first paint to stamp <html> from localStorage. Without this the
 * page paints light, then corrects on hydration — a visible flash for dark users.
 * Stringified because it must execute ahead of the React bundle.
 */
export const themeBootScript = `
(function(){
  try {
    var t = localStorage.getItem('${THEME_KEY}');
    var a = localStorage.getItem('${ACCENT_KEY}');
    if (t !== 'light' && t !== 'dark') t = '${DEFAULT_THEME}';
    if (['amber','blue','pink','rose','emerald','black'].indexOf(a) === -1) a = '${DEFAULT_ACCENT}';
    document.documentElement.classList.toggle('dark', t === 'dark');
    document.documentElement.dataset.accent = a;
    document.documentElement.style.colorScheme = t;
  } catch (e) {}
})();
`;
