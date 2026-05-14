"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Archive, FileText, Image } from "phosphor-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type FileRecord = {
  id: number;
  file_id: string;
  file_name: string;
  file_type: string;
  linked_job: string | null;
  file_size: string | null;
  mime_type: string | null;
  download_url: string;
  linked_entity_type: string | null;
  linked_entity_id: number | null;
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("document");
  const [linkedEntityType, setLinkedEntityType] = useState("");
  const [linkedEntityId, setLinkedEntityId] = useState("");
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

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedFile) {
      setUploadError("Choose a file to upload.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("category", uploadCategory);
      if (linkedEntityType && linkedEntityId) {
        formData.append("linked_entity_type", linkedEntityType);
        formData.append("linked_entity_id", linkedEntityId);
      }

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data && typeof data.error === "string"
            ? data.error
            : `Failed to upload file (${response.status})`,
        );
      }

      const created = data as FileRecord;
      setFiles((current) => [created, ...current]);
      setSelectedFile(null);
      setUploadCategory("document");
      setLinkedEntityType("");
      setLinkedEntityId("");
      const input = document.getElementById(
        "file-upload",
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      setUploadSuccess(`Uploaded ${created.file_name}.`);
    } catch (uploadErrorValue) {
      setUploadError(
        uploadErrorValue instanceof Error
          ? uploadErrorValue.message
          : "Failed to upload file",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="space-y-1"
      >
        <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
          <ShinyText>Files</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          Internal file records linked to operational records and work orders.
        </p>
      </FadeContent>

      <FadeContent
        blur={true}
        duration={800}
        delay={90}
        className="glass-surface p-5"
      >
        <form onSubmit={uploadFile} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-textPrimary">
              Upload File
            </h2>
            <p className="mt-1 text-sm text-textSecondary">
              Store supporting files with metadata and optional work links.
            </p>
          </div>

          {uploadError ? <ErrorPanel message={uploadError} /> : null}
          {uploadSuccess ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 shadow-soft dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
              {uploadSuccess}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(10rem,0.5fr)_minmax(10rem,0.5fr)_minmax(8rem,0.4fr)]">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
              File
              <input
                id="file-upload"
                type="file"
                onChange={(event) =>
                  setSelectedFile(event.target.files?.[0] ?? null)
                }
                className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 py-2 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
              Type
              <select
                value={uploadCategory}
                onChange={(event) => setUploadCategory(event.target.value)}
                className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
              >
                {FILE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
              Linked Type
              <select
                value={linkedEntityType}
                onChange={(event) => setLinkedEntityType(event.target.value)}
                className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
              >
                <option value="">None</option>
                <option value="task">Task</option>
                <option value="request">Request</option>
                <option value="work_order">Work Order</option>
                <option value="sop">SOP</option>
                <option value="inventory">Inventory</option>
                <option value="employee">Employee</option>
                <option value="document">Document</option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-textMuted">
              Linked ID
              <input
                type="number"
                min="1"
                value={linkedEntityId}
                onChange={(event) => setLinkedEntityId(event.target.value)}
                disabled={!linkedEntityType}
                className="h-11 rounded-xl border border-white/30 bg-white/55 px-3 text-sm font-medium normal-case text-textPrimary outline-none backdrop-blur-xl transition-all disabled:cursor-not-allowed disabled:opacity-60 focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-accent/90 px-5 text-sm font-semibold text-white shadow-glass ring-1 ring-white/20 backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-accent hover:shadow-glassHover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </form>
      </FadeContent>

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={120}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard label="Total Files" value={metrics.total} />
        <StatCard label="Contracts" value={metrics.contracts} />
        <StatCard label="Photos" value={metrics.photos} />
        <StatCard label="Permits" value={metrics.permits} />
      </FadeContent>

      <FadeContent
        blur={true}
        duration={800}
        delay={140}
        className="glass-surface p-5"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search files or linked records"
            className="h-10 w-full rounded-xl border border-white/30 bg-white/55 px-3 text-sm text-textPrimary outline-none backdrop-blur-xl transition-colors placeholder:text-textDisabled focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5 md:w-64"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="h-10 rounded-xl border border-white/30 bg-white/55 px-3 text-sm text-textPrimary outline-none backdrop-blur-xl transition-colors focus:border-white/60 focus:bg-white/80 focus:ring-4 focus:ring-white/25 dark:border-white/10 dark:bg-white/5"
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
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading files..." />
      ) : (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={150}
          className="glass-surface overflow-hidden"
        >
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">File Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Linked Record</th>
                  <th className="px-4 py-3 font-semibold">Uploaded By</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Download</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
                {filteredFiles.map((file) => {
                  const Icon = getFileIcon(file.file_type);
                  return (
                    <tr
                      key={file.id}
                      className="transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                    >
                      <td className="px-4 py-3 text-textMuted">
                        {file.file_id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Icon
                            className="h-4 w-4 shrink-0 text-accent"
                            weight="duotone"
                          />
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
                      <td className="px-4 py-3">
                        <a
                          href={file.download_url}
                          className="text-sm font-semibold text-accent hover:text-accentSoft"
                        >
                          Download
                        </a>
                      </td>
                    </tr>
                  );
                })}

                {filteredFiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
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
                <article key={file.id} className="glass-surface p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2">
                      <Icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        weight="duotone"
                      />
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
                      label="Linked Record"
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
                  <a
                    href={file.download_url}
                    className="mt-4 inline-flex text-sm font-semibold text-accent hover:text-accentSoft"
                  >
                    Download
                  </a>
                </article>
              );
            })}

            {filteredFiles.length === 0 ? (
              <article className="rounded-lg border border-dashed border-borderSubtle bg-bgDark p-6 text-center text-sm text-textSecondary">
                No files match the selected filters.
              </article>
            ) : null}
          </div>
        </FadeContent>
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
