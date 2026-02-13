import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeState = {
  isDark: boolean;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  toggleSidebar: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: true,
      sidebarCollapsed: false,
      toggleTheme: () =>
        set((state) => {
          const next = !state.isDark;

          document.documentElement.classList.toggle("dark", next);

          return { isDark: next };
        }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "jenga-theme",
      partialize: (state) => {
        return {
          isDark: state.isDark,
          sidebarCollapsed: state.sidebarCollapsed,
        };
      },
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            document.documentElement.classList.remove("dark");

            if (state.isDark) {
              document.documentElement.classList.add("dark");
            }
          }
        };
      },
    },
  ),
);
