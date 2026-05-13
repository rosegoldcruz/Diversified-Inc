"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Warning,
  Robot,
  Database,
  ArrowSquareOut,
  GearSix,
  Users,
  Lightning,
  Plus,
  Trash,
  PencilSimple,
  X,
} from "phosphor-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type Role = "Leadership" | "Admin" | "Manager" | "Employee";
const ROLE_OPTIONS: Role[] = ["Leadership", "Admin", "Manager", "Employee"];

type Employee = {
  id: number;
  name: string;
  role: Role | null;
  department: string | null;
  status: "active" | "inactive" | string | null;
  email: string | null;
  phone: string | null;
  hire_date: string | null;
  last_login_at: string | null;
};

type Me = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

export default function AdminPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const canManage = me?.role === "Admin" || me?.role === "Leadership";
  const canDelete = me?.role === "Leadership";

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, employeesRes] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
      ]);
      if (meRes.ok) {
        const meBody = (await meRes.json()) as { user: Me | null };
        setMe(meBody.user);
      }
      if (!employeesRes.ok) {
        const body = (await employeesRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          body?.error || `Failed to load employees (${employeesRes.status})`,
        );
      }
      const rows = (await employeesRes.json()) as Employee[];
      setEmployees(rows);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load admin data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRoleChange(employee: Employee, role: Role) {
    if (!canManage) return;
    setSavingId(employee.id);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `Update failed (${res.status})`);
      }
      const updated = (await res.json()) as Employee;
      setEmployees((current) =>
        current.map((e) => (e.id === updated.id ? updated : e)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleStatus(employee: Employee) {
    if (!canManage) return;
    const next = employee.status === "active" ? "inactive" : "active";
    setSavingId(employee.id);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `Update failed (${res.status})`);
      }
      const updated = (await res.json()) as Employee;
      setEmployees((current) =>
        current.map((e) => (e.id === updated.id ? updated : e)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeactivate(employee: Employee) {
    if (!canDelete) return;
    const confirmed = window.confirm(
      `Deactivate ${employee.name}? They will lose access until reactivated.`,
    );
    if (!confirmed) return;
    setSavingId(employee.id);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `Delete failed (${res.status})`);
      }
      const updated = (await res.json()) as Employee;
      setEmployees((current) =>
        current.map((e) => (e.id === updated.id ? updated : e)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deactivate");
    } finally {
      setSavingId(null);
    }
  }

  const counts = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter((e) => e.status === "active").length,
      inactive: employees.filter((e) => e.status && e.status !== "active")
        .length,
    };
  }, [employees]);

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
          <ShinyText>Admin Settings</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          System configuration, user management, and platform preferences.
        </p>
      </FadeContent>

      {error ? (
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
      ) : null}

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <SectionTitle icon={Users} title="Team & Roles" />
            <span className="text-xs text-textMuted">
              {counts.total} total · {counts.active} active · {counts.inactive}{" "}
              inactive
            </span>
          </div>
          <button
            type="button"
            onClick={() => setCreatorOpen(true)}
            disabled={!canManage}
            title={
              canManage
                ? "Add a new employee"
                : "Requires Admin or Leadership role"
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" weight="bold" />
            Add Employee
          </button>
        </div>

        {loading ? (
          <p className="py-6 text-center text-sm text-textSecondary">
            Loading employees…
          </p>
        ) : employees.length === 0 ? (
          <p className="py-6 text-center text-sm text-textMuted">
            No employees yet. Add the first one to get started.
          </p>
        ) : (
          <div className="divide-y divide-borderSubtle">
            {employees.map((employee) => {
              const role = (employee.role as Role) || "Employee";
              const inactive = employee.status && employee.status !== "active";
              return (
                <div
                  key={employee.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="flex items-center gap-2 font-medium text-textPrimary">
                      {employee.name}
                      {inactive ? (
                        <span className="rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-300">
                          Inactive
                        </span>
                      ) : null}
                    </p>
                    <p className="text-sm text-textMuted">
                      {employee.email || "no email"}
                      {employee.department ? ` · ${employee.department}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={role}
                      disabled={!canManage || savingId === employee.id}
                      onChange={(event) =>
                        handleRoleChange(employee, event.target.value as Role)
                      }
                      className="h-10 rounded-md border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {ROLE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setEditing(employee)}
                      disabled={!canManage}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-borderSubtle text-textSecondary transition-colors hover:bg-bgDark hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-50"
                      title="Edit employee"
                      aria-label={`Edit ${employee.name}`}
                    >
                      <PencilSimple className="h-4 w-4" weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(employee)}
                      disabled={!canManage || savingId === employee.id}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-borderSubtle px-3 text-xs font-semibold text-textSecondary transition-colors hover:bg-bgDark hover:text-textPrimary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {inactive ? "Reactivate" : "Disable"}
                    </button>
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(employee)}
                        disabled={savingId === employee.id}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-red-500/30 text-red-600 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-300"
                        title="Deactivate (Leadership only)"
                        aria-label={`Deactivate ${employee.name}`}
                      >
                        <Trash className="h-4 w-4" weight="bold" />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <SectionTitle icon={Lightning} title="Integrations" />
        <div className="space-y-3">
          <IntegrationRow
            icon={Lightning}
            name="n8n Automation Platform"
            badge="Connected"
            href="https://auto.snrglabs.com"
          />
          <IntegrationRow
            icon={Database}
            name="NocoDB Database Admin"
            badge="Connected"
            href="https://data.snrglabs.com"
          />
          <IntegrationRow icon={Robot} name="AEON AI Chat" badge="Active" />
        </div>
      </section>

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <SectionTitle icon={GearSix} title="Account" />
        <p className="text-sm text-textSecondary">
          Signed in as{" "}
          <span className="font-semibold text-textPrimary">
            {me?.name ?? "—"}
          </span>{" "}
          ({me?.email ?? "—"}) · Role:{" "}
          <span className="font-semibold text-textPrimary">
            {me?.role ?? "—"}
          </span>
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md border border-borderSubtle bg-bgDark px-4 text-sm font-semibold text-textPrimary transition-colors hover:bg-surface"
          >
            Sign out
          </button>
        </form>
      </section>

      <section className="space-y-5 rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
        <SectionTitle
          icon={Warning}
          title="Danger Zone"
          iconClassName="text-red-500"
        />
        <p className="text-sm text-textSecondary">
          Destructive actions are restricted to Leadership and require explicit
          confirmation.
        </p>
      </section>

      {creatorOpen ? (
        <EmployeeModal
          title="Add Employee"
          onClose={() => setCreatorOpen(false)}
          onSubmit={async (form) => {
            const res = await fetch("/api/employees", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            if (!res.ok) {
              const body = (await res.json().catch(() => null)) as {
                error?: string;
              } | null;
              throw new Error(body?.error || `Create failed (${res.status})`);
            }
            const created = (await res.json()) as Employee;
            setEmployees((current) =>
              [...current, created].sort((a, b) =>
                a.name.localeCompare(b.name),
              ),
            );
            setCreatorOpen(false);
          }}
        />
      ) : null}

      {editing ? (
        <EmployeeModal
          title={`Edit ${editing.name}`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (form) => {
            const res = await fetch(`/api/employees/${editing.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(form),
            });
            if (!res.ok) {
              const body = (await res.json().catch(() => null)) as {
                error?: string;
              } | null;
              throw new Error(body?.error || `Update failed (${res.status})`);
            }
            const updated = (await res.json()) as Employee;
            setEmployees((current) =>
              current.map((e) => (e.id === updated.id ? updated : e)),
            );
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

type EmployeeFormPayload = {
  name?: string;
  email?: string;
  role?: Role;
  department?: string;
  phone?: string;
  password?: string;
  status?: "active" | "inactive";
};

function EmployeeModal({
  title,
  initial,
  onClose,
  onSubmit,
}: {
  title: string;
  initial?: Employee;
  onClose: () => void;
  onSubmit: (payload: EmployeeFormPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<EmployeeFormPayload>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    role: (initial?.role as Role) || "Employee",
    department: initial?.department ?? "",
    phone: initial?.phone ?? "",
    password: "",
    status: initial?.status === "inactive" ? "inactive" : "active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload: EmployeeFormPayload = { ...form };
      if (!payload.password) delete payload.password;
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 rounded-2xl border border-borderSubtle bg-surface p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-borderSubtle p-1.5 text-textSecondary hover:bg-bgDark"
            aria-label="Close"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>

        <Field label="Name">
          <input
            required
            value={form.name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="h-11 w-full rounded-lg border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary"
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            required
            value={form.email ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="h-11 w-full rounded-lg border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as Role }))
              }
              className="h-11 w-full rounded-lg border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as "active" | "inactive",
                }))
              }
              className="h-11 w-full rounded-lg border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
        <Field label="Department">
          <input
            value={form.department ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, department: e.target.value }))
            }
            className="h-11 w-full rounded-lg border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary"
          />
        </Field>
        <Field label="Phone">
          <input
            value={form.phone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="h-11 w-full rounded-lg border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary"
          />
        </Field>
        <Field
          label={
            initial ? "New password (leave blank to keep)" : "Initial password"
          }
        >
          <input
            type="password"
            minLength={initial ? 0 : 8}
            placeholder={initial ? "••••••" : "Min 8 characters"}
            value={form.password ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            className="h-11 w-full rounded-lg border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary"
          />
        </Field>

        {error ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-borderSubtle px-4 text-sm font-semibold text-textSecondary hover:bg-bgDark"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-semibold text-white hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      {children}
    </label>
  );
}

function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-soft dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md p-1 hover:bg-red-500/10"
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" weight="bold" />
      </button>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  iconClassName = "text-accent",
}: {
  icon: typeof Users;
  title: string;
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-lg bg-bgDark p-2">
        <Icon className={`h-5 w-5 ${iconClassName}`} weight="duotone" />
      </div>
      <h2 className="text-base font-semibold text-textPrimary">{title}</h2>
    </div>
  );
}

function IntegrationRow({
  icon: Icon,
  name,
  badge,
  href,
}: {
  icon: typeof Users;
  name: string;
  badge: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-borderSubtle bg-bgDark px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-accent" weight="duotone" />
        <p className="font-medium text-textPrimary">{name}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {badge}
        </span>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent hover:underline"
          >
            Open <ArrowSquareOut className="h-3.5 w-3.5" weight="bold" />
          </a>
        ) : null}
      </div>
    </div>
  );
}
