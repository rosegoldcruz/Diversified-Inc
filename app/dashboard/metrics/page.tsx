"use client";

import { useEffect, useState } from "react";
import {
  ArrowsClockwise,
  Briefcase,
  ClipboardText,
  Package,
  Users,
  Warning,
} from "phosphor-react";
import { Button } from "@/components/ui/button";
import { ShinyText } from "@/components/ui/ShinyText";

type DashboardStats = {
  total_tasks: number;
  open_work_orders: number;
  low_stock_items: number;
  total_employees: number;
  high_priority_tasks: number;
  blocked_tasks: number;
};

type MetricCard = {
  label: string;
  value: number;
  description: string;
  tone: "default" | "warning" | "critical";
  icon: typeof ClipboardText;
};

export default function MetricsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(
          `Failed to load dashboard metrics (${response.status})`,
        );
      }
      setStats((await response.json()) as DashboardStats);
      setLastRefresh(new Date());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load dashboard metrics",
      );
    } finally {
      setLoading(false);
    }
  }

  const metrics: MetricCard[] = stats
    ? [
        {
          label: "Total Tasks",
          value: stats.total_tasks,
          description: "Tracked execution items",
          tone: "default",
          icon: ClipboardText,
        },
        {
          label: "Open Work Orders",
          value: stats.open_work_orders,
          description: "Operational work not completed",
          tone: stats.open_work_orders > 0 ? "warning" : "default",
          icon: Briefcase,
        },
        {
          label: "Low Stock Items",
          value: stats.low_stock_items,
          description: "Inventory records needing attention",
          tone: stats.low_stock_items > 0 ? "warning" : "default",
          icon: Package,
        },
        {
          label: "Employees",
          value: stats.total_employees,
          description: "People in the workspace directory",
          tone: "default",
          icon: Users,
        },
        {
          label: "High Priority Tasks",
          value: stats.high_priority_tasks,
          description: "Priority work requiring focus",
          tone: stats.high_priority_tasks > 0 ? "warning" : "default",
          icon: Warning,
        },
        {
          label: "Blocked Tasks",
          value: stats.blocked_tasks,
          description: "Work that needs intervention",
          tone: stats.blocked_tasks > 0 ? "critical" : "default",
          icon: Warning,
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            <ShinyText>Operations Metrics</ShinyText>
          </h1>
          <p className="text-sm text-neutral-400">
            PostgreSQL-backed workspace metrics
            {lastRefresh
              ? ` | Last updated: ${lastRefresh.toLocaleTimeString()}`
              : null}
          </p>
        </div>
        <Button
          onClick={() => void loadDashboard()}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <ArrowsClockwise
            className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            weight="bold"
          />
          Refresh
        </Button>
      </header>

      {error ? (
        <div className="rounded-md border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-3 rounded-md border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-100 transition-colors hover:bg-red-900/40"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading && !stats ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-12 text-center text-sm text-neutral-400">
          Loading operations metrics...
        </div>
      ) : null}

      {stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article
                key={metric.label}
                className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="rounded-md border border-neutral-800 bg-neutral-950/80 p-2">
                    <Icon className="h-5 w-5 text-blue-300" weight="duotone" />
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-medium ${
                      metric.tone === "critical"
                        ? "border-red-500/40 bg-red-500/10 text-red-200"
                        : metric.tone === "warning"
                          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                          : "border-neutral-700 bg-neutral-950 text-neutral-300"
                    }`}
                  >
                    {metric.tone === "default" ? "Current" : "Attention"}
                  </span>
                </div>
                <p className="text-sm text-neutral-400">{metric.label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  {metric.value.toLocaleString()}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {metric.description}
                </p>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
