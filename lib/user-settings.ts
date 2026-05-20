import { query } from "@/lib/db";
import { ensureSchema } from "@/lib/schema";

export const NOTIFICATION_EVENTS = [
  "task_assigned",
  "task_overdue",
  "request_submitted",
  "request_approved_denied",
  "form_submitted",
  "work_order_assigned",
  "low_inventory",
  "timesheet_submitted",
  "weekly_leadership_summary",
  "security_admin_alert",
] as const;

export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export type NotificationChannelPrefs = {
  inApp: boolean;
  email: boolean;
  sms: boolean;
};

export type NotificationSettings = {
  events: Record<NotificationEvent, NotificationChannelPrefs>;
  digestFrequency: "immediate" | "daily" | "weekly";
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  toastStyle: "minimal" | "detailed" | "silent";
};

export type AppearanceSettings = {
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  sidebarBehavior: "expanded" | "collapsed" | "remember";
  tableDisplay: {
    statusBadges: boolean;
    priorityColor: boolean;
    compactTimestamps: boolean;
    assignedAvatars: boolean;
  };
  reduceMotion: boolean;
};

export type WorkspaceSettings = {
  defaultLandingPage:
    | "/dashboard"
    | "/tasks"
    | "/calendar"
    | "/requests"
    | "/work-orders"
    | "/reports";
  defaultModuleView: "cards" | "table" | "split";
  defaultDateRange: "today" | "this_week" | "this_month";
  companyDivisionFilter: string | null;
  departmentFilter: string | null;
  quickActionsEnabled: boolean;
  leadershipCardsEnabled: boolean;
};

export type SecuritySettings = {
  sessionTimeout: "30m" | "1h" | "8h" | "keep_signed_in";
  requireReauthForAdminActions: boolean;
  twoFactorEnabled: boolean;
};

export type ProfileSettings = {
  displayName: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  timezone: string;
};

export type UserSettingsPayload = {
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

type EmployeeRow = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  phone: string | null;
  department: string | null;
  auth_provider: string | null;
};

type UserPreferenceRow = {
  user_id: number;
  profile: unknown;
  notifications: unknown;
  appearance: unknown;
  workspace: unknown;
  security: unknown;
};

let ensured = false;

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  events: {
    task_assigned: { inApp: true, email: true, sms: false },
    task_overdue: { inApp: true, email: true, sms: false },
    request_submitted: { inApp: true, email: true, sms: false },
    request_approved_denied: { inApp: true, email: true, sms: false },
    form_submitted: { inApp: true, email: true, sms: false },
    work_order_assigned: { inApp: true, email: true, sms: false },
    low_inventory: { inApp: true, email: true, sms: false },
    timesheet_submitted: { inApp: true, email: true, sms: false },
    weekly_leadership_summary: { inApp: true, email: true, sms: false },
    security_admin_alert: { inApp: true, email: true, sms: false },
  },
  digestFrequency: "daily",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "06:00",
  toastStyle: "detailed",
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "system",
  density: "comfortable",
  sidebarBehavior: "remember",
  tableDisplay: {
    statusBadges: true,
    priorityColor: true,
    compactTimestamps: false,
    assignedAvatars: true,
  },
  reduceMotion: false,
};

const DEFAULT_WORKSPACE: WorkspaceSettings = {
  defaultLandingPage: "/dashboard",
  defaultModuleView: "cards",
  defaultDateRange: "this_week",
  companyDivisionFilter: null,
  departmentFilter: null,
  quickActionsEnabled: true,
  leadershipCardsEnabled: true,
};

const DEFAULT_SECURITY: SecuritySettings = {
  sessionTimeout: "8h",
  requireReauthForAdminActions: true,
  twoFactorEnabled: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.trim();
}

function asBool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function parseHourMinute(value: unknown, fallback: string): string {
  const str = asString(value, fallback);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(str) ? str : fallback;
}

function parseNotificationSettings(value: unknown): NotificationSettings {
  const source = isRecord(value) ? value : {};
  const events: NotificationSettings["events"] = {
    ...DEFAULT_NOTIFICATIONS.events,
  };

  for (const event of NOTIFICATION_EVENTS) {
    const row =
      source.events && isRecord(source.events)
        ? source.events[event]
        : undefined;
    const rowRecord = isRecord(row) ? row : {};
    events[event] = {
      inApp: asBool(rowRecord.inApp, DEFAULT_NOTIFICATIONS.events[event].inApp),
      email: asBool(rowRecord.email, DEFAULT_NOTIFICATIONS.events[event].email),
      sms: asBool(rowRecord.sms, DEFAULT_NOTIFICATIONS.events[event].sms),
    };
  }

  const digest = asString(
    source.digestFrequency,
    DEFAULT_NOTIFICATIONS.digestFrequency,
  );
  const toastStyle = asString(
    source.toastStyle,
    DEFAULT_NOTIFICATIONS.toastStyle,
  );

  return {
    events,
    digestFrequency:
      digest === "immediate" || digest === "daily" || digest === "weekly"
        ? digest
        : DEFAULT_NOTIFICATIONS.digestFrequency,
    quietHoursEnabled: asBool(
      source.quietHoursEnabled,
      DEFAULT_NOTIFICATIONS.quietHoursEnabled,
    ),
    quietHoursStart: parseHourMinute(
      source.quietHoursStart,
      DEFAULT_NOTIFICATIONS.quietHoursStart,
    ),
    quietHoursEnd: parseHourMinute(
      source.quietHoursEnd,
      DEFAULT_NOTIFICATIONS.quietHoursEnd,
    ),
    toastStyle:
      toastStyle === "minimal" ||
      toastStyle === "detailed" ||
      toastStyle === "silent"
        ? toastStyle
        : DEFAULT_NOTIFICATIONS.toastStyle,
  };
}

function parseAppearanceSettings(value: unknown): AppearanceSettings {
  const source = isRecord(value) ? value : {};
  const tableDisplaySource = isRecord(source.tableDisplay)
    ? source.tableDisplay
    : {};

  const theme = asString(source.theme, DEFAULT_APPEARANCE.theme);
  const density = asString(source.density, DEFAULT_APPEARANCE.density);
  const sidebarBehavior = asString(
    source.sidebarBehavior,
    DEFAULT_APPEARANCE.sidebarBehavior,
  );

  return {
    theme:
      theme === "light" || theme === "dark" || theme === "system"
        ? theme
        : DEFAULT_APPEARANCE.theme,
    density:
      density === "comfortable" || density === "compact"
        ? density
        : DEFAULT_APPEARANCE.density,
    sidebarBehavior:
      sidebarBehavior === "expanded" ||
      sidebarBehavior === "collapsed" ||
      sidebarBehavior === "remember"
        ? sidebarBehavior
        : DEFAULT_APPEARANCE.sidebarBehavior,
    tableDisplay: {
      statusBadges: asBool(
        tableDisplaySource.statusBadges,
        DEFAULT_APPEARANCE.tableDisplay.statusBadges,
      ),
      priorityColor: asBool(
        tableDisplaySource.priorityColor,
        DEFAULT_APPEARANCE.tableDisplay.priorityColor,
      ),
      compactTimestamps: asBool(
        tableDisplaySource.compactTimestamps,
        DEFAULT_APPEARANCE.tableDisplay.compactTimestamps,
      ),
      assignedAvatars: asBool(
        tableDisplaySource.assignedAvatars,
        DEFAULT_APPEARANCE.tableDisplay.assignedAvatars,
      ),
    },
    reduceMotion: asBool(source.reduceMotion, DEFAULT_APPEARANCE.reduceMotion),
  };
}

function parseWorkspaceSettings(value: unknown): WorkspaceSettings {
  const source = isRecord(value) ? value : {};
  const defaultLandingPage = asString(
    source.defaultLandingPage,
    DEFAULT_WORKSPACE.defaultLandingPage,
  );
  const defaultModuleView = asString(
    source.defaultModuleView,
    DEFAULT_WORKSPACE.defaultModuleView,
  );
  const defaultDateRange = asString(
    source.defaultDateRange,
    DEFAULT_WORKSPACE.defaultDateRange,
  );

  return {
    defaultLandingPage:
      defaultLandingPage === "/dashboard" ||
      defaultLandingPage === "/tasks" ||
      defaultLandingPage === "/calendar" ||
      defaultLandingPage === "/requests" ||
      defaultLandingPage === "/work-orders" ||
      defaultLandingPage === "/reports"
        ? defaultLandingPage
        : DEFAULT_WORKSPACE.defaultLandingPage,
    defaultModuleView:
      defaultModuleView === "cards" ||
      defaultModuleView === "table" ||
      defaultModuleView === "split"
        ? defaultModuleView
        : DEFAULT_WORKSPACE.defaultModuleView,
    defaultDateRange:
      defaultDateRange === "today" ||
      defaultDateRange === "this_week" ||
      defaultDateRange === "this_month"
        ? defaultDateRange
        : DEFAULT_WORKSPACE.defaultDateRange,
    companyDivisionFilter:
      source.companyDivisionFilter === null
        ? null
        : asString(source.companyDivisionFilter, "") || null,
    departmentFilter:
      source.departmentFilter === null
        ? null
        : asString(source.departmentFilter, "") || null,
    quickActionsEnabled: asBool(
      source.quickActionsEnabled,
      DEFAULT_WORKSPACE.quickActionsEnabled,
    ),
    leadershipCardsEnabled: asBool(
      source.leadershipCardsEnabled,
      DEFAULT_WORKSPACE.leadershipCardsEnabled,
    ),
  };
}

function parseSecuritySettings(value: unknown): SecuritySettings {
  const source = isRecord(value) ? value : {};
  const sessionTimeout = asString(
    source.sessionTimeout,
    DEFAULT_SECURITY.sessionTimeout,
  );

  return {
    sessionTimeout:
      sessionTimeout === "30m" ||
      sessionTimeout === "1h" ||
      sessionTimeout === "8h" ||
      sessionTimeout === "keep_signed_in"
        ? sessionTimeout
        : DEFAULT_SECURITY.sessionTimeout,
    requireReauthForAdminActions: asBool(
      source.requireReauthForAdminActions,
      DEFAULT_SECURITY.requireReauthForAdminActions,
    ),
    twoFactorEnabled: false,
  };
}

function toProfileSettings(
  employee: EmployeeRow,
  profileValue: unknown,
): ProfileSettings {
  const source = isRecord(profileValue) ? profileValue : {};
  return {
    displayName: asString(source.displayName, employee.name || ""),
    email: asString(source.email, employee.email || ""),
    phone: asString(source.phone, employee.phone || ""),
    department: asString(source.department, employee.department || ""),
    role: employee.role || "Employee",
    timezone: asString(source.timezone, "America/Chicago") || "America/Chicago",
  };
}

function validateEmail(value: string): string {
  const email = value.trim().toLowerCase();
  if (!email) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Email must be a valid email address.");
  }
  return email;
}

export async function ensureUserPreferencesTable() {
  if (ensured) return;
  await ensureSchema();
  await query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id INTEGER PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
      profile JSONB NOT NULL DEFAULT '{}'::jsonb,
      notifications JSONB NOT NULL DEFAULT '{}'::jsonb,
      appearance JSONB NOT NULL DEFAULT '{}'::jsonb,
      workspace JSONB NOT NULL DEFAULT '{}'::jsonb,
      security JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  ensured = true;
}

async function getEmployee(userId: number): Promise<EmployeeRow | null> {
  const rows = await query<EmployeeRow>(
    `SELECT id, name, email, role, phone, department, auth_provider
     FROM employees
     WHERE id = $1
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

async function getDepartments(): Promise<string[]> {
  const rows = await query<{ department: string | null }>(
    `SELECT DISTINCT department FROM employees WHERE department IS NOT NULL ORDER BY department ASC`,
  );
  return rows
    .map((row) => row.department?.trim() || "")
    .filter((value) => value.length > 0);
}

async function getPreferenceRow(
  userId: number,
): Promise<UserPreferenceRow | null> {
  const rows = await query<UserPreferenceRow>(
    `SELECT user_id, profile, notifications, appearance, workspace, security
     FROM user_preferences
     WHERE user_id = $1
     LIMIT 1`,
    [userId],
  );
  return rows[0] ?? null;
}

async function upsertColumn(
  userId: number,
  column: "profile" | "notifications" | "appearance" | "workspace" | "security",
  value: unknown,
) {
  await query(
    `INSERT INTO user_preferences (user_id, ${column}, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET ${column} = EXCLUDED.${column}, updated_at = NOW()`,
    [userId, JSON.stringify(value)],
  );
}

export async function getUserSettings(
  userId: number,
): Promise<UserSettingsPayload> {
  await ensureUserPreferencesTable();

  const employee = await getEmployee(userId);
  if (!employee) {
    throw new Error("Current user record was not found.");
  }

  const [row, departments] = await Promise.all([
    getPreferenceRow(userId),
    getDepartments(),
  ]);

  const profile = toProfileSettings(employee, row?.profile);
  const notifications = parseNotificationSettings(row?.notifications);
  const appearance = parseAppearanceSettings(row?.appearance);
  const workspace = parseWorkspaceSettings(row?.workspace);
  const security = parseSecuritySettings(row?.security);

  const canEditEmail = (employee.auth_provider || "local") === "local";

  return {
    profile,
    notifications,
    appearance,
    workspace,
    security,
    meta: {
      canEditEmail,
      smsConfigured: Boolean(
        process.env.SMS_PROVIDER_URL || process.env.TWILIO_ACCOUNT_SID,
      ),
      supportsPasswordChange: (employee.auth_provider || "local") === "local",
      supportsTwoFactor: false,
      departments,
    },
  };
}

export async function updateProfileSettings(
  userId: number,
  payload: Partial<ProfileSettings>,
): Promise<ProfileSettings> {
  await ensureUserPreferencesTable();

  const employee = await getEmployee(userId);
  if (!employee) {
    throw new Error("Current user record was not found.");
  }

  const current = toProfileSettings(
    employee,
    (await getPreferenceRow(userId))?.profile,
  );
  const next: ProfileSettings = {
    ...current,
    displayName:
      payload.displayName !== undefined
        ? asString(payload.displayName)
        : current.displayName,
    email:
      payload.email !== undefined
        ? validateEmail(payload.email)
        : current.email,
    phone:
      payload.phone !== undefined ? asString(payload.phone) : current.phone,
    department:
      payload.department !== undefined
        ? asString(payload.department)
        : current.department,
    timezone:
      payload.timezone !== undefined
        ? asString(payload.timezone)
        : current.timezone,
    role: current.role,
  };

  if (!next.displayName) {
    throw new Error("Display name is required.");
  }

  const authProvider = employee.auth_provider || "local";
  const canEditEmail = authProvider === "local";
  if (!canEditEmail && next.email !== current.email) {
    throw new Error("Email is managed by the authentication provider.");
  }

  if (canEditEmail && next.email) {
    const duplicate = await query<{ id: number }>(
      `SELECT id FROM employees WHERE LOWER(email) = $1 AND id <> $2 LIMIT 1`,
      [next.email.toLowerCase(), userId],
    );
    if (duplicate.length > 0) {
      throw new Error("Another employee already uses that email.");
    }
  }

  await query(
    `UPDATE employees
     SET name = $1,
         email = CASE WHEN $2::boolean THEN $3 ELSE email END,
         phone = $4,
         department = $5
     WHERE id = $6`,
    [
      next.displayName,
      canEditEmail,
      next.email || null,
      next.phone || null,
      next.department || null,
      userId,
    ],
  );

  await upsertColumn(userId, "profile", {
    displayName: next.displayName,
    email: next.email,
    phone: next.phone,
    department: next.department,
    timezone: next.timezone,
  });

  return next;
}

export async function updateNotificationsSettings(
  userId: number,
  payload: NotificationSettings,
): Promise<NotificationSettings> {
  await ensureUserPreferencesTable();
  const normalized = parseNotificationSettings(payload);
  await upsertColumn(userId, "notifications", normalized);
  return normalized;
}

export async function updateAppearanceSettings(
  userId: number,
  payload: AppearanceSettings,
): Promise<AppearanceSettings> {
  await ensureUserPreferencesTable();
  const normalized = parseAppearanceSettings(payload);
  await upsertColumn(userId, "appearance", normalized);
  return normalized;
}

export async function updateWorkspaceSettings(
  userId: number,
  payload: WorkspaceSettings,
): Promise<WorkspaceSettings> {
  await ensureUserPreferencesTable();
  const normalized = parseWorkspaceSettings(payload);
  await upsertColumn(userId, "workspace", normalized);
  return normalized;
}

export async function updateSecurityPreferences(
  userId: number,
  payload: Partial<SecuritySettings>,
): Promise<SecuritySettings> {
  await ensureUserPreferencesTable();
  const current = parseSecuritySettings(
    (await getPreferenceRow(userId))?.security,
  );
  const next = parseSecuritySettings({ ...current, ...payload });
  await upsertColumn(userId, "security", next);
  return next;
}
