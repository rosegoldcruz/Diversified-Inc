"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarBlank,
  ChatCircleDots,
  ClipboardText,
  FileArrowUp,
  NotePencil,
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

  const overdueWorkOrders = useMemo(() => {
    const now = new Date();
    return workOrders.filter((workOrder) => {
      if (!workOrder.due_date) return false;
      const due = new Date(workOrder.due_date);
      if (Number.isNaN(due.getTime())) return false;
      const status = normalizeStatus(workOrder.status);
      return status !== "complete" && status !== "completed" && due < now;
    });
  }, [workOrders]);

  const highPriorityTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const priority = normalizeStatus(task.priority);
        return priority === "high" || priority === "urgent";
      }),
    [tasks],
  );

  const highPriorityRequests = useMemo(
    () =>
      requests.filter((request) => {
        const priority = normalizeStatus(request.priority);
        return priority === "high" || priority === "urgent";
      }),
    [requests],
  );

  const highPriorityWorkOrders = useMemo(
    () =>
      workOrders.filter((workOrder) => {
        const priority = normalizeStatus(workOrder.priority);
        return priority === "high" || priority === "urgent";
      }),
    [workOrders],
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

  const inventoryRisk = useMemo(() => {
    const critical = inventory.filter((item) => {
      const quantity = item.quantity ?? 0;
      const reorder = item.reorder_threshold ?? -1;
      return reorder >= 0 && quantity <= Math.max(0, Math.floor(reorder * 0.5));
    }).length;
    const warning = lowInventoryItems.length - critical;
    const healthy = Math.max(0, inventory.length - lowInventoryItems.length);
    return {
      critical,
      warning,
      healthy,
      total: inventory.length,
    };
  }, [inventory, lowInventoryItems]);

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

  const dueTodayCount =
    todayWork.dueTodayTasks.length + todayWork.dueTodayWorkOrders.length;

  const highPriorityCount =
    highPriorityTasks.length +
    highPriorityRequests.length +
    highPriorityWorkOrders.length;

  const blockedCount = blockedTasks.length + overdueWorkOrders.length;

  const taskStatusSummary = useMemo(() => {
    const buckets = [
      { key: "not started", label: "Not Started", count: 0 },
      { key: "in progress", label: "In Progress", count: 0 },
      { key: "waiting", label: "Waiting", count: 0 },
      { key: "blocked", label: "Blocked", count: 0 },
      { key: "completed", label: "Completed", count: 0 },
    ];
    tasks.forEach((task) => {
      const status = normalizeStatus(task.status);
      const match =
        buckets.find((bucket) => bucket.key === status) ||
        (status === "complete"
          ? buckets.find((bucket) => bucket.key === "completed")
          : null);
      if (match) match.count += 1;
    });
    return buckets;
  }, [tasks]);

  const requestPrioritySummary = useMemo(() => {
    if (requests.length === 0) return [];
    const priorities = [
      { key: "urgent", label: "Urgent", count: 0 },
      { key: "high", label: "High", count: 0 },
      { key: "normal", label: "Normal", count: 0 },
      { key: "low", label: "Low", count: 0 },
    ];
    requests.forEach((request) => {
      const priority = normalizeStatus(request.priority);
      const match = priorities.find((item) => item.key === priority);
      if (match) match.count += 1;
    });
    return priorities;
  }, [requests]);

  const needsAttentionQueue = useMemo(() => {
    const overdueTaskItems = overdueTasks.map((task) => ({
      key: `overdue-task-${task.id}`,
      title: task.title,
      source: "Task",
      href: `/tasks/${task.id}`,
      status: task.status || "Overdue",
      priority: task.priority || "High",
      severity: 1,
      time: task.due_date,
      signal: "Overdue",
    }));

    const blockedTaskItems = blockedTasks.map((task) => ({
      key: `blocked-task-${task.id}`,
      title: task.title,
      source: "Task",
      href: `/tasks/${task.id}`,
      status: task.status || "Blocked",
      priority: task.priority || "High",
      severity: 1,
      time: task.updated_at || task.due_date,
      signal: "Blocked",
    }));

    const overdueWorkOrderItems = overdueWorkOrders.map((workOrder) => ({
      key: `overdue-wo-${workOrder.id}`,
      title: workOrder.title,
      source: "Work Order",
      href: `/work-orders/${workOrder.id}`,
      status: workOrder.status || "Open",
      priority: workOrder.priority || "High",
      severity: 1,
      time: workOrder.due_date,
      signal: "Overdue",
    }));

    const reviewRequestItems = waitingRequests.map((request) => ({
      key: `waiting-request-${request.id}`,
      title: request.title || request.request_id,
      source: "Request",
      href: "/requests",
      status: request.status || "Under Review",
      priority: request.priority || "Normal",
      severity: normalizeStatus(request.priority) === "urgent" ? 1 : 2,
      time: request.submitted_date,
      signal: "Waiting Review",
    }));

    const lowInventoryQueueItems = lowInventoryItems.map((item) => ({
      key: `inventory-risk-${item.id}`,
      title: item.item_name,
      source: "Inventory",
      href: `/inventory/${item.id}`,
      status: item.status || "Low Stock",
      priority: "High",
      severity: 2,
      time: null,
      signal: "Low Stock",
    }));

    return [
      ...overdueTaskItems,
      ...blockedTaskItems,
      ...overdueWorkOrderItems,
      ...reviewRequestItems,
      ...lowInventoryQueueItems,
    ]
      .sort((left, right) => {
        if (left.severity !== right.severity)
          return left.severity - right.severity;
        const leftTime = new Date(left.time || 0).getTime();
        const rightTime = new Date(right.time || 0).getTime();
        return rightTime - leftTime;
      })
      .slice(0, 6);
  }, [
    blockedTasks,
    lowInventoryItems,
    overdueTasks,
    overdueWorkOrders,
    waitingRequests,
  ]);

  const quickActions = [
    {
      label: "New Task",
      href: "/calendar?action=new-task",
      detail: "Create and assign execution work",
      icon: NotePencil,
      accent: "bg-blue-500/15 border-blue-500/40",
    },
    {
      label: "Submit Request",
      href: "/requests",
      detail: "Open a new internal request",
      icon: ClipboardText,
      accent: "bg-amber-500/15 border-amber-500/40",
    },
    {
      label: "Create Work Order",
      href: "/work-orders",
      detail: "Launch an operational work order",
      icon: Wrench,
      accent: "bg-emerald-500/15 border-emerald-500/40",
    },
    {
      label: "Upload File",
      href: "/files",
      detail: "Attach operational documentation",
      icon: FileArrowUp,
      accent: "bg-cyan-500/15 border-cyan-500/40",
    },
    {
      label: "Ask AEON",
      href: "/ai-chat",
      detail: "Get a fast operations summary",
      icon: ChatCircleDots,
      accent: "bg-violet-500/15 border-violet-500/40",
    },
    {
      label: "Open Calendar",
      href: "/calendar",
      detail: "View today and projected blocks",
      icon: CalendarBlank,
      accent: "bg-fuchsia-500/15 border-fuchsia-500/40",
    },
  ];

  const summaryStrip = [
    {
      label: "Overdue",
      value: overdueTasks.length + overdueWorkOrders.length,
      href: "/tasks?status=overdue",
      tone: "critical" as const,
    },
    {
      label: "Due Today",
      value: dueTodayCount,
      href: "/calendar",
      tone: "warning" as const,
    },
    {
      label: "Open Work Orders",
      value: stats.open_work_orders,
      href: "/work-orders",
      tone: "neutral" as const,
    },
    {
      label: "Waiting Review",
      value: waitingRequests.length,
      href: "/requests",
      tone: "warning" as const,
    },
    {
      label: "High Priority",
      value: highPriorityCount,
      href: "/tasks?priority=high",
      tone: "critical" as const,
    },
    {
      label: "Blocked",
      value: blockedCount,
      href: "/tasks?status=blocked",
      tone: "critical" as const,
    },
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
      value:
        automationHealth === "healthy"
          ? "Healthy"
          : automationHealth === "degraded"
            ? "Degraded"
            : "Automation hooks pending",
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

  return (
    <div className="space-y-6 pb-6">
      <FadeContent
        as="section"
        blur={true}
        duration={700}
        delay={40}
        className="rounded-2xl border border-slate-500/40 bg-gradient-to-r from-slate-100/95 via-slate-100/90 to-white/95 p-5 shadow-soft dark:from-slate-950/95 dark:via-slate-900/95 dark:to-slate-900/95"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-normal text-slate-900 dark:text-white md:text-4xl">
              <ShinyText>Dashboard</ShinyText>
            </h1>
            <p className="max-w-3xl text-base text-slate-700 dark:text-slate-300">
              Daily command center for work, priorities, and team visibility.
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
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1.05fr)]">
            <aside className="order-1 space-y-5 xl:order-2">
              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={110}
                className="rounded-2xl border border-slate-300/80 bg-white p-6 shadow-soft dark:border-slate-500/75 dark:bg-slate-900/85"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Quick Actions
                </h2>
                <p className="mt-1 text-[15px] text-slate-700 dark:text-slate-300">
                  Start core service desk workflows.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        className={`group rounded-xl border p-5 transition hover:-translate-y-px hover:shadow-md ${action.accent}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[1.04rem] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                              {action.label}
                            </p>
                            <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300">
                              {action.detail}
                            </p>
                          </div>
                          <Icon
                            className="h-6 w-6 text-slate-700 dark:text-slate-200"
                            weight="duotone"
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={140}
                className="rounded-2xl border border-slate-300/80 bg-white p-6 shadow-soft dark:border-slate-500/75 dark:bg-slate-900/85"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Workspace Notes / Announcements
                </h2>
                <div className="mt-3 space-y-2">
                  {needsAttentionQueue.length > 0 ? (
                    <ul className="space-y-2">
                      <li className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-200">
                        {overdueTasks.length + overdueWorkOrders.length} overdue
                        items require immediate owner follow-up.
                      </li>
                      <li className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                        {waitingRequests.length} requests are waiting for review
                        decisions.
                      </li>
                      <li className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-900 dark:text-blue-200">
                        Queue refreshed {formatDateTime(lastUpdatedAt)}.
                      </li>
                    </ul>
                  ) : (
                    <EmptyState message="No active announcements from current dashboard data." />
                  )}
                </div>
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={170}
                className="rounded-2xl border border-slate-300/80 bg-white p-6 shadow-soft dark:border-slate-500/75 dark:bg-slate-900/85"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Reports Snapshot
                </h2>
                <p className="mt-1 text-[15px] text-slate-700 dark:text-slate-300">
                  Live operational summaries from task, request, and inventory
                  feeds.
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Work by Status
                    </p>
                    <div className="mt-2 space-y-2">
                      {taskStatusSummary.map((item) => (
                        <BarMetric
                          key={item.key}
                          label={item.label}
                          value={item.count}
                          total={Math.max(tasks.length, 1)}
                          tone={
                            item.key === "blocked"
                              ? "critical"
                              : item.key === "waiting"
                                ? "warning"
                                : "neutral"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Requests by Priority
                    </p>
                    {requestPrioritySummary.length === 0 ? (
                      <EmptyState message="No request priority data available." />
                    ) : (
                      <div className="mt-2 space-y-2">
                        {requestPrioritySummary.map((item) => (
                          <BarMetric
                            key={item.key}
                            label={item.label}
                            value={item.count}
                            total={Math.max(requests.length, 1)}
                            tone={
                              item.key === "urgent" || item.key === "high"
                                ? "warning"
                                : "neutral"
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Inventory Risk Summary
                    </p>
                    {inventoryRisk.total === 0 ? (
                      <EmptyState message="No inventory records available." />
                    ) : (
                      <div className="mt-2 space-y-2">
                        <BarMetric
                          label="Critical"
                          value={inventoryRisk.critical}
                          total={inventoryRisk.total}
                          tone="critical"
                        />
                        <BarMetric
                          label="Warning"
                          value={Math.max(0, inventoryRisk.warning)}
                          total={inventoryRisk.total}
                          tone="warning"
                        />
                        <BarMetric
                          label="Healthy"
                          value={inventoryRisk.healthy}
                          total={inventoryRisk.total}
                          tone="success"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
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
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/reports"
                    className="inline-flex rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    Open Reports
                  </Link>
                  {reportsExportReady ? (
                    <a
                      href="/api/reports/export"
                      className="inline-flex rounded-lg border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      Export CSV
                    </a>
                  ) : null}
                </div>
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={200}
                className="rounded-2xl border border-slate-300/80 bg-white p-6 shadow-soft dark:border-slate-500/75 dark:bg-slate-900/85"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  System Health / Integration Status
                </h2>
                <div className="mt-3 grid gap-2">
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
              </FadeContent>
            </aside>

            <section className="order-2 space-y-5 xl:order-1">
              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={80}
                className=""
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {summaryStrip.map((item) => (
                    <SummaryStripItem
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      href={item.href}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={110}
                className="rounded-2xl border border-red-500/35 bg-gradient-to-br from-red-50/90 via-amber-50/80 to-white p-5 shadow-soft dark:from-red-950/25 dark:via-amber-950/20 dark:to-slate-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    Needs Attention
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-500/35 bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-800 dark:text-red-200">
                    Immediate Queue
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  Urgent, blocked, and waiting items sorted by operational risk.
                </p>

                {needsAttentionQueue.length === 0 ? (
                  <EmptyState message="No urgent queue items from tasks, requests, work orders, or inventory." />
                ) : (
                  <ul className="mt-4 space-y-2.5">
                    {needsAttentionQueue.map((item) => (
                      <li
                        key={item.key}
                        className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 dark:border-slate-600/70 dark:bg-slate-900/65"
                      >
                        <div className="flex flex-wrap items-center gap-2.5">
                          <Badge
                            label={item.signal}
                            tone={item.severity === 1 ? "critical" : "warning"}
                          />
                          <Badge label={item.source} tone="neutral" />
                          <Badge
                            label={item.priority}
                            tone={item.severity === 1 ? "critical" : "warning"}
                          />
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {formatDate(item.time)}
                          </span>
                        </div>
                        <Link
                          href={item.href}
                          className="mt-2 block text-[15px] font-semibold leading-snug text-slate-900 hover:text-accent dark:text-slate-100"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-[12px] text-slate-700 dark:text-slate-400">
                          {item.status}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex justify-end">
                  <Link
                    href="/tasks?status=blocked"
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    View all queue items
                  </Link>
                </div>
              </FadeContent>

              <FadeContent
                as="article"
                blur={true}
                duration={700}
                delay={140}
                className="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-soft dark:border-slate-500/75 dark:bg-slate-900/85"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Queue Breakdown
                </h2>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  Category-level command view for current pressure points.
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <AttentionBucket
                    title="Overdue tasks"
                    count={overdueTasks.length}
                    items={overdueTasks.slice(0, 2).map((task) => ({
                      key: `overdue-${task.id}`,
                      label: task.title,
                      href: `/tasks/${task.id}`,
                    }))}
                  />
                  <AttentionBucket
                    title="Blocked tasks"
                    count={blockedTasks.length}
                    items={blockedTasks.slice(0, 2).map((task) => ({
                      key: `blocked-${task.id}`,
                      label: task.title,
                      href: `/tasks/${task.id}`,
                    }))}
                  />
                  <AttentionBucket
                    title="High-priority work"
                    count={highPriorityTasks.length}
                    items={highPriorityTasks.slice(0, 2).map((task) => ({
                      key: `high-${task.id}`,
                      label: task.title,
                      href: `/tasks/${task.id}`,
                    }))}
                  />
                  <AttentionBucket
                    title="Unassigned items"
                    count={unassignedItems.length}
                    items={unassignedItems.slice(0, 2).map((item) => ({
                      key: item.key,
                      label: `${item.title} (${item.source})`,
                      href: item.href,
                    }))}
                  />
                  <AttentionBucket
                    title="Requests waiting review"
                    count={waitingRequests.length}
                    items={waitingRequests.slice(0, 2).map((request) => ({
                      key: `request-${request.id}`,
                      label: `${request.request_id} - ${request.title}`,
                      href: "/requests",
                    }))}
                  />
                  <AttentionBucket
                    title="Low inventory"
                    count={lowInventoryItems.length}
                    items={lowInventoryItems.slice(0, 2).map((item) => ({
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
                delay={170}
                className="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-soft dark:border-slate-500/75 dark:bg-slate-900/85"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Priority Watchlist
                </h2>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  Critical queue across tasks, work orders, requests, and
                  inventory.
                </p>

                {priorityWatchlist.length === 0 ? (
                  <EmptyState message="No critical watchlist items right now." />
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="px-2 py-2 font-semibold">Title</th>
                          <th className="px-2 py-2 font-semibold">Owner</th>
                          <th className="px-2 py-2 font-semibold">Due</th>
                          <th className="px-2 py-2 font-semibold">Status</th>
                          <th className="px-2 py-2 font-semibold">Priority</th>
                          <th className="px-2 py-2 font-semibold">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300/70 dark:divide-slate-700/70">
                        {priorityWatchlist.map((item) => (
                          <tr
                            key={item.key}
                            className="hover:bg-slate-100/70 dark:hover:bg-slate-800/40"
                          >
                            <td className="px-2 py-2">
                              <Link
                                href={item.href}
                                className="font-medium text-slate-900 hover:text-accent dark:text-slate-100"
                              >
                                {item.title}
                              </Link>
                            </td>
                            <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
                              {item.owner}
                            </td>
                            <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
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
                            <td className="px-2 py-2 text-slate-700 dark:text-slate-300">
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
                delay={200}
                className="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-soft dark:border-slate-500/75 dark:bg-slate-900/85"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Today&apos;s Work
                </h2>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
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
                        key: `assigned-${item.id}`,
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
                delay={230}
                className="rounded-2xl border border-slate-300/80 bg-white p-5 shadow-soft dark:border-slate-500/75 dark:bg-slate-900/85"
              >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Recent Activity
                </h2>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
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
                        className="rounded-xl border border-slate-300/70 bg-slate-100/60 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-800/35"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {toActivityLabel(log.action)}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-300">
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
    <article className="rounded-xl border border-slate-300/80 bg-slate-50/90 p-3 dark:border-slate-700/70 dark:bg-slate-900/55">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <Badge label={String(count)} tone={count > 0 ? "warning" : "neutral"} />
      </div>
      <div className="mt-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No items.
          </p>
        ) : (
          items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="block truncate text-sm text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
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
    <article className="rounded-xl border border-slate-300/80 bg-slate-50/90 p-3 dark:border-slate-700/70 dark:bg-slate-900/55">
      <p className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </p>
      <div className="mt-2 space-y-1.5">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No items.
          </p>
        ) : (
          items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="block truncate text-sm text-slate-700 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
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
    <div className="rounded-lg border border-slate-300/80 bg-slate-100/80 px-3 py-2 dark:border-slate-700/70 dark:bg-slate-800/35">
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function SummaryStripItem({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  tone: "critical" | "warning" | "neutral";
}) {
  const toneStyles: Record<typeof tone, string> = {
    critical:
      "border-red-500/45 bg-red-500/10 hover:bg-red-500/15 text-red-900 dark:text-red-100",
    warning:
      "border-amber-500/45 bg-amber-500/10 hover:bg-amber-500/15 text-amber-900 dark:text-amber-100",
    neutral:
      "border-slate-400/45 bg-slate-100/85 hover:bg-slate-200/85 text-slate-900 dark:border-slate-600/45 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-700/70",
  };

  return (
    <Link
      href={href}
      className={`rounded-xl border px-4 py-3 transition ${toneStyles[tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-85">
        {label}
      </p>
      <p className="mt-1 text-[2rem] font-bold leading-none">{value}</p>
    </Link>
  );
}

function BarMetric({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "success" | "warning" | "critical" | "neutral";
}) {
  const pct = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));
  const trackStyles: Record<typeof tone, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    critical: "bg-red-500",
    neutral: "bg-slate-500",
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {label}
        </span>
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
        <div
          className={`h-2 rounded-full transition-all ${trackStyles[tone]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
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
      "border-emerald-500/45 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    warning:
      "border-amber-500/45 bg-amber-500/15 text-amber-900 dark:text-amber-200",
    neutral:
      "border-slate-400/60 bg-slate-100/85 text-slate-700 dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm ${tones[tone]}`}
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
  tone: "success" | "warning" | "critical" | "neutral";
}) {
  const tones: Record<typeof tone, string> = {
    success:
      "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    warning:
      "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200",
    critical: "border-red-500/40 bg-red-500/15 text-red-800 dark:text-red-200",
    neutral:
      "border-slate-400/60 bg-slate-100/85 text-slate-700 dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-300",
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
    <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-100/70 px-3 py-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/35 dark:text-slate-300">
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
