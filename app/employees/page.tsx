"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Employee = {
  id: number;
  name: string;
  role: string | null;
  department: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/employees", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load employees (${response.status})`);
        }

        const data = (await response.json()) as Employee[];
        if (!cancelled) {
          setEmployees(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load employees",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
          Employees
        </h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          Live employee records from PostgreSQL, including role, department, and
          contact details.
        </p>
      </header>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading employees..." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <Link
              key={employee.id}
              href={`/employees/${employee.id}`}
              className="rounded-xl border border-borderSubtle bg-surface p-5 shadow-soft transition hover:bg-bgDark"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-textPrimary">
                    {employee.name}
                  </h2>
                  <p className="text-sm text-textSecondary">
                    {employee.role || "Role not set"}
                  </p>
                </div>
                <StatusBadge status={employee.status} />
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <InfoRow
                  label="Department"
                  value={employee.department || "Unassigned"}
                />
                <InfoRow label="Email" value={employee.email || "No email"} />
                <InfoRow label="Phone" value={employee.phone || "No phone"} />
              </dl>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-borderSubtle pt-3 first:border-t-0 first:pt-0">
      <dt className="text-textMuted">{label}</dt>
      <dd className="text-right text-textPrimary">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const normalized =
    status?.toLowerCase() === "inactive" ? "inactive" : "active";
  const styles =
    normalized === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}
    >
      {normalized}
    </span>
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
