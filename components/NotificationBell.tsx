"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "phosphor-react";
import { Button } from "@/components/ui/button";

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

const POLL_MS = 30_000;

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications?limit=25", {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: Notification[];
        unreadCount: number;
      };
      if (!mountedRef.current) return;
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadNotifications();
    const interval = setInterval(loadNotifications, POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [loadNotifications]);

  async function markOneRead(id: number) {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", { method: "POST" });
      await loadNotifications();
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  }

  function handleClick(notification: Notification) {
    if (!notification.read_at) {
      void markOneRead(notification.id).then(() => loadNotifications());
    }
    if (notification.link) {
      setIsOpen(false);
      router.push(notification.link);
    }
  }

  return (
    <div className="relative z-40">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative z-20 rounded-lg p-2 transition hover:bg-slate-200/80 dark:hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-textSecondary" weight="duotone" />
        {unreadCount > 0 ? (
          <span className="absolute right-0 top-0 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 z-20 flex max-h-[min(600px,calc(100vh-6rem))] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-950/10 dark:border-slate-700 dark:bg-slate-950 dark:ring-white/10">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="font-semibold text-textPrimary">Notifications</h3>
              {unreadCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  className="text-xs text-blue-500 hover:text-blue-400"
                >
                  Mark all read
                </Button>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
              {loading && notifications.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center p-8 text-center">
                  <p className="text-sm text-textMuted">Loading...</p>
                </div>
              ) : null}

              {!loading && notifications.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
                  <Bell
                    className="mb-3 h-12 w-12 text-textMuted"
                    weight="duotone"
                  />
                  <p className="text-sm font-medium text-textSecondary">
                    No notifications yet
                  </p>
                </div>
              ) : null}

              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleClick(notification)}
                      className={`cursor-pointer p-4 transition hover:bg-slate-100 dark:hover:bg-slate-900 ${
                        !notification.read_at
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-sm font-medium ${
                            !notification.read_at
                              ? "text-textPrimary"
                              : "text-textSecondary"
                          }`}
                        >
                          {notification.title}
                        </h4>
                        {!notification.read_at ? (
                          <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                        ) : null}
                      </div>
                      {notification.body ? (
                        <p className="mt-1 line-clamp-2 text-xs text-textMuted">
                          {notification.body}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-textMuted">
                        {formatRelative(notification.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function formatRelative(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
