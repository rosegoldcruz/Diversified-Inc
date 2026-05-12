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
    <header className="flex min-w-0 items-center justify-between border-b border-borderSubtle bg-surface/80 px-4 py-3 shadow-soft backdrop-blur-xl sm:px-5 lg:px-8">
      {/* Search Section */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-borderSubtle bg-surface/80 text-textMuted shadow-soft transition-all hover:-translate-y-px hover:bg-surface hover:text-textPrimary"
            aria-label="Go back"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={onMenuToggle}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-borderSubtle bg-surface/80 text-textMuted shadow-soft transition-all hover:-translate-y-px hover:bg-surface hover:text-textPrimary lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative max-w-xl min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-2.5 h-4 w-4 text-textDisabled" />
          <input
            className="h-10 w-full rounded-xl border border-borderSubtle bg-bgDark/80 pl-10 pr-3 text-sm text-textPrimary outline-none transition-all placeholder:text-textDisabled focus:border-borderFocus focus:bg-surface focus:ring-4 focus:ring-accent/10"
            placeholder="Search tasks, work orders, files…"
          />
          <kbd className="absolute right-3 top-2.5 hidden rounded-md border border-borderSubtle bg-surface/90 px-1.5 py-0.5 text-[10px] text-textDisabled sm:block">
            ⌘K
          </kbd>
        </div>

        <button className="hidden h-10 items-center gap-1.5 rounded-xl border border-borderSubtle bg-surface/80 px-3 text-xs font-medium text-textSecondary shadow-soft transition-all hover:-translate-y-px hover:bg-surface hover:text-textPrimary sm:inline-flex">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Right Section */}
      <div className="ml-3 flex items-center gap-2 sm:ml-4 sm:gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-borderSubtle bg-surface/80 text-textMuted shadow-soft transition-all hover:-translate-y-px hover:bg-surface hover:text-textPrimary"
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
        <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-borderSubtle bg-surface/80 text-textMuted shadow-soft transition-all hover:-translate-y-px hover:bg-surface hover:text-textPrimary">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-surface" />
        </button>

        {/* User Profile */}
        <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-borderSubtle bg-surface/80 px-3 shadow-soft backdrop-blur-xl sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[10px] font-semibold text-white shadow-soft">
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
