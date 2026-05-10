"use client";

import { useEffect, useState } from "react";

const EMPLOYEES = [
  "Terry Strasser",
  "Jordan Strasser",
  "Cathy Kraft",
  "Jill Strasser",
  "Marcus Johnson",
  "Sarah Chen",
  "David Rodriguez",
  "Lisa Thompson",
  "James Wilson",
  "Emma Davis",
];

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
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [entries, setEntries] = useState<TimeclockEntry[]>([]);
  const [activeEntries, setActiveEntries] = useState<TimeclockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActive, setLoadingActive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorActive, setErrorActive] = useState<string | null>(null);
  const [message, setMessage] = useState<PunchMessage | null>(null);
  const [elapsedTimes, setElapsedTimes] = useState<Record<number, string>>({});

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
    if (!selectedEmployee) {
      setMessage({ type: "error", text: "Please select an employee" });
      return;
    }

    try {
      const response = await fetch("/api/timeclock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_name: selectedEmployee,
          action,
        }),
      });

      if (!response.ok) {
        setMessage({
          type: "error",
          text: `Failed to clock ${action === "in" ? "in" : "out"} ${selectedEmployee}`,
        });
        return;
      }

      const result = await response.json();
      const time = formatTime(result.clock_in);

      setMessage({
        type: "success",
        text: `✓ ${selectedEmployee} clocked ${action === "in" ? "in" : "out"} at ${time}`,
      });

      // Refresh both sections
      await Promise.all([
        (async () => {
          const response = await fetch("/api/timeclock", { cache: "no-store" });
          if (response.ok) {
            setEntries(await response.json());
          }
        })(),
        (async () => {
          const response = await fetch("/api/timeclock/active", {
            cache: "no-store",
          });
          if (response.ok) {
            setActiveEntries(await response.json());
          }
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
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
          Timeclock
        </h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          Log employee clock-ins and clock-outs in real time.
        </p>
      </header>

      {/* SECTION A: Punch Panel */}
      <section className="space-y-4 rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
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
              Select Employee
            </label>
            <select
              id="employee-select"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="mt-2 w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary shadow-soft transition-colors focus:border-borderFocus focus:outline-none dark:bg-bgDark"
            >
              <option value="">-- Choose an employee --</option>
              {EMPLOYEES.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
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
      </section>

      {/* SECTION B: Currently Clocked In */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-textPrimary">
          Currently Clocked In
        </h2>

        {errorActive ? <ErrorPanel message={errorActive} /> : null}

        {loadingActive ? (
          <LoadingPanel label="Loading active entries..." />
        ) : activeEntries.length === 0 ? (
          <div className="rounded-xl border border-borderSubtle bg-surface p-6 text-center text-sm text-textMuted shadow-soft">
            No employees currently clocked in.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft"
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
          <div className="rounded-xl border border-borderSubtle bg-surface p-6 text-center text-sm text-textMuted shadow-soft">
            No punch entries for today.
          </div>
        ) : (
          <>
            {/* Table view (hidden on mobile) */}
            <div className="hidden overflow-hidden rounded-xl border border-borderSubtle bg-surface shadow-soft md:block">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-navy text-xs uppercase tracking-wide text-white">
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
                          {entry.employee_name}
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
                  className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft"
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
    <div className="rounded-xl border border-borderSubtle bg-surface p-10 text-center text-sm text-textSecondary shadow-soft">
      {label}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
      {message}
    </div>
  );
}
