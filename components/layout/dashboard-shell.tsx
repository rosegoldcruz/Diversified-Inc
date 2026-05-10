"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  { label: "Settings", href: "/settings", icon: Settings },
];

type RouteMotionProfile = {
  introY: number;
  outroY: number;
  stiffness: number;
  damping: number;
  mass: number;
  stageDuration: number;
  stageDelay: number;
};

function getRouteMotionProfile(pathname: string): RouteMotionProfile {
  if (pathname.startsWith("/dashboard")) {
    return {
      introY: 10,
      outroY: -8,
      stiffness: 320,
      damping: 32,
      mass: 0.8,
      stageDuration: 360,
      stageDelay: 32,
    };
  }

  const dataHeavyPrefixes = [
    "/tasks",
    "/work-orders",
    "/inventory",
    "/reports",
    "/documents",
    "/forms",
    "/employees",
    "/requests",
  ];

  if (dataHeavyPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return {
      introY: 14,
      outroY: -10,
      stiffness: 250,
      damping: 30,
      mass: 0.88,
      stageDuration: 460,
      stageDelay: 50,
    };
  }

  return {
    introY: 12,
    outroY: -8,
    stiffness: 285,
    damping: 30,
    mass: 0.84,
    stageDuration: 410,
    stageDelay: 42,
  };
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const desktopStaggerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const motionProfile = getRouteMotionProfile(pathname);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    const stageContainer = desktopStaggerRef.current;
    if (!stageContainer) return;

    const pageRoot = stageContainer.firstElementChild as HTMLElement | null;
    if (!pageRoot) return;

    const stageNodes = Array.from(pageRoot.children)
      .filter((node): node is HTMLElement => node instanceof HTMLElement)
      .slice(0, 8);

    if (stageNodes.length === 0) return;

    for (const [index, node] of stageNodes.entries()) {
      node.animate(
        [
          { opacity: 0, transform: "translateY(10px) scale(0.995)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        {
          duration: motionProfile.stageDuration,
          delay: motionProfile.stageDelay * index,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "both",
        },
      );
    }
  }, [pathname, prefersReducedMotion, motionProfile.stageDelay, motionProfile.stageDuration]);

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
      <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} desktopCollapsed={desktopCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onMenuToggle={toggleSidebar} onDesktopToggle={toggleDesktopSidebar} desktopCollapsed={desktopCollapsed} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              ref={desktopStaggerRef}
              initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: motionProfile.introY, scale: 0.995 }}
              animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: motionProfile.outroY, scale: 0.995 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: motionProfile.stiffness,
                      damping: motionProfile.damping,
                      mass: motionProfile.mass,
                    }
              }
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <MobileBottomNav pathname={pathname} onMoreClick={() => setMobileSheetOpen(true)} />
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
        className="mx-auto grid max-w-lg grid-cols-5 gap-1 rounded-2xl border border-borderSubtle bg-surface/95 p-1.5 shadow-soft backdrop-blur"
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
                  ? "bg-navy text-white"
                  : "text-textMuted hover:bg-bgMedium hover:text-navy",
              ].join(" ")}
            >
              {active ? (
                <motion.span
                  layoutId="mobile-nav-active-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 35, mass: 0.9 }}
                  className="absolute inset-0 rounded-xl bg-navy"
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
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-medium text-textMuted transition-colors hover:bg-bgMedium hover:text-navy"
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

function MobileNavigationSheet({ pathname, open, onClose }: MobileNavigationSheetProps) {
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
            transition={{ type: "spring", stiffness: 330, damping: 34, mass: 0.9 }}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-borderSubtle bg-surface px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 shadow-cyberLg lg:hidden"
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
                        ? "border-navy bg-navy/10 text-navy"
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
