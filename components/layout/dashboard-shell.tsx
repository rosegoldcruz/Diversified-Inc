"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, FolderKanban, FolderOpen, MoreHorizontal } from "lucide-react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
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
      <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} desktopCollapsed={desktopCollapsed} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onMenuToggle={toggleSidebar} onDesktopToggle={toggleDesktopSidebar} desktopCollapsed={desktopCollapsed} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-28 pt-5 sm:px-5 lg:px-8 lg:pb-6">
          {children}
        </main>
        <MobileBottomNav pathname={pathname} onMoreClick={toggleSidebar} />
      </div>
    </div>
  );
}

type MobileBottomNavProps = {
  pathname: string;
  onMoreClick: () => void;
};

function MobileBottomNav({ pathname, onMoreClick }: MobileBottomNavProps) {
  const items = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Tasks", href: "/tasks", icon: CheckSquare },
    { label: "Work Orders", href: "/work-orders", icon: FolderKanban },
    { label: "Files", href: "/files", icon: FolderOpen },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-borderSubtle bg-surface px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-[10px] font-medium transition-colors",
                active
                  ? "bg-navy text-white"
                  : "text-textMuted hover:bg-bgMedium hover:text-navy",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md px-2 text-[10px] font-medium text-textMuted transition-colors hover:bg-bgMedium hover:text-navy"
          aria-label="Open full navigation"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
