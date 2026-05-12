"use client";

import { useEffect, useMemo, useState } from "react";
import { Archive, FileText, Image } from "lucide-react";

type FileRecord = {
  id: number;
  file_id: string;
  file_name: string;
  file_type: string;
  linked_job: string | null;
  file_size: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
};

const FILE_TYPES = [
  "contract",
  "photo",
  "document",
  "permit",
  "archive",
  "invoice",
];

export default function FilesPage() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFiles() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/files", { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Failed to load files (${response.status})`);
        }

        const data = (await response.json()) as FileRecord[];
        if (!cancelled) {
          setFiles(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load files",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadFiles();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return files.filter((file) => {
      const matchesSearch =
        query.length === 0 ||
        file.file_name.toLowerCase().includes(query) ||
        (file.linked_job || "").toLowerCase().includes(query);
      const matchesType =
        typeFilter.length === 0 || file.file_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [files, search, typeFilter]);

  const metrics = useMemo(() => {
    return {
      total: files.length,
      contracts: files.filter((file) => file.file_type === "contract").length,
      photos: files.filter((file) => file.file_type === "photo").length,
      permits: files.filter((file) => file.file_type === "permit").length,
    };
  }, [files]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-textPrimary md:text-3xl">
            Files
          </h1>
          <p className="max-w-3xl text-sm text-textSecondary">
            Internal file records linked to jobs and work orders.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Coming soon"
          className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-md border border-accent bg-accent px-4 text-sm font-semibold text-white opacity-50"
        >
          Upload File
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Files" value={metrics.total} />
        <StatCard label="Contracts" value={metrics.contracts} />
        <StatCard label="Photos" value={metrics.photos} />
        <StatCard label="Permits" value={metrics.permits} />
      </section>

      <div className="rounded-xl border border-borderSubtle bg-surface/95 p-5 shadow-soft backdrop-blur-xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files or linked jobs"
            className="h-10 w-full rounded-md border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary outline-none transition-colors placeholder:text-textDisabled focus:border-accent focus:ring-2 focus:ring-accent/20 md:w-64"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-10 rounded-md border border-borderSubtle bg-bgDark px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            <option value="">All Types</option>
            {FILE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <span className="text-sm text-textMuted md:ml-auto">
            {filteredFiles.length} / {files.length} files
          </span>
        </div>
      </div>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading files..." />
      ) : (
        <section className="overflow-hidden rounded-xl border border-borderSubtle bg-surface/95 shadow-soft backdrop-blur-xl">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-surfaceSoft text-xs uppercase tracking-wide text-textMuted">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">File Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Linked Job</th>
                  <th className="px-4 py-3 font-semibold">Uploaded By</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.file_type);
                  return (
                    <tr
                      key={file.id}
                      className="transition-colors hover:bg-bgDark"
                    >
                      <td className="px-4 py-3 text-textMuted">
                        {file.file_id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 shrink-0 text-accent" />
                          <span className="font-medium text-textPrimary">
                            {file.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={file.file_type} />
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        {file.linked_job || "-"}
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        {file.uploaded_by || "Unknown"}
                      </td>
                      <td className="px-4 py-3 text-textSecondary">
                        {formatDate(file.uploaded_at)}
                      </td>
                    </tr>
                  );
                })}

                {filteredFiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-textSecondary"
                    >
                      No files match the selected filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 p-4 md:hidden">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.file_type);
              return (
                <article
                  key={file.id}
                  className="rounded-lg border border-borderSubtle bg-bgDark p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <div className="min-w-0">
                        <h2 className="break-words font-medium text-textPrimary">
                          {file.file_name}
                        </h2>
                        <p className="mt-1 text-xs text-textMuted">
                          {file.file_id}
                        </p>
                      </div>
                    </div>
                    <TypeBadge type={file.file_type} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <MobileField
                      label="Linked Job"
                      value={file.linked_job || "-"}
                    />
                    <MobileField
                      label="Size"
                      value={file.file_size || "Unknown"}
                    />
                    <MobileField
                      label="Uploaded"
                      value={formatDate(file.uploaded_at)}
                    />
                    <MobileField
                      label="By"
                      value={file.uploaded_by || "Unknown"}
                    />
                  </dl>
                </article>
              );
            })}

            {filteredFiles.length === 0 ? (
              <article className="rounded-lg border border-dashed border-borderSubtle bg-bgDark p-6 text-center text-sm text-textSecondary">
                No files match the selected filters.
              </article>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-borderSubtle bg-surface/95 p-6 shadow-soft backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-textPrimary">{value}</p>
    </article>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    contract:
      "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    photo: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    document: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    permit:
      "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    archive:
      "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    invoice:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <span
      className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${
        styles[type] || styles.document
      }`}
    >
      {type}
    </span>
  );
}

function getFileIcon(type: string) {
  if (type === "photo") return Image;
  if (type === "archive") return Archive;
  return FileText;
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </dt>
      <dd className="mt-1 text-textSecondary">{value}</dd>
    </div>
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

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}
