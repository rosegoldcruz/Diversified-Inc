"use client";

import { useEffect, useMemo, useState } from "react";
import { DownloadSimple } from "phosphor-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

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

type ReportData = {
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

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportReady, setExportReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/reports", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load reports (${response.status})`);
        }
        const data = (await response.json()) as ReportData;
        if (!cancelled) setReport(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load reports",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkExportAvailability() {
      try {
        const response = await fetch("/api/reports/export?check=1", {
          cache: "no-store",
        });
        if (!response.ok) {
          if (!cancelled) setExportReady(false);
          return;
        }
        const payload = (await response.json()) as { export: boolean };
        if (!cancelled) setExportReady(Boolean(payload.export));
      } catch {
        if (!cancelled) setExportReady(false);
      }
    }

    void checkExportAvailability();

    return () => {
      cancelled = true;
    };
  }, []);

  const tasksByStatus = report?.tasksByStatus ?? [];
  const tasksByPriority = report?.tasksByPriority ?? [];
  const requestsByStatus = report?.requestsByStatus ?? [];
  const workOrdersByStatus = report?.workOrdersByStatus ?? [];
  const timesheetApprovalCounts = report?.timesheetApprovalCounts ?? [];
  const sopsNeedingReview = report?.sopsNeedingReview ?? [];
  const employeeWorkload = report?.employeeWorkload ?? [];
  const lowInventory = report?.lowInventory ?? [];
  const recentOperationalActivity = report?.recentOperationalActivity ?? [];

  const cards = useMemo(() => {
    if (!report) return [];
    return [
      { label: "Total Tasks", value: report.summary.totalTasks },
      { label: "Overdue Tasks", value: report.summary.overdueTasks },
      { label: "Blocked Tasks", value: report.summary.blockedTasks },
      {
        label: "Completed This Week",
        value: report.summary.completedTasksThisWeek,
      },
      { label: "Open Requests", value: report.summary.openRequests },
      { label: "Open Work Orders", value: report.summary.openWorkOrders },
      { label: "Low Inventory", value: report.summary.lowInventory },
      {
        label: "Pending Timesheets",
        value: report.summary.timesheetsPendingApproval,
      },
      {
        label: "SOPs Needing Review",
        value: report.summary.sopsNeedingReview ?? 0,
      },
      {
        label: "Weekly Completed Work",
        value: report.summary.weeklyCompletedWork,
      },
    ];
  }, [report]);

  async function exportCsv() {
    try {
      setExporting(true);
      setError(null);
      const response = await fetch("/api/reports/export", {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`Failed to export reports (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `diversified-os-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Failed to export reports",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
            <ShinyText>Reports</ShinyText>
          </h1>
          <p className="max-w-3xl text-base text-textSecondary">
            PostgreSQL-backed operational reporting across tasks, requests, work
            orders, inventory, SOPs, and timesheets.
          </p>
          {report ? (
            <p className="text-xs text-textMuted">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          ) : null}
        </div>
        {exportReady ? (
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting || loading || !report}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/55 px-4 text-sm font-semibold text-textPrimary shadow-glass backdrop-blur-2xl transition hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <DownloadSimple className="h-4 w-4" weight="bold" />
            {exporting ? "Exporting" : "Export CSV"}
          </button>
        ) : null}
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? <LoadingPanel label="Loading reports..." /> : null}

      {!loading && !error && report && cards.length === 0 ? (
        <EmptyPanel message="No report records are available." />
      ) : null}

      {report ? (
        <>
          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={90}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-5"
          >
            {cards.map((card) => (
              <article
                key={card.label}
                className="glass-surface cursor-default p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                  {card.label}
                </p>
                <p className="mt-3 text-4xl font-semibold text-textPrimary">
                  {card.value.toLocaleString()}
                </p>
              </article>
            ))}
          </FadeContent>

          <div className="grid gap-6 xl:grid-cols-2">
            <BreakdownTable title="Tasks by Status" rows={tasksByStatus} />
            <BreakdownTable title="Tasks by Priority" rows={tasksByPriority} />
            <BreakdownTable
              title="Requests by Status"
              rows={requestsByStatus}
            />
            <BreakdownTable
              title="Work Orders by Status"
              rows={workOrdersByStatus}
            />
            <BreakdownTable
              title="Timesheet Approval Counts"
              rows={timesheetApprovalCounts}
            />
            <BreakdownTable title="SOP Review Needs" rows={sopsNeedingReview} />
          </div>

          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={120}
            className="glass-surface p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-textPrimary">
              Employee Workload
            </h2>
            <DataTableEmpty visible={employeeWorkload.length === 0} />
            {employeeWorkload.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Employee</th>
                      <th className="px-4 py-3 font-semibold">Department</th>
                      <th className="px-4 py-3 font-semibold">Open Tasks</th>
                      <th className="px-4 py-3 font-semibold">
                        Open Work Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30 dark:divide-white/10">
                    {employeeWorkload.map((row) => (
                      <tr key={row.employee_id}>
                        <td className="px-4 py-3 font-medium text-textPrimary">
                          {row.employee_name}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {row.department || "-"}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {row.open_tasks}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {row.open_work_orders}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </FadeContent>

          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={150}
            className="glass-surface p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-textPrimary">
              Inventory Alerts
            </h2>
            <DataTableEmpty visible={lowInventory.length === 0} />
            {lowInventory.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold">Quantity</th>
                      <th className="px-4 py-3 font-semibold">Unit</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30 dark:divide-white/10">
                    {lowInventory.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-medium text-textPrimary">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {item.quantity ?? 0}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {item.unit || "-"}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {item.location || "-"}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {formatLabel(item.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </FadeContent>

          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={180}
            className="glass-surface p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-textPrimary">
              Recent Operational Activity
            </h2>
            <DataTableEmpty visible={recentOperationalActivity.length === 0} />
            {recentOperationalActivity.length > 0 ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Action</th>
                      <th className="px-4 py-3 font-semibold">Module</th>
                      <th className="px-4 py-3 font-semibold">Entity</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30 dark:divide-white/10">
                    {recentOperationalActivity.map((activity, index) => (
                      <tr
                        key={`${activity.module}-${activity.action}-${index}`}
                      >
                        <td className="px-4 py-3 font-medium text-textPrimary">
                          {activity.action}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {activity.module}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {[activity.entity_type, activity.entity_id]
                            .filter(Boolean)
                            .join(":") || "-"}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {new Date(activity.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </FadeContent>
        </>
      ) : null}
    </div>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: CountRow[] }) {
  return (
    <FadeContent
      as="section"
      blur={true}
      duration={800}
      delay={120}
      className="glass-surface p-6 md:p-8"
    >
      <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
      <DataTableEmpty visible={rows.length === 0} />
      {rows.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
              <tr>
                <th className="px-4 py-3 font-semibold">Label</th>
                <th className="px-4 py-3 font-semibold">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30 dark:divide-white/10">
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="px-4 py-3 text-textSecondary">
                    {formatLabel(row.label)}
                  </td>
                  <td className="px-4 py-3 font-medium text-textPrimary">
                    {row.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </FadeContent>
  );
}

function DataTableEmpty({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return <p className="mt-4 text-sm text-textSecondary">No records found.</p>;
}

function formatLabel(value: string | null) {
  return (value || "unknown").replaceAll("_", " ");
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="glass-surface p-12 text-center text-sm text-textSecondary">
      {label}
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="glass-surface p-8 text-center text-sm text-textSecondary">
      {message}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-5 text-sm text-red-700 shadow-glass backdrop-blur-2xl dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
