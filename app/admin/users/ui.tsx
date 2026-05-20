"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/app/admin/_components/admin-layout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type Employee = {
  id: number;
  name: string;
  role: string | null;
  department: string | null;
  status: string | null;
  email: string | null;
};

export function AdminUsersClient() {
  const { pushToast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employees", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load users.");
      }
      const rows = (await response.json()) as Employee[];
      setEmployees(rows);
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Failed to load users.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  return (
    <AdminLayout>
      <section className="glass-surface rounded-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-textPrimary">Users</h2>
          <Button
            variant="outline"
            disabled
            title="Not implemented in this release"
          >
            Invite user (planned)
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-textSecondary">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/20 text-left">
                  <th className="px-2 py-2 text-textMuted">Name</th>
                  <th className="px-2 py-2 text-textMuted">Email</th>
                  <th className="px-2 py-2 text-textMuted">Role</th>
                  <th className="px-2 py-2 text-textMuted">Department</th>
                  <th className="px-2 py-2 text-textMuted">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-white/10">
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
                      {employee.status || "unknown"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-xs text-textMuted">
          Role changes and account lifecycle actions remain in the existing
          employee API and are not expanded here beyond verified capabilities.
        </p>
      </section>
    </AdminLayout>
  );
}
