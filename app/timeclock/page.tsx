"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "Employee" | "Manager" | "Admin" | "Leadership";
};

type EmployeeOption = {
  id: number;
  name: string;
  status: string;
};

const SUPERVISOR_ROLES = new Set(["Manager", "Admin", "Leadership"]);

interface TimeclockEntry {
  id: number;
  employee_id: number | null;
  employee_name: string;
  clock_in: string;
  clock_out: string | null;
  total_minutes: number | null;
  notes: string | null;
  created_at: string;
}

interface PunchMessage {
  type: "success" | "error";
  text: string;
}

export default function TimeclockPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [entries, setEntries] = useState<TimeclockEntry[]>([]);
  const [activeEntries, setActiveEntries] = useState<TimeclockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorActive, setErrorActive] = useState<string | null>(null);
  const [message, setMessage] = useState<PunchMessage | null>(null);
  const [elapsedTimes, setElapsedTimes] = useState<Record<number, string>>({});

  const isSupervisor = me ? SUPERVISOR_ROLES.has(me.role) : false;

  // Load session + employee directory.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, empRes] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
        ]);
        if (meRes.ok) {
          const data = (await meRes.json()) as { user: SessionUser | null };
          if (!cancelled && data.user) {
            setMe(data.user);
            setSelectedEmployeeId(data.user.id);
          }
        }
        if (empRes.ok) {
          const list = (await empRes.json()) as EmployeeOption[];
          if (!cancelled) {
            setEmployees(list.filter((e) => e.status === "active"));
          }
        }
      } catch {
        // swallow; UI shows error state separately
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch all entries (all time)
  useEffect(() => {
    let cancelled = false;

    const fetchEntries = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/timeclock", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch timeclock entries (${response.status})`,
          );
        }

        const data = (await response.json()) as TimeclockEntry[];
        if (!cancelled) {
          setEntries(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch entries",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch active entries (currently clocked in)
  useEffect(() => {
    let cancelled = false;

    const fetchActive = async () => {
      try {
        setLoadingActive(true);
        setErrorActive(null);

        const response = await fetch("/api/timeclock/active", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch active entries (${response.status})`,
          );
        }

        const data = (await response.json()) as TimeclockEntry[];
        if (!cancelled) {
          setActiveEntries(data);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorActive(
            err instanceof Error
              ? err.message
              : "Failed to fetch active entries",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingActive(false);
        }
      }
    };

    fetchActive();

    return () => {
      cancelled = true;
    };
  }, []);

  // Update elapsed times every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const times: Record<number, string> = {};
      activeEntries.forEach((entry) => {
        times[entry.id] = calculateElapsedTime(entry.clock_in);
      });
      setElapsedTimes(times);
    }, 60000);

    // Initial calculation
    const times: Record<number, string> = {};
    activeEntries.forEach((entry) => {
      times[entry.id] = calculateElapsedTime(entry.clock_in);
    });
    setElapsedTimes(times);

    return () => clearInterval(interval);
  }, [activeEntries]);

  // Auto-dismiss message after 3 seconds
  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const calculateElapsedTime = (clockInIso: string): string => {
    const clockInDate = new Date(clockInIso);
    const now = new Date();
    const diffMs = now.getTime() - clockInDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours === 0) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""} elapsed`;
    }

    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""} elapsed`;
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handlePunch = async (action: "in" | "out") => {
    if (!me) {
      setMessage({ type: "error", text: "You must be signed in to punch" });
      return;
    }
    const targetId = isSupervisor ? (selectedEmployeeId ?? me.id) : me.id;
    const targetEmployee = employees.find((e) => e.id === targetId);
    const targetName = targetEmployee?.name ?? me.name;

    try {
      const response = await fetch("/api/timeclock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id: targetId, action }),
      });

      const result = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      if (!response.ok) {
        setMessage({
          type: "error",
          text:
            (result?.error as string) ??
            `Failed to clock ${action === "in" ? "in" : "out"} ${targetName}`,
        });
        return;
      }

      const time = formatTime(
        (result.clock_in as string) ?? new Date().toISOString(),
      );
      setMessage({
        type: "success",
        text: `✓ ${targetName} clocked ${action === "in" ? "in" : "out"} at ${time}`,
      });

      await Promise.all([
        (async () => {
          const r = await fetch("/api/timeclock", { cache: "no-store" });
          if (r.ok) setEntries(await r.json());
        })(),
        (async () => {
          const r = await fetch("/api/timeclock/active", { cache: "no-store" });
          if (r.ok) setActiveEntries(await r.json());
        })(),
      ]);
    } catch {
      setMessage({ type: "error", text: "Network error" });
    }
  };

  // Filter entries to today only
  const todayEntries = entries.filter((entry) => {
    const entryDate = new Date(entry.clock_in).toDateString();
    const todayDate = new Date().toDateString();
    return entryDate === todayDate;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
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
          Log employee clock-ins and clock-outs in real time.
        </p>
      </FadeContent>

      {/* SECTION A: Punch Panel */}
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={100}
        className="glass-surface space-y-5 p-6 md:p-8"
      >
        <div>
          <h2 className="text-lg font-semibold text-textPrimary">
            Clock In / Clock Out
          </h2>
          <p className="mt-1 text-sm text-textSecondary">
            Select an employee and click Clock In to start their shift. Click
            Clock Out to end their shift.
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`rounded-lg p-3 text-sm font-medium ${
              message.type === "success"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="employee-select"
              className="block text-sm font-medium text-textPrimary"
            >
              Employee
            </label>
            {isSupervisor ? (
              <select
                id="employee-select"
                value={selectedEmployeeId ?? ""}
                onChange={(e) =>
                  setSelectedEmployeeId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft transition-colors focus:border-borderFocus focus:outline-none dark:bg-bgDark"
              >
                {me ? (
                  <option value={me.id}>{me.name} (you)</option>
                ) : (
                  <option value="">-- Choose an employee --</option>
                )}
                {employees
                  .filter((emp) => !me || emp.id !== me.id)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>
            ) : (
              <div
                id="employee-select"
                className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft dark:bg-bgDark"
              >
                {me?.name ?? "Sign in to punch"}
                <span className="ml-2 text-xs text-textMuted">{me?.role}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handlePunch("in")}
              className="px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium"
            >
              Clock In
            </button>
            <button
              onClick={() => handlePunch("out")}
              className="rounded-md border border-borderSubtle bg-surface px-4 py-2 font-medium text-textSecondary transition-colors hover:bg-bgDark hover:text-textPrimary"
            >
              Clock Out
            </button>
          </div>
        </div>
      </FadeContent>

      {/* SECTION B: Currently Clocked In */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-textPrimary">
          Currently Clocked In
        </h2>

        {errorActive ? <ErrorPanel message={errorActive} /> : null}

        {loadingActive ? (
          <LoadingPanel label="Loading active entries..." />
        ) : activeEntries.length === 0 ? (
          <div className="rounded-xl border border-borderSubtle bg-surface/95 p-8 text-center text-sm text-textMuted shadow-soft backdrop-blur-xl">
            No employees currently clocked in.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-borderSubtle bg-surface/95 p-5 shadow-soft backdrop-blur-xl"
              >
                <h3 className="text-lg font-semibold text-textPrimary">
                  {entry.employee_name}
                </h3>
                <div className="mt-3 space-y-1 text-sm text-textSecondary">
                  <p>
                    <span className="font-medium text-textMuted">
                      Clock In:
                    </span>{" "}
                    {formatTime(entry.clock_in)}
                  </p>
                  <p>
                    <span className="font-medium text-textMuted">Elapsed:</span>{" "}
                    {elapsedTimes[entry.id] || "calculating..."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION C: Today&apos;s Punch Log */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-textPrimary">
          Today&apos;s Punch Log
        </h2>

        {error ? <ErrorPanel message={error} /> : null}

        {loading ? (
          <LoadingPanel label="Loading punch log..." />
        ) : todayEntries.length === 0 ? (
          <div className="rounded-xl border border-borderSubtle bg-surface/95 p-8 text-center text-sm text-textMuted shadow-soft backdrop-blur-xl">
            No punch entries for today.
          </div>
        ) : (
          <>
            {/* Table view (hidden on mobile) */}
            <div className="hidden overflow-hidden rounded-xl border border-borderSubtle bg-surface/95 shadow-soft backdrop-blur-xl md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surfaceSoft text-xs uppercase tracking-wide text-textMuted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Employee</th>
                      <th className="px-4 py-3 font-semibold">Clock In</th>
                      <th className="px-4 py-3 font-semibold">Clock Out</th>
                      <th className="px-4 py-3 font-semibold text-right">
                        Total Minutes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderSubtle">
                    {todayEntries.map((entry, idx) => (
                      <tr
                        key={entry.id}
                        className={
                          idx % 2 === 0 ? "bg-surface" : "bg-transparent"
                        }
                      >
                        <td className="px-4 py-3 font-medium text-textPrimary">
                          <Link
                            href={`/employees?search=${encodeURIComponent(entry.employee_name)}`}
                            className="text-accent hover:underline"
                          >
                            {entry.employee_name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {formatTime(entry.clock_in)}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {entry.clock_out ? formatTime(entry.clock_out) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right text-textSecondary">
                          {entry.total_minutes ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card view (mobile only) */}
            <div className="grid gap-3 md:hidden">
              {todayEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-borderSubtle bg-surface/95 p-5 shadow-soft backdrop-blur-xl"
                >
                  <h3 className="text-lg font-semibold text-textPrimary">
                    {entry.employee_name}
                  </h3>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-textMuted">Clock In</dt>
                      <dd className="text-textPrimary">
                        {formatTime(entry.clock_in)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-textMuted">Clock Out</dt>
                      <dd className="text-textPrimary">
                        {entry.clock_out ? formatTime(entry.clock_out) : "—"}
                      </dd>
                    </div>
                    <div className="flex justify-between border-t border-borderSubtle pt-2">
                      <dt className="text-textMuted font-medium">
                        Total Minutes
                      </dt>
                      <dd className="text-textPrimary font-medium">
                        {entry.total_minutes ?? "—"}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
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
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-soft dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
