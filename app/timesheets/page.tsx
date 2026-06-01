"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

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
  needs_review?: boolean;
  review_state?:
    | "draft"
    | "submitted"
    | "approved"
    | "rejected"
    | "needs_review";
  exception_open_entries?: number;
  warning_open_entries?: number;
  submitted_at: string | null;
  approved_by: string | null;
  notes: string | null;
  created_at: string;
}

interface TimesheetPunch {
  id: number;
  employee_id: number | null;
  employee_name: string;
  clock_in: string;
  clock_out: string | null;
  total_minutes: number | null;
  notes: string | null;
  created_at: string;
}

interface TimesheetDetailResponse {
  timesheet: Timesheet;
  punches: TimesheetPunch[];
}

type SessionUser = {
  id: number;
  role: "Employee" | "Manager" | "Admin" | "Leadership";
};

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
    case "needs_review":
      return `${baseClasses} bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200`;
    case "draft":
      return `${baseClasses} bg-bgDark text-textSecondary`;
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

function toDateOnly(value: string): string {
  return value.split("T")[0];
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMinutes(minutes: number | null) {
  if (minutes === null) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function getDisplayStatus(timesheet: Timesheet) {
  return timesheet.needs_review ? "needs_review" : timesheet.status;
}

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [actionBusyId, setActionBusyId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [needsReviewFilter, setNeedsReviewFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [weekFilter, setWeekFilter] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [detail, setDetail] = useState<TimesheetDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [editHours, setEditHours] = useState({
    monday_hours: "0",
    tuesday_hours: "0",
    wednesday_hours: "0",
    thursday_hours: "0",
    friday_hours: "0",
    saturday_hours: "0",
    sunday_hours: "0",
    notes: "",
  });

  const fetchTimesheets = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [response, meResponse] = await Promise.all([
        fetch("/api/timesheets", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);
      if (!response.ok) throw new Error("Failed to fetch timesheets");

      const data = (await response.json()) as Timesheet[];
      setTimesheets(data);

      if (meResponse.ok) {
        const meData = (await meResponse.json()) as { user: SessionUser | null };
        setMe(meData.user);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch timesheets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchTimesheets(false);
  }, [fetchTimesheets]);

  const loadTimesheetDetail = useCallback(async (timesheetId: number) => {
    try {
      setDetailLoading(true);
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | TimesheetDetailResponse
        | { error?: string }
        | null;

      if (!response.ok || !payload || !("timesheet" in payload)) {
        throw new Error(
          (payload as { error?: string } | null)?.error ||
            "Failed to load timesheet detail",
        );
      }

      setDetail(payload);
      setError(null);
      return payload;
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Failed to load timesheet detail",
      );
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const currentWeekStart = getCurrentWeekStart();
  const totalTimesheets = timesheets.length;
  const pendingApproval = timesheets.filter(
    (ts) => ts.status === "submitted",
  ).length;
  const approvedThisWeek = timesheets.filter(
    (ts) =>
      ts.status === "approved" &&
      toDateOnly(ts.week_start) === currentWeekStart,
  ).length;
  const needsReviewCount = timesheets.filter((ts) => ts.needs_review).length;

  const isManagerLevel =
    me?.role === "Manager" || me?.role === "Admin" || me?.role === "Leadership";

  const uniqueEmployees = useMemo(
    () => Array.from(new Set(timesheets.map((item) => item.employee_name))).sort(),
    [timesheets],
  );

  const uniqueWeeks = useMemo(
    () => Array.from(new Set(timesheets.map((item) => toDateOnly(item.week_start)))).sort().reverse(),
    [timesheets],
  );

  const filteredTimesheets = useMemo(() => {
    return timesheets.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (needsReviewFilter === "needs_review" && !item.needs_review) {
        return false;
      }

      if (needsReviewFilter === "clean" && item.needs_review) {
        return false;
      }

      if (employeeFilter !== "all" && item.employee_name !== employeeFilter) {
        return false;
      }

      if (weekFilter !== "all" && toDateOnly(item.week_start) !== weekFilter) {
        return false;
      }

      if (
        searchFilter.trim() &&
        !item.employee_name.toLowerCase().includes(searchFilter.trim().toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [
    employeeFilter,
    needsReviewFilter,
    searchFilter,
    statusFilter,
    timesheets,
    weekFilter,
  ]);

  async function updateTimesheetStatus(
    timesheetId: number,
    status: Timesheet["status"],
  ) {
    try {
      setActionBusyId(timesheetId);
      const response = await fetch(`/api/timesheets/${timesheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => null)) as
        | Timesheet
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          (payload as { error?: string } | null)?.error ||
            `Failed to update timesheet (${response.status})`,
        );
      }
      setTimesheets((prev) =>
        prev.map((item) =>
          item.id === timesheetId ? (payload as Timesheet) : item,
        ),
      );
      setError(null);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update timesheet",
      );
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleViewTimesheet(timesheetId: number) {
    await loadTimesheetDetail(timesheetId);
    setEditingTimesheet(null);
  }

  async function handlePrintTimesheet(timesheetId: number) {
    const loaded = await loadTimesheetDetail(timesheetId);
    if (loaded) {
      setEditingTimesheet(null);
      window.print();
    }
  }

  function beginEditTimesheet(timesheet: Timesheet) {
    setEditingTimesheet(timesheet);
    setEditHours({
      monday_hours: String(timesheet.monday_hours ?? 0),
      tuesday_hours: String(timesheet.tuesday_hours ?? 0),
      wednesday_hours: String(timesheet.wednesday_hours ?? 0),
      thursday_hours: String(timesheet.thursday_hours ?? 0),
      friday_hours: String(timesheet.friday_hours ?? 0),
      saturday_hours: String(timesheet.saturday_hours ?? 0),
      sunday_hours: String(timesheet.sunday_hours ?? 0),
      notes: timesheet.notes || "",
    });
  }

  async function saveTimesheetEdits() {
    if (!editingTimesheet) return;

    try {
      setActionBusyId(editingTimesheet.id);
      const response = await fetch(`/api/timesheets/${editingTimesheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monday_hours: Number(editHours.monday_hours || 0),
          tuesday_hours: Number(editHours.tuesday_hours || 0),
          wednesday_hours: Number(editHours.wednesday_hours || 0),
          thursday_hours: Number(editHours.thursday_hours || 0),
          friday_hours: Number(editHours.friday_hours || 0),
          saturday_hours: Number(editHours.saturday_hours || 0),
          sunday_hours: Number(editHours.sunday_hours || 0),
          notes: editHours.notes,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | Timesheet
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          (payload as { error?: string } | null)?.error ||
            "Failed to save timesheet edits",
        );
      }

      setTimesheets((prev) =>
        prev.map((item) =>
          item.id === editingTimesheet.id ? (payload as Timesheet) : item,
        ),
      );
      setEditingTimesheet(null);
      await loadTimesheetDetail(editingTimesheet.id);
      setError(null);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save timesheet edits",
      );
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <div className="space-y-8 font-sans">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
          <ShinyText>Timesheets</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          Weekly hour logs by employee, submitted for payroll approval.
        </p>
      </FadeContent>

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={90}
        className="grid gap-3 sm:grid-cols-4"
      >
        <SummaryCard label="Total Timesheets" value={totalTimesheets} />
        <SummaryCard label="Pending Approval" value={pendingApproval} />
        <SummaryCard label="Approved This Week" value={approvedThisWeek} />
        <SummaryCard label="Needs Review" value={needsReviewCount} />
      </FadeContent>

      <section className="glass-surface grid gap-3 p-5 md:grid-cols-6 md:items-end">
        <label className="text-sm font-medium text-textPrimary">
          Week
          <select
            value={weekFilter}
            onChange={(event) => setWeekFilter(event.target.value)}
            className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
          >
            <option value="all">All weeks</option>
            {uniqueWeeks.map((week) => (
              <option key={week} value={week}>
                {week}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-textPrimary">
          Employee
          <select
            value={employeeFilter}
            onChange={(event) => setEmployeeFilter(event.target.value)}
            className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
          >
            <option value="all">All employees</option>
            {uniqueEmployees.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-medium text-textPrimary">
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>

        <label className="text-sm font-medium text-textPrimary">
          Needs Review
          <select
            value={needsReviewFilter}
            onChange={(event) => setNeedsReviewFilter(event.target.value)}
            className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
          >
            <option value="all">All</option>
            <option value="needs_review">Needs review</option>
            <option value="clean">No review flags</option>
          </select>
        </label>

        <label className="text-sm font-medium text-textPrimary">
          Search Employee
          <input
            type="text"
            value={searchFilter}
            onChange={(event) => setSearchFilter(event.target.value)}
            placeholder="Name"
            className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
          />
        </label>

        <button
          type="button"
          onClick={() => void fetchTimesheets(true)}
          disabled={refreshing}
          className="rounded-md border border-borderSubtle bg-surface px-4 py-2 text-sm font-semibold text-textPrimary shadow-soft disabled:opacity-60 dark:bg-bgDark"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {error && <ErrorPanel message={error} />}

      {loading ? (
        <LoadingPanel label="Loading timesheets..." />
      ) : (
        <>
          <section className="hidden overflow-hidden rounded-xl border border-borderSubtle bg-surface/95 shadow-soft backdrop-blur-xl md:block">
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
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {filteredTimesheets.map((timesheet, idx) => (
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
                          timesheet.week_end,
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
                        {timesheet.needs_review ? (
                          <p className="mt-1 text-xs font-medium text-red-400">
                            Exception punches excluded pending review
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={getStatusBadgeClasses(
                            getDisplayStatus(timesheet),
                          )}
                        >
                          {getDisplayStatus(timesheet) === "needs_review"
                            ? "Needs Review"
                            : timesheet.status.charAt(0).toUpperCase() +
                              timesheet.status.slice(1)}
                        </span>
                        {timesheet.exception_open_entries ? (
                          <p className="mt-1 text-xs text-red-400">
                            {timesheet.exception_open_entries} open shift(s) over 16h
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleViewTimesheet(timesheet.id)}
                            className="rounded-md border border-borderSubtle bg-surface px-2.5 py-1 text-xs font-semibold text-textPrimary dark:bg-bgDark"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => void handlePrintTimesheet(timesheet.id)}
                            className="rounded-md border border-borderSubtle bg-surface px-2.5 py-1 text-xs font-semibold text-textPrimary dark:bg-bgDark"
                          >
                            Print
                          </button>
                          {isManagerLevel || timesheet.status !== "approved" ? (
                            <button
                              type="button"
                              onClick={() => beginEditTimesheet(timesheet)}
                              className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                            >
                              Edit
                            </button>
                          ) : null}
                          {timesheet.status === "draft" ? (
                            <button
                              type="button"
                              disabled={actionBusyId === timesheet.id}
                              onClick={() =>
                                void updateTimesheetStatus(
                                  timesheet.id,
                                  "submitted",
                                )
                              }
                              className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 disabled:opacity-60 dark:text-blue-300"
                            >
                              Submit
                            </button>
                          ) : null}
                          {isManagerLevel &&
                          timesheet.status === "submitted" ? (
                            <>
                              <button
                                type="button"
                                disabled={
                                  actionBusyId === timesheet.id ||
                                  !!timesheet.needs_review
                                }
                                onClick={() =>
                                  void updateTimesheetStatus(
                                    timesheet.id,
                                    "approved",
                                  )
                                }
                                className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-60 dark:text-emerald-300"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={actionBusyId === timesheet.id}
                                onClick={() =>
                                  void updateTimesheetStatus(
                                    timesheet.id,
                                    "rejected",
                                  )
                                }
                                className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-60 dark:text-red-300"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-3 md:hidden">
            {filteredTimesheets.map((timesheet) => (
              <article
                key={timesheet.id}
                className="rounded-xl border border-borderSubtle bg-surface/95 p-5 shadow-soft backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-textPrimary">
                      {timesheet.employee_name}
                    </p>
                    <p className="mt-1 text-xs text-textSecondary">
                      {formatWeekRange(
                        timesheet.week_start,
                        timesheet.week_end,
                      )}
                    </p>
                  </div>
                  <span
                    className={getStatusBadgeClasses(getDisplayStatus(timesheet))}
                  >
                    {getDisplayStatus(timesheet) === "needs_review"
                      ? "Needs Review"
                      : timesheet.status.charAt(0).toUpperCase() +
                        timesheet.status.slice(1)}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <MobileHourCell day="Mon" hours={timesheet.monday_hours} />
                    <MobileHourCell day="Tue" hours={timesheet.tuesday_hours} />
                    <MobileHourCell
                      day="Wed"
                      hours={timesheet.wednesday_hours}
                    />
                    <MobileHourCell
                      day="Thu"
                      hours={timesheet.thursday_hours}
                    />
                    <MobileHourCell day="Fri" hours={timesheet.friday_hours} />
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-xs">
                    <MobileHourCell
                      day="Sat"
                      hours={timesheet.saturday_hours}
                    />
                    <MobileHourCell day="Sun" hours={timesheet.sunday_hours} />
                  </div>
                </div>

                <div className="mt-4 border-t border-borderSubtle pt-3">
                  <p className="text-sm text-textSecondary">
                    Total:{" "}
                    <span className="font-bold text-textPrimary">
                      {timesheet.total_hours} hours
                    </span>
                  </p>
                  {timesheet.exception_open_entries ? (
                    <p className="mt-1 text-xs text-red-400">
                      {timesheet.exception_open_entries} open shift(s) over 16h need review.
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleViewTimesheet(timesheet.id)}
                      className="rounded-md border border-borderSubtle bg-surface px-2.5 py-1 text-xs font-semibold text-textPrimary dark:bg-bgDark"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePrintTimesheet(timesheet.id)}
                      className="rounded-md border border-borderSubtle bg-surface px-2.5 py-1 text-xs font-semibold text-textPrimary dark:bg-bgDark"
                    >
                      Print
                    </button>
                    {isManagerLevel || timesheet.status !== "approved" ? (
                      <button
                        type="button"
                        onClick={() => beginEditTimesheet(timesheet)}
                        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                      >
                        Edit
                      </button>
                    ) : null}
                    {timesheet.status === "draft" ? (
                      <button
                        type="button"
                        disabled={actionBusyId === timesheet.id}
                        onClick={() =>
                          void updateTimesheetStatus(timesheet.id, "submitted")
                        }
                        className="rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-700 disabled:opacity-60 dark:text-blue-300"
                      >
                        Submit
                      </button>
                    ) : null}
                    {isManagerLevel && timesheet.status === "submitted" ? (
                      <>
                        <button
                          type="button"
                          disabled={
                            actionBusyId === timesheet.id ||
                            !!timesheet.needs_review
                          }
                          onClick={() =>
                            void updateTimesheetStatus(timesheet.id, "approved")
                          }
                          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-60 dark:text-emerald-300"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actionBusyId === timesheet.id}
                          onClick={() =>
                            void updateTimesheetStatus(timesheet.id, "rejected")
                          }
                          className="rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-60 dark:text-red-300"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </section>

          {filteredTimesheets.length === 0 && (
            <section className="rounded-lg border border-dashed border-borderSubtle bg-surface p-8 text-center text-sm text-textSecondary">
              No timesheets found.
            </section>
          )}
        </>
      )}

      {detailLoading ? (
        <LoadingPanel label="Loading timesheet detail..." />
      ) : null}

      {detail ? (
        <section className="glass-surface space-y-4 p-6 md:p-8 print:block">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-textPrimary">
                Timesheet Detail
              </h2>
              <p className="text-sm text-textSecondary">
                {detail.timesheet.employee_name} · {formatWeekRange(detail.timesheet.week_start, detail.timesheet.week_end)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDetail(null)}
              className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark print:hidden"
            >
              Close
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <DetailCell label="Status" value={getDisplayStatus(detail.timesheet)} />
            <DetailCell label="Total Hours" value={String(detail.timesheet.total_hours)} />
            <DetailCell
              label="Review"
              value={
                detail.timesheet.needs_review
                  ? "Needs review"
                  : "No review flags"
              }
            />
            <DetailCell
              label="Notes"
              value={detail.timesheet.notes || "-"}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-borderSubtle">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surfaceSoft text-xs uppercase tracking-wide text-textMuted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Clock In</th>
                  <th className="px-3 py-2 font-semibold">Clock Out</th>
                  <th className="px-3 py-2 font-semibold">Total</th>
                  <th className="px-3 py-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {detail.punches.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-4 text-center text-textSecondary"
                      colSpan={4}
                    >
                      No punches for this week.
                    </td>
                  </tr>
                ) : (
                  detail.punches.map((punch) => (
                    <tr key={punch.id}>
                      <td className="px-3 py-2 text-textPrimary">
                        {formatDateTime(punch.clock_in)}
                      </td>
                      <td className="px-3 py-2 text-textPrimary">
                        {punch.clock_out ? formatDateTime(punch.clock_out) : "Open"}
                      </td>
                      <td className="px-3 py-2 text-textPrimary">
                        {formatMinutes(punch.total_minutes)}
                      </td>
                      <td className="px-3 py-2 text-textSecondary">
                        {punch.notes || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {editingTimesheet ? (
        <section className="glass-surface space-y-4 p-6 md:p-8 print:hidden">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-textPrimary">Edit Timesheet</h2>
            <button
              type="button"
              onClick={() => setEditingTimesheet(null)}
              className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <HourInput label="Mon" value={editHours.monday_hours} onChange={(value) => setEditHours((prev) => ({ ...prev, monday_hours: value }))} />
            <HourInput label="Tue" value={editHours.tuesday_hours} onChange={(value) => setEditHours((prev) => ({ ...prev, tuesday_hours: value }))} />
            <HourInput label="Wed" value={editHours.wednesday_hours} onChange={(value) => setEditHours((prev) => ({ ...prev, wednesday_hours: value }))} />
            <HourInput label="Thu" value={editHours.thursday_hours} onChange={(value) => setEditHours((prev) => ({ ...prev, thursday_hours: value }))} />
            <HourInput label="Fri" value={editHours.friday_hours} onChange={(value) => setEditHours((prev) => ({ ...prev, friday_hours: value }))} />
            <HourInput label="Sat" value={editHours.saturday_hours} onChange={(value) => setEditHours((prev) => ({ ...prev, saturday_hours: value }))} />
            <HourInput label="Sun" value={editHours.sunday_hours} onChange={(value) => setEditHours((prev) => ({ ...prev, sunday_hours: value }))} />
          </div>
          <label className="block text-sm font-medium text-textPrimary">
            Notes
            <textarea
              value={editHours.notes}
              onChange={(event) =>
                setEditHours((prev) => ({ ...prev, notes: event.target.value }))
              }
              rows={3}
              className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
            />
          </label>
          <button
            type="button"
            onClick={() => void saveTimesheetEdits()}
            disabled={actionBusyId === editingTimesheet.id}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-accent/90 disabled:opacity-60"
          >
            {actionBusyId === editingTimesheet.id ? "Saving..." : "Save Timesheet"}
          </button>
        </section>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-surface/95 p-5 shadow-soft backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-textPrimary">{value}</p>
    </div>
  );
}

function MobileHourCell({ day, hours }: { day: string; hours: number | string }) {
  return (
    <div className="text-center">
      <p className="font-semibold text-textMuted">{day}</p>
      <p className="text-textPrimary">{hours || "0"}</p>
    </div>
  );
}

function DetailCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-surface/90 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-1 text-sm text-textPrimary">{value}</p>
    </div>
  );
}

function HourInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-textPrimary">
      {label}
      <input
        type="number"
        min={0}
        max={24}
        step="0.25"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
      />
    </label>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-surface/95 p-12 text-center text-sm text-textSecondary shadow-soft backdrop-blur-xl">
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
