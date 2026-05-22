"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/toast";
import type {
  AppearanceSettings,
  NotificationSettings,
  ProfileSettings,
  SecuritySettings,
  WorkspaceSettings,
} from "@/lib/user-settings";

type SettingsResponse = {
  profile: ProfileSettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
  workspace: WorkspaceSettings;
  security: SecuritySettings;
  meta: {
    canEditEmail: boolean;
    smsConfigured: boolean;
    supportsPasswordChange: boolean;
    supportsTwoFactor: boolean;
    departments: string[];
  };
};

type TabKey =
  | "profile"
  | "notifications"
  | "appearance"
  | "workspace"
  | "security";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "profile", label: "Profile" },
  { key: "notifications", label: "Notifications" },
  { key: "appearance", label: "Appearance" },
  { key: "workspace", label: "Workspace" },
  { key: "security", label: "Security" },
];

const TIMEZONES = [
  "America/Chicago",
  "America/New_York",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
];

const EVENT_LABELS: Record<keyof NotificationSettings["events"], string> = {
  task_assigned: "Task assigned",
  task_overdue: "Task overdue",
  request_submitted: "Request submitted",
  request_approved_denied: "Request approved/denied",
  form_submitted: "Form submitted",
  work_order_assigned: "Work order assigned",
  low_inventory: "Low inventory",
  timesheet_submitted: "Timesheet submitted",
  weekly_leadership_summary: "Weekly leadership summary",
  security_admin_alert: "Security/admin alert",
};

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass-surface rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-textSecondary">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-emerald-600" : "bg-neutral-500/60"
      } disabled:cursor-not-allowed disabled:opacity-50`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          checked ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}

export default function SettingsPage() {
  const { pushToast } = useToast();
  const [tab, setTab] = useState<TabKey>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SettingsResponse | null>(null);

  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationSettings | null>(null);
  const [appearance, setAppearance] = useState<AppearanceSettings | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSettings | null>(null);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to load settings.");
      }

      const payload = (await response.json()) as SettingsResponse;
      setData(payload);
      setProfile(payload.profile);
      setNotifications(payload.notifications);
      setAppearance(payload.appearance);
      setWorkspace(payload.workspace);
      setSecurity(payload.security);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load settings",
      );
    } finally {
      setLoading(false);
    }
  }

  async function save(
    path: string,
    body: Record<string, unknown>,
    success: string,
  ) {
    try {
      setSaving(true);
      const response = await fetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Save failed.");
      }
      pushToast(success, "success");
      await loadSettings();
    } catch (saveError) {
      pushToast(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save settings.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  const initials = useMemo(() => {
    const name = profile?.displayName || "User";
    return (
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("") || "U"
    );
  }, [profile?.displayName]);

  useEffect(() => {
    if (!appearance) return;
    if (appearance.theme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      document.documentElement.classList.toggle("dark", prefersDark);
      localStorage.removeItem("theme");
      return;
    }
    document.documentElement.classList.toggle(
      "dark",
      appearance.theme === "dark",
    );
    localStorage.setItem("theme", appearance.theme);
  }, [appearance]);

  if (loading) {
    return (
      <p className="p-6 text-sm text-textSecondary">Loading settings...</p>
    );
  }

  if (
    error ||
    !data ||
    !profile ||
    !notifications ||
    !appearance ||
    !workspace ||
    !security
  ) {
    return (
      <div className="space-y-4 p-6">
        <Badge variant="danger">Error</Badge>
        <p className="text-sm text-textSecondary">
          {error || "Settings are not available."}
        </p>
        <Button variant="outline" onClick={() => void loadSettings()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section>
        <h1 className="text-3xl font-semibold text-textPrimary">Settings</h1>
        <p className="mt-1 text-sm text-textSecondary">
          Manage your personal workspace preferences for Diversified OS.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={[
              "rounded-xl border px-3 py-2 text-sm transition",
              tab === item.key
                ? "border-accent/60 bg-accent/20 text-textPrimary"
                : "border-white/20 bg-white/10 text-textSecondary hover:bg-white/20",
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <div className="space-y-5">
          <Section
            title="Profile Information"
            description="These preferences identify you across tasks, requests, and work orders."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Display name</span>
                <input
                  value={profile.displayName}
                  onChange={(event) =>
                    setProfile((current) =>
                      current
                        ? { ...current, displayName: event.target.value }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Email</span>
                <input
                  value={profile.email}
                  disabled={!data.meta.canEditEmail}
                  onChange={(event) =>
                    setProfile((current) =>
                      current
                        ? { ...current, email: event.target.value }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary disabled:opacity-60"
                />
                {!data.meta.canEditEmail ? (
                  <span className="text-xs text-textMuted">
                    Email is managed by your authentication provider.
                  </span>
                ) : null}
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Phone</span>
                <input
                  value={profile.phone}
                  onChange={(event) =>
                    setProfile((current) =>
                      current
                        ? { ...current, phone: event.target.value }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Department</span>
                <select
                  value={profile.department}
                  onChange={(event) =>
                    setProfile((current) =>
                      current
                        ? { ...current, department: event.target.value }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                >
                  <option value="">Unassigned</option>
                  {data.meta.departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Role</span>
                <input
                  value={profile.role || "Employee"}
                  readOnly
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary opacity-70"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Timezone</span>
                <select
                  value={profile.timezone}
                  onChange={(event) =>
                    setProfile((current) =>
                      current
                        ? { ...current, timezone: event.target.value }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                >
                  {TIMEZONES.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4">
              <Button
                disabled={saving}
                onClick={() =>
                  void save(
                    "/api/settings/profile",
                    { ...profile },
                    "Profile settings saved.",
                  )
                }
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </Section>

          <Section
            title="Profile Photo"
            description="Avatar uploads are not configured in settings yet."
          >
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-accent/60 text-lg font-semibold text-white">
                {initials}
              </div>
              <div>
                <Button variant="outline" disabled>
                  Upload photo (planned)
                </Button>
                <p className="mt-1 text-xs text-textMuted">
                  File upload management is available in Files, but profile
                  avatar upload is future scope.
                </p>
              </div>
            </div>
          </Section>
        </div>
      ) : null}

      {tab === "notifications" ? (
        <div className="space-y-5">
          <Section
            title="Event Channels"
            description="Choose where each internal operations event should notify you."
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-white/20 text-left">
                    <th className="px-2 py-2 text-textMuted">Event</th>
                    <th className="px-2 py-2 text-textMuted">In-app</th>
                    <th className="px-2 py-2 text-textMuted">Email</th>
                    <th className="px-2 py-2 text-textMuted">SMS</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(notifications.events).map(
                    ([eventKey, channels]) => (
                      <tr key={eventKey} className="border-b border-white/10">
                        <td className="px-2 py-3 text-textPrimary">
                          {
                            EVENT_LABELS[
                              eventKey as keyof NotificationSettings["events"]
                            ]
                          }
                        </td>
                        <td className="px-2 py-3">
                          <Toggle
                            checked={channels.inApp}
                            onChange={() =>
                              setNotifications((current) => {
                                if (!current) return current;
                                return {
                                  ...current,
                                  events: {
                                    ...current.events,
                                    [eventKey]: {
                                      ...current.events[
                                        eventKey as keyof NotificationSettings["events"]
                                      ],
                                      inApp: !channels.inApp,
                                    },
                                  },
                                };
                              })
                            }
                          />
                        </td>
                        <td className="px-2 py-3">
                          <Toggle
                            checked={channels.email}
                            onChange={() =>
                              setNotifications((current) => {
                                if (!current) return current;
                                return {
                                  ...current,
                                  events: {
                                    ...current.events,
                                    [eventKey]: {
                                      ...current.events[
                                        eventKey as keyof NotificationSettings["events"]
                                      ],
                                      email: !channels.email,
                                    },
                                  },
                                };
                              })
                            }
                          />
                        </td>
                        <td className="px-2 py-3">
                          <Toggle
                            checked={channels.sms}
                            disabled={!data.meta.smsConfigured}
                            onChange={() => {
                              if (!data.meta.smsConfigured) {
                                pushToast(
                                  "SMS notifications are future scope.",
                                  "info",
                                );
                                return;
                              }
                              setNotifications((current) => {
                                if (!current) return current;
                                return {
                                  ...current,
                                  events: {
                                    ...current.events,
                                    [eventKey]: {
                                      ...current.events[
                                        eventKey as keyof NotificationSettings["events"]
                                      ],
                                      sms: !channels.sms,
                                    },
                                  },
                                };
                              });
                            }}
                          />
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Digest frequency</span>
                <select
                  value={notifications.digestFrequency}
                  onChange={(event) =>
                    setNotifications((current) =>
                      current
                        ? {
                            ...current,
                            digestFrequency: event.target
                              .value as NotificationSettings["digestFrequency"],
                          }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Toast style</span>
                <select
                  value={notifications.toastStyle}
                  onChange={(event) =>
                    setNotifications((current) =>
                      current
                        ? {
                            ...current,
                            toastStyle: event.target
                              .value as NotificationSettings["toastStyle"],
                          }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                >
                  <option value="minimal">Minimal</option>
                  <option value="detailed">Detailed</option>
                  <option value="silent">Silent</option>
                </select>
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm text-textPrimary">
                <Toggle
                  checked={notifications.quietHoursEnabled}
                  onChange={() =>
                    setNotifications((current) =>
                      current
                        ? {
                            ...current,
                            quietHoursEnabled: !current.quietHoursEnabled,
                          }
                        : current,
                    )
                  }
                />
                Quiet hours
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Quiet hours start</span>
                <input
                  type="time"
                  value={notifications.quietHoursStart}
                  onChange={(event) =>
                    setNotifications((current) =>
                      current
                        ? { ...current, quietHoursStart: event.target.value }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Quiet hours end</span>
                <input
                  type="time"
                  value={notifications.quietHoursEnd}
                  onChange={(event) =>
                    setNotifications((current) =>
                      current
                        ? { ...current, quietHoursEnd: event.target.value }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                />
              </label>
            </div>

            <div className="mt-4">
              <Button
                disabled={saving}
                onClick={() =>
                  void save(
                    "/api/settings/notifications",
                    { notifications },
                    "Notification settings saved.",
                  )
                }
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </Section>
        </div>
      ) : null}

      {tab === "appearance" ? (
        <Section
          title="Appearance"
          description="Set your theme, density, sidebar behavior, and table display defaults."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-textMuted">Theme</span>
              <select
                value={appearance.theme}
                onChange={(event) =>
                  setAppearance((current) =>
                    current
                      ? {
                          ...current,
                          theme: event.target
                            .value as AppearanceSettings["theme"],
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textMuted">Density</span>
              <select
                value={appearance.density}
                onChange={(event) =>
                  setAppearance((current) =>
                    current
                      ? {
                          ...current,
                          density: event.target
                            .value as AppearanceSettings["density"],
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textMuted">Sidebar behavior</span>
              <select
                value={appearance.sidebarBehavior}
                onChange={(event) =>
                  setAppearance((current) =>
                    current
                      ? {
                          ...current,
                          sidebarBehavior: event.target
                            .value as AppearanceSettings["sidebarBehavior"],
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
              >
                <option value="expanded">Expanded</option>
                <option value="collapsed">Collapsed</option>
                <option value="remember">Remember last state</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm text-textPrimary">
              <Toggle
                checked={appearance.reduceMotion}
                onChange={() =>
                  setAppearance((current) =>
                    current
                      ? { ...current, reduceMotion: !current.reduceMotion }
                      : current,
                  )
                }
              />
              Reduce motion
            </label>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {[
              {
                key: "statusBadges",
                label: "Show status badges",
              },
              {
                key: "priorityColor",
                label: "Show priority color",
              },
              {
                key: "compactTimestamps",
                label: "Show compact timestamps",
              },
              {
                key: "assignedAvatars",
                label: "Show assigned user avatars",
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 text-sm text-textPrimary"
              >
                <input
                  type="checkbox"
                  checked={
                    appearance.tableDisplay[
                      item.key as keyof AppearanceSettings["tableDisplay"]
                    ]
                  }
                  onChange={(event) =>
                    setAppearance((current) =>
                      current
                        ? {
                            ...current,
                            tableDisplay: {
                              ...current.tableDisplay,
                              [item.key]: event.target.checked,
                            },
                          }
                        : current,
                    )
                  }
                />
                {item.label}
              </label>
            ))}
          </div>

          <div className="mt-4">
            <Button
              disabled={saving}
              onClick={() =>
                void save(
                  "/api/settings/appearance",
                  { appearance },
                  "Appearance settings saved.",
                )
              }
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </Section>
      ) : null}

      {tab === "workspace" ? (
        <Section
          title="Workspace"
          description="Choose default routes and default view preferences used when your workspace opens."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-textMuted">Default landing page</span>
              <select
                value={workspace.defaultLandingPage}
                onChange={(event) =>
                  setWorkspace((current) =>
                    current
                      ? {
                          ...current,
                          defaultLandingPage: event.target
                            .value as WorkspaceSettings["defaultLandingPage"],
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
              >
                <option value="/dashboard">Dashboard</option>
                <option value="/tasks">Tasks</option>
                <option value="/calendar">Projection Calendar</option>
                <option value="/requests">Requests</option>
                <option value="/work-orders">Work Orders</option>
                <option value="/reports">Reports</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textMuted">Default module view</span>
              <select
                value={workspace.defaultModuleView}
                onChange={(event) =>
                  setWorkspace((current) =>
                    current
                      ? {
                          ...current,
                          defaultModuleView: event.target
                            .value as WorkspaceSettings["defaultModuleView"],
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
              >
                <option value="cards">Cards</option>
                <option value="table">Table</option>
                <option value="split">Split view</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textMuted">Default date range</span>
              <select
                value={workspace.defaultDateRange}
                onChange={(event) =>
                  setWorkspace((current) =>
                    current
                      ? {
                          ...current,
                          defaultDateRange: event.target
                            .value as WorkspaceSettings["defaultDateRange"],
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
              >
                <option value="today">Today</option>
                <option value="this_week">This week</option>
                <option value="this_month">This month</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textMuted">Department filter</span>
              <select
                value={workspace.departmentFilter || ""}
                onChange={(event) =>
                  setWorkspace((current) =>
                    current
                      ? {
                          ...current,
                          departmentFilter: event.target.value || null,
                        }
                      : current,
                  )
                }
                className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
              >
                <option value="">All departments</option>
                {data.meta.departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-textMuted">Company/division filter</span>
              <input
                value={workspace.companyDivisionFilter || ""}
                onChange={(event) =>
                  setWorkspace((current) =>
                    current
                      ? {
                          ...current,
                          companyDivisionFilter: event.target.value || null,
                        }
                      : current,
                  )
                }
                placeholder="Optional"
                className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
              />
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm text-textPrimary">
              <Toggle
                checked={workspace.quickActionsEnabled}
                onChange={() =>
                  setWorkspace((current) =>
                    current
                      ? {
                          ...current,
                          quickActionsEnabled: !current.quickActionsEnabled,
                        }
                      : current,
                  )
                }
              />
              Show quick actions
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm text-textPrimary">
              <Toggle
                checked={workspace.leadershipCardsEnabled}
                onChange={() =>
                  setWorkspace((current) =>
                    current
                      ? {
                          ...current,
                          leadershipCardsEnabled:
                            !current.leadershipCardsEnabled,
                        }
                      : current,
                  )
                }
              />
              Show leadership cards
            </label>
          </div>

          <div className="mt-4">
            <Button
              disabled={saving}
              onClick={() =>
                void save(
                  "/api/settings/workspace",
                  { workspace },
                  "Workspace settings saved.",
                )
              }
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </Section>
      ) : null}

      {tab === "security" ? (
        <div className="space-y-5">
          <Section
            title="Password Change"
            description="For local accounts only. Zitadel-managed accounts must change passwords via the identity provider."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Current password</span>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  disabled={!data.meta.supportsPasswordChange}
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary disabled:opacity-60"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">New password</span>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  disabled={!data.meta.supportsPasswordChange}
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary disabled:opacity-60"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Confirm new password</span>
                <input
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmNewPassword: event.target.value,
                    }))
                  }
                  disabled={!data.meta.supportsPasswordChange}
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary disabled:opacity-60"
                />
              </label>
            </div>
            {!data.meta.supportsPasswordChange ? (
              <p className="mt-2 text-xs text-textMuted">
                Password changes are auth-provider-managed for this account.
              </p>
            ) : null}
            <div className="mt-4">
              <Button
                disabled={saving || !data.meta.supportsPasswordChange}
                onClick={() =>
                  void save(
                    "/api/settings/security",
                    {
                      ...passwordForm,
                      security,
                    },
                    "Password updated.",
                  )
                }
              >
                {saving ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </Section>

          <Section
            title="Session Preferences"
            description="Control timeout and additional re-auth requirements for admin actions."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-textMuted">Session timeout</span>
                <select
                  value={security.sessionTimeout}
                  onChange={(event) =>
                    setSecurity((current) =>
                      current
                        ? {
                            ...current,
                            sessionTimeout: event.target
                              .value as SecuritySettings["sessionTimeout"],
                          }
                        : current,
                    )
                  }
                  className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
                >
                  <option value="30m">30 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="8h">8 hours</option>
                  <option value="keep_signed_in">Keep me signed in</option>
                </select>
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm text-textPrimary">
                <Toggle
                  checked={security.requireReauthForAdminActions}
                  onChange={() =>
                    setSecurity((current) =>
                      current
                        ? {
                            ...current,
                            requireReauthForAdminActions:
                              !current.requireReauthForAdminActions,
                          }
                        : current,
                    )
                  }
                />
                Require re-auth for admin actions
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-textPrimary">
                Two-factor authentication
              </p>
              <p className="mt-1 text-xs text-textMuted">
                {data.meta.supportsTwoFactor
                  ? "2FA is available for this account."
                  : "Planned: two-factor authentication is not configured yet."}
              </p>
              <Button variant="outline" className="mt-3" disabled>
                Enable 2FA (planned)
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-white/15 bg-black/20 p-4">
              <p className="text-sm text-textPrimary">Active sessions</p>
              <p className="mt-1 text-xs text-textMuted">
                Current session only. Session inventory is not fully implemented
                in this deployment.
              </p>
              <div className="mt-2 text-sm text-textSecondary">
                This browser session (current)
              </div>
            </div>

            <div className="mt-4">
              <Button
                disabled={saving}
                onClick={() =>
                  void save(
                    "/api/settings/security",
                    { security },
                    "Security settings saved.",
                  )
                }
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </Section>
        </div>
      ) : null}
    </div>
  );
}
