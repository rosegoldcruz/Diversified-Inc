"use client";

type DocumentStatus = "Signed" | "Pending" | "Draft";
type DocumentType =
  | "Contract"
  | "Quote"
  | "Permit"
  | "Completion Record"
  | "QC Photos";

type InternalDocument = {
  id: string;
  documentName: string;
  type: DocumentType;
  linkedJobOrWorkOrder: string;
  status: DocumentStatus;
  uploadedDate: string;
};

const documents: InternalDocument[] = [
  {
    id: "DOC-2026-201",
    documentName: "North Valley Apartment Contract",
    type: "Contract",
    linkedJobOrWorkOrder: "WO-8824",
    status: "Signed",
    uploadedDate: "May 9, 2026",
  },
  {
    id: "DOC-2026-202",
    documentName: "Elm Street Cabinet Quote",
    type: "Quote",
    linkedJobOrWorkOrder: "JOB-4512",
    status: "Pending",
    uploadedDate: "May 8, 2026",
  },
  {
    id: "DOC-2026-203",
    documentName: "Downtown Fire Permit Packet",
    type: "Permit",
    linkedJobOrWorkOrder: "WO-8820",
    status: "Draft",
    uploadedDate: "May 8, 2026",
  },
  {
    id: "DOC-2026-204",
    documentName: "Warehouse Remodel Completion Record",
    type: "Completion Record",
    linkedJobOrWorkOrder: "JOB-4487",
    status: "Signed",
    uploadedDate: "May 7, 2026",
  },
  {
    id: "DOC-2026-205",
    documentName: "Fleet Bay QC Photos Set A",
    type: "QC Photos",
    linkedJobOrWorkOrder: "WO-8815",
    status: "Pending",
    uploadedDate: "May 7, 2026",
  },
  {
    id: "DOC-2026-206",
    documentName: "Main Office Expansion Contract",
    type: "Contract",
    linkedJobOrWorkOrder: "JOB-4526",
    status: "Pending",
    uploadedDate: "May 6, 2026",
  },
  {
    id: "DOC-2026-207",
    documentName: "West Service Yard Permit Renewal",
    type: "Permit",
    linkedJobOrWorkOrder: "WO-8830",
    status: "Signed",
    uploadedDate: "May 6, 2026",
  },
];

const statusStyles: Record<DocumentStatus, string> = {
  Signed:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Pending:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Draft:
    "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
};

const typeStyles: Record<DocumentType, string> = {
  Contract:
    "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  Quote: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  Permit:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Completion Record":
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "QC Photos":
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

export default function DocumentsPage() {
  const signedCount = documents.filter(
    (document) => document.status === "Signed",
  ).length;
  const pendingCount = documents.filter(
    (document) => document.status === "Pending",
  ).length;
  const draftCount = documents.filter(
    (document) => document.status === "Draft",
  ).length;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-navy">Documents</h1>
        <p className="text-sm text-textMuted">
          Internal contracts, quotes, permits, completion records, and QC photos
          linked to active work.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Signed" value={signedCount} />
        <SummaryCard label="Pending" value={pendingCount} />
        <SummaryCard label="Draft" value={draftCount} />
      </section>

      <section className="overflow-hidden rounded-xl border border-borderSubtle bg-surface/95 shadow-soft backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="bg-surfaceSoft text-xs uppercase tracking-wide text-textMuted">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Document Name</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Linked Job/WO</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Uploaded Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSubtle">
              {documents.map((document) => (
                <tr
                  key={document.id}
                  className="transition-colors hover:bg-bgDark"
                >
                  <td className="px-4 py-3 text-textMuted">{document.id}</td>
                  <td className="px-4 py-3 font-medium text-textPrimary">
                    {document.documentName}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${typeStyles[document.type]}`}
                    >
                      {document.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-textSecondary">
                    {document.linkedJobOrWorkOrder}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[document.status]}`}
                    >
                      {document.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-textSecondary">
                    {document.uploadedDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-borderSubtle bg-surface/95 p-5 shadow-soft backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
    </div>
  );
}
