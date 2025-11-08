"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemePreference = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

interface ThemeContextValue {
  theme: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const THEME_STORAGE_KEY = "nexi:theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    if (typeof window === "undefined") {
      return "system";
    }
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as
      | ThemePreference
      | null;
    return stored ?? "system";
  });
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>("light");

  // Observe system preference changes
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () => {
      setSystemTheme(mediaQuery.matches ? "dark" : "light");
    };

    updateSystemTheme();
    mediaQuery.addEventListener("change", updateSystemTheme);
    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme);
    };
  }, []);

  const effectiveTheme: EffectiveTheme =
    theme === "system" ? systemTheme : theme;

  // Apply theme changes to <html>
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;

    root.dataset.theme = effectiveTheme;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${effectiveTheme}`);

    if (theme === "system") {
      window.localStorage.removeItem(THEME_STORAGE_KEY);
    } else {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [effectiveTheme, theme]);

  const updateTheme = useCallback((nextTheme: ThemePreference) => {
    setTheme(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      if (current === "system") {
        return systemTheme === "dark" ? "light" : "dark";
      }
      return current === "dark" ? "light" : "dark";
    });
  }, [systemTheme]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      effectiveTheme,
      setTheme: updateTheme,
      toggleTheme,
    }),
    [effectiveTheme, theme, toggleTheme, updateTheme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

