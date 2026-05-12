"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  MessageCircle,
  MoreHorizontal,
  CalendarDays,
  ClipboardList,
  Users,
  Boxes,
  BarChart3,
  FolderOpen,
  BookOpen,
  ClipboardCheck,
  FileText,
  Bot,
  Zap,
  Settings,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

const MOBILE_PRIMARY_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Work Orders", href: "/work-orders", icon: FolderKanban },
  { label: "AI Chat", href: "/ai-chat", icon: MessageCircle },
];

const MOBILE_MORE_NAV = [
  { label: "Projection Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Forms", href: "/forms", icon: ClipboardList },
  { label: "Employees", href: "/employees", icon: Users },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Files", href: "/files", icon: FolderOpen },
  { label: "SOPs", href: "/sops", icon: BookOpen },
  { label: "Requests", href: "/requests", icon: ClipboardCheck },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "AI Tools", href: "/ai-tools", icon: Bot },
  { label: "Automations", href: "/automations", icon: Zap },
  { label: "Admin Settings", href: "/settings", icon: Settings },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setDesktopCollapsed((collapsed) => !collapsed);
  }, []);

  return (
    <div className="flex h-dvh bg-bgDark text-textPrimary">
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
        desktopCollapsed={desktopCollapsed}
        onDesktopToggle={toggleDesktopSidebar}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onMenuToggle={toggleSidebar} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-8 lg:pt-8">
          {children}
        </main>
        <MobileBottomNav
          pathname={pathname}
          onMoreClick={() => setMobileSheetOpen(true)}
        />
        <MobileNavigationSheet
          pathname={pathname}
          open={mobileSheetOpen}
          onClose={() => setMobileSheetOpen(false)}
        />
      </div>
    </div>
  );
}

type MobileBottomNavProps = {
  pathname: string;
  onMoreClick: () => void;
};

function MobileBottomNav({ pathname, onMoreClick }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 lg:hidden">
      <motion.div
        initial={{ y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 32, mass: 0.85 }}
        className="mx-auto grid max-w-lg grid-cols-5 gap-1 rounded-2xl border border-borderSubtle bg-surface/90 p-1.5 shadow-cyberMd backdrop-blur-xl"
      >
        {MOBILE_PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-medium transition-colors",
                active
                  ? "bg-blue-50 text-accent dark:bg-blue-500/10 dark:text-blue-300"
                  : "text-textMuted hover:bg-bgMedium hover:text-textPrimary",
              ].join(" ")}
            >
              {active ? (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 35,
                    mass: 0.9,
                  }}
                  className="absolute inset-0 rounded-xl bg-blue-50 dark:bg-blue-500/10"
                />
              ) : null}
              <Icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-medium text-textMuted transition-colors hover:bg-bgMedium hover:text-textPrimary"
          aria-label="Open full navigation"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span>More</span>
        </button>
      </motion.div>
    </nav>
  );
}

type MobileNavigationSheetProps = {
  pathname: string;
  open: boolean;
  onClose: () => void;
};

function MobileNavigationSheet({
  pathname,
  open,
  onClose,
}: MobileNavigationSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close mobile navigation"
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/45 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.section
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{
              type: "spring",
              stiffness: 330,
              damping: 34,
              mass: 0.9,
            }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border border-borderSubtle bg-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 shadow-cyberLg backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-borderHover" />
            <p className="px-1 text-sm text-textMuted">All destinations</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {MOBILE_MORE_NAV.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={[
                      "flex min-h-12 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
                      active
                        ? "border-blue-200 bg-blue-50 text-accent dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300"
                        : "border-borderSubtle text-textPrimary",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
