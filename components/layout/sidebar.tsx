"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  ClipboardList,
  ClipboardCheck,
  BookOpen,
  FolderKanban,
  Users,
  Boxes,
  BarChart3,
  FolderOpen,
  FileText,
  MessageCircle,
  Bot,
  Zap,
  Settings,
  X,
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Projection Calendar", href: "/calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Forms Center", href: "/forms", icon: ClipboardList },
      { label: "Work Orders", href: "/work-orders", icon: FolderKanban },
      { label: "Employees", href: "/employees", icon: Users },
      { label: "SOPs", href: "/sops", icon: BookOpen },
      { label: "Requests", href: "/requests", icon: ClipboardCheck },
      { label: "Documents", href: "/documents", icon: FileText },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Inventory", href: "/inventory", icon: Boxes },
      { label: "Reports", href: "/reports", icon: BarChart3 },
      { label: "Files", href: "/files", icon: FolderOpen },
    ],
  },
  {
    label: "System",
    items: [
      { label: "AI Chat", href: "/ai-chat", icon: MessageCircle },
      { label: "AI Tools", href: "/ai-tools", icon: Bot },
      { label: "Automations", href: "/automations", icon: Zap },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  desktopCollapsed?: boolean;
};

export function Sidebar({ mobileOpen = false, onClose, desktopCollapsed = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
    <div
      className={[
        "fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
        mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      onClick={onClose}
      aria-hidden="true"
    />
    <aside
      className={[
        "fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,85vw)] flex-col border-r border-borderSubtle bg-surface transition-all duration-300 lg:static lg:z-auto lg:h-full lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        desktopCollapsed ? "lg:w-16" : "lg:w-64",
      ].join(" ")}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between gap-3 border-b border-borderSubtle px-5 py-4 lg:px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy">
            <span className="text-xs font-bold text-white">D</span>
          </div>
          <div className={desktopCollapsed ? "lg:hidden" : ""}>
            <div className="text-sm font-bold text-navy">
              Diversified OS
            </div>
            <div className="text-[10px] text-textMuted">
              Internal Operations Platform
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-textMuted transition-colors hover:bg-bgDark hover:text-textPrimary lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-3 py-5 text-sm lg:px-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className={["px-2 text-[10px] font-semibold uppercase tracking-widest text-textDisabled", desktopCollapsed ? "lg:hidden" : ""].join(" ")}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/" &&
                    pathname.startsWith(item.href) &&
                    pathname !== "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={[
                      "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-150",
                      desktopCollapsed ? "lg:justify-center lg:px-0" : "",
                      active
                        ? "bg-navy text-white"
                        : "text-textSecondary hover:bg-bgDark hover:text-textPrimary",
                    ].join(" ")}
                    title={desktopCollapsed ? item.label : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={["truncate", desktopCollapsed ? "lg:hidden" : ""].join(" ")}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={["border-t border-borderSubtle px-4 py-3", desktopCollapsed ? "lg:hidden" : ""].join(" ")}>
        <div className="text-[10px] font-medium text-textDisabled">Diversified OS</div>
        <div className="mt-0.5 text-[10px] text-borderHover">Internal Operations Platform</div>
      </div>
    </aside>
    </>
  );
}
