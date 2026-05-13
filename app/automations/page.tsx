"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowClockwise,
  CheckCircle,
  Lightning,
  Warning,
} from "phosphor-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type AutomationEventStatus = "pending" | "sent" | "failed" | "config_missing";

type AutomationEvent = {
  id: string;
  event_type: string;
  source_module: string;
  entity_type: string | null;
  payload: Record<string, unknown>;
  status: AutomationEventStatus;
  response_status: number | null;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
};

type AutomationStatus = {
  checkedAt: string;
  healthState: "healthy" | "degraded" | "config_missing";
  n8n: {
    baseUrl: string;
    genericWebhookConfigured: boolean;
    configuredWebhooks: string[];
    webhookSecretConfigured: boolean;
    anyWebhookConfigured: boolean;
  };
  counts: Record<AutomationEventStatus, number>;
  lastSuccessfulEvent: AutomationEvent | null;
  lastFailedEvent: AutomationEvent | null;
};

type AutomationEventsResponse = {
  events: AutomationEvent[];
};

const STATUS_LABELS: Record<AutomationEventStatus, string> = {
  pending: "Pending",
  sent: "Sent",
  failed: "Failed",
  config_missing: "Config Missing",
};

export default function AutomationsPage() {
  const [status, setStatus] = useState<AutomationStatus | null>(null);
  const [events, setEvents] = useState<AutomationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  async function loadAutomations() {
    try {
      setLoading(true);
      setError(null);
      const [statusResponse, eventsResponse] = await Promise.all([
        fetch("/api/automations/status", { cache: "no-store" }),
        fetch("/api/automation-events?limit=75", { cache: "no-store" }),
      ]);

      if (!statusResponse.ok) {
        throw new Error(
          `Failed to load automation status (${statusResponse.status})`,
        );
      }
      if (!eventsResponse.ok) {
        throw new Error(
          `Failed to load automation events (${eventsResponse.status})`,
        );
      }

      setStatus((await statusResponse.json()) as AutomationStatus);
      const eventPayload =
        (await eventsResponse.json()) as AutomationEventsResponse;
      setEvents(eventPayload.events ?? []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load automations",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAutomations();
  }, []);

  const failedEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.status === "failed" || event.status === "config_missing",
      ),
    [events],
  );

  async function retryEvent(eventId: string) {
    try {
      setRetryingId(eventId);
      setError(null);
      const response = await fetch("/api/automations/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });
      if (!response.ok) {
        throw new Error(`Retry failed (${response.status})`);
      }
      await loadAutomations();
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "Failed to retry automation event",
      );
    } finally {
      setRetryingId(null);
    }
  }

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
          <ShinyText>Automations</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          Durable workflow event logs, n8n dispatch status, and retry controls
          for internal operations.
        </p>
      </FadeContent>

      {error ? (
        <ErrorPanel message={error} onRetry={() => void loadAutomations()} />
      ) : null}

      {loading ? (
        <LoadingPanel label="Loading automation events..." />
      ) : status ? (
        <>
          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={90}
            className="grid gap-4 md:grid-cols-4"
          >
            <StatusCard
              label="Dispatch Health"
              value={formatLabel(status.healthState)}
              tone={status.healthState === "healthy" ? "good" : "warn"}
            />
            <StatusCard
              label="Webhook Target"
              value={status.n8n.anyWebhookConfigured ? "Configured" : "Missing"}
              tone={status.n8n.anyWebhookConfigured ? "good" : "warn"}
            />
            <StatusCard
              label="Webhook Secret"
              value={
                status.n8n.webhookSecretConfigured ? "Configured" : "Missing"
              }
              tone={status.n8n.webhookSecretConfigured ? "good" : "warn"}
            />
            <StatusCard
              label="n8n Base URL"
              value={
                status.n8n.baseUrl === "Not configured"
                  ? "Missing"
                  : "Configured"
              }
              tone={status.n8n.baseUrl === "Not configured" ? "warn" : "good"}
            />
          </FadeContent>

          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={120}
            className="grid gap-4 md:grid-cols-4"
          >
            {Object.entries(status.counts).map(([key, value]) => (
              <MetricCard
                key={key}
                label={STATUS_LABELS[key as AutomationEventStatus]}
                value={value}
                status={key as AutomationEventStatus}
              />
            ))}
          </FadeContent>

          <FadeContent
            as="section"
            blur={true}
            duration={800}
            delay={150}
            className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]"
          >
            <EventTable
              events={events}
              retryingId={retryingId}
              onRetry={retryEvent}
            />
            <FailurePanel
              events={failedEvents}
              retryingId={retryingId}
              onRetry={retryEvent}
            />
          </FadeContent>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn";
}) {
  return (
    <article className="glass-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
          {label}
        </p>
        {tone === "good" ? (
          <CheckCircle className="h-5 w-5 text-emerald-500" weight="duotone" />
        ) : (
          <Warning className="h-5 w-5 text-amber-500" weight="duotone" />
        )}
      </div>
      <p className="mt-3 text-2xl font-semibold text-textPrimary">{value}</p>
    </article>
  );
}

function MetricCard({
  label,
  value,
  status,
}: {
  label: string;
  value: number;
  status: AutomationEventStatus;
}) {
  return (
    <article className="glass-surface p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
            {label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-textPrimary">
            {value}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>
    </article>
  );
}

function EventTable({
  events,
  retryingId,
  onRetry,
}: {
  events: AutomationEvent[];
  retryingId: string | null;
  onRetry: (eventId: string) => Promise<void>;
}) {
  return (
    <section className="glass-surface overflow-hidden">
      <div className="border-b border-white/20 p-5 dark:border-white/10">
        <h2 className="text-lg font-semibold text-textPrimary">
          Recent Events
        </h2>
        <p className="mt-1 text-sm text-textSecondary">
          Stored workflow events from production routes and n8n dispatch
          attempts.
        </p>
      </div>
      {events.length === 0 ? (
        <div className="p-8 text-sm text-textSecondary">
          No automation events have been recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/15 text-sm dark:divide-white/10">
            <thead className="bg-white/30 text-left text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
              <tr>
                <th className="px-5 py-3 font-semibold">Event</th>
                <th className="px-5 py-3 font-semibold">Source</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                <th className="px-5 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/15 dark:divide-white/10">
              {events.map((event) => (
                <tr key={event.id} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-medium text-textPrimary">
                      {formatLabel(event.event_type)}
                    </p>
                    <p className="mt-1 text-xs text-textMuted">
                      {event.entity_type ?? "workflow"}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-textSecondary">
                    {formatLabel(event.source_module)}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-5 py-4 text-textSecondary">
                    {formatDate(event.created_at)}
                  </td>
                  <td className="px-5 py-4">
                    {event.status === "failed" ||
                    event.status === "config_missing" ? (
                      <RetryButton
                        eventId={event.id}
                        retryingId={retryingId}
                        onRetry={onRetry}
                      />
                    ) : (
                      <span className="text-xs text-textMuted">No action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FailurePanel({
  events,
  retryingId,
  onRetry,
}: {
  events: AutomationEvent[];
  retryingId: string | null;
  onRetry: (eventId: string) => Promise<void>;
}) {
  return (
    <aside className="glass-surface p-5">
      <div className="flex items-center gap-2">
        <Lightning className="h-5 w-5 text-accent" weight="duotone" />
        <h2 className="text-lg font-semibold text-textPrimary">
          Needs Attention
        </h2>
      </div>
      <div className="mt-5 space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-textSecondary">
            No failed or unconfigured automation events.
          </p>
        ) : (
          events.slice(0, 8).map((event) => (
            <article
              key={event.id}
              className="rounded-lg border border-white/20 bg-white/35 p-4 dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-textPrimary">
                    {formatLabel(event.event_type)}
                  </p>
                  <p className="mt-1 text-xs text-textMuted">
                    {formatDate(event.created_at)}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </div>
              {event.error_message ? (
                <p className="mt-3 text-sm leading-6 text-textSecondary">
                  {event.error_message}
                </p>
              ) : null}
              <div className="mt-4">
                <RetryButton
                  eventId={event.id}
                  retryingId={retryingId}
                  onRetry={onRetry}
                />
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}

function RetryButton({
  eventId,
  retryingId,
  onRetry,
}: {
  eventId: string;
  retryingId: string | null;
  onRetry: (eventId: string) => Promise<void>;
}) {
  const isRetrying = retryingId === eventId;
  return (
    <button
      type="button"
      onClick={() => void onRetry(eventId)}
      disabled={Boolean(retryingId)}
      className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/45 px-3 py-1.5 text-xs font-semibold text-textPrimary transition-colors hover:bg-white/65 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
    >
      <ArrowClockwise
        className={isRetrying ? "h-4 w-4 animate-spin" : "h-4 w-4"}
      />
      {isRetrying ? "Retrying" : "Retry"}
    </button>
  );
}

function StatusBadge({ status }: { status: AutomationEventStatus }) {
  const classes: Record<AutomationEventStatus, string> = {
    sent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    pending: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    failed: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
    config_missing:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${classes[status]}`}
    >
      {STATUS_LABELS[status]}
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

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200/70 bg-red-50/70 p-5 text-sm text-red-700 shadow-glass backdrop-blur-2xl dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-100 dark:border-red-500/40 dark:hover:bg-red-500/10"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-surface p-8 text-center text-sm text-textSecondary">
      Automation status is unavailable.
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
