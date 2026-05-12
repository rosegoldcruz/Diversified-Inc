"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type Task = {
  id: number;
  status: string | null;
  priority: string | null;
};

type WorkOrder = {
  id: number;
  status: string | null;
};

type Employee = {
  id: number;
};

type InventoryItem = {
  id: number;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  status: string | null;
};

type ReportData = {
  tasks: Task[];
  workOrders: WorkOrder[];
  employees: Employee[];
  inventory: InventoryItem[];
};

const EMPTY_DATA: ReportData = {
  tasks: [],
  workOrders: [],
  employees: [],
  inventory: [],
};

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<ReportData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        setLoading(true);
        setError(null);

        const [
          tasksResponse,
          workOrdersResponse,
          employeesResponse,
          inventoryResponse,
        ] = await Promise.all([
          fetch("/api/tasks", { cache: "no-store" }),
          fetch("/api/work-orders", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
          fetch("/api/inventory", { cache: "no-store" }),
        ]);

        if (!tasksResponse.ok)
          throw new Error(`Failed to load tasks (${tasksResponse.status})`);
        if (!workOrdersResponse.ok)
          throw new Error(
            `Failed to load work orders (${workOrdersResponse.status})`,
          );
        if (!employeesResponse.ok)
          throw new Error(
            `Failed to load employees (${employeesResponse.status})`,
          );
        if (!inventoryResponse.ok)
          throw new Error(
            `Failed to load inventory (${inventoryResponse.status})`,
          );

        const [tasks, workOrders, employees, inventory] = (await Promise.all([
          tasksResponse.json(),
          workOrdersResponse.json(),
          employeesResponse.json(),
          inventoryResponse.json(),
        ])) as [Task[], WorkOrder[], Employee[], InventoryItem[]];

        if (!cancelled) {
          setData({ tasks, workOrders, employees, inventory });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load reports",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    const completedTasks = data.tasks.filter(
      (task) => normalize(task.status) === "completed",
    ).length;
    const blockedTasks = data.tasks.filter(
      (task) => normalize(task.status) === "blocked",
    ).length;
    const highPriorityTasks = data.tasks.filter((task) => {
      const priority = normalize(task.priority);
      return priority === "high" || priority === "urgent";
    }).length;

    const openWorkOrders = data.workOrders.filter((workOrder) => {
      const status = normalize(workOrder.status);
      return (
        status !== "completed" &&
        status !== "complete" &&
        status !== "closed" &&
        status !== "canceled" &&
        status !== "cancelled"
      );
    }).length;

    const lowStockItems = data.inventory.filter(
      (item) => normalize(item.status) === "low_stock",
    ).length;
    const outOfStockItems = data.inventory.filter(
      (item) => normalize(item.status) === "out_of_stock",
    ).length;

    return {
      totalTasks: data.tasks.length,
      completedTasks,
      blockedTasks,
      highPriorityTasks,
      openWorkOrders,
      totalEmployees: data.employees.length,
      lowStockItems,
      outOfStockItems,
    };
  }, [data]);

  const taskBreakdown = useMemo(() => {
    return {
      todo: data.tasks.filter((task) => normalize(task.status) === "todo")
        .length,
      in_progress: data.tasks.filter(
        (task) => normalize(task.status) === "in_progress",
      ).length,
      completed: data.tasks.filter(
        (task) => normalize(task.status) === "completed",
      ).length,
      blocked: data.tasks.filter((task) => normalize(task.status) === "blocked")
        .length,
    };
  }, [data.tasks]);

  const inventoryAlerts = useMemo(() => {
    return data.inventory.filter((item) => {
      const status = normalize(item.status);
      return status === "low_stock" || status === "out_of_stock";
    });
  }, [data.inventory]);

  const workOrderBreakdown = useMemo(() => {
    return {
      open: data.workOrders.filter((workOrder) => {
        const status = normalize(workOrder.status);
        return status === "open" || status === "todo";
      }).length,
      in_progress: data.workOrders.filter(
        (workOrder) => normalize(workOrder.status) === "in_progress",
      ).length,
      pending: data.workOrders.filter((workOrder) => {
        const status = normalize(workOrder.status);
        return status === "pending" || status === "waiting";
      }).length,
      completed: data.workOrders.filter((workOrder) => {
        const status = normalize(workOrder.status);
        return status === "completed" || status === "complete";
      }).length,
    };
  }, [data.workOrders]);

  const cards = [
    { label: "Total Tasks", value: metrics.totalTasks },
    { label: "Completed Tasks", value: metrics.completedTasks },
    { label: "Blocked Tasks", value: metrics.blockedTasks },
    { label: "High Priority Tasks", value: metrics.highPriorityTasks },
    { label: "Open Work Orders", value: metrics.openWorkOrders },
    { label: "Total Employees", value: metrics.totalEmployees },
    { label: "Low Stock Items", value: metrics.lowStockItems },
    { label: "Out of Stock Items", value: metrics.outOfStockItems },
  ];

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
          <ShinyText>Reports</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          Live reporting across tasks, work orders, employees, and inventory.
        </p>
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading reports..." />
      ) : (
        <>
          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={90}
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-4"
          >
            {cards.map((card) => (
              <article
                key={card.label}
                className="glass-surface glass-surface-hover p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                  {card.label}
                </p>
                <p className="mt-3 text-4xl font-semibold text-textPrimary">
                  {card.value}
                </p>
              </article>
            ))}
          </FadeContent>

          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={120}
            className="glass-surface p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-textPrimary">
              Task Breakdown by Status
            </h2>
            <p className="mt-1 text-sm text-textSecondary">
              Counts for todo, in_progress, completed, and blocked tasks.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30 dark:divide-white/10">
                  <tr
                    onClick={() => router.push("/tasks?status=todo")}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textSecondary">todo</td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {taskBreakdown.todo}
                    </td>
                  </tr>
                  <tr
                    onClick={() => router.push("/tasks?status=in_progress")}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textSecondary">
                      in_progress
                    </td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {taskBreakdown.in_progress}
                    </td>
                  </tr>
                  <tr
                    onClick={() => router.push("/tasks?status=completed")}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textSecondary">completed</td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {taskBreakdown.completed}
                    </td>
                  </tr>
                  <tr
                    onClick={() => router.push("/tasks?status=blocked")}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textSecondary">blocked</td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {taskBreakdown.blocked}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </FadeContent>

          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={150}
            className="glass-surface p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-textPrimary">
              Work Order Breakdown by Status
            </h2>
            <p className="mt-1 text-sm text-textSecondary">
              Counts for open, in_progress, pending, and completed work orders.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/30 dark:divide-white/10">
                  <tr
                    onClick={() => router.push("/work-orders?status=open")}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textSecondary">open</td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {workOrderBreakdown.open}
                    </td>
                  </tr>
                  <tr
                    onClick={() =>
                      router.push("/work-orders?status=in_progress")
                    }
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textSecondary">
                      in_progress
                    </td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {workOrderBreakdown.in_progress}
                    </td>
                  </tr>
                  <tr
                    onClick={() => router.push("/work-orders?status=pending")}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textSecondary">pending</td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {workOrderBreakdown.pending}
                    </td>
                  </tr>
                  <tr
                    onClick={() => router.push("/work-orders?status=completed")}
                    className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textSecondary">completed</td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      {workOrderBreakdown.completed}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </FadeContent>

          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={180}
            className="glass-surface p-6 md:p-8"
          >
            <h2 className="text-lg font-semibold text-textPrimary">
              Inventory Alerts
            </h2>
            <p className="mt-1 text-sm text-textSecondary">
              Items currently low on stock or out of stock.
            </p>

            {inventoryAlerts.length === 0 ? (
              <p className="mt-4 text-sm text-textSecondary">
                No inventory alerts right now.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold">Quantity</th>
                      <th className="px-4 py-3 font-semibold">Unit</th>
                      <th className="px-4 py-3 font-semibold">Location</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/30 dark:divide-white/10">
                    {inventoryAlerts.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => router.push(`/inventory/${item.id}`)}
                        className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium text-textPrimary">
                          {item.item_name}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {item.quantity ?? 0}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {item.unit || "-"}
                        </td>
                        <td className="px-4 py-3 text-textSecondary">
                          {item.location || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <InventoryStatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FadeContent>
        </>
      )}
    </div>
  );
}

function normalize(value: string | null) {
  return (value || "").toLowerCase();
}

function InventoryStatusBadge({ status }: { status: string | null }) {
  const normalized = normalize(status);
  const styles: Record<string, string> = {
    low_stock:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    out_of_stock:
      "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles[normalized] || styles.low_stock}`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="glass-surface p-12 text-center text-sm text-textSecondary">
      {label}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-5 text-sm text-red-700 shadow-glass backdrop-blur-2xl dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
