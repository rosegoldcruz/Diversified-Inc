"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

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
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
          <ShinyText>Inventory</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          Live stock levels, locations, and reorder warnings from PostgreSQL
          inventory records.
        </p>
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading inventory..." />
      ) : (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={100}
          className="glass-surface overflow-hidden"
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-semibold">Item</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Unit</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
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
                      className="cursor-pointer transition-colors hover:bg-white/45 dark:hover:bg-white/5"
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
                  className="glass-surface cursor-pointer p-5 transition-colors"
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
        </FadeContent>
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
    <div className="glass-surface p-12 text-center text-sm text-textSecondary">
      {label}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-5 text-sm text-red-700 shadow-glass backdrop-blur-2xl dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
      {message}
    </div>
  );
}
