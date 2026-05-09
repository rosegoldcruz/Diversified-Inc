"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { Bot, Cpu, ScanSearch, Sparkles } from "lucide-react";

type StylePreset = {
  id: string;
  label: string;
  detail: string;
};

type ToolAction = {
  id: string;
  label: string;
  detail: string;
  endpoint: string;
};

type RenderJob = {
  id: string;
  style: string;
  prompt: string;
  createdAt: string;
  status: "Queued" | "Processing";
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

const STYLE_PRESETS: StylePreset[] = [
  { id: "modern-white", label: "Modern White", detail: "White shaker doors, black pulls, neutral counters" },
  { id: "warm-wood", label: "Warm Wood", detail: "Walnut slab fronts, brass hardware, warm task lighting" },
  { id: "two-tone", label: "Two Tone", detail: "White uppers, navy lowers, brushed brass accents" },
  { id: "matte-black", label: "Matte Black", detail: "Matte black faces with oak accents and brass pulls" },
];

const TOOL_ACTIONS: ToolAction[] = [
  {
    id: "summarize-job",
    label: "Summarize Job",
    detail: "Compile key job context from requests, files, and work orders.",
    endpoint: "/ai/summarize-job",
  },
  {
    id: "email-draft",
    label: "Draft Follow-Up Email",
    detail: "Generate homeowner follow-up based on quote and open scope.",
    endpoint: "/ai/email-homeowner",
  },
  {
    id: "material-check",
    label: "Material Takeoff Check",
    detail: "Validate panel, door, and hardware counts before ordering.",
    endpoint: "/ai/material-check",
  },
  {
    id: "installer-brief",
    label: "Installer Brief",
    detail: "Create one-page install brief with blockers and dependencies.",
    endpoint: "/ai/installer-brief",
  },
];

export default function AiToolsPage() {
  const [prompt, setPrompt] = useState("");
  const [roomPhoto, setRoomPhoto] = useState<File | null>(null);
  const [style, setStyle] = useState(STYLE_PRESETS[0].id);
  const [loading, setLoading] = useState(false);
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVisualize(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setRenderJob(null);

    if (!roomPhoto) {
      setError("Upload a room photo before creating an AI render job.");
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 700));
      setRenderJob({
        id: `AI-${Date.now().toString().slice(-6)}`,
        style,
        prompt,
        status: "Queued",
        createdAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to queue render job";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-navy">AI Tools</h1>
        <p className="max-w-3xl text-sm text-textMuted">
          Operational AI workspace for visualizer requests, communication drafting, and execution support. This module is
          UI-ready and structured for future PostgreSQL/NocoDB-backed job tracking.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tool Actions" value={TOOL_ACTIONS.length} icon={<Bot className="h-4 w-4" />} />
        <MetricCard label="Queued Jobs" value={renderJob ? 1 : 0} icon={<ScanSearch className="h-4 w-4" />} />
        <MetricCard label="AI Lane Status" value="Live" icon={<Sparkles className="h-4 w-4" />} />
        <MetricCard label="Endpoint Base" value={API_BASE.replace(/^https?:\/\//, "")} icon={<Cpu className="h-4 w-4" />} />
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-cyber-red dark:border-red-400/30 dark:bg-red-500/10">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-borderSubtle bg-surface p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-textPrimary">Kitchen Visualizer Queue</h2>
          <p className="mt-1 text-xs text-textMuted">
            Upload a site photo, apply a style preset, and queue an AI-assisted visualization request.
          </p>

          <form onSubmit={handleVisualize} className="mt-4 space-y-4">
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">Room Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setRoomPhoto(event.target.files?.[0] || null)}
                className="block w-full rounded-md border border-borderSubtle bg-bgDark px-3 py-2 text-xs text-textPrimary file:mr-3 file:rounded file:border-0 file:bg-navy file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">Style Preset</span>
              <select
                value={style}
                onChange={(event) => setStyle(event.target.value)}
                className="h-10 w-full rounded-md border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary outline-none transition-colors focus:border-borderFocus focus:ring-2 focus:ring-accent/20"
              >
                {STYLE_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-textMuted">{STYLE_PRESETS.find((preset) => preset.id === style)?.detail}</p>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">Additional Prompt</span>
              <textarea
                rows={3}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Keep layout unchanged, preserve flooring, add under-cabinet task lighting."
                className="w-full rounded-md border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textDisabled focus:border-borderFocus focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-md bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-[#243B63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Queuing Render..." : "Queue Render Job"}
              </button>
            </div>
          </form>

          {renderJob && (
            <div className="mt-4 rounded-lg border border-borderSubtle bg-bgDark p-3 text-sm text-textSecondary">
              <p className="font-semibold text-textPrimary">Render job {renderJob.id} queued</p>
              <p className="mt-1 text-xs">Style: {STYLE_PRESETS.find((preset) => preset.id === renderJob.style)?.label}</p>
              <p className="text-xs">Submitted: {formatDateTime(renderJob.createdAt)}</p>
            </div>
          )}
        </article>

        <article className="rounded-lg border border-borderSubtle bg-surface p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-textPrimary">Operations AI Actions</h2>
          <p className="mt-1 text-xs text-textMuted">
            AI helper actions for day-to-day execution workflows. Endpoints are listed so backend wiring is straightforward.
          </p>

          <div className="mt-4 grid gap-3">
            {TOOL_ACTIONS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                className="rounded-md border border-borderSubtle bg-bgDark px-3 py-3 text-left transition-colors hover:border-borderHover"
              >
                <p className="text-sm font-semibold text-textPrimary">{tool.label}</p>
                <p className="mt-1 text-xs text-textMuted">{tool.detail}</p>
                <p className="mt-1 font-mono text-[11px] text-accent">POST {tool.endpoint}</p>
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-md border border-dashed border-borderHover bg-bgDark p-3 text-xs text-textMuted">
            Data integration note: replace local state with persisted AI job records in PostgreSQL, and expose write-safe API
            routes/server actions for queueing and status updates.
          </div>
        </article>
      </section>
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <article className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">{label}</p>
          <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
        </div>
        <div className="rounded-md bg-bgDark p-2 text-accent">{icon}</div>
      </div>
    </article>
  );
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}
