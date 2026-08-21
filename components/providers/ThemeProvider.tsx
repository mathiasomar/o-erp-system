"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ColorPalette = "red" | "rose" | "blue" | "green" | "orange";

export type { Theme, ColorPalette };

const PALETTE_CLASSES = [
  "theme-red",
  "theme-rose",
  "theme-blue",
  "theme-green",
  "theme-orange",
] as const;

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultPalette?: ColorPalette;
  enableSystem?: boolean;
  attribute?: "class" | `data-${string}`;
  disableTransitionOnChange?: boolean;
};

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getStoredTheme = (): Theme | null => {
  if (typeof window === "undefined") return null;
  const storedTheme = window.localStorage.getItem("theme");
  if (
    storedTheme === "light" ||
    storedTheme === "dark" ||
    storedTheme === "system"
  ) {
    return storedTheme;
  }
  return null;
};

const getStoredPalette = (): ColorPalette | null => {
  if (typeof window === "undefined") return null;
  const storedPalette = window.localStorage.getItem("palette");
  if (
    storedPalette === "red" ||
    storedPalette === "rose" ||
    storedPalette === "blue" ||
    storedPalette === "green" ||
    storedPalette === "orange"
  ) {
    return storedPalette;
  }
  return null;
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultPalette = "red",
  enableSystem = true,
  attribute = "class",
  disableTransitionOnChange,
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(
    () => getStoredTheme() ?? defaultTheme,
  );
  const [palette, setPalette] = React.useState<ColorPalette>(
    () => getStoredPalette() ?? defaultPalette,
  );
  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">(
    getSystemTheme(),
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(getSystemTheme());
    mediaQuery.addEventListener("change", onChange);

    return () => mediaQuery.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: "light" | "dark" =
    theme === "system" ? (enableSystem ? systemTheme : "light") : theme;

  React.useEffect(() => {
    const root = document.documentElement;
    const value = resolvedTheme;
    const paletteClass = `theme-${palette}`;

    if (attribute === "class") {
      root.classList.remove("light", "dark");
      root.classList.add(value);
    } else {
      root.setAttribute(attribute, value);
    }

    root.classList.remove(...PALETTE_CLASSES);
    root.classList.add(paletteClass);

    if (disableTransitionOnChange) {
      const previousTransition = root.style.transition;
      root.style.transition = "none";
      requestAnimationFrame(() => {
        root.style.transition = previousTransition;
      });
    }

    root.style.colorScheme = value;
    window.localStorage.setItem("theme", theme);
    window.localStorage.setItem("palette", palette);
  }, [theme, resolvedTheme, attribute, disableTransitionOnChange, palette]);

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      palette,
      setPalette,
    }),
    [theme, resolvedTheme, palette],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}
