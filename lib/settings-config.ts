export const SETTINGS_CATEGORIES = {
  notifications: "notifications",
  visibility: "visibility",
  system: "system",
  ui: "ui",
} as const;

export type SettingCategory =
  (typeof SETTINGS_CATEGORIES)[keyof typeof SETTINGS_CATEGORIES];

export const SETTING_KEYS = {
  notificationPreferences: "notification_preferences",
  clientVisibleModules: "client_visible_modules",
  automationMode: "automation_mode",
  maintenanceBanner: "maintenance_banner",
  appDisplayLabels: "app_display_labels",
  moduleVisibilityFlags: "demo_visibility_flags",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export const AUTOMATION_MODES = ["disabled", "test", "live"] as const;
export type AutomationMode = (typeof AUTOMATION_MODES)[number];

export const MODULE_VISIBILITY_OPTIONS = [
  "visible",
  "hidden",
  "internal",
] as const;

export type ModuleVisibility = (typeof MODULE_VISIBILITY_OPTIONS)[number];

export const CLIENT_VISIBLE_MODULES = [
  "Dashboard",
  "Tasks",
  "Calendar",
  "Forms",
  "Requests",
  "Work Orders",
  "Employees",
  "Inventory",
  "SOPs",
  "Timeclock",
  "Timesheets",
  "Reports",
  "Files",
  "Documents",
  "AI Chat",
  "Automations",
  "Settings",
  "Admin",
] as const;

export type ClientVisibleModule = (typeof CLIENT_VISIBLE_MODULES)[number];

export const NOTIFICATION_EVENT_TYPES = [
  "task_assigned",
  "task_overdue",
  "request_submitted",
  "request_approved_or_denied",
  "form_submitted",
  "work_order_assigned",
  "low_inventory",
  "timesheet_submitted",
  "weekly_leadership_summary",
] as const;

export type NotificationEventType = (typeof NOTIFICATION_EVENT_TYPES)[number];

export type NotificationChannels = {
  inApp: boolean;
  email: boolean;
  sms: boolean;
};

export type NotificationPreferences = Record<
  NotificationEventType,
  NotificationChannels
>;

export type ClientVisibleModulesMap = Record<
  ClientVisibleModule,
  ModuleVisibility
>;

export type MaintenanceBannerSetting = {
  enabled: boolean;
  message: string;
};

export type AppDisplayLabelsSetting = Record<string, string>;

export type ModuleVisibilityFlagsSetting = Record<string, boolean>;

export type SystemSettingValue =
  | NotificationPreferences
  | ClientVisibleModulesMap
  | AutomationMode
  | MaintenanceBannerSetting
  | AppDisplayLabelsSetting
  | ModuleVisibilityFlagsSetting;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  task_assigned: { inApp: true, email: true, sms: false },
  task_overdue: { inApp: true, email: true, sms: false },
  request_submitted: { inApp: true, email: true, sms: false },
  request_approved_or_denied: { inApp: true, email: true, sms: false },
  form_submitted: { inApp: true, email: true, sms: false },
  work_order_assigned: { inApp: true, email: true, sms: false },
  low_inventory: { inApp: true, email: true, sms: false },
  timesheet_submitted: { inApp: true, email: true, sms: false },
  weekly_leadership_summary: { inApp: true, email: true, sms: false },
};

export const DEFAULT_CLIENT_VISIBLE_MODULES: ClientVisibleModulesMap =
  CLIENT_VISIBLE_MODULES.reduce((acc, moduleName) => {
    acc[moduleName] = "visible";
    return acc;
  }, {} as ClientVisibleModulesMap);

export const DEFAULT_SETTINGS: Record<SettingKey, SystemSettingValue> = {
  [SETTING_KEYS.notificationPreferences]: DEFAULT_NOTIFICATION_PREFERENCES,
  [SETTING_KEYS.clientVisibleModules]: DEFAULT_CLIENT_VISIBLE_MODULES,
  [SETTING_KEYS.automationMode]: "disabled",
  [SETTING_KEYS.maintenanceBanner]: {
    enabled: false,
    message: "",
  },
  [SETTING_KEYS.appDisplayLabels]: {
    workspaceName: "Diversified OS",
  },
  [SETTING_KEYS.moduleVisibilityFlags]: {
    hideIncompletePages: true,
  },
};

export const SETTINGS_METADATA: Record<
  SettingKey,
  { category: SettingCategory; description: string }
> = {
  [SETTING_KEYS.notificationPreferences]: {
    category: SETTINGS_CATEGORIES.notifications,
    description:
      "Internal notification channel preferences for operations events.",
  },
  [SETTING_KEYS.clientVisibleModules]: {
    category: SETTINGS_CATEGORIES.visibility,
    description:
      "Controls whether modules are visible, hidden, or internal-only in managed deployments.",
  },
  [SETTING_KEYS.automationMode]: {
    category: SETTINGS_CATEGORIES.system,
    description:
      "Global automation mode used by internal workflow hooks (disabled/test/live).",
  },
  [SETTING_KEYS.maintenanceBanner]: {
    category: SETTINGS_CATEGORIES.ui,
    description: "Optional maintenance banner shown in the workspace.",
  },
  [SETTING_KEYS.appDisplayLabels]: {
    category: SETTINGS_CATEGORIES.ui,
    description: "Display labels that are safe to edit from the UI.",
  },
  [SETTING_KEYS.moduleVisibilityFlags]: {
    category: SETTINGS_CATEGORIES.visibility,
    description:
      "Compatibility safety switches for module visibility behavior.",
  },
};

export function isAllowedSettingKey(value: unknown): value is SettingKey {
  return typeof value === "string" && value in SETTINGS_METADATA;
}

export function isAllowedCategory(value: unknown): value is SettingCategory {
  return (
    typeof value === "string" &&
    Object.values(SETTINGS_CATEGORIES).includes(value as SettingCategory)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isValidNotificationPreferences(value: unknown): boolean {
  if (!isRecord(value)) return false;
  for (const eventType of NOTIFICATION_EVENT_TYPES) {
    const channels = value[eventType];
    if (!isRecord(channels)) return false;
    if (
      !isBoolean(channels.inApp) ||
      !isBoolean(channels.email) ||
      !isBoolean(channels.sms)
    ) {
      return false;
    }
  }
  return true;
}

function isValidClientVisibleModules(value: unknown): boolean {
  if (!isRecord(value)) return false;
  for (const moduleName of CLIENT_VISIBLE_MODULES) {
    const visibility = value[moduleName];
    if (
      typeof visibility !== "string" ||
      !MODULE_VISIBILITY_OPTIONS.includes(visibility as ModuleVisibility)
    ) {
      return false;
    }
  }
  return true;
}

function isValidMaintenanceBanner(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.enabled === "boolean" && typeof value.message === "string"
  );
}

function isValidDisplayLabels(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "string");
}

function isValidModuleVisibilityFlags(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.values(value).every((item) => typeof item === "boolean");
}

export function isValidSettingValue(
  key: SettingKey,
  value: unknown,
): value is SystemSettingValue {
  switch (key) {
    case SETTING_KEYS.notificationPreferences:
      return isValidNotificationPreferences(value);
    case SETTING_KEYS.clientVisibleModules:
      return isValidClientVisibleModules(value);
    case SETTING_KEYS.automationMode:
      return (
        typeof value === "string" &&
        AUTOMATION_MODES.includes(value as AutomationMode)
      );
    case SETTING_KEYS.maintenanceBanner:
      return isValidMaintenanceBanner(value);
    case SETTING_KEYS.appDisplayLabels:
      return isValidDisplayLabels(value);
    case SETTING_KEYS.moduleVisibilityFlags:
      return isValidModuleVisibilityFlags(value);
    default:
      return false;
  }
}
