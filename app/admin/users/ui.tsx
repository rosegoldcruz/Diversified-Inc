"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/app/admin/_components/admin-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ROLES, type Role } from "@/lib/auth-shared";

type Employee = {
  id: number;
  name: string;
  role: string | null;
  department: string | null;
  status: string | null;
  email: string | null;
  phone: string | null;
};

type EmployeeFormState = {
  name: string;
  email: string;
  role: Role;
  department: string;
  phone: string;
  status: "active" | "inactive";
};

const STATUS_OPTIONS = ["active", "inactive"] as const;

const INITIAL_FORM: EmployeeFormState = {
  name: "",
  email: "",
  role: "Employee",
  department: "",
  phone: "",
  status: "active",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateForm(form: EmployeeFormState): string | null {
  if (!form.name.trim()) return "Name is required.";
  if (!form.email.trim()) return "Email is required.";
  if (!isValidEmail(form.email.trim())) return "Email must be valid.";
  if (!ROLES.includes(form.role)) return "Role is invalid.";
  if (!STATUS_OPTIONS.includes(form.status)) return "Status is invalid.";
  return null;
}

async function readApiError(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: unknown };
    if (payload && typeof payload.error === "string") return payload.error;
  } catch {
    // Ignore JSON parse errors and fall back to static message.
  }
  return fallback;
}

export function AdminUsersClient() {
  const { pushToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<EmployeeFormState>(INITIAL_FORM);
  const [createSaving, setCreateSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EmployeeFormState>(INITIAL_FORM);
  const [editSavingId, setEditSavingId] = useState<number | null>(null);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch("/api/employees", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to load users."));
      }
      const rows = (await response.json()) as Employee[];
      setEmployees(rows);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load users.";
      setLoadError(message);
      pushToast(
        message,
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  function openCreateForm() {
    setCreateForm(INITIAL_FORM);
    setShowCreate(true);
  }

  function startEdit(employee: Employee) {
    setEditingId(employee.id);
    setEditForm({
      name: employee.name,
      email: employee.email ?? "",
      role: ROLES.includes((employee.role ?? "Employee") as Role)
        ? ((employee.role ?? "Employee") as Role)
        : "Employee",
      department: employee.department ?? "",
      phone: employee.phone ?? "",
      status: employee.status === "inactive" ? "inactive" : "active",
    });
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formError = validateForm(createForm);
    if (formError) {
      pushToast(formError, "error");
      return;
    }

    setCreateSaving(true);
    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          role: createForm.role,
          department: createForm.department.trim(),
          phone: createForm.phone.trim(),
          status: createForm.status,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to create user."));
      }

      pushToast("User added.", "success");
      setShowCreate(false);
      setCreateForm(INITIAL_FORM);
      await loadEmployees();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to create user.",
        "error",
      );
    } finally {
      setCreateSaving(false);
    }
  }

  async function handleEditSave(employeeId: number) {
    const formError = validateForm(editForm);
    if (formError) {
      pushToast(formError, "error");
      return;
    }

    setEditSavingId(employeeId);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
          department: editForm.department.trim(),
          phone: editForm.phone.trim(),
          status: editForm.status,
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to update user."));
      }

      pushToast("User updated.", "success");
      setEditingId(null);
      await loadEmployees();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to update user.",
        "error",
      );
    } finally {
      setEditSavingId(null);
    }
  }

  async function handleDeactivate(employee: Employee) {
    const confirmed = window.confirm(
      "Deactivate this user? Their historical records will remain.",
    );
    if (!confirmed) return;

    setDeactivateId(employee.id);
    try {
      const response = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "Failed to deactivate user."),
        );
      }

      pushToast("User deactivated.", "success");
      if (editingId === employee.id) {
        setEditingId(null);
      }
      await loadEmployees();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to deactivate user.",
        "error",
      );
    } finally {
      setDeactivateId(null);
    }
  }

  return (
    <AdminLayout>
      <section className="glass-surface rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-textPrimary">Users</h2>
          <Button variant="outline" onClick={openCreateForm}>
            Add user
          </Button>
        </div>

        {showCreate ? (
          <form
            className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-white/20 bg-white/5 p-4 md:grid-cols-2"
            onSubmit={handleCreateSubmit}
          >
            <label className="flex flex-col gap-1 text-xs text-textMuted">
              Name
              <input
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-textPrimary"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Full name"
                disabled={createSaving}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-textMuted">
              Email
              <input
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-textPrimary"
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="name@company.com"
                disabled={createSaving}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-textMuted">
              Role
              <select
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-textPrimary"
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    role: event.target.value as Role,
                  }))
                }
                disabled={createSaving}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-textMuted">
              Status
              <select
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-textPrimary"
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    status: event.target.value as "active" | "inactive",
                  }))
                }
                disabled={createSaving}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-textMuted">
              Department
              <input
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-textPrimary"
                value={createForm.department}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    department: event.target.value,
                  }))
                }
                placeholder="Department"
                disabled={createSaving}
              />
            </label>
            <label className="flex flex-col gap-1 text-xs text-textMuted">
              Phone
              <input
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-textPrimary"
                value={createForm.phone}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="Phone"
                disabled={createSaving}
              />
            </label>
            <div className="md:col-span-2 flex items-center gap-2">
              <Button type="submit" disabled={createSaving}>
                {createSaving ? "Adding..." : "Create user"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
                disabled={createSaving}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}

        {loading ? (
          <p className="text-sm text-textSecondary">Loading users...</p>
        ) : loadError ? (
          <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4">
            <p className="text-sm text-red-100">{loadError}</p>
            <Button
              className="mt-3"
              variant="outline"
              size="sm"
              onClick={() => void loadEmployees()}
            >
              Retry
            </Button>
          </div>
        ) : employees.length === 0 ? (
          <p className="text-sm text-textSecondary">
            No users found. Add a user to create the first employee record.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/20 text-left">
                  <th className="px-2 py-2 text-textMuted">Name</th>
                  <th className="px-2 py-2 text-textMuted">Email</th>
                  <th className="px-2 py-2 text-textMuted">Role</th>
                  <th className="px-2 py-2 text-textMuted">Department</th>
                  <th className="px-2 py-2 text-textMuted">Phone</th>
                  <th className="px-2 py-2 text-textMuted">Status</th>
                  <th className="px-2 py-2 text-textMuted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-white/10">
                    {editingId === employee.id ? (
                      <>
                        <td className="px-2 py-3">
                          <input
                            className="w-full rounded-lg border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-textPrimary"
                            value={editForm.name}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                name: event.target.value,
                              }))
                            }
                            disabled={editSavingId === employee.id}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input
                            className="w-full rounded-lg border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-textPrimary"
                            type="email"
                            value={editForm.email}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                email: event.target.value,
                              }))
                            }
                            disabled={editSavingId === employee.id}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <select
                            className="w-full rounded-lg border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-textPrimary"
                            value={editForm.role}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                role: event.target.value as Role,
                              }))
                            }
                            disabled={editSavingId === employee.id}
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <input
                            className="w-full rounded-lg border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-textPrimary"
                            value={editForm.department}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                department: event.target.value,
                              }))
                            }
                            disabled={editSavingId === employee.id}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input
                            className="w-full rounded-lg border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-textPrimary"
                            value={editForm.phone}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                phone: event.target.value,
                              }))
                            }
                            disabled={editSavingId === employee.id}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <select
                            className="w-full rounded-lg border border-white/20 bg-black/20 px-2 py-1.5 text-sm text-textPrimary"
                            value={editForm.status}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                status: event.target.value as
                                  | "active"
                                  | "inactive",
                              }))
                            }
                            disabled={editSavingId === employee.id}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => void handleEditSave(employee.id)}
                              disabled={editSavingId === employee.id}
                            >
                              {editSavingId === employee.id ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                              disabled={editSavingId === employee.id}
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-3 text-textPrimary">
                          {employee.name}
                        </td>
                        <td className="px-2 py-3 text-textSecondary">
                          {employee.email || "No email"}
                        </td>
                        <td className="px-2 py-3 text-textSecondary">
                          {employee.role || "Employee"}
                        </td>
                        <td className="px-2 py-3 text-textSecondary">
                          {employee.department || "Unassigned"}
                        </td>
                        <td className="px-2 py-3 text-textSecondary">
                          {employee.phone || "No phone"}
                        </td>
                        <td className="px-2 py-3 text-textSecondary">
                          {employee.status || "unknown"}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(employee)}
                              disabled={deactivateId === employee.id}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => void handleDeactivate(employee)}
                              disabled={
                                deactivateId === employee.id ||
                                employee.status === "inactive"
                              }
                            >
                              {deactivateId === employee.id
                                ? "Deactivating..."
                                : employee.status === "inactive"
                                  ? "Inactive"
                                  : "Deactivate"}
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-textMuted">
          User records, roles, departments, and active status are backed by the
          employee API. Passwords and external identity invitations remain
          managed through Zitadel.
        </p>
      </section>
    </AdminLayout>
  );
}
