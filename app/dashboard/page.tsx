"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardText,
  Fire,
  Prohibit,
  UploadSimple,
  Users,
  Warning,
  Wrench,
} from "phosphor-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type DashboardStats = {
  total_tasks: number;
  open_work_orders: number;
  low_stock_items: number;
  total_employees: number;
  high_priority_tasks: number;
  blocked_tasks: number;
};

type SessionUser = {
  id: number;
  name: string;
  role: "Employee" | "Manager" | "Admin" | "Leadership";
};

type Task = {
  id: number;
  title: string;
  status: string | null;
  priority: string | null;
  assigned_to_name: string | null;
  due_date: string | null;
  updated_at?: string | null;
};

type WorkOrder = {
  id: number;
  title: string;
  status: string | null;
  priority: string | null;
  owner_name: string | null;
  due_date: string | null;
  updated_at?: string | null;
};

type RequestItem = {
  id: number;
  title: string;
  request_id: string;
  status: string | null;
  priority: string | null;
  requester: string;
  assigned_reviewer: string | null;
  submitted_date: string;
};

type InventoryItem = {
  id: number;
  item_name: string;
  quantity: number | null;
  status: string | null;
  reorder_threshold: number | null;
  location: string | null;
};

type CalendarBlock = {
  id: string;
  title: string;
  block_type: string;
  assigned_to_name: string | null;
  start_time: string;
  end_time: string;
};

type AuditLog = {
  id: string;
  action: string;
  module: string;
  entity_type: string | null;
  entity_id_text: string | null;
  created_at: string;
};

type AutomationStatusResponse = {
  healthState: "healthy" | "degraded" | "config_missing";
};

type IntegrationsResponse = {
  integrations: Array<{
    key: string;
    status: string;
    configured: boolean;
  }>;
};

type ReportSummary = {
  completedTasksThisWeek: number;
  blockedTasks: number;
  openRequests: number;
  lowInventory: number;
};

const EMPTY_STATS: DashboardStats = {
  total_tasks: 0,
  open_work_orders: 0,
  low_stock_items: 0,
  total_employees: 0,
  high_priority_tasks: 0,
  blocked_tasks: 0,
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [calendarBlocks, setCalendarBlocks] = useState<CalendarBlock[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [automationHealth, setAutomationHealth] = useState<string | null>(null);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [reportsSummary, setReportsSummary] = useState<ReportSummary | null>(
    null,
  );
  const [reportsExportReady, setReportsExportReady] = useState(false);
  const [activityVisibility, setActivityVisibility] = useState<
    "available" | "restricted" | "unavailable"
  >("unavailable");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const [statsResponse, tasksResponse] = await Promise.all([
          fetch("/api/dashboard", { cache: "no-store" }),
          fetch("/api/tasks", { cache: "no-store" }),
        ]);

        if (!statsResponse.ok) {
          throw new Error(`Failed to load dashboard (${statsResponse.status})`);
        }
        if (!tasksResponse.ok) {
          throw new Error(`Failed to load tasks (${tasksResponse.status})`);
        }

        const [statsData, tasksData] = (await Promise.all([
          statsResponse.json(),
          tasksResponse.json(),
        ])) as [DashboardStats, Task[]];

        const optionalResults = await Promise.allSettled([
          fetchJson<WorkOrder[]>("/api/work-orders"),
          fetchJson<RequestItem[]>("/api/requests"),
          fetchJson<InventoryItem[]>("/api/inventory"),
          fetchTodayCalendarBlocks(),
          fetchJson<{ logs: AuditLog[] }>("/api/audit-logs?limit=8"),
          fetchJson<{ user: SessionUser | null }>("/api/auth/me"),
          fetchJson<AutomationStatusResponse>("/api/automations/status"),
          fetchJson<IntegrationsResponse>("/api/settings/integrations"),
          fetchJson<{ summary?: ReportSummary }>("/api/reports"),
          fetchJson<{ export: boolean }>("/api/reports/export?check=1"),
        ]);

        if (cancelled) return;

        setStats(statsData);
        setTasks(tasksData);

        const [
          workOrdersResult,
          requestsResult,
          inventoryResult,
          blocksResult,
          activityResult,
          meResult,
          automationResult,
          integrationsResult,
          reportsResult,
          exportResult,
        ] = optionalResults;

        if (workOrdersResult.status === "fulfilled") {
          setWorkOrders(workOrdersResult.value);
        }
        if (requestsResult.status === "fulfilled") {
          setRequests(requestsResult.value);
        }
        if (inventoryResult.status === "fulfilled") {
          setInventory(inventoryResult.value);
        }
        if (blocksResult.status === "fulfilled") {
          setCalendarBlocks(blocksResult.value);
        }
        if (activityResult.status === "fulfilled") {
          setActivity(activityResult.value.logs || []);
          setActivityVisibility("available");
        } else {
          const reason = String(activityResult.reason || "");
          setActivityVisibility(
            reason.includes("403") ? "restricted" : "unavailable",
          );
        }
        if (meResult.status === "fulfilled") {
          setMe(meResult.value.user || null);
        }
        if (automationResult.status === "fulfilled") {
          setAutomationHealth(automationResult.value.healthState || null);
        }
        if (integrationsResult.status === "fulfilled") {
          const aiIntegration = integrationsResult.value.integrations.find(
            (item) => item.key === "ai_provider",
          );
          setAiReady(Boolean(aiIntegration?.configured));
        }
        if (reportsResult.status === "fulfilled") {
          setReportsSummary(reportsResult.value.summary || null);
        }
        if (exportResult.status === "fulfilled") {
          setReportsExportReady(Boolean(exportResult.value.export));
        } else {
          setReportsExportReady(false);
        }

        setLastUpdatedAt(new Date().toISOString());
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load dashboard",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const due = new Date(task.due_date);
      if (Number.isNaN(due.getTime())) return false;
      const status = normalizeStatus(task.status);
      return status !== "complete" && status !== "completed" && due < now;
    });
  }, [tasks]);

  const blockedTasks = useMemo(
    () => tasks.filter((task) => normalizeStatus(task.status) === "blocked"),
    [tasks],
  );

  const highPriorityTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const priority = normalizeStatus(task.priority);
        return priority === "high" || priority === "urgent";
      }),
    [tasks],
  );

  const unassignedItems = useMemo(() => {
    const taskItems = tasks
      .filter((task) => !task.assigned_to_name)
      .map((task) => ({
        key: `task-${task.id}`,
        title: task.title,
        source: "Task",
        href: `/tasks/${task.id}`,
      }));

    const workOrderItems = workOrders
      .filter((workOrder) => !workOrder.owner_name)
      .map((workOrder) => ({
        key: `work-order-${workOrder.id}`,
        title: workOrder.title,
        source: "Work Order",
        href: `/work-orders/${workOrder.id}`,
      }));

    return [...taskItems, ...workOrderItems].slice(0, 5);
  }, [tasks, workOrders]);

  const waitingRequests = useMemo(() => {
    return requests.filter((request) => {
      const status = normalizeStatus(request.status);
      return status === "submitted" || status === "under review";
    });
  }, [requests]);

  const lowInventoryItems = useMemo(() => {
    return inventory.filter((item) => {
      const status = normalizeStatus(item.status);
      const quantity = item.quantity ?? 0;
      const reorder = item.reorder_threshold ?? -1;
      return status === "low stock" || (reorder >= 0 && quantity <= reorder);
    });
  }, [inventory]);

  const priorityWatchlist = useMemo(() => {
    const taskItems = [...highPriorityTasks, ...blockedTasks].map((task) => ({
      key: `task-${task.id}`,
      title: task.title,
      owner: task.assigned_to_name || "Unassigned",
      dueDate: task.due_date,
      status: task.status,
      priority: task.priority,
      source: "Task",
      href: `/tasks/${task.id}`,
      rank: normalizeStatus(task.status) === "blocked" ? 1 : 2,
      updatedAt: task.updated_at || task.due_date,
    }));

    const workOrderItems = workOrders
      .filter((workOrder) => {
        const priority = normalizeStatus(workOrder.priority);
        const status = normalizeStatus(workOrder.status);
        return (
          priority === "urgent" ||
          priority === "high" ||
          status === "waiting" ||
          status === "open"
        );
      })
      .map((workOrder) => ({
        key: `work-order-${workOrder.id}`,
        title: workOrder.title,
        owner: workOrder.owner_name || "Unassigned",
        dueDate: workOrder.due_date,
        status: workOrder.status,
        priority: workOrder.priority,
        source: "Work Order",
        href: `/work-orders/${workOrder.id}`,
        rank: normalizeStatus(workOrder.priority) === "urgent" ? 1 : 2,
        updatedAt: workOrder.updated_at || workOrder.due_date,
      }));

    const requestItems = waitingRequests.map((request) => ({
      key: `request-${request.id}`,
      title: request.title || request.request_id,
      owner: request.requester,
      dueDate: request.submitted_date,
      status: request.status,
      priority: request.priority,
      source: "Request",
      href: "/requests",
      rank: normalizeStatus(request.priority) === "urgent" ? 1 : 3,
      updatedAt: request.submitted_date,
    }));

    const inventoryItems = lowInventoryItems.map((item) => ({
      key: `inventory-${item.id}`,
      title: item.item_name,
      owner: item.location || "Inventory",
      dueDate: null,
      status: item.status,
      priority: "High",
      source: "Inventory",
      href: `/inventory/${item.id}`,
      rank: 2,
      updatedAt: null,
    }));

    return [...taskItems, ...workOrderItems, ...requestItems, ...inventoryItems]
      .sort((left, right) => {
        if (left.rank !== right.rank) return left.rank - right.rank;
        const leftTime = new Date(
          left.updatedAt || left.dueDate || 0,
        ).getTime();
        const rightTime = new Date(
          right.updatedAt || right.dueDate || 0,
        ).getTime();
        return rightTime - leftTime;
      })
      .slice(0, 8);
  }, [
    blockedTasks,
    highPriorityTasks,
    lowInventoryItems,
    waitingRequests,
    workOrders,
  ]);

  const todayWork = useMemo(() => {
    const todayKey = dateKey(new Date());
    const dueTodayTasks = tasks.filter(
      (task) => dateKey(task.due_date) === todayKey,
    );
    const dueTodayWorkOrders = workOrders.filter(
      (workOrder) => dateKey(workOrder.due_date) === todayKey,
    );
    const todayBlocks = calendarBlocks.filter(
      (block) => dateKey(block.start_time) === todayKey,
    );
    const assignedToMe = me
      ? [
          ...tasks.filter(
            (task) =>
              task.assigned_to_name === me.name &&
              normalizeStatus(task.status) !== "complete" &&
              normalizeStatus(task.status) !== "completed",
          ),
          ...workOrders.filter(
            (workOrder) =>
              workOrder.owner_name === me.name &&
              normalizeStatus(workOrder.status) !== "complete" &&
              normalizeStatus(workOrder.status) !== "completed",
          ),
        ]
      : [];

    return {
      dueTodayTasks,
      dueTodayWorkOrders,
      todayBlocks,
      assignedToMe,
    };
  }, [calendarBlocks, me, tasks, workOrders]);

  const quickActions = [
    { label: "+ New Task", href: "/calendar?action=new-task" },
    { label: "+ Work Order", href: "/work-orders" },
    { label: "+ Request", href: "/requests" },
    { label: "+ Upload File", href: "/files", icon: UploadSimple },
    { label: "Open Calendar", href: "/calendar" },
    { label: "Ask AEON", href: "/ai-chat" },
  ];

  const leadershipSnapshot = {
    completedThisWeek:
      reportsSummary?.completedTasksThisWeek ??
      tasks.filter(
        (task) =>
          normalizeStatus(task.status) === "completed" &&
          isInCurrentWeek(task.updated_at || task.due_date),
      ).length,
    blockedItems: reportsSummary?.blockedTasks ?? blockedTasks.length,
    openRequests: reportsSummary?.openRequests ?? waitingRequests.length,
    lowStock: reportsSummary?.lowInventory ?? lowInventoryItems.length,
  };

  const statusPills: Array<{
    label: string;
    value: string;
    tone: "success" | "warning" | "neutral";
    visible: boolean;
  }> = [
    {
      label: "Live database",
      value: error ? "Issue" : "Online",
      tone: error ? "warning" : "success",
      visible: !loading,
    },
    {
      label: "AI ready",
      value: aiReady ? "Ready" : "Not configured",
      tone: aiReady ? "success" : "neutral",
      visible: aiReady !== null,
    },
    {
      label: "Automations",
      value: automationHealth
        ? automationHealth.replaceAll("_", " ")
        : "Unavailable",
      tone:
        automationHealth === "healthy"
          ? "success"
          : automationHealth === "degraded"
            ? "warning"
            : "neutral",
      visible: automationHealth !== null,
    },
    {
      label: "Last updated",
      value: lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "-",
      tone: "neutral",
      visible: Boolean(lastUpdatedAt),
    },
  ];

  const statCards = [
    {
      label: "Total Tasks",
      value: stats.total_tasks,
      meaning: "All tracked tasks across teams.",
      icon: ClipboardText,
      href: "/tasks",
    },
    {
      label: "Open Work Orders",
      value: stats.open_work_orders,
      meaning: "Execution items still in progress.",
      icon: Wrench,
      href: "/work-orders",
    },
    {
      label: "Low Stock Items",
      value: stats.low_stock_items,
      meaning: "Inventory requiring reorder review.",
      icon: Warning,
      href: "/inventory",
    },
    {
      label: "Total Employees",
      value: stats.total_employees,
      meaning: "Active internal directory records.",
      icon: Users,
      href: "/employees",
    },
    {
      label: "High Priority Tasks",
      value: stats.high_priority_tasks,
      meaning: "Priority work needing fast response.",
      icon: Fire,
      href: "/tasks?priority=high",
    },
    {
      label: "Blocked Tasks",
      value: stats.blocked_tasks,
      meaning: "Tasks blocked by dependencies or issues.",
      icon: Prohibit,
      href: "/tasks?status=blocked",
    },
  ];

  return (
    <div className="space-y-6 pb-6">
      <FadeContent
        as="section"
        blur={true}
        duration={700}
        delay={40}
        className="rounded-2xl border border-borderSubtle bg-surface/85 p-5 shadow-soft"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
              <ShinyText>Dashboard</ShinyText>
            </h1>
            <p className="max-w-3xl text-base text-textSecondary">
              Your team&apos;s daily command center.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {statusPills.map((pill) => {
              if (!pill.visible) return null;
              return (
                <StatusPill
                  key={pill.label}
                  label={pill.label}
                  value={pill.value}
                  tone={pill.tone}
                />
              );
            })}
          </div>
        </div>
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading dashboard..." />
      ) : (
        <>
          <FadeContent
            as="section"
            blur={true}
            duration={700}
            delay={80}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.label}
                  href={card.href}
                  className="group rounded-2xl border border-borderSubtle bg-surface/90 p-4 shadow-soft transition-all hover:-translate-y-px hover:border-white/40 hover:bg-surface"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                      {card.label}
                    </p>
                    <Icon
                      className="h-4.5 w-4.5 text-accent"
                      weight="duotone"
                    />
                  </div>
                  <p className="mt-2 text-3xl font-semibold text-textPrimary">
                    {card.value.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-textSecondary">
                    {card.meaning}
                  </p>
                </Link>
              );
            })}
          </FadeContent>

          <div className="grid gap-4 xl:grid-cols-3">
            <section className="space-y-4 xl:col-span-2">
              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={110}
                className="rounded-2xl border border-borderSubtle bg-surface/90 p-5 shadow-soft"
              >
                <h2 className="text-lg font-semibold text-textPrimary">
                  Needs Attention
                </h2>
                <p className="mt-1 text-sm text-textSecondary">
                  Items leadership should review today.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <AttentionBucket
                    title="Overdue tasks"
                    count={overdueTasks.length}
                    items={overdueTasks.slice(0, 3).map((task) => ({
                      key: `overdue-${task.id}`,
                      label: task.title,
                      href: `/tasks/${task.id}`,
                    }))}
                  />
                  <AttentionBucket
                    title="Blocked tasks"
                    count={blockedTasks.length}
                    items={blockedTasks.slice(0, 3).map((task) => ({
                      key: `blocked-${task.id}`,
                      label: task.title,
                      href: `/tasks/${task.id}`,
                    }))}
                  />
                  <AttentionBucket
                    title="High-priority work"
                    count={highPriorityTasks.length}
                    items={highPriorityTasks.slice(0, 3).map((task) => ({
                      key: `high-${task.id}`,
                      label: task.title,
                      href: `/tasks/${task.id}`,
                    }))}
                  />
                  <AttentionBucket
                    title="Unassigned items"
                    count={unassignedItems.length}
                    items={unassignedItems.slice(0, 3).map((item) => ({
                      key: item.key,
                      label: `${item.title} (${item.source})`,
                      href: item.href,
                    }))}
                  />
                  <AttentionBucket
                    title="Requests waiting review"
                    count={waitingRequests.length}
                    items={waitingRequests.slice(0, 3).map((request) => ({
                      key: `request-${request.id}`,
                      label: `${request.request_id} - ${request.title}`,
                      href: "/requests",
                    }))}
                  />
                  <AttentionBucket
                    title="Low inventory"
                    count={lowInventoryItems.length}
                    items={lowInventoryItems.slice(0, 3).map((item) => ({
                      key: `inventory-${item.id}`,
                      label: item.item_name,
                      href: `/inventory/${item.id}`,
                    }))}
                  />
                </div>
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={140}
                className="rounded-2xl border border-borderSubtle bg-surface/90 p-5 shadow-soft"
              >
                <h2 className="text-lg font-semibold text-textPrimary">
                  Priority Watchlist
                </h2>
                <p className="mt-1 text-sm text-textSecondary">
                  Critical queue across tasks, work orders, requests, and
                  inventory.
                </p>

                {priorityWatchlist.length === 0 ? (
                  <EmptyState message="No critical watchlist items right now." />
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-textMuted">
                        <tr>
                          <th className="px-2 py-2 font-semibold">Title</th>
                          <th className="px-2 py-2 font-semibold">Owner</th>
                          <th className="px-2 py-2 font-semibold">Due</th>
                          <th className="px-2 py-2 font-semibold">Status</th>
                          <th className="px-2 py-2 font-semibold">Priority</th>
                          <th className="px-2 py-2 font-semibold">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-borderSubtle">
                        {priorityWatchlist.map((item) => (
                          <tr key={item.key} className="hover:bg-white/5">
                            <td className="px-2 py-2">
                              <Link
                                href={item.href}
                                className="font-medium text-textPrimary hover:text-accent"
                              >
                                {item.title}
                              </Link>
                            </td>
                            <td className="px-2 py-2 text-textSecondary">
                              {item.owner}
                            </td>
                            <td className="px-2 py-2 text-textSecondary">
                              {formatDate(item.dueDate)}
                            </td>
                            <td className="px-2 py-2">
                              <Badge
                                label={item.status || "Open"}
                                tone="neutral"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Badge
                                label={item.priority || "Normal"}
                                tone="warning"
                              />
                            </td>
                            <td className="px-2 py-2 text-textSecondary">
                              {item.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={170}
                className="rounded-2xl border border-borderSubtle bg-surface/90 p-5 shadow-soft"
              >
                <h2 className="text-lg font-semibold text-textPrimary">
                  Today&apos;s Work
                </h2>
                <p className="mt-1 text-sm text-textSecondary">
                  Due today, scheduled blocks, and assigned execution.
                </p>

                {todayWork.dueTodayTasks.length === 0 &&
                todayWork.todayBlocks.length === 0 &&
                todayWork.dueTodayWorkOrders.length === 0 &&
                todayWork.assignedToMe.length === 0 ? (
                  <EmptyState message="No scheduled work due today." />
                ) : (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SimpleListCard
                      title="Due Today Tasks"
                      items={todayWork.dueTodayTasks
                        .slice(0, 4)
                        .map((task) => ({
                          key: `today-task-${task.id}`,
                          label: task.title,
                          href: `/tasks/${task.id}`,
                        }))}
                    />
                    <SimpleListCard
                      title="Scheduled Blocks"
                      items={todayWork.todayBlocks.slice(0, 4).map((block) => ({
                        key: `today-block-${block.id}`,
                        label: `${formatTime(block.start_time)} - ${block.title}`,
                        href: "/calendar",
                      }))}
                    />
                    <SimpleListCard
                      title="Work Orders Due Today"
                      items={todayWork.dueTodayWorkOrders
                        .slice(0, 4)
                        .map((workOrder) => ({
                          key: `today-wo-${workOrder.id}`,
                          label: workOrder.title,
                          href: `/work-orders/${workOrder.id}`,
                        }))}
                    />
                    <SimpleListCard
                      title="Assigned Work"
                      items={todayWork.assignedToMe.slice(0, 4).map((item) => ({
                        key: `assigned-${"id" in item ? String(item.id) : Math.random()}`,
                        label: item.title,
                        href:
                          "owner_name" in item
                            ? `/work-orders/${item.id}`
                            : `/tasks/${item.id}`,
                      }))}
                    />
                  </div>
                )}
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={200}
                className="rounded-2xl border border-borderSubtle bg-surface/90 p-5 shadow-soft"
              >
                <h2 className="text-lg font-semibold text-textPrimary">
                  Recent Activity
                </h2>
                <p className="mt-1 text-sm text-textSecondary">
                  Latest operational changes from internal audit logs.
                </p>

                {activityVisibility === "restricted" ? (
                  <EmptyState message="Recent activity is available to Admin and Leadership roles." />
                ) : activity.length === 0 ? (
                  <EmptyState message="No recent activity records available." />
                ) : (
                  <ul className="mt-4 space-y-2">
                    {activity.map((log) => (
                      <li
                        key={log.id}
                        className="rounded-xl border border-borderSubtle bg-bgDark/20 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-textPrimary">
                          {toActivityLabel(log.action)}
                        </p>
                        <p className="mt-0.5 text-xs text-textSecondary">
                          {log.module}{" "}
                          {log.entity_type ? `- ${log.entity_type}` : ""}
                          {log.entity_id_text
                            ? ` #${log.entity_id_text}`
                            : ""}{" "}
                          - {formatDateTime(log.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </FadeContent>
            </section>

            <aside className="space-y-4">
              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={110}
                className="rounded-2xl border border-borderSubtle bg-surface/90 p-5 shadow-soft"
              >
                <h2 className="text-lg font-semibold text-textPrimary">
                  Quick Actions
                </h2>
                <p className="mt-1 text-sm text-textSecondary">
                  Jump directly into daily execution flows.
                </p>
                <div className="mt-4 grid gap-2">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="inline-flex items-center justify-between rounded-lg border border-borderSubtle bg-bgDark/25 px-3 py-2 text-sm font-medium text-textPrimary transition hover:border-white/35 hover:bg-bgDark/40"
                    >
                      {action.label}
                      <span className="text-xs text-textMuted">Open</span>
                    </Link>
                  ))}
                </div>
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={140}
                className="rounded-2xl border border-borderSubtle bg-surface/90 p-5 shadow-soft"
              >
                <h2 className="text-lg font-semibold text-textPrimary">
                  Workspace Notes
                </h2>
                <p className="mt-2 text-sm text-textSecondary">
                  Current polish focus: Outlook sync reliability, Forms to
                  Requests workflow stability, and admin control hardening.
                </p>
                <p className="mt-2 text-sm text-textSecondary">
                  In progress: dashboard and mobile command-center polish for
                  demo readiness.
                </p>
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={170}
                className="rounded-2xl border border-borderSubtle bg-surface/90 p-5 shadow-soft"
              >
                <h2 className="text-lg font-semibold text-textPrimary">
                  Reports Snapshot
                </h2>
                <p className="mt-1 text-sm text-textSecondary">
                  Leadership preview from current operational data.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <SnapshotMetric
                    label="Completed this week"
                    value={leadershipSnapshot.completedThisWeek}
                  />
                  <SnapshotMetric
                    label="Blocked items"
                    value={leadershipSnapshot.blockedItems}
                  />
                  <SnapshotMetric
                    label="Open requests"
                    value={leadershipSnapshot.openRequests}
                  />
                  <SnapshotMetric
                    label="Low stock"
                    value={leadershipSnapshot.lowStock}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/reports"
                    className="inline-flex rounded-lg border border-borderSubtle bg-bgDark/25 px-3 py-1.5 text-xs font-semibold text-textPrimary transition hover:bg-bgDark/40"
                  >
                    Open Reports
                  </Link>
                  {reportsExportReady ? (
                    <a
                      href="/api/reports/export"
                      className="inline-flex rounded-lg border border-borderSubtle bg-bgDark/25 px-3 py-1.5 text-xs font-semibold text-textPrimary transition hover:bg-bgDark/40"
                    >
                      Export CSV
                    </a>
                  ) : null}
                </div>
              </FadeContent>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}

function AttentionBucket({
  title,
  count,
  items,
}: {
  title: string;
  count: number;
  items: Array<{ key: string; label: string; href: string }>;
}) {
  return (
    <article className="rounded-xl border border-borderSubtle bg-bgDark/20 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-textPrimary">{title}</p>
        <Badge label={String(count)} tone={count > 0 ? "warning" : "neutral"} />
      </div>
      <div className="mt-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-textMuted">No items.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="block truncate text-xs text-textSecondary transition hover:text-textPrimary"
            >
              {item.label}
            </Link>
          ))
        )}
      </div>
    </article>
  );
}

function SimpleListCard({
  title,
  items,
}: {
  title: string;
  items: Array<{ key: string; label: string; href: string }>;
}) {
  return (
    <article className="rounded-xl border border-borderSubtle bg-bgDark/20 p-3">
      <p className="text-sm font-semibold text-textPrimary">{title}</p>
      <div className="mt-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-xs text-textMuted">No items.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="block truncate text-sm text-textSecondary transition hover:text-textPrimary"
            >
              {item.label}
            </Link>
          ))
        )}
      </div>
    </article>
  );
}

function SnapshotMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-borderSubtle bg-bgDark/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-textPrimary">{value}</p>
    </div>
  );
}

function StatusPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "neutral";
}) {
  const tones: Record<typeof tone, string> = {
    success:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    neutral: "border-borderSubtle bg-bgDark/20 text-textSecondary",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${tones[tone]}`}
    >
      <span className="font-semibold">{label}:</span>
      <span>{value}</span>
    </span>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "neutral";
}) {
  const tones: Record<typeof tone, string> = {
    success:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    neutral: "border-borderSubtle bg-bgDark/20 text-textSecondary",
  };
  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="mt-3 rounded-xl border border-dashed border-borderSubtle bg-bgDark/15 px-3 py-4 text-sm text-textSecondary">
      {message}
    </p>
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

async function fetchJson<T>(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${url} (${response.status})`);
  }
  return (await response.json()) as T;
}

async function fetchTodayCalendarBlocks() {
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return fetchJson<CalendarBlock[]>(
    `/api/calendar-blocks?${params.toString()}`,
  );
}

function normalizeStatus(value: string | null | undefined) {
  return (value || "").trim().toLowerCase().replaceAll("_", " ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No due date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function formatTime(value: string | null | undefined) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function dateKey(value: string | Date | null | undefined) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function isInCurrentWeek(value: string | null | undefined) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return date >= monday && date <= sunday;
}

function toActivityLabel(action: string) {
  return action
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
