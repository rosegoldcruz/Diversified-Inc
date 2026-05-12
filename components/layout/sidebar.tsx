"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Gauge,
  CheckSquare,
  Calendar,
  ClipboardText,
  Clipboard,
  BookOpen,
  Briefcase,
  Users,
  Clock,
  CalendarCheck,
  Package,
  ChartBar,
  FolderOpen,
  FileText,
  ChatCircle,
  Robot,
  Lightning,
  GearSix,
  X,
  CaretLeft,
  CaretRight,
} from "phosphor-react";
import { GlassIcons } from "@/components/ui/GlassIcons";
import { SidebarItem } from "@/components/ui/SidebarItem";

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
type PhosphorIcon = ComponentType<{
  className?: string;
  size?: number | string;
  weight?: IconWeight;
}>;

type NavItem = {
  label: string;
  href: string;
  icon: PhosphorIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: Gauge },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Projection Calendar", href: "/calendar", icon: Calendar },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Forms Center", href: "/forms", icon: ClipboardText },
      { label: "Work Orders", href: "/work-orders", icon: Briefcase },
      { label: "Employees", href: "/employees", icon: Users },
      { label: "Timeclock", href: "/timeclock", icon: Clock },
      { label: "Timesheets", href: "/timesheets", icon: CalendarCheck },
      { label: "SOPs", href: "/sops", icon: BookOpen },
      { label: "Requests", href: "/requests", icon: Clipboard },
      { label: "Documents", href: "/documents", icon: FileText },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Inventory", href: "/inventory", icon: Package },
      { label: "Reports", href: "/reports", icon: ChartBar },
      { label: "Files", href: "/files", icon: FolderOpen },
    ],
  },
  {
    label: "System",
    items: [
      { label: "AI Chat", href: "/ai-chat", icon: ChatCircle },
      { label: "AI Tools", href: "/ai-tools", icon: Robot },
      { label: "Automations", href: "/automations", icon: Lightning },
      { label: "Admin Settings", href: "/settings", icon: GearSix },
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
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(20rem,85vw)] flex-col border-r border-white/25 bg-white/55 shadow-glass ring-1 ring-white/20 backdrop-blur-2xl transition-all duration-300 dark:border-white/10 dark:bg-slate-950/70 dark:ring-white/10 lg:static lg:z-auto lg:h-full lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          desktopCollapsed ? "lg:w-16" : "lg:w-64",
        ].join(" ")}
      >
        {/* Logo Section */}
        <div className="relative border-b border-white/25 px-3 py-3 dark:border-white/10">
          <div className="relative h-16 w-full overflow-hidden rounded-2xl border border-white/30 shadow-glass ring-1 ring-white/20 backdrop-blur-2xl dark:border-white/10 dark:ring-white/10">
            <Image
              src="/divco.gif"
              alt="Diversified OS"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 85vw, 256px"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/20" />
          </div>
          <button
            type="button"
            onClick={onDesktopToggle}
            className="absolute right-5 top-5 hidden h-8 w-8 items-center justify-center rounded-xl border border-white/30 bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55 lg:inline-flex"
            aria-label={
              desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {desktopCollapsed ? (
              <CaretRight className="h-4 w-4" weight="bold" />
            ) : (
              <CaretLeft className="h-4 w-4" weight="bold" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/55 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto scrollbar-thin px-3 py-5 text-sm lg:px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              <p
                className={[
                  "px-3 text-[10px] font-semibold uppercase tracking-widest text-textDisabled",
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
                    <SidebarItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={Icon}
                      active={active}
                      collapsed={desktopCollapsed}
                      onClick={onClose}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div
          className={[
            "space-y-3 border-t border-white/25 px-3 py-3 dark:border-white/10",
            desktopCollapsed ? "lg:hidden" : "",
          ].join(" ")}
        >
          <GlassIcons
            items={[
              { label: "Tasks", href: "/tasks", icon: CheckSquare },
              { label: "Reports", href: "/reports", icon: ChartBar },
            ]}
            className="grid-cols-2"
          />
          <div className="px-1">
            <div className="text-[10px] font-medium text-textDisabled">
              Diversified OS
            </div>
            <div className="mt-0.5 text-[10px] text-borderHover">
              Internal Operations Platform
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
