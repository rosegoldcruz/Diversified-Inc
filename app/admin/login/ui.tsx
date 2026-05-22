"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function AdminLoginForm() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setSubmitting(true);
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Admin login failed.");
      }

      pushToast("Admin access granted.", "success");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      pushToast(
        error instanceof Error ? error.message : "Admin login failed.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="text-textMuted">Current password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-10 w-full rounded-lg border border-white/20 bg-black/20 px-3 text-textPrimary"
        />
      </label>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Verifying..." : "Enter Admin Portal"}
      </Button>
    </form>
  );
}
