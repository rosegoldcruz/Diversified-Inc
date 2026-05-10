"use client";

import { useEffect, useState } from "react";

interface Timesheet {
  id: number;
  employee_id: number | null;
  employee_name: string;
  week_start: string;
  week_end: string;
  monday_hours: number;
  tuesday_hours: number;
  wednesday_hours: number;
  thursday_hours: number;
  friday_hours: number;
  saturday_hours: number;
  sunday_hours: number;
  total_hours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  submitted_at: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const yearFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}, ${yearFormatter.format(end)}`;
}

function getStatusBadgeClasses(status: string): string {
  const baseClasses = "px-3 py-1 rounded text-sm font-medium";
  switch (status) {
    case "draft":
      return `${baseClasses} bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300`;
    case "submitted":
      return `${baseClasses} bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200`;
    case "approved":
      return `${baseClasses} bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200`;
    case "rejected":
      return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200`;
    default:
      return `${baseClasses} bg-slate-100 text-slate-700`;
  }
}

function getCurrentWeekStart(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchTimesheets = async () => {
      try {
        const response = await fetch("/api/timesheets", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to fetch timesheets");
        const data = await response.json();
        if (!cancelled) {
          setTimesheets(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch timesheets"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchTimesheets();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentWeekStart = getCurrentWeekStart();
  const totalTimesheets = timesheets.length;
  const pendingApproval = timesheets.filter(
    (ts) => ts.status === "submitted"
  ).length;
  const approvedThisWeek = timesheets.filter(
    (ts) => ts.status === "approved" && ts.week_start === currentWeekStart
  ).length;

  return (
    <div className="space-y-5 font-sans">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
          Timesheets
        </h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          Weekly hour logs by employee, submitted for payroll approval.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Timesheets" value={totalTimesheets} />
        <SummaryCard label="Pending Approval" value={pendingApproval} />
        <SummaryCard label="Approved This Week" value={approvedThisWeek} />
      </section>

      {error && <ErrorPanel message={error} />}

      {loading ? (
        <LoadingPanel label="Loading timesheets..." />
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-lg border border-borderSubtle bg-surface shadow-soft md:block">
            <div className="overflow-x-auto">
              <table className="min-w-[1400px] w-full text-left text-sm">
                <thead className="bg-navy text-xs uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employee</th>
                    <th className="px-4 py-3 font-semibold">Week</th>
                    <th className="px-4 py-3 font-semibold text-right">Mon</th>
                    <th className="px-4 py-3 font-semibold text-right">Tue</th>
                    <th className="px-4 py-3 font-semibold text-right">Wed</th>
                    <th className="px-4 py-3 font-semibold text-right">Thu</th>
                    <th className="px-4 py-3 font-semibold text-right">Fri</th>
                    <th className="px-4 py-3 font-semibold text-right">Sat</th>
                    <th className="px-4 py-3 font-semibold text-right">Sun</th>
                    <th className="px-4 py-3 font-semibold text-right">
                      Total Hours
                    </th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {timesheets.map((timesheet, idx) => (
                    <tr
                      key={timesheet.id}
                      className={`transition-colors hover:bg-surfaceHover ${
                        idx % 2 === 0 ? "bg-surface" : "bg-bgDark/30"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-textPrimary">
                          {timesheet.employee_name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        {formatWeekRange(
                          timesheet.week_start,
                          timesheet.week_end
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-textPrimary">
                        {timesheet.monday_hours || "0"}
                      </td>
                      <td className="px-4 py-3 text-right text-textPrimary">
                        {timesheet.tuesday_hours || "0"}
                      </td>
                      <td className="px-4 py-3 text-right text-textPrimary">
                        {timesheet.wednesday_hours || "0"}
                      </td>
                      <td className="px-4 py-3 text-right text-textPrimary">
                        {timesheet.thursday_hours || "0"}
                      </td>
                      <td className="px-4 py-3 text-right text-textPrimary">
                        {timesheet.friday_hours || "0"}
                      </td>
                      <td className="px-4 py-3 text-right text-textPrimary">
                        {timesheet.saturday_hours || "0"}
                      </td>
                      <td className="px-4 py-3 text-right text-textPrimary">
                        {timesheet.sunday_hours || "0"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-textPrimary">
                        {timesheet.total_hours}
                      </td>
                      <td className="px-4 py-3">
                        <span className={getStatusBadgeClasses(timesheet.status)}>
                          {timesheet.status.charAt(0).toUpperCase() +
                            timesheet.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3 md:hidden">
            {timesheets.map((timesheet) => (
              <article
                key={timesheet.id}
                className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-textPrimary">
                      {timesheet.employee_name}
                    </p>
                    <p className="mt-1 text-xs text-textSecondary">
                      {formatWeekRange(
                        timesheet.week_start,
                        timesheet.week_end
                      )}
                    </p>
                  </div>
                  <span className={getStatusBadgeClasses(timesheet.status)}>
                    {timesheet.status.charAt(0).toUpperCase() +
                      timesheet.status.slice(1)}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <MobileHourCell
                      day="Mon"
                      hours={timesheet.monday_hours}
                    />
                    <MobileHourCell
                      day="Tue"
                      hours={timesheet.tuesday_hours}
                    />
                    <MobileHourCell
                      day="Wed"
                      hours={timesheet.wednesday_hours}
                    />
                    <MobileHourCell
                      day="Thu"
                      hours={timesheet.thursday_hours}
                    />
                    <MobileHourCell
                      day="Fri"
                      hours={timesheet.friday_hours}
                    />
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <MobileHourCell
                      day="Sat"
                      hours={timesheet.saturday_hours}
                    />
                    <MobileHourCell
                      day="Sun"
                      hours={timesheet.sunday_hours}
                    />
                  </div>
                </div>

                <div className="mt-4 border-t border-borderSubtle pt-3">
                  <p className="text-sm text-textSecondary">
                    Total:{" "}
                    <span className="font-bold text-textPrimary">
                      {timesheet.total_hours} hours
                    </span>
                  </p>
                </div>
              </article>
            ))}
          </section>

          {timesheets.length === 0 && (
            <section className="rounded-lg border border-dashed border-borderSubtle bg-surface p-8 text-center text-sm text-textSecondary">
              No timesheets found.
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-textPrimary">{value}</p>
    </div>
  );
}

function MobileHourCell({ day, hours }: { day: string; hours: number }) {
  return (
    <div className="text-center">
      <p className="font-semibold text-textMuted">{day}</p>
      <p className="text-textPrimary">{hours || "0"}</p>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-surface p-10 text-center text-sm text-textSecondary shadow-soft">
      {label}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
      {message}
    </div>
  );
}
