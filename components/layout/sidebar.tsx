"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Clock,
  CalendarCheck,
  Boxes,
  BarChart3,
  FolderOpen,
  FileText,
  MessageCircle,
  Bot,
  Zap,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
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
      { label: "Timeclock", href: "/timeclock", icon: Clock },
      { label: "Timesheets", href: "/timesheets", icon: CalendarCheck },
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
      { label: "Admin Settings", href: "/settings", icon: Settings },
    ],
  },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
  desktopCollapsed?: boolean;
  onDesktopToggle?: () => void;
};

export function Sidebar({
  mobileOpen = false,
  onClose,
  desktopCollapsed = false,
  onDesktopToggle,
}: SidebarProps) {
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
        <div className="relative border-b border-borderSubtle">
          <div className="relative h-20 w-full overflow-hidden">
            <Image
              src="/divco.gif"
              alt="Diversified OS"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 85vw, 256px"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent" />
          </div>
          <button
            type="button"
            onClick={onDesktopToggle}
            className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-md border border-white/30 bg-black/35 text-white transition-colors hover:bg-black/55 lg:inline-flex"
            aria-label={
              desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {desktopCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-black/35 text-white transition-colors hover:bg-black/55 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-3 py-5 text-sm lg:px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              <p
                className={[
                  "px-2 text-[10px] font-semibold uppercase tracking-widest text-textDisabled",
                  desktopCollapsed ? "lg:hidden" : "",
                ].join(" ")}
              >
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
                      <span
                        className={[
                          "truncate",
                          desktopCollapsed ? "lg:hidden" : "",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={[
            "border-t border-borderSubtle px-4 py-3",
            desktopCollapsed ? "lg:hidden" : "",
          ].join(" ")}
        >
          <div className="text-[10px] font-medium text-textDisabled">
            Diversified OS
          </div>
          <div className="mt-0.5 text-[10px] text-borderHover">
            Internal Operations Platform
          </div>
        </div>
      </aside>
    </>
  );
}
