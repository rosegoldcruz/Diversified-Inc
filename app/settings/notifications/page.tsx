"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { ShinyText } from "@/components/ui/ShinyText";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_EVENT_TYPES,
  SETTING_KEYS,
  type NotificationChannels,
  type NotificationEventType,
  type NotificationPreferences,
} from "@/lib/settings-config";

const LABELS: Record<NotificationEventType, string> = {
  task_assigned: "Task assigned",
  task_overdue: "Task overdue",
  request_submitted: "Request submitted",
  request_approved_or_denied: "Request approved or denied",
  form_submitted: "Form submitted",
  work_order_assigned: "Work order assigned",
  low_inventory: "Low inventory",
  timesheet_submitted: "Timesheet submitted",
  weekly_leadership_summary: "Weekly leadership summary",
};

type SettingsResponse = {
  byKey?: {
    notification_preferences?: NotificationPreferences;
  };
};

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      setLoading(true);
      const response = await fetch("/api/settings", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load notification settings.");
      }

      const payload = (await response.json()) as SettingsResponse;
      setPreferences(
        payload.byKey?.notification_preferences ??
          DEFAULT_NOTIFICATION_PREFERENCES,
      );
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to load preferences";
      setMessage(text);
    } finally {
      setLoading(false);
    }
  }

  function toggleChannel(
    eventType: NotificationEventType,
    channel: keyof NotificationChannels,
  ) {
    setPreferences((current) => ({
      ...current,
      [eventType]: {
        ...current[eventType],
        [channel]: !current[eventType][channel],
      },
    }));
  }

  async function savePreferences() {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: SETTING_KEYS.notificationPreferences,
          value: preferences,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Failed to save preferences.");
      }

      setMessage("Notification preferences saved.");
      await loadPreferences();
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to save preferences";
      setMessage(text);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="p-6 text-sm text-textSecondary">
        Loading notification settings...
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-semibold text-textPrimary">
          <ShinyText>Notification Settings</ShinyText>
        </h1>
        <p className="text-sm text-textSecondary">
          Internal OS notification preferences. In-app is active now; email and
          SMS are persisted for phased rollout.
        </p>
      </section>

      <section className="glass-surface rounded-2xl p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge variant="success">Persisted</Badge>
          <Badge variant="blue">In-App Active</Badge>
          <Badge variant="warning">Email Later</Badge>
          <Badge variant="default">SMS Future Scope</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/20 text-left dark:border-white/10">
                <th className="px-2 py-2 font-medium text-textMuted">Event</th>
                <th className="px-2 py-2 font-medium text-textMuted">In-App</th>
                <th className="px-2 py-2 font-medium text-textMuted">Email</th>
                <th className="px-2 py-2 font-medium text-textMuted">SMS</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_EVENT_TYPES.map((eventType) => (
                <tr key={eventType} className="border-b border-white/10">
                  <td className="px-2 py-3 text-textPrimary">
                    {LABELS[eventType]}
                  </td>
                  <td className="px-2 py-3">
                    <ToggleButton
                      checked={preferences[eventType].inApp}
                      onChange={() => toggleChannel(eventType, "inApp")}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <ToggleButton
                      checked={preferences[eventType].email}
                      onChange={() => toggleChannel(eventType, "email")}
                    />
                  </td>
                  <td className="px-2 py-3">
                    <ToggleButton
                      checked={preferences[eventType].sms}
                      onChange={() => toggleChannel(eventType, "sms")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={() => void savePreferences()} disabled={saving}>
            {saving ? "Saving..." : "Save Notification Settings"}
          </Button>
          {message ? (
            <p className="text-xs text-textSecondary">{message}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ToggleButton({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-emerald-600" : "bg-neutral-500/50"
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
          checked ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}
