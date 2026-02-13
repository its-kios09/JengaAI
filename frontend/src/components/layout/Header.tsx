import { useState } from "react";
import { Sun, Moon, LogOut, User, ChevronDown } from "lucide-react";
import { useAuthStore } from "@/store/auth-store.ts";
import { useThemeStore } from "@/store/theme-store.ts";
import { useNavigate } from "react-router-dom";

export function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="h-16 border-b border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 px-6 flex items-center justify-end gap-4">
      {/* Theme toggle */}
      <button
        onClick={handleToggleTheme}
        className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500 dark:text-surface-400 transition-colors"
      >
        {isDark ? <Moon size={18}/>  : <Sun size={18} /> }
      </button>

      {/* User dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300 hidden sm:block">
            {user?.fullName || "User"}
          </span>
          <ChevronDown size={14} className="text-surface-400" />
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 z-20 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 shadow-lg py-1">
              <div className="px-4 py-3 border-b border-surface-200 dark:border-surface-700">
                <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                  {user?.fullName}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                <User size={16} /> Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger-600 dark:text-danger-400 hover:bg-surface-100 dark:hover:bg-surface-700"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
