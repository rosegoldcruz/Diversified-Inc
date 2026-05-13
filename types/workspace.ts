export type SopStatus = "Draft" | "Active" | "Needs Review" | "Archived";

export type SopCategory =
  | "Office Procedures"
  | "Field Operations"
  | "Safety"
  | "HR / Employee"
  | "Inventory"
  | "Work Orders"
  | "Customer Follow-Up"
  | "Billing / Admin";

export type Sop = {
  id: string;
  title: string;
  description: string;
  category: SopCategory;
  department: string;
  owner: string;
  status: SopStatus;
  lastUpdated: string;
  reviewDate?: string;
  relatedFileIds?: string[];
  relatedFormIds?: string[];
  relatedTaskIds?: string[];
  relatedWorkOrderIds?: string[];
};

export type NotificationChannelPreferences = {
  inApp: boolean;
  email: boolean;
  sms: boolean;
};

export type NotificationPreferenceMap = {
  task_assigned: NotificationChannelPreferences;
  task_overdue: NotificationChannelPreferences;
  request_submitted: NotificationChannelPreferences;
  request_approved_or_denied: NotificationChannelPreferences;
  form_submitted: NotificationChannelPreferences;
  work_order_assigned: NotificationChannelPreferences;
  low_inventory: NotificationChannelPreferences;
  timesheet_submitted: NotificationChannelPreferences;
  weekly_leadership_summary: NotificationChannelPreferences;
};

export type ClientModuleVisibility = "visible" | "hidden" | "internal";

export type ClientVisibleModuleMap = {
  Dashboard: ClientModuleVisibility;
  Tasks: ClientModuleVisibility;
  Calendar: ClientModuleVisibility;
  Forms: ClientModuleVisibility;
  Requests: ClientModuleVisibility;
  "Work Orders": ClientModuleVisibility;
  Employees: ClientModuleVisibility;
  Inventory: ClientModuleVisibility;
  SOPs: ClientModuleVisibility;
  Timeclock: ClientModuleVisibility;
  Timesheets: ClientModuleVisibility;
  Reports: ClientModuleVisibility;
  Files: ClientModuleVisibility;
  Documents: ClientModuleVisibility;
  "AI Chat": ClientModuleVisibility;
  Automations: ClientModuleVisibility;
  Settings: ClientModuleVisibility;
  Admin: ClientModuleVisibility;
};

export type SystemSettingRecord = {
  id: number;
  key: string;
  value: unknown;
  category: string;
  description: string | null;
  is_public: boolean;
  updated_at: string;
  created_at: string;
};

export type SystemAuditLog = {
  id: number;
  actor_user_id: string | null;
  action: string;
  module: string;
  record_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type CalendarBlock = {
  id: string;
  title: string;
  description: string | null;
  block_type:
    | "task_work"
    | "meeting"
    | "admin"
    | "follow_up"
    | "review"
    | "work_order"
    | "other";
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  assigned_to_employee_id: number | null;
  linked_task_id: string | null;
  linked_task_int_id: number | null;
  linked_work_order_id: string | null;
  linked_work_order_int_id: number | null;
  company_division: string | null;
  start_time: string;
  end_time: string;
  all_day: boolean | null;
  notes: string | null;
  created_by: string | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  actor_user_id: string | null;
  actor_user_id_text: string | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  entity_id_text: string | null;
  before_data: unknown;
  after_data: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};
