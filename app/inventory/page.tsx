"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type InventoryItem = {
  id: number;
  item_name: string;
  category: string | null;
  quantity: number | null;
  unit: string | null;
  location: string | null;
  status: string | null;
  reorder_threshold: number | null;
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/inventory", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load inventory (${response.status})`);
        }

        const data = (await response.json()) as InventoryItem[];
        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load inventory",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
          Inventory
        </h1>
        <p className="max-w-3xl text-sm text-textSecondary">
          Live stock levels, locations, and reorder warnings from PostgreSQL
          inventory records.
        </p>
      </header>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading inventory..." />
      ) : (
        <section className="overflow-hidden rounded-xl border border-borderSubtle bg-surface/95 shadow-soft backdrop-blur-xl">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surfaceSoft text-xs uppercase tracking-wide text-textMuted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {items.map((item) => {
                  const quantity = item.quantity ?? 0;
                  const reorderThreshold = item.reorder_threshold ?? 0;
                  const showWarning =
                    item.reorder_threshold !== null &&
                    quantity <= reorderThreshold;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(`/inventory/${item.id}`)}
                      className="cursor-pointer transition-colors hover:bg-bgDark"
                    >
                      <td className="px-4 py-3 font-medium text-textPrimary">
                        <div className="flex items-center gap-2">
                          <span>{item.item_name}</span>
                          {showWarning ? (
                            <AlertTriangle
                              className="h-4 w-4 text-amber-500"
                              aria-hidden="true"
                            />
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        {item.category || "Uncategorized"}
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        {quantity}
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        {item.unit || "-"}
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        {item.location || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <InventoryStatusBadge status={item.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {items.map((item) => {
              const quantity = item.quantity ?? 0;
              const reorderThreshold = item.reorder_threshold ?? 0;
              const showWarning =
                item.reorder_threshold !== null && quantity <= reorderThreshold;

              return (
                <article
                  key={item.id}
                  onClick={() => router.push(`/inventory/${item.id}`)}
                  className="cursor-pointer rounded-lg border border-borderSubtle bg-bgDark p-4 transition-colors hover:bg-surface"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-medium text-textPrimary">
                        {item.item_name}
                      </h2>
                      <p className="mt-1 text-sm text-textSecondary">
                        {item.category || "Uncategorized"}
                      </p>
                    </div>
                    {showWarning ? (
                      <AlertTriangle
                        className="mt-0.5 h-4 w-4 text-amber-500"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-sm text-textSecondary">
                      {quantity}
                      {item.unit ? ` ${item.unit}` : ""}
                    </p>
                    <InventoryStatusBadge status={item.status} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function InventoryStatusBadge({ status }: { status: string | null }) {
  const normalized = (status || "in_stock").toLowerCase();
  const styles: Record<string, string> = {
    in_stock:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    low_stock:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    out_of_stock:
      "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${styles[normalized] || styles.in_stock}`}
    >
      {normalized.replaceAll("_", " ")}
    </span>
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
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-soft dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
