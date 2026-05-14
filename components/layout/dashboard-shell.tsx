"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const pathname = usePathname() ?? "/";

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((open) => !open);
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setDesktopCollapsed((collapsed) => !collapsed);
  }, []);

  // Auth pages render outside the dashboard chrome.
  if (pathname === "/login" || pathname?.startsWith("/login/")) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh bg-transparent text-textPrimary">
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={closeSidebar}
        desktopCollapsed={desktopCollapsed}
        onDesktopToggle={toggleDesktopSidebar}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar onMenuToggle={toggleSidebar} />
        <main className="main-content page-shell min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-6 pt-4 sm:px-5 sm:pt-6 lg:px-10 lg:pb-8 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
