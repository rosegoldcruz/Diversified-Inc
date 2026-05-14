"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Envelope, Phone, Users } from "phosphor-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type Employee = {
  id: number;
  name: string;
  role: string | null;
  department: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
};

type SessionUser = {
  role: "Employee" | "Manager" | "Admin" | "Leadership";
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Employee");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadEmployees() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/employees", { cache: "no-store" });
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load employees (${response.status})`);
        }

        const data = (await response.json()) as Employee[];
        if (!cancelled) {
          setEmployees(data);
          if (meResponse.ok) {
            const meData = (await meResponse.json()) as {
              user: SessionUser | null;
            };
            setMe(meData.user);
          }
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

  const canCreate = me?.role === "Admin" || me?.role === "Leadership";

  async function createEmployee() {
    try {
      setCreateBusy(true);
      setCreateError(null);
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          department,
          email,
          phone,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | Employee
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          (payload as { error?: string } | null)?.error ||
            `Failed to create employee (${response.status})`,
        );
      }
      setEmployees((prev) => [payload as Employee, ...prev]);
      setCreateOpen(false);
      setName("");
      setRole("Employee");
      setDepartment("");
      setEmail("");
      setPhone("");
    } catch (createErr) {
      setCreateError(
        createErr instanceof Error ? createErr.message : "Create failed",
      );
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="flex flex-col gap-6 border-b border-white/30 pb-6 dark:border-white/10 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-textMuted">
            Operations directory
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
            <ShinyText>Employees</ShinyText>
          </h1>
          <p className="max-w-3xl text-base text-textSecondary">
            Live employee records from PostgreSQL, including role, department,
            and contact details.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:flex">
          <Metric label="Total employees" value={employees.length} />
          <Metric
            label="Active"
            value={
              employees.filter(
                (employee) => employee.status?.toLowerCase() !== "inactive",
              ).length
            }
          />
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/30 bg-white/55 px-4 text-sm font-semibold text-textPrimary shadow-glass backdrop-blur-2xl transition hover:bg-white/80 dark:border-white/10 dark:bg-white/5"
            >
              + Add Employee
            </button>
          ) : null}
        </div>
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading employees..." />
      ) : (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={100}
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {employees.map((employee) => (
            <Link
              key={employee.id}
              href={`/employees/${employee.id}`}
              className="glass-surface glass-surface-hover group p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50/90 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                    {getInitials(employee.name)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold text-textPrimary">
                      {employee.name}
                    </h2>
                    <p className="mt-0.5 truncate text-sm text-textSecondary">
                      {employee.role || "Role not set"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={employee.status} />
              </div>
              <dl className="mt-5 space-y-3 border-t border-white/30 pt-4 text-sm dark:border-white/10">
                <InfoRow
                  label="Department"
                  value={employee.department || "Unassigned"}
                />
                <InfoRow
                  icon={<Envelope className="h-3.5 w-3.5" weight="regular" />}
                  label="Email"
                  value={employee.email || "No email"}
                />
                <InfoRow
                  icon={<Phone className="h-3.5 w-3.5" weight="regular" />}
                  label="Phone"
                  value={employee.phone || "No phone"}
                />
              </dl>
            </Link>
          ))}
        </FadeContent>
      )}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgDark/55 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-borderSubtle bg-surface p-5 shadow-cyberMd">
            <h2 className="text-lg font-semibold text-textPrimary">
              Add Employee
            </h2>
            <div className="mt-4 grid gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              >
                <option>Employee</option>
                <option>Manager</option>
                <option>Admin</option>
                {me?.role === "Leadership" ? <option>Leadership</option> : null}
              </select>
            </div>
            {createError ? (
              <p className="mt-3 text-sm text-red-500">{createError}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-borderSubtle px-4 py-2 text-sm font-semibold text-textPrimary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createEmployee()}
                disabled={createBusy}
                className="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {createBusy ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Card padding="sm" className="min-w-40">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50/90 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          <Users className="h-4 w-4" weight="duotone" />
        </div>
        <div>
          <p className="text-xs font-medium text-textMuted">{label}</p>
          <p className="text-lg font-semibold text-textPrimary">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="flex items-center gap-1.5 text-textMuted">
        {icon}
        <span>{label}</span>
      </dt>
      <dd className="min-w-0 truncate text-right font-medium text-textPrimary">
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const normalized =
    status?.toLowerCase() === "inactive" ? "inactive" : "active";
  return (
    <Badge variant={normalized === "active" ? "success" : "neutral"}>
      {normalized}
    </Badge>
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
    <div className="rounded-xl border border-red-200 bg-red-50/90 p-5 text-sm text-red-700 shadow-soft dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
