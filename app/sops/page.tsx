"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SopCard } from "@/components/sop-card";
import { mockSops } from "@/app/lib/mockData";
import type { SopCategory, SopStatus } from "@/types/workspace";

const STATUS_OPTIONS: Array<SopStatus | "All"> = ["All", "Active", "Needs Review", "Draft", "Archived"];

const CATEGORY_OPTIONS: Array<SopCategory | "All"> = [
  "All",
  "Office Procedures",
  "Field Operations",
  "Safety",
  "HR / Employee",
  "Inventory",
  "Work Orders",
  "Customer Follow-Up",
  "Billing / Admin",
];

export default function SopsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<SopStatus | "All">("All");
  const [selectedCategory, setSelectedCategory] = useState<SopCategory | "All">("All");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("All");

  const departmentOptions = useMemo(() => {
    return ["All", ...new Set(mockSops.map((sop) => sop.department).sort())];
  }, []);

  const filteredSops = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return mockSops.filter((sop) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        sop.title.toLowerCase().includes(normalizedQuery) ||
        sop.description.toLowerCase().includes(normalizedQuery) ||
        sop.owner.toLowerCase().includes(normalizedQuery);

      const matchesStatus = selectedStatus === "All" || sop.status === selectedStatus;
      const matchesCategory = selectedCategory === "All" || sop.category === selectedCategory;
      const matchesDepartment = selectedDepartment === "All" || sop.department === selectedDepartment;

      return matchesQuery && matchesStatus && matchesCategory && matchesDepartment;
    });
  }, [searchQuery, selectedStatus, selectedCategory, selectedDepartment]);

  const recentlyUpdated = useMemo(() => {
    return [...mockSops]
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
      .slice(0, 3);
  }, []);

  const stats = useMemo(
    () => ({
      total: mockSops.length,
      active: mockSops.filter((sop) => sop.status === "Active").length,
      needsReview: mockSops.filter((sop) => sop.status === "Needs Review").length,
      draft: mockSops.filter((sop) => sop.status === "Draft").length,
    }),
    [],
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-navy">SOPs</h1>
        <p className="max-w-3xl text-sm text-textMuted">
          Internal procedures and operational knowledge base for Diversified teams. Find the right process, related forms,
          files, tasks, and work order context from anywhere.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total SOPs" value={stats.total} />
        <SummaryCard label="Active SOPs" value={stats.active} />
        <SummaryCard label="Needs Review" value={stats.needsReview} />
        <SummaryCard label="Draft SOPs" value={stats.draft} />
      </section>

      <section className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">Search SOPs</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-textDisabled" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search title, description, or owner"
                className="h-10 w-full rounded-md border border-borderSubtle bg-bgDark pl-9 pr-3 text-sm text-textPrimary outline-none transition-colors placeholder:text-textDisabled focus:border-borderFocus focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </label>

          <SelectFilter
            label="Category"
            value={selectedCategory}
            onChange={(value) => setSelectedCategory(value as SopCategory | "All")}
            options={CATEGORY_OPTIONS}
          />

          <SelectFilter
            label="Status"
            value={selectedStatus}
            onChange={(value) => setSelectedStatus(value as SopStatus | "All")}
            options={STATUS_OPTIONS}
          />

          <SelectFilter
            label="Department"
            value={selectedDepartment}
            onChange={setSelectedDepartment}
            options={departmentOptions}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-textPrimary">SOP Library</h2>
          <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
            {filteredSops.length} of {mockSops.length} visible
          </p>
        </div>

        {filteredSops.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredSops.map((sop) => (
              <SopCard key={sop.id} sop={sop} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-textPrimary">Recently Updated</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {recentlyUpdated.map((sop) => (
            <article key={sop.id} className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-textDisabled">{sop.category}</p>
              <h3 className="mt-1 text-sm font-semibold text-navy">{sop.title}</h3>
              <p className="mt-2 text-xs text-textMuted">Updated {formatDate(sop.lastUpdated)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-borderSubtle bg-surface p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">{label}</p>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
    </article>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary outline-none transition-colors focus:border-borderFocus focus:ring-2 focus:ring-accent/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState() {
  return (
    <article className="rounded-lg border border-dashed border-borderHover bg-surface p-8 text-center">
      <h3 className="text-base font-semibold text-textPrimary">No SOPs match your filters</h3>
      <p className="mt-2 text-sm text-textMuted">
        Adjust the search or filter selections to find procedures, process documentation, and related operational context.
      </p>
    </article>
  );
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
