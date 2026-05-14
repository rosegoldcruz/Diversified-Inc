"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  List,
  MagnifyingGlass,
  Moon,
  SignOut,
  Sun,
} from "phosphor-react";
import NotificationBell from "@/components/NotificationBell";

type TopBarProps = {
  onMenuToggle: () => void;
};

type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  url: string;
  status: string | null;
  matched_field: string;
};

export function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const TOP_LEVEL_PATHS = new Set([
    "/dashboard",
    "/tasks",
    "/calendar",
    "/work-orders",
    "/forms",
    "/employees",
    "/timeclock",
    "/timesheets",
    "/sops",
    "/requests",
    "/documents",
    "/inventory",
    "/reports",
    "/files",
    "/ai-chat",
    "/ai-tools",
    "/automations",
    "/admin",
    "/settings",
    "/",
  ]);

  const parentRoute = pathname.match(/^\/tasks\/\d+/)?.[0]
    ? "/tasks"
    : pathname.match(/^\/work-orders\/\d+/)?.[0]
      ? "/work-orders"
      : pathname.match(/^\/employees\/\d+/)?.[0]
        ? "/employees"
        : pathname.match(/^\/inventory\/\d+/)?.[0]
          ? "/inventory"
          : pathname.match(/^\/documents\/\d+/)?.[0]
            ? "/documents"
            : pathname.startsWith("/settings/")
              ? "/settings"
              : pathname.startsWith("/tasks/")
                ? "/tasks"
                : pathname.startsWith("/work-orders/")
                  ? "/work-orders"
                  : pathname.startsWith("/employees/")
                    ? "/employees"
                    : pathname.startsWith("/inventory/")
                      ? "/inventory"
                      : pathname.startsWith("/documents/")
                        ? "/documents"
                        : null;

  const canGoBack = !TOP_LEVEL_PATHS.has(pathname) && Boolean(parentRoute);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.user) setUser(data.user as SessionUser);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const params = new URLSearchParams({ q: trimmed, limit: "8" });
        const response = await fetch(`/api/search?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Search failed (${response.status})`);
        }
        const data = (await response.json()) as { results?: SearchResult[] };
        setSearchResults(data.results ?? []);
        setSearchOpen(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSearchResults([]);
        setSearchError(
          error instanceof Error ? error.message : "Search failed",
        );
        setSearchOpen(true);
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("theme", nextTheme);
  };

  async function signOut() {
    window.location.assign("/api/auth/logout");
  }

  function openResult(result: SearchResult) {
    setSearchOpen(false);
    setQuery("");
    router.push(result.url);
  }

  function goBackSafely() {
    if (parentRoute) {
      router.push(parentRoute);
      return;
    }
    router.push("/dashboard");
  }

  const initials = user
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "D"
    : "D";

  return (
    <header className="m-3 mb-0 flex min-w-0 items-center justify-between rounded-2xl border border-white/30 bg-white/70 px-4 py-3 shadow-glass ring-1 ring-white/20 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/10 sm:mx-5 sm:px-5 lg:mx-8 lg:px-6">
      {/* Search Section */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {canGoBack && (
          <button
            type="button"
            onClick={goBackSafely}
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
        <div className="relative min-w-0 flex-1">
          <div className="relative">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted"
              weight="duotone"
            />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(event.target.value.trim().length >= 2);
              }}
              onFocus={() => setSearchOpen(query.trim().length >= 2)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setSearchOpen(false);
                if (event.key === "Enter" && searchResults[0]) {
                  event.preventDefault();
                  openResult(searchResults[0]);
                }
              }}
              placeholder="Search operations"
              aria-label="Search operations"
              className="h-10 w-full rounded-xl border border-white/30 bg-white/55 pl-9 pr-3 text-sm text-textPrimary shadow-glass outline-none backdrop-blur-2xl transition placeholder:text-textMuted focus:border-accent/50 focus:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:focus:bg-white/10"
            />
          </div>
          {searchOpen ? (
            <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-white/30 bg-white/95 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/95">
              {searchLoading ? (
                <SearchState label="Searching..." />
              ) : searchError ? (
                <SearchState label={searchError} tone="error" />
              ) : searchResults.length === 0 ? (
                <SearchState label="No matching records found." />
              ) : (
                <ul className="max-h-80 overflow-y-auto py-2">
                  {searchResults.map((result) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => openResult(result)}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-black/5 focus:bg-black/5 focus:outline-none dark:hover:bg-white/10 dark:focus:bg-white/10"
                      >
                        <span className="mt-0.5 rounded-md border border-white/30 bg-white/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-textMuted dark:border-white/10 dark:bg-white/5">
                          {result.type.replaceAll("_", " ")}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-textPrimary">
                            {result.title}
                          </span>
                          <span className="block truncate text-xs text-textMuted">
                            {result.subtitle ||
                              result.status ||
                              `Matched ${result.matched_field}`}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
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
        <NotificationBell />

        {/* User Profile */}
        <div className="hidden h-10 items-center gap-2.5 rounded-xl border border-white/30 bg-white/55 px-3 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:flex">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/30 bg-accent/90 text-[10px] font-semibold text-white shadow-glass">
            {initials}
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-textPrimary">
              {user?.name ?? "Diversified OS"}
            </div>
            <div className="text-[10px] text-textMuted">
              {user?.role ?? "Internal Operations"}
            </div>
          </div>
          {user ? (
            <button
              type="button"
              onClick={signOut}
              className="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/30 text-textMuted transition hover:bg-white/40 hover:text-textPrimary dark:border-white/10 dark:hover:bg-white/10"
              aria-label="Sign out"
              title="Sign out"
            >
              <SignOut className="h-3.5 w-3.5" weight="bold" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function SearchState({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "error";
}) {
  return (
    <div
      className={`px-4 py-5 text-sm ${
        tone === "error" ? "text-red-600 dark:text-red-300" : "text-textMuted"
      }`}
    >
      {label}
    </div>
  );
}
