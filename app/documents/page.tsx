"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type DocumentRecord = {
  id: number;
  title: string;
  document_type: string;
  entity_type: string | null;
  entity_id: number | null;
  status: string;
  sign_status: string;
  created_at: string | null;
  file_url: string | null;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/documents?limit=500", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Failed to load documents (${response.status})`);
        }

        const data = (await response.json()) as DocumentRecord[];
        if (!cancelled) setDocuments(data);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load documents",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  const metrics = useMemo(() => {
    return {
      signed: documents.filter((document) => document.sign_status === "signed")
        .length,
      pending: documents.filter(
        (document) => document.sign_status === "pending_signature",
      ).length,
      draft: documents.filter((document) => document.status === "draft").length,
    };
  }, [documents]);

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
            <ShinyText>Documents</ShinyText>
          </h1>
          <p className="max-w-3xl text-base text-textSecondary">
            Internal contracts, permits, completion records, and document
            records linked to active work.
          </p>
        </div>
        <Link
          href="/documents/esign"
          className="inline-flex h-10 items-center justify-center rounded-xl border border-white/30 bg-white/55 px-4 text-sm font-semibold text-textPrimary shadow-glass backdrop-blur-2xl transition hover:bg-white/80 dark:border-white/10 dark:bg-white/5"
        >
          + New Document
        </Link>
      </FadeContent>

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={90}
        className="grid gap-3 sm:grid-cols-3"
      >
        <SummaryCard label="Signed" value={metrics.signed} />
        <SummaryCard label="Pending Signature" value={metrics.pending} />
        <SummaryCard label="Draft" value={metrics.draft} />
      </FadeContent>

      {error ? <ErrorPanel message={error} /> : null}

      {loading ? (
        <LoadingPanel label="Loading documents..." />
      ) : (
        <FadeContent
          as="section"
          blur={true}
          duration={800}
          delay={120}
          className="glass-surface overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-[920px] w-full text-left text-sm">
              <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Document Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Linked Record</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Signature</th>
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/10">
                {documents.map((document) => (
                  <tr
                    key={document.id}
                    className="transition-colors hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 text-textMuted">
                      DOC-{document.id}
                    </td>
                    <td className="px-4 py-3 font-medium text-textPrimary">
                      <Link
                        href={`/documents/${document.id}`}
                        className="hover:text-accent"
                      >
                        {document.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={document.document_type} />
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {formatLinkedRecord(document)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={document.status} />
                    </td>
                    <td className="px-4 py-3">
                      <SignatureBadge status={document.sign_status} />
                    </td>
                    <td className="px-4 py-3 text-textSecondary">
                      {formatDate(document.created_at)}
                    </td>
                  </tr>
                ))}

                {documents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-textSecondary"
                    >
                      No document records have been created yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </FadeContent>
      )}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-semibold capitalize text-cyan-700 dark:text-cyan-300">
      {type.replaceAll("_", " ")}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
      {status.replaceAll("_", " ")}
    </span>
  );
}

function SignatureBadge({ status }: { status: string }) {
  const signed = status === "signed";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${
        signed
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function formatLinkedRecord(document: DocumentRecord) {
  if (!document.entity_type || !document.entity_id) return "-";
  return `${document.entity_type.replaceAll("_", " ")} #${document.entity_id}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
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
