"use client";

import { Warning } from "phosphor-react";
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

type SessionUser = {
  role: "Employee" | "Manager" | "Admin" | "Leadership";
};

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("General");
  const [quantity, setQuantity] = useState("0");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState("");
  const [reorderThreshold, setReorderThreshold] = useState("0");

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/inventory", { cache: "no-store" });
        const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load inventory (${response.status})`);
        }

        const data = (await response.json()) as InventoryItem[];
        if (!cancelled) {
          setItems(data);
          if (meResponse.ok) {
            const meData = (await meResponse.json()) as {
              user: SessionUser | null;
            };
            setMe(meData.user);
          }
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

  const canCreate =
    me?.role === "Manager" || me?.role === "Admin" || me?.role === "Leadership";

  async function createItem() {
    try {
      setCreateBusy(true);
      setCreateError(null);
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: itemName,
          category,
          quantity: Number(quantity),
          unit,
          location,
          reorder_threshold: Number(reorderThreshold),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | InventoryItem
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          (payload as { error?: string } | null)?.error ||
            `Failed to create inventory item (${response.status})`,
        );
      }
      setItems((prev) => [payload as InventoryItem, ...prev]);
      setCreateOpen(false);
      setItemName("");
      setCategory("General");
      setQuantity("0");
      setUnit("");
      setLocation("");
      setReorderThreshold("0");
    } catch (createErr) {
      setCreateError(
        createErr instanceof Error ? createErr.message : "Create failed",
      );
    } finally {
      setCreateBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
            <ShinyText>Inventory</ShinyText>
          </h1>
          <p className="max-w-3xl text-base text-textSecondary">
            Live stock levels, locations, and reorder warnings from PostgreSQL
            inventory records.
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/30 bg-white/55 px-4 text-sm font-semibold text-textPrimary shadow-glass backdrop-blur-2xl transition hover:bg-white/80 dark:border-white/10 dark:bg-white/5"
          >
            + Add Item
          </button>
        ) : null}
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
                            <Warning
                              className="h-4 w-4 text-amber-500"
                              weight="duotone"
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
                      <Warning
                        className="mt-0.5 h-4 w-4 text-amber-500"
                        weight="duotone"
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

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bgDark/55 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-borderSubtle bg-surface p-5 shadow-cyberMd">
            <h2 className="text-lg font-semibold text-textPrimary">
              Add Inventory Item
            </h2>
            <div className="mt-4 grid gap-3">
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Item name"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <input
                type="number"
                min={0}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Quantity"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Unit (optional)"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
              <input
                type="number"
                min={0}
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(e.target.value)}
                placeholder="Reorder threshold"
                className="w-full rounded-lg border border-borderSubtle bg-bgDark/80 px-3 py-2 text-sm text-textPrimary"
              />
            </div>
            {createError ? (
              <p className="mt-3 text-sm text-red-500">{createError}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-lg border border-borderSubtle px-4 py-2 text-sm font-semibold text-textPrimary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void createItem()}
                disabled={createBusy}
                className="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {createBusy ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
