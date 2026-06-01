"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type SessionUser = {
  id: number;
  email: string | null;
  name: string;
  role: string | null;
  department: string | null;
  status: string | null;
};

type EmployeeOption = {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  department: string | null;
  status: string | null;
};

type TimeclockEntry = {
  id: number;
  entry_id?: number;
  employee_id: number | null;
  employee_name: string;
  name?: string;
  clock_in: string;
  clock_out: string | null;
  total_minutes: number | null;
  elapsed_minutes?: number | null;
  elapsed_label?: string;
  severity?: "normal" | "warning" | "exception";
  needs_review?: boolean;
  review_reason?: string | null;
  include_in_active_now?: boolean;
  notes: string | null;
  created_at: string;
  source?: "manual" | "self";
  is_manual?: boolean;
};

type TimeclockStatus = {
  user: SessionUser;
  canManageTimeclock: boolean;
  managerScope: "all" | "self";
  selectedEmployee: EmployeeOption;
  activeEntry: TimeclockEntry | null;
  recentEntries: TimeclockEntry[];
  activeEntries: TimeclockEntry[];
  employees: EmployeeOption[];
};

type PunchMessage = {
  type: "success" | "error";
  text: string;
};

function formatTime(isoString: string) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateTime(isoString: string) {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

const WARNING_ACTIVE_SHIFT_HOURS = 12;
const MAX_ACTIVE_SHIFT_HOURS = 16;
const EXCEPTION_ACTIVE_SHIFT_HOURS = 16;

function getElapsedMinutes(clockInIso: string) {
  const clockInTime = new Date(clockInIso).getTime();
  if (Number.isNaN(clockInTime)) return null;
  return Math.max(0, Math.floor((Date.now() - clockInTime) / 60000));
}

function classifyActiveShift(entry: TimeclockEntry) {
  if (entry.severity) return entry.severity;
  const elapsedMinutes =
    typeof entry.elapsed_minutes === "number"
      ? entry.elapsed_minutes
      : getElapsedMinutes(entry.clock_in);
  if (elapsedMinutes === null) return "exception" as const;
  if (elapsedMinutes >= EXCEPTION_ACTIVE_SHIFT_HOURS * 60) {
    return "exception" as const;
  }
  if (elapsedMinutes >= WARNING_ACTIVE_SHIFT_HOURS * 60) {
    return "warning" as const;
  }
  return "normal" as const;
}

function calculateElapsedTime(clockInIso: string) {
  const diffMinutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(clockInIso).getTime()) / 60000),
  );
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours === 0) return `${minutes}m elapsed`;
  return `${hours}h ${minutes}m elapsed`;
}

function todayForInput() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function toInputDateTime(isoString: string | null) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function TimeclockPage() {
  const [status, setStatus] = useState<TimeclockStatus | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<
    "in" | "out" | "manual" | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<PunchMessage | null>(null);
  const [manualClockIn, setManualClockIn] = useState(todayForInput);
  const [manualClockOut, setManualClockOut] = useState(todayForInput);
  const [manualNotes, setManualNotes] = useState("");
  const [recentStatusFilter, setRecentStatusFilter] = useState<
    "all" | "open" | "closed" | "manual" | "exception"
  >("all");
  const [recentDateFrom, setRecentDateFrom] = useState("");
  const [recentDateTo, setRecentDateTo] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<TimeclockEntry | null>(null);
  const [editingEntry, setEditingEntry] = useState<TimeclockEntry | null>(null);
  const [editClockIn, setEditClockIn] = useState("");
  const [editClockOut, setEditClockOut] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [nowTick, setNowTick] = useState(0);

  const loadStatus = useCallback(async (employeeId?: number | null) => {
    try {
      setLoading(true);
      setError(null);
      const params =
        employeeId !== undefined && employeeId !== null
          ? `?employee_id=${employeeId}`
          : "";
      const response = await fetch(`/api/timeclock/active${params}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | TimeclockStatus
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(
          (data && "error" in data && data.error) ||
            `Failed to load timeclock (${response.status})`,
        );
      }

      const nextStatus = data as TimeclockStatus;
      setStatus(nextStatus);
      setSelectedEmployeeId(nextStatus.selectedEmployee.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load timeclock",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const interval = setInterval(() => setNowTick((value) => value + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [message]);

  const activeEntry = status?.activeEntry ?? null;
  const selectedEmployee = status?.selectedEmployee ?? null;
  const canManageTimeclock = status?.canManageTimeclock ?? false;
  const activeSeverity = activeEntry ? classifyActiveShift(activeEntry) : null;
  const isExceptionActive =
    !!activeEntry && (activeEntry.needs_review || activeSeverity === "exception");

  const selectedEmployeeName = useMemo(() => {
    if (!status) return "Employee";
    return selectedEmployee?.name ?? status.user.name;
  }, [selectedEmployee, status]);

  const visibleActiveEntries = useMemo(() => {
    if (!status) return [] as TimeclockEntry[];
    if (canManageTimeclock) return status.activeEntries;
    return activeEntry ? [activeEntry] : [];
  }, [activeEntry, canManageTimeclock, status]);

  const normalAndWarningEntries = useMemo(
    () =>
      visibleActiveEntries.filter((entry) => {
        if (entry.include_in_active_now !== undefined) {
          return entry.include_in_active_now;
        }
        return classifyActiveShift(entry) !== "exception";
      }),
    [visibleActiveEntries],
  );

  const exceptionEntries = useMemo(
    () =>
      visibleActiveEntries.filter((entry) => classifyActiveShift(entry) === "exception"),
    [visibleActiveEntries],
  );

  const filteredRecentEntries = useMemo(() => {
    if (!status) return [] as TimeclockEntry[];

    return status.recentEntries.filter((entry) => {
      const isOpen = entry.clock_out === null;
      const isManual = !!entry.is_manual;
      const isException = classifyActiveShift(entry) === "exception";

      if (recentStatusFilter === "open" && !isOpen) return false;
      if (recentStatusFilter === "closed" && isOpen) return false;
      if (recentStatusFilter === "manual" && !isManual) return false;
      if (recentStatusFilter === "exception" && !isException) return false;

      if (recentDateFrom) {
        const minDate = new Date(`${recentDateFrom}T00:00:00`).getTime();
        if (new Date(entry.clock_in).getTime() < minDate) return false;
      }

      if (recentDateTo) {
        const maxDate = new Date(`${recentDateTo}T23:59:59`).getTime();
        if (new Date(entry.clock_in).getTime() > maxDate) return false;
      }

      return true;
    });
  }, [recentDateFrom, recentDateTo, recentStatusFilter, status]);

  const handleEmployeeChange = async (employeeId: number) => {
    setSelectedEmployeeId(employeeId);
    await loadStatus(employeeId);
  };

  const handlePunch = async (action: "in" | "out") => {
    if (!status || pendingAction) return;

    const targetId = canManageTimeclock
      ? selectedEmployeeId ?? status.user.id
      : status.user.id;

    try {
      setPendingAction(action);
      const response = await fetch("/api/timeclock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: targetId, action }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        activeEntry?: TimeclockEntry;
        clock_in?: string;
        clock_out?: string | null;
      };

      if (!response.ok) {
        const actionLabel = action === "out" ? "clock out" : "clock in";
        const conflictSync =
          response.status === 409 && result.activeEntry
            ? " Status has been synced."
            : "";
        setMessage({
          type: "error",
          text:
            (result.error || `Failed to ${actionLabel}`) +
            conflictSync,
        });
        await loadStatus(targetId);
        return;
      }

      const punchTime =
        action === "out"
          ? result.clock_out || new Date().toISOString()
          : result.clock_in || new Date().toISOString();
      setMessage({
        type: "success",
        text: `${selectedEmployeeName} ${action === "out" ? "clocked out" : "clocked in"} at ${formatTime(punchTime)}.`,
      });
      await loadStatus(targetId);
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setPendingAction(null);
    }
  };

  const handleManualCorrection = async () => {
    if (!status || !canManageTimeclock || pendingAction) return;
    const targetId = selectedEmployeeId ?? status.user.id;

    if (!manualNotes.trim()) {
      setMessage({
        type: "error",
        text: "Manual correction reason is required.",
      });
      return;
    }

    try {
      setPendingAction("manual");
      const response = await fetch("/api/timeclock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "manual",
          employee_id: targetId,
          clock_in: new Date(manualClockIn).toISOString(),
          clock_out: new Date(manualClockOut).toISOString(),
          notes: manualNotes,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.error || "Failed to save manual correction",
        });
        return;
      }

      setManualNotes("");
      setMessage({
        type: "success",
        text: `Manual correction saved for ${selectedEmployeeName}.`,
      });
      await loadStatus(targetId);
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setPendingAction(null);
    }
  };

  const openEntryDetails = (entry: TimeclockEntry) => {
    setSelectedEntry(entry);
  };

  const startEditEntry = (entry: TimeclockEntry) => {
    setEditingEntry(entry);
    setEditClockIn(toInputDateTime(entry.clock_in));
    setEditClockOut(toInputDateTime(entry.clock_out));
    setEditReason("");
    setEditNotes("");
  };

  const handleSaveEntryCorrection = async () => {
    if (!status || !editingEntry || pendingAction) return;
    if (!editReason.trim()) {
      setMessage({ type: "error", text: "Correction reason is required." });
      return;
    }

    try {
      setPendingAction("manual");
      const response = await fetch("/api/timeclock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_id: editingEntry.id,
          clock_in: editClockIn ? new Date(editClockIn).toISOString() : undefined,
          clock_out: editClockOut ? new Date(editClockOut).toISOString() : undefined,
          correction_reason: editReason,
          notes: editNotes || undefined,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setMessage({
          type: "error",
          text: result.error || "Failed to save punch correction",
        });
        return;
      }

      setMessage({ type: "success", text: "Punch correction saved." });
      setEditingEntry(null);
      await loadStatus(selectedEmployeeId ?? status.user.id);
    } catch {
      setMessage({ type: "error", text: "Network error" });
    } finally {
      setPendingAction(null);
    }
  };

  const handlePrintTimecard = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
          <ShinyText>Timeclock</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          Punch tracking for employee shifts, manager review, and payroll prep.
        </p>
      </FadeContent>

      {message ? (
        <div
          className={`rounded-lg border p-4 text-sm font-medium shadow-soft ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {error ? <ErrorPanel message={error} /> : null}

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={100}
        className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="glass-surface space-y-5 p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-textPrimary">
                {selectedEmployeeName}
              </h2>
              <p className="mt-1 text-sm text-textSecondary">
                {canManageTimeclock
                  ? "Manager and admin timeclock management"
                  : "Employee timeclock"}
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrintTimecard}
              className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm font-medium text-textPrimary shadow-soft transition-colors hover:bg-surfaceSoft dark:bg-bgDark"
            >
              Print Timecard
            </button>

            {canManageTimeclock ? (
              <div className="w-full sm:w-72">
                <label
                  htmlFor="employee-select"
                  className="block text-sm font-medium text-textPrimary"
                >
                  Employee
                </label>
                <select
                  id="employee-select"
                  value={selectedEmployeeId ?? ""}
                  disabled={loading || pendingAction !== null}
                  onChange={(event) =>
                    handleEmployeeChange(Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft transition-colors focus:border-borderFocus focus:outline-none disabled:opacity-60 dark:bg-bgDark"
                >
                  {status?.employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          {loading && !status ? (
            <LoadingPanel label="Loading timeclock..." />
          ) : (
            <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <div
                className={`rounded-xl border p-5 shadow-soft ${
                  activeEntry
                    ? isExceptionActive
                      ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-borderSubtle bg-surface/95 text-textPrimary"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                  Status
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {!activeEntry
                    ? "Clocked Out"
                    : isExceptionActive
                      ? "Needs Review"
                      : "Clocked In"}
                </p>
                <p className="mt-2 text-sm text-textSecondary">
                  {activeEntry
                    ? `Since ${formatTime(activeEntry.clock_in)}`
                    : "No active shift"}
                </p>
                {activeEntry ? (
                  <p className="mt-1 text-sm font-medium">
                    {isExceptionActive
                      ? "Missed clock-out likely. Manager review required."
                      : activeEntry.elapsed_label ||
                        calculateElapsedTime(activeEntry.clock_in)}
                    <span className="sr-only">{nowTick}</span>
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border border-borderSubtle bg-surface/95 p-5 shadow-soft">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-textPrimary">
                      Current Punch
                    </p>
                    <p className="mt-1 text-sm text-textSecondary">
                      {activeEntry
                        ? isExceptionActive
                          ? `${selectedEmployeeName} has an exception shift requiring review.`
                          : `${selectedEmployeeName} has an open shift.`
                        : `${selectedEmployeeName} is not currently clocked in.`}
                    </p>
                  </div>
                  {!activeEntry ? (
                    <button
                      onClick={() => void handlePunch("in")}
                      disabled={loading || pendingAction !== null || !status}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingAction === "in" ? "Saving..." : "Clock In"}
                    </button>
                  ) : isExceptionActive ? (
                    canManageTimeclock ? (
                      <button
                        onClick={() => void handlePunch("out")}
                        disabled={loading || pendingAction !== null || !status}
                        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingAction === "out"
                          ? "Saving..."
                          : "Resolve Open Punch"}
                      </button>
                    ) : (
                      <p className="text-sm font-medium text-amber-300">
                        Resolve in manager review.
                      </p>
                    )
                  ) : (
                    <button
                      onClick={() => void handlePunch("out")}
                      disabled={loading || pendingAction !== null || !status}
                      className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-600 dark:hover:bg-slate-500"
                    >
                      {pendingAction === "out" ? "Saving..." : "Clock Out"}
                    </button>
                  )}
                </div>
                {activeEntry && isExceptionActive ? (
                  <p className="mt-3 text-sm text-amber-300">
                    Likely missed clock-out. Shift duration exceeds {MAX_ACTIVE_SHIFT_HOURS} hours.
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="glass-surface space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">
              Active Now
            </h2>
            <p className="mt-1 text-sm text-textSecondary">
              {canManageTimeclock
                ? "Open shifts under exception threshold"
                : "Current shift visibility"}
            </p>
          </div>
          {!status || loading ? (
            <LoadingPanel label="Loading active shifts..." />
          ) : (
            <>
              {normalAndWarningEntries.length === 0 ? (
                <EmptyPanel label="No normal active shifts." />
              ) : (
                <div className="space-y-3">
                  {normalAndWarningEntries.map((entry) => (
                    <MiniActiveEntry key={entry.id} entry={entry} />
                  ))}
                </div>
              )}

              <div className="pt-3">
                <h3 className="text-base font-semibold text-textPrimary">
                  Needs Review
                </h3>
                <p className="mt-1 text-sm text-textSecondary">
                  Likely missed clock-outs ({EXCEPTION_ACTIVE_SHIFT_HOURS}h+)
                </p>
              </div>

              {exceptionEntries.length === 0 ? (
                <EmptyPanel label="No exception shifts requiring review." />
              ) : (
                <div className="space-y-3">
                  {exceptionEntries.map((entry) => (
                    <MiniActiveEntry key={`exception-${entry.id}`} entry={entry} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </FadeContent>

      {canManageTimeclock ? (
        <section className="glass-surface space-y-5 p-6 md:p-8">
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">
              Manual Correction
            </h2>
            <p className="mt-1 text-sm text-textSecondary">
              Admin-created corrections are marked on the punch and written to
              the audit log. Use Resolve Open Punch for missed clock-out
              exceptions.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_minmax(180px,1fr)_auto] md:items-end">
            <label className="block text-sm font-medium text-textPrimary">
              Clock In
              <input
                type="datetime-local"
                value={manualClockIn}
                onChange={(event) => setManualClockIn(event.target.value)}
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft focus:border-borderFocus focus:outline-none dark:bg-bgDark"
              />
            </label>
            <label className="block text-sm font-medium text-textPrimary">
              Clock Out
              <input
                type="datetime-local"
                value={manualClockOut}
                onChange={(event) => setManualClockOut(event.target.value)}
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft focus:border-borderFocus focus:outline-none dark:bg-bgDark"
              />
            </label>
            <label className="block text-sm font-medium text-textPrimary">
              Correction Reason
              <input
                type="text"
                value={manualNotes}
                onChange={(event) => setManualNotes(event.target.value)}
                placeholder="Required"
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft focus:border-borderFocus focus:outline-none dark:bg-bgDark"
              />
            </label>
            <button
              onClick={handleManualCorrection}
              disabled={
                loading ||
                pendingAction !== null ||
                !status ||
                !manualNotes.trim()
              }
              className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "manual" ? "Saving..." : "Save Correction"}
            </button>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">
              Recent Punches
            </h2>
            <p className="text-sm text-textSecondary">
              {canManageTimeclock
                ? `Showing ${selectedEmployeeName}`
                : "Showing your punches only"}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={recentStatusFilter}
              onChange={(event) =>
                setRecentStatusFilter(
                  event.target.value as
                    | "all"
                    | "open"
                    | "closed"
                    | "manual"
                    | "exception",
                )
              }
              className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft dark:bg-bgDark"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="manual">Manual</option>
              <option value="exception">Exception</option>
            </select>
            <input
              type="date"
              value={recentDateFrom}
              onChange={(event) => setRecentDateFrom(event.target.value)}
              className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft dark:bg-bgDark"
            />
            <input
              type="date"
              value={recentDateTo}
              onChange={(event) => setRecentDateTo(event.target.value)}
              className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft dark:bg-bgDark"
            />
          </div>
        </div>

        {!status || loading ? (
          <LoadingPanel label="Loading punch history..." />
        ) : filteredRecentEntries.length === 0 ? (
          <EmptyPanel label="No punch history found." />
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-xl border border-borderSubtle bg-surface/95 shadow-soft backdrop-blur-xl md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surfaceSoft text-xs uppercase tracking-wide text-textMuted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Employee</th>
                      <th className="px-4 py-3 font-semibold">Clock In</th>
                      <th className="px-4 py-3 font-semibold">Clock Out</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Total
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderSubtle">
                    {filteredRecentEntries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={
                          idx % 2 === 0 ? "bg-surface" : "bg-transparent"
                        }
                      >
                        <td className="px-4 py-3 font-medium text-textPrimary">
                          {entry.employee_name}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {formatDateTime(entry.clock_in)}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {entry.clock_out
                            ? formatDateTime(entry.clock_out)
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          <SourceBadge entry={entry} />
                        </td>
                        <td className="px-4 py-3 text-right text-textSecondary">
                          {formatDuration(entry.total_minutes)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEntryDetails(entry)}
                              className="rounded-md border border-borderSubtle bg-surface px-2.5 py-1 text-xs font-semibold text-textPrimary"
                            >
                              View
                            </button>
                            {canManageTimeclock ? (
                              <button
                                type="button"
                                onClick={() => startEditEntry(entry)}
                                className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                              >
                                Edit
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {filteredRecentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-borderSubtle bg-surface/95 p-5 shadow-soft backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-textPrimary">
                      {entry.employee_name}
                    </h3>
                    <SourceBadge entry={entry} />
                  </div>
                  <dl className="mt-3 space-y-2 text-sm">
                    <Row label="Clock In" value={formatDateTime(entry.clock_in)} />
                    <Row
                      label="Clock Out"
                      value={
                        entry.clock_out ? formatDateTime(entry.clock_out) : "-"
                      }
                    />
                    <Row label="Total" value={formatDuration(entry.total_minutes)} />
                  </dl>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEntryDetails(entry)}
                      className="rounded-md border border-borderSubtle bg-surface px-2.5 py-1 text-xs font-semibold text-textPrimary"
                    >
                      View
                    </button>
                    {canManageTimeclock ? (
                      <button
                        type="button"
                        onClick={() => startEditEntry(entry)}
                        className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {selectedEntry ? (
        <section className="glass-surface space-y-4 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-textPrimary">Punch Detail</h2>
            <button
              type="button"
              onClick={() => setSelectedEntry(null)}
              className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
            >
              Close
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Row label="Employee" value={selectedEntry.employee_name} />
            <Row label="Clock In" value={formatDateTime(selectedEntry.clock_in)} />
            <Row
              label="Clock Out"
              value={
                selectedEntry.clock_out ? formatDateTime(selectedEntry.clock_out) : "Open"
              }
            />
            <Row label="Total" value={formatDuration(selectedEntry.total_minutes)} />
            <Row
              label="Review"
              value={selectedEntry.review_reason || "No review flags"}
            />
            <Row label="Notes" value={selectedEntry.notes || "-"} />
          </div>
        </section>
      ) : null}

      {editingEntry ? (
        <section className="glass-surface space-y-4 p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-textPrimary">Edit Punch</h2>
            <button
              type="button"
              onClick={() => setEditingEntry(null)}
              className="rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary dark:bg-bgDark"
            >
              Cancel
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-medium text-textPrimary">
              Clock In
              <input
                type="datetime-local"
                value={editClockIn}
                onChange={(event) => setEditClockIn(event.target.value)}
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft dark:bg-bgDark"
              />
            </label>
            <label className="block text-sm font-medium text-textPrimary">
              Clock Out
              <input
                type="datetime-local"
                value={editClockOut}
                onChange={(event) => setEditClockOut(event.target.value)}
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft dark:bg-bgDark"
              />
            </label>
            <label className="block text-sm font-medium text-textPrimary md:col-span-2">
              Manager Note
              <input
                type="text"
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft dark:bg-bgDark"
              />
            </label>
            <label className="block text-sm font-medium text-textPrimary md:col-span-2">
              Correction Reason
              <input
                type="text"
                value={editReason}
                onChange={(event) => setEditReason(event.target.value)}
                placeholder="Required"
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft dark:bg-bgDark"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleSaveEntryCorrection}
            disabled={pendingAction !== null || !editReason.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-accent/90 disabled:opacity-60"
          >
            {pendingAction === "manual" ? "Saving..." : "Save Punch Edit"}
          </button>
        </section>
      ) : null}
    </div>
  );
}

function MiniActiveEntry({ entry }: { entry: TimeclockEntry }) {
  const severity = classifyActiveShift(entry);
  const elapsedLabel = entry.elapsed_label || calculateElapsedTime(entry.clock_in);

  const badgeClass =
    severity === "exception"
      ? "bg-red-500/20 text-red-200"
      : severity === "warning"
        ? "bg-amber-500/20 text-amber-200"
        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";

  return (
    <div className="rounded-xl border border-borderSubtle bg-surface/95 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-textPrimary">{entry.employee_name}</p>
          <p className="mt-1 text-sm text-textSecondary">
            Since {formatTime(entry.clock_in)}
          </p>
          {severity === "warning" ? (
            <p className="mt-1 text-xs text-amber-300">Approaching max shift</p>
          ) : null}
          {severity === "exception" ? (
            <p className="mt-1 text-xs text-red-300">
              Likely missed clock-out
              {entry.review_reason ? `: ${entry.review_reason}` : ""}
            </p>
          ) : null}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass}`}>
          {elapsedLabel}
        </span>
      </div>
    </div>
  );
}

function SourceBadge({ entry }: { entry: TimeclockEntry }) {
  return entry.is_manual ? (
    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
      Manual
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-surfaceSoft px-2.5 py-1 text-xs font-semibold text-textMuted">
      Self
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-textMuted">{label}</dt>
      <dd className="text-right text-textPrimary">{value}</dd>
    </div>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-surface/95 p-8 text-center text-sm text-textSecondary shadow-soft backdrop-blur-xl">
      {label}
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-surface/95 p-8 text-center text-sm text-textMuted shadow-soft backdrop-blur-xl">
      {label}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-soft dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
