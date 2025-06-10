export type Theme = "light" | "dark";

export const getTheme = (): Theme => {
  if (typeof window === "undefined") return "light";

  const stored = localStorage.getItem("theme") as Theme;
  if (stored && ["light", "dark"].includes(stored)) {
    return stored;
  }

  // Check system preference
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export const setTheme = (theme: Theme): void => {
  if (typeof window === "undefined") return;

  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  // Also set a class for compatibility
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(`theme-${theme}`);
};

export const toggleTheme = (): Theme => {
  const current = getTheme();
  const next = current === "light" ? "dark" : "light";
  setTheme(next);
  return next;
};

// Initialize theme on load
export const initializeTheme = (): void => {
  const theme = getTheme();
  setTheme(theme);
};

// Listen for system theme changes
export const watchSystemTheme = (callback?: (theme: Theme) => void): (() => void) => {
  if (typeof window === "undefined") return () => {};

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (e: MediaQueryListEvent) => {
    const theme = e.matches ? "dark" : "light";
    // Only update if no theme is stored (following system preference)
    if (!localStorage.getItem("theme")) {
      setTheme(theme);
      callback?.(theme);
    }
  };

  mediaQuery.addEventListener("change", handler);

  // Return cleanup function
  return () => mediaQuery.removeEventListener("change", handler);
};
