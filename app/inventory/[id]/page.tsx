"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type InventoryItem = {
  id: number;
  item_name: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  status: string | null;
  reorder_threshold: number | null;
  notes?: string | null;
};

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = useMemo(() => {
    const id = params?.id;
    return Array.isArray(id) ? id[0] : id;
  }, [params]);

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [quantityInput, setQuantityInput] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) {
      setError("Invalid inventory id");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadItem() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/inventory/${itemId}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load inventory item (${response.status})`);
        }

        const data = (await response.json()) as InventoryItem;

        if (!cancelled) {
          setItem(data);
          setQuantityInput(data.quantity ?? 0);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load inventory item",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadItem();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  async function updateQuantity() {
    if (!itemId) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/inventory/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: quantityInput }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update quantity (${response.status})`);
      }

      const data = (await response.json()) as InventoryItem;
      setItem(data);
      setQuantityInput(data.quantity ?? quantityInput);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update quantity",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-borderSubtle bg-surface p-10 text-center text-sm text-textSecondary shadow-soft">
        Loading inventory item...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-4 rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-textSecondary hover:text-textPrimary"
        >
          ← Back to Inventory
        </button>
        <p className="text-sm text-red-700 dark:text-red-300">
          {error || "Inventory item not found"}
        </p>
      </div>
    );
  }

  const quantity = item.quantity ?? 0;
  const reorderThreshold = item.reorder_threshold;
  const showWarning =
    reorderThreshold !== null && reorderThreshold !== undefined && quantity <= reorderThreshold;

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-sm font-medium text-textSecondary hover:text-textPrimary"
      >
        ← Back to Inventory
      </button>

      <section className="space-y-4 rounded-xl border border-borderSubtle bg-surface p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold text-textPrimary">{item.item_name}</h1>
          <InventoryStatusBadge status={item.status} />
        </div>

        {showWarning ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            Warning: quantity is at or below reorder threshold.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <dl className="grid gap-3 rounded-lg border border-borderSubtle bg-bgDark p-4 sm:grid-cols-2">
          <InfoRow label="Category" value={item.category || "Uncategorized"} />
          <InfoRow label="Quantity" value={`${quantity}`} />
          <InfoRow label="Unit" value={item.unit || "-"} />
          <InfoRow label="Location" value={item.location || "-"} />
          <InfoRow
            label="Reorder Threshold"
            value={
              reorderThreshold !== null && reorderThreshold !== undefined
                ? `${reorderThreshold}`
                : "Not set"
            }
          />
        </dl>

        <section className="rounded-lg border border-borderSubtle bg-bgDark p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-textMuted">
            Adjust Quantity
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <input
              type="number"
              value={quantityInput}
              onChange={(event) => setQuantityInput(Number(event.target.value))}
              className="h-10 w-36 rounded-md border border-borderSubtle bg-surface px-3 text-sm text-textPrimary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={updateQuantity}
              disabled={saving}
              className="h-10 rounded-md bg-accent px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Updating..." : "Update Quantity"}
            </button>
          </div>
        </section>
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-textPrimary">{value}</dd>
    </div>
  );
}

function InventoryStatusBadge({ status }: { status: string | null }) {
  const normalized = (status || "in_stock").toLowerCase();
  const styles: Record<string, string> = {
    in_stock: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    low_stock: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    out_of_stock: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  };

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[normalized] || styles.in_stock}`}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
}
