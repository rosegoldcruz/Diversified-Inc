"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Funnel,
  List,
  MagnifyingGlass,
  Moon,
  Sun,
} from "phosphor-react";

type TopBarProps = {
  onMenuToggle: () => void;
};

export function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
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
    <header className="m-3 mb-0 flex min-w-0 items-center justify-between rounded-2xl border border-white/30 bg-white/70 px-4 py-3 shadow-glass ring-1 ring-white/20 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/10 sm:mx-5 sm:px-5 lg:mx-8 lg:px-6">
      {/* Search Section */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/55 text-textMuted shadow-glass backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-white/80 hover:text-textPrimary dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
            aria-label="Go back"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" weight="bold" />
          </button>
        )}
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/30 bg-white/55 text-textMuted shadow-glass backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-white/80 hover:text-textPrimary dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 lg:hidden"
          aria-label="Open navigation"
        >
          <List className="h-4 w-4" weight="bold" />
        </button>
        <div className="relative max-w-xl min-w-0 flex-1">
          <MagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-textDisabled"
            weight="regular"
          />
          <input
            className="h-10 w-full rounded-xl border border-white/30 bg-white/55 pl-10 pr-3 text-sm text-textPrimary shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] outline-none backdrop-blur-2xl transition-all placeholder:text-textDisabled focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/10"
            placeholder="Search tasks, work orders, files…"
          />
          <kbd className="absolute right-3 top-2.5 hidden rounded-lg border border-white/30 bg-white/60 px-1.5 py-0.5 text-[10px] text-textDisabled backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:block">
            ⌘K
          </kbd>
        </div>

        <button className="hidden h-10 items-center gap-1.5 rounded-xl border border-white/30 bg-white/55 px-3 text-xs font-medium text-textSecondary shadow-glass backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-white/80 hover:text-textPrimary dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 sm:inline-flex">
          <Funnel className="h-3.5 w-3.5" weight="regular" />
          <span>Filters</span>
        </button>
      </div>

      {/* Right Section */}
      <div className="ml-3 flex items-center gap-2 sm:ml-4 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/55 text-textMuted shadow-glass backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-white/80 hover:text-textPrimary dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" weight="duotone" />
          ) : (
            <Moon className="h-4 w-4" weight="duotone" />
          )}
        </button>

        {/* Notifications */}
        <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/30 bg-white/55 text-textMuted shadow-glass backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-white/80 hover:text-textPrimary dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
          <Bell className="h-4 w-4" weight="duotone" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-surface" />
        </button>

        {/* User Profile */}
        <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-white/30 bg-white/55 px-3 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/30 bg-accent/90 text-[10px] font-semibold text-white shadow-glass">
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
