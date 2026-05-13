import { query } from "@/lib/db";

type Role = "Leadership" | "Admin" | "Manager" | "Employee" | "Viewer";

type ReportFilters = {
  from?: string;
  to?: string;
  company_division?: string;
  department?: string;
  employee_id?: number;
};

type TableInfo = {
  tables: Set<string>;
  columns: Map<string, Set<string>>;
};

type CountRow = {
  label: string;
  count: number;
};

type EmployeeWorkloadRow = {
  employee_id: number;
  employee_name: string;
  department: string | null;
  open_tasks: number;
  open_work_orders: number;
};

type InventoryAlertRow = {
  id: number;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  status: string | null;
};

type ActivityRow = {
  action: string;
  module: string;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
};

export type WorkspaceReport = {
  filters: ReportFilters;
  generatedAt: string;
  summary: {
    totalTasks: number;
    overdueTasks: number;
    blockedTasks: number;
    completedTasksThisWeek: number;
    openRequests: number;
    openWorkOrders: number;
    lowInventory: number;
    timesheetsPendingApproval: number;
    sopsNeedingReview: number | null;
    weeklyCompletedWork: number;
  };
  tasksByStatus: CountRow[];
  tasksByPriority: CountRow[];
  requestsByStatus: CountRow[];
  workOrdersByStatus: CountRow[];
  employeeWorkload: EmployeeWorkloadRow[];
  timesheetApprovalCounts: CountRow[];
  lowInventory: InventoryAlertRow[];
  sopsNeedingReview: CountRow[];
  recentOperationalActivity: ActivityRow[];
};

const REPORT_TABLES = [
  "tasks",
  "requests",
  "work_orders",
  "inventory",
  "employees",
  "timesheets",
  "sops",
  "audit_logs",
  "system_audit_logs",
];

export function parseReportFilters(
  searchParams: URLSearchParams,
): ReportFilters {
  const filters: ReportFilters = {};
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const division = cleanText(searchParams.get("company_division"));
  const department = cleanText(searchParams.get("department"));
  const employeeId = parsePositiveInteger(searchParams.get("employee_id"));

  if (from) filters.from = from;
  if (to) filters.to = to;
  if (division) filters.company_division = division;
  if (department) filters.department = department;
  if (employeeId) filters.employee_id = employeeId;

  return filters;
}

export function canViewFullReports(role: Role | string) {
  return role === "Leadership" || role === "Admin" || role === "Manager";
}

export async function getWorkspaceReport(
  filters: ReportFilters,
): Promise<WorkspaceReport> {
  const info = await getTableInfo();

  const [
    tasksByStatus,
    tasksByPriority,
    overdueTasks,
    blockedTasks,
    completedTasksThisWeek,
    requestsByStatus,
    openRequests,
    workOrdersByStatus,
    openWorkOrders,
    lowInventoryCount,
    lowInventoryRows,
    employeeWorkload,
    timesheetApprovalCounts,
    timesheetsPendingApproval,
    sopsNeedingReview,
    completedWorkOrdersThisWeekCount,
    recentOperationalActivity,
  ] = await Promise.all([
    countBy(info, "tasks", "t", "status", filters, taskOptions(info)),
    countBy(info, "tasks", "t", "priority", filters, taskOptions(info)),
    countScalar(info, "tasks", "t", filters, taskOptions(info), [
      "t.due_date IS NOT NULL",
      "t.due_date < CURRENT_DATE",
      "LOWER(COALESCE(t.status, '')) NOT IN ('completed', 'complete', 'done', 'cancelled', 'canceled')",
    ]),
    countScalar(info, "tasks", "t", filters, taskOptions(info), [
      "LOWER(COALESCE(t.status, '')) = 'blocked'",
    ]),
    countScalar(info, "tasks", "t", filters, taskOptions(info), [
      "LOWER(COALESCE(t.status, '')) IN ('completed', 'complete', 'done')",
      weekClause(info, "tasks", "t"),
    ]),
    countBy(info, "requests", "r", "status", filters, requestOptions(info)),
    countScalar(info, "requests", "r", filters, requestOptions(info), [
      "LOWER(COALESCE(r.status, '')) NOT IN ('approved', 'denied', 'completed', 'closed')",
    ]),
    countBy(
      info,
      "work_orders",
      "w",
      "status",
      filters,
      workOrderOptions(info),
    ),
    countScalar(info, "work_orders", "w", filters, workOrderOptions(info), [
      "LOWER(COALESCE(w.status, '')) NOT IN ('completed', 'complete', 'closed', 'cancelled', 'canceled')",
    ]),
    countLowInventory(info, filters),
    getLowInventory(info, filters),
    getEmployeeWorkload(info, filters),
    countBy(
      info,
      "timesheets",
      "ts",
      "status",
      filters,
      timesheetOptions(info),
    ),
    countScalar(info, "timesheets", "ts", filters, timesheetOptions(info), [
      "LOWER(COALESCE(ts.status, '')) = 'submitted'",
    ]),
    getSopsNeedingReview(info, filters),
    countScalar(info, "work_orders", "w", filters, workOrderOptions(info), [
      "LOWER(COALESCE(w.status, '')) IN ('completed', 'complete')",
      weekClause(info, "work_orders", "w"),
    ]),
    getRecentOperationalActivity(info),
  ]);

  const sopsCount = sopsNeedingReview.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const weeklyCompletedWork =
    completedTasksThisWeek + completedWorkOrdersThisWeekCount;

  return {
    filters,
    generatedAt: new Date().toISOString(),
    summary: {
      totalTasks: sumCounts(tasksByStatus),
      overdueTasks,
      blockedTasks,
      completedTasksThisWeek,
      openRequests,
      openWorkOrders,
      lowInventory: lowInventoryCount,
      timesheetsPendingApproval,
      sopsNeedingReview: info.tables.has("sops") ? sopsCount : null,
      weeklyCompletedWork,
    },
    tasksByStatus,
    tasksByPriority,
    requestsByStatus,
    workOrdersByStatus,
    employeeWorkload,
    timesheetApprovalCounts,
    lowInventory: lowInventoryRows,
    sopsNeedingReview,
    recentOperationalActivity,
  };
}

export function reportToCsv(report: WorkspaceReport) {
  const rows: string[][] = [
    ["Section", "Label", "Value", "Detail"],
    ["Summary", "Total Tasks", String(report.summary.totalTasks), ""],
    ["Summary", "Overdue Tasks", String(report.summary.overdueTasks), ""],
    ["Summary", "Blocked Tasks", String(report.summary.blockedTasks), ""],
    [
      "Summary",
      "Completed Tasks This Week",
      String(report.summary.completedTasksThisWeek),
      "",
    ],
    ["Summary", "Open Requests", String(report.summary.openRequests), ""],
    ["Summary", "Open Work Orders", String(report.summary.openWorkOrders), ""],
    ["Summary", "Low Inventory", String(report.summary.lowInventory), ""],
    [
      "Summary",
      "Timesheets Pending Approval",
      String(report.summary.timesheetsPendingApproval),
      "",
    ],
    [
      "Summary",
      "SOPs Needing Review",
      String(report.summary.sopsNeedingReview ?? "N/A"),
      "",
    ],
    [
      "Summary",
      "Weekly Completed Work",
      String(report.summary.weeklyCompletedWork),
      "",
    ],
    ...countRows("Tasks by Status", report.tasksByStatus),
    ...countRows("Tasks by Priority", report.tasksByPriority),
    ...countRows("Requests by Status", report.requestsByStatus),
    ...countRows("Work Orders by Status", report.workOrdersByStatus),
    ...countRows("Timesheets", report.timesheetApprovalCounts),
    ...countRows("SOPs", report.sopsNeedingReview),
    ...report.employeeWorkload.map((row) => [
      "Employee Workload",
      row.employee_name,
      String(row.open_tasks + row.open_work_orders),
      `department=${row.department ?? ""}; open_tasks=${row.open_tasks}; open_work_orders=${row.open_work_orders}`,
    ]),
    ...report.lowInventory.map((row) => [
      "Low Inventory",
      row.item_name,
      String(row.quantity ?? 0),
      `status=${row.status ?? ""}; location=${row.location ?? ""}; unit=${row.unit ?? ""}`,
    ]),
  ];

  return rows.map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n";
}

function countRows(section: string, rows: CountRow[]) {
  return rows.map((row) => [section, row.label, String(row.count), ""]);
}

function escapeCsv(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

async function getTableInfo(): Promise<TableInfo> {
  const rows = await query<{ table_name: string; column_name: string }>(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [REPORT_TABLES],
  );

  const tables = new Set<string>();
  const columns = new Map<string, Set<string>>();

  for (const row of rows) {
    tables.add(row.table_name);
    if (!columns.has(row.table_name)) columns.set(row.table_name, new Set());
    columns.get(row.table_name)?.add(row.column_name);
  }

  return { tables, columns };
}

function has(info: TableInfo, table: string, column: string) {
  return info.columns.get(table)?.has(column) ?? false;
}

function taskOptions(info: TableInfo): FilterOptions {
  return {
    dateExpression: dateExpression(info, "tasks", "t", [
      "completed_at",
      "updated_at",
      "due_date",
      "created_at",
    ]),
    divisionColumn: has(info, "tasks", "division") ? "division" : undefined,
    employeeColumn: has(info, "tasks", "assigned_to")
      ? "assigned_to"
      : undefined,
    departmentJoin:
      has(info, "tasks", "assigned_to") && info.tables.has("employees")
        ? "LEFT JOIN employees e ON t.assigned_to = e.id"
        : undefined,
  };
}

function requestOptions(info: TableInfo): FilterOptions {
  return {
    dateExpression: dateExpression(info, "requests", "r", [
      "submitted_date",
      "updated_at",
      "created_at",
    ]),
    departmentJoin: undefined,
  };
}

function workOrderOptions(info: TableInfo): FilterOptions {
  return {
    dateExpression: dateExpression(info, "work_orders", "w", [
      "completed_at",
      "updated_at",
      "due_date",
      "created_at",
    ]),
    divisionColumn: has(info, "work_orders", "division")
      ? "division"
      : undefined,
    employeeColumn: has(info, "work_orders", "owner") ? "owner" : undefined,
    departmentJoin:
      has(info, "work_orders", "owner") && info.tables.has("employees")
        ? "LEFT JOIN employees e ON w.owner = e.id"
        : undefined,
  };
}

function timesheetOptions(info: TableInfo): FilterOptions {
  return {
    dateExpression: dateExpression(info, "timesheets", "ts", [
      "submitted_at",
      "week_start",
      "created_at",
    ]),
    employeeColumn: has(info, "timesheets", "employee_id")
      ? "employee_id"
      : undefined,
  };
}

type FilterOptions = {
  dateExpression?: string;
  divisionColumn?: string;
  employeeColumn?: string;
  departmentJoin?: string;
};

function buildWhere(
  alias: string,
  filters: ReportFilters,
  options: FilterOptions,
  extra: string[] = [],
) {
  const clauses = [...extra.filter(Boolean)];
  const params: unknown[] = [];

  if (filters.from && options.dateExpression) {
    params.push(filters.from);
    clauses.push(`${options.dateExpression} >= $${params.length}::timestamptz`);
  }
  if (filters.to && options.dateExpression) {
    params.push(filters.to);
    clauses.push(
      `${options.dateExpression} < ($${params.length}::date + INTERVAL '1 day')`,
    );
  }
  if (filters.company_division && options.divisionColumn) {
    params.push(filters.company_division);
    clauses.push(
      `LOWER(${alias}.${options.divisionColumn}) = LOWER($${params.length})`,
    );
  }
  if (filters.employee_id && options.employeeColumn) {
    params.push(filters.employee_id);
    clauses.push(`${alias}.${options.employeeColumn} = $${params.length}`);
  }
  if (filters.department && options.departmentJoin) {
    params.push(filters.department);
    clauses.push(`LOWER(e.department) = LOWER($${params.length})`);
  }

  return {
    params,
    join: options.departmentJoin ? ` ${options.departmentJoin} ` : "",
    where: clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "",
  };
}

async function countBy(
  info: TableInfo,
  table: string,
  alias: string,
  column: string,
  filters: ReportFilters,
  options: FilterOptions,
): Promise<CountRow[]> {
  if (!info.tables.has(table) || !has(info, table, column)) return [];
  const built = buildWhere(alias, filters, options);
  const rows = await query<{ label: string; count: string }>(
    `SELECT COALESCE(NULLIF(${alias}.${column}, ''), 'unknown') AS label,
            COUNT(*)::text AS count
     FROM ${table} ${alias}
     ${built.join}
     ${built.where}
     GROUP BY label
     ORDER BY count DESC, label ASC`,
    built.params,
  );
  return rows.map((row) => ({ label: row.label, count: Number(row.count) }));
}

async function countScalar(
  info: TableInfo,
  table: string,
  alias: string,
  filters: ReportFilters,
  options: FilterOptions,
  extra: string[] = [],
): Promise<number> {
  if (!info.tables.has(table)) return 0;
  const built = buildWhere(alias, filters, options, extra);
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM ${table} ${alias}
     ${built.join}
     ${built.where}`,
    built.params,
  );
  return Number(rows[0]?.count ?? 0);
}

function dateExpression(
  info: TableInfo,
  table: string,
  alias: string,
  columns: string[],
) {
  const available = columns.filter((column) => has(info, table, column));
  if (available.length === 0) return undefined;
  return `COALESCE(${available.map((column) => `${alias}.${column}::timestamptz`).join(", ")})`;
}

function weekClause(info: TableInfo, table: string, alias: string) {
  const expression = dateExpression(info, table, alias, [
    "completed_at",
    "updated_at",
    "created_at",
  ]);
  return expression ? `${expression} >= date_trunc('week', NOW())` : "TRUE";
}

async function countLowInventory(info: TableInfo, filters: ReportFilters) {
  if (!info.tables.has("inventory")) return 0;
  const reorderClause =
    has(info, "inventory", "reorder_threshold") &&
    has(info, "inventory", "quantity")
      ? "OR (i.reorder_threshold IS NOT NULL AND i.quantity <= i.reorder_threshold)"
      : "";
  const clauses = [
    `(LOWER(COALESCE(i.status, '')) IN ('low_stock', 'out_of_stock') ${reorderClause})`,
  ];
  const built = buildWhere(
    "i",
    filters,
    {
      dateExpression: dateExpression(info, "inventory", "i", [
        "updated_at",
        "last_updated",
        "created_at",
      ]),
    },
    clauses,
  );
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM inventory i ${built.where}`,
    built.params,
  );
  return Number(rows[0]?.count ?? 0);
}

async function getLowInventory(
  info: TableInfo,
  filters: ReportFilters,
): Promise<InventoryAlertRow[]> {
  if (!info.tables.has("inventory")) return [];
  const nameColumn = has(info, "inventory", "item_name")
    ? "item_name"
    : has(info, "inventory", "name")
      ? "name"
      : "id::text";
  const reorderClause =
    has(info, "inventory", "reorder_threshold") &&
    has(info, "inventory", "quantity")
      ? "OR (i.reorder_threshold IS NOT NULL AND i.quantity <= i.reorder_threshold)"
      : "";
  const clauses = [
    `(LOWER(COALESCE(i.status, '')) IN ('low_stock', 'out_of_stock') ${reorderClause})`,
  ];
  const built = buildWhere(
    "i",
    filters,
    {
      dateExpression: dateExpression(info, "inventory", "i", [
        "updated_at",
        "last_updated",
        "created_at",
      ]),
    },
    clauses,
  );
  return query<InventoryAlertRow>(
    `SELECT i.id,
            i.${nameColumn} AS item_name,
            ${has(info, "inventory", "quantity") ? "i.quantity" : "NULL::numeric"} AS quantity,
            ${has(info, "inventory", "unit") ? "i.unit" : "NULL::text"} AS unit,
            ${has(info, "inventory", "location") ? "i.location" : "NULL::text"} AS location,
            ${has(info, "inventory", "status") ? "i.status" : "NULL::text"} AS status
     FROM inventory i
     ${built.where}
     ORDER BY i.status ASC NULLS LAST, item_name ASC
     LIMIT 25`,
    built.params,
  );
}

async function getEmployeeWorkload(
  info: TableInfo,
  filters: ReportFilters,
): Promise<EmployeeWorkloadRow[]> {
  if (!info.tables.has("employees")) return [];
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.department && has(info, "employees", "department")) {
    params.push(filters.department);
    clauses.push(`LOWER(e.department) = LOWER($${params.length})`);
  }
  if (filters.employee_id) {
    params.push(filters.employee_id);
    clauses.push(`e.id = $${params.length}`);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const taskSubquery =
    info.tables.has("tasks") && has(info, "tasks", "assigned_to")
      ? `(SELECT COUNT(*)::int FROM tasks t WHERE t.assigned_to = e.id AND LOWER(COALESCE(t.status, '')) NOT IN ('completed', 'complete', 'done', 'cancelled', 'canceled'))`
      : "0";
  const workOrderSubquery =
    info.tables.has("work_orders") && has(info, "work_orders", "owner")
      ? `(SELECT COUNT(*)::int FROM work_orders w WHERE w.owner = e.id AND LOWER(COALESCE(w.status, '')) NOT IN ('completed', 'complete', 'closed', 'cancelled', 'canceled'))`
      : "0";

  return query<EmployeeWorkloadRow>(
    `SELECT e.id AS employee_id,
            e.name AS employee_name,
            ${has(info, "employees", "department") ? "e.department" : "NULL::text"} AS department,
            ${taskSubquery} AS open_tasks,
            ${workOrderSubquery} AS open_work_orders
     FROM employees e
     ${where}
     ORDER BY ((${taskSubquery}) + (${workOrderSubquery})) DESC, e.name ASC
     LIMIT 25`,
    params,
  );
}

async function getSopsNeedingReview(
  info: TableInfo,
  filters: ReportFilters,
): Promise<CountRow[]> {
  if (!info.tables.has("sops")) return [];
  const reviewChecks = [];
  if (has(info, "sops", "status")) {
    reviewChecks.push(
      "LOWER(COALESCE(s.status, '')) IN ('needs_review', 'needs review')",
    );
  }
  if (has(info, "sops", "review_date")) {
    reviewChecks.push(
      "s.review_date IS NOT NULL AND s.review_date < CURRENT_DATE",
    );
  }
  if (reviewChecks.length === 0) return [];
  const clauses = [`(${reviewChecks.join(" OR ")})`];
  const built = buildWhere(
    "s",
    filters,
    {
      dateExpression: dateExpression(info, "sops", "s", [
        "review_date",
        "updated_at",
        "last_updated",
        "created_at",
      ]),
      departmentJoin: has(info, "sops", "department") ? undefined : undefined,
    },
    clauses,
  );
  if (filters.department && has(info, "sops", "department")) {
    built.params.push(filters.department);
    built.where = built.where
      ? `${built.where} AND LOWER(s.department) = LOWER($${built.params.length})`
      : `WHERE LOWER(s.department) = LOWER($${built.params.length})`;
  }
  const categoryExpr = has(info, "sops", "category")
    ? "COALESCE(NULLIF(s.category, ''), 'Uncategorized')"
    : "'SOPs'";
  const rows = await query<{ label: string; count: string }>(
    `SELECT ${categoryExpr} AS label, COUNT(*)::text AS count
     FROM sops s
     ${built.where}
     GROUP BY label
     ORDER BY count DESC, label ASC`,
    built.params,
  );
  return rows.map((row) => ({ label: row.label, count: Number(row.count) }));
}

async function getRecentOperationalActivity(
  info: TableInfo,
): Promise<ActivityRow[]> {
  if (info.tables.has("audit_logs")) {
    return query<ActivityRow>(
      `SELECT action,
              module,
              entity_type,
              entity_id::text AS entity_id,
              created_at::text AS created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT 15`,
    );
  }
  if (info.tables.has("system_audit_logs")) {
    return query<ActivityRow>(
      `SELECT action,
              module,
              'system_setting'::text AS entity_type,
              record_id::text AS entity_id,
              created_at::text AS created_at
       FROM system_audit_logs
       ORDER BY created_at DESC
       LIMIT 15`,
    );
  }
  return [];
}

function sumCounts(rows: CountRow[]) {
  return rows.reduce((sum, row) => sum + row.count, 0);
}

function parseDate(value: string | null) {
  if (!value) return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

function cleanText(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 100) : undefined;
}

function parsePositiveInteger(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
