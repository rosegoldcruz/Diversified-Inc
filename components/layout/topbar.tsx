"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, Bell, Filter, Menu, ArrowLeft, Moon, Sun } from "lucide-react";

type TopBarProps = {
  onMenuToggle: () => void;
};

export function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const canGoBack = pathname !== "/";

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("theme", nextTheme);
  };

  return (
    <header className="flex min-w-0 items-center justify-between border-b border-borderSubtle bg-surface px-3 py-2.5 sm:px-4 lg:px-6">
      {/* Search Section */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-borderSubtle text-textMuted transition-colors hover:bg-bgDark hover:text-textPrimary"
            aria-label="Go back"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-borderSubtle text-textMuted transition-colors hover:bg-bgDark hover:text-textPrimary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative max-w-lg min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-textDisabled" />
          <input
            className="h-9 w-full rounded-md border border-borderSubtle bg-bgDark pl-9 pr-3 text-sm text-textPrimary outline-none placeholder:text-textDisabled focus:border-borderFocus focus:ring-2 focus:ring-accent/20 transition-colors"
            placeholder="Search tasks, work orders, files…"
          />
          <kbd className="absolute right-3 top-2 hidden rounded border border-borderSubtle bg-surface px-1.5 py-0.5 text-[10px] text-textDisabled sm:block">
            ⌘K
          </kbd>
        </div>

        <button className="hidden items-center gap-1.5 rounded-md border border-borderSubtle bg-surface px-3 py-1.5 text-xs font-medium text-textSecondary transition-colors hover:bg-bgDark hover:text-textPrimary sm:inline-flex">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Right Section */}
      <div className="ml-3 flex items-center gap-2 sm:ml-4 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-borderSubtle text-textMuted transition-colors hover:bg-bgDark hover:text-textPrimary"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-borderSubtle text-textMuted transition-colors hover:bg-bgDark hover:text-textPrimary">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-cyber-red" />
        </button>

        {/* User Profile */}
        <div className="hidden items-center gap-2.5 rounded-md border border-borderSubtle bg-surface px-3 py-1.5 sm:flex">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white">
            D
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-textPrimary">
              Diversified OS
            </div>
            <div className="text-[10px] text-textMuted">
              Internal Operations
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
