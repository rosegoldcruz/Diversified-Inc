"use client";

import { useState } from "react";
import { Zap, CheckCircle, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AutomationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const stats = {
    total: 0,
    active: 0,
    totalRuns: 0,
    successRate: 0,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Automations & Workflows
          </h1>
          <p className="text-sm text-neutral-400">
            Cron tasks and event-triggered automations
          </p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
          <Zap className="w-4 h-4 mr-2" />
          New Automation
        </Button>
      </header>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-amber-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-neutral-400">Total Automations</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-xs text-neutral-400">Active</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.totalRuns.toLocaleString()}
              </p>
              <p className="text-xs text-neutral-400">Total Runs</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">
                {stats.successRate.toFixed(1)}%
              </p>
              <p className="text-xs text-neutral-400">Success Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-48 rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="disabled">Disabled</option>
          <option value="error">Error</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full md:w-48 rounded-md bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/60"
        >
          <option value="">All types</option>
          <option value="trigger">Trigger</option>
          <option value="scheduled">Scheduled</option>
          <option value="webhook">Webhook</option>
        </select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStatusFilter("");
            setTypeFilter("");
          }}
          className="border-neutral-700 text-neutral-200 hover:bg-neutral-800 md:ml-auto"
        >
          Refresh
        </Button>
      </div>

      {/* Automations Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-neutral-800 bg-neutral-950/70">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900/80 border-b border-neutral-800 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-neutral-400">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-400">
                Type
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-400">
                Trigger
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-400">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-400">
                Runs
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-400">
                Success
              </th>
              <th className="px-4 py-3 text-left font-medium text-neutral-400">
                Last Run
              </th>
              <th className="px-4 py-3 text-right font-medium text-neutral-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-neutral-500 text-sm"
              >
                <p>No automations configured</p>
                <p className="mt-1 text-xs text-neutral-600">
                  Automations will appear here once connected to the workflow
                  engine.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
