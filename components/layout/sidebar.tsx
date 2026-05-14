"use client";

import { useEffect, useState, type ComponentType } from "react";
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
  SignOut,
  X,
  CaretLeft,
  CaretRight,
} from "phosphor-react";
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

type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: string;
};

export function Sidebar({
  mobileOpen = false,
  onClose,
  desktopCollapsed = false,
  onDesktopToggle,
}: SidebarProps) {
  const pathname = usePathname() ?? "/";
  const [user, setUser] = useState<SessionUser | null>(null);

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

  function signOut() {
    window.location.assign("/api/auth/logout");
  }

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
        <div
          className={[
            "relative border-b border-white/25 dark:border-white/10",
            desktopCollapsed ? "px-2 py-2" : "px-3 py-3",
          ].join(" ")}
        >
          <div
            className={[
              "relative w-full overflow-hidden border border-white/35 bg-white/65 shadow-glass ring-1 ring-white/20 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/40 dark:ring-white/10",
              desktopCollapsed ? "h-12 rounded-xl" : "h-20 rounded-2xl",
            ].join(" ")}
          >
            <Image
              src="/divco.gif"
              alt="Diversified OS"
              fill
              priority
              className="object-contain p-2"
              sizes="(max-width: 1024px) 85vw, 256px"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/10 dark:to-black/10" />
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
        <div className="space-y-3 border-t border-white/25 px-3 py-3 dark:border-white/10">
          {user ? (
            <div className="rounded-xl border border-white/20 bg-white/40 px-3 py-2 text-xs dark:border-white/10 dark:bg-white/5 lg:hidden">
              <div className="font-semibold text-textPrimary">{user.name}</div>
              <div className="text-textMuted">{user.role}</div>
              <button
                type="button"
                onClick={signOut}
                className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-white/30 bg-white/50 font-semibold text-textPrimary transition hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/20"
              >
                <SignOut className="h-3.5 w-3.5" weight="bold" />
                Logout
              </button>
            </div>
          ) : null}
          <div
            className={["px-1", desktopCollapsed ? "lg:hidden" : ""].join(" ")}
          >
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
