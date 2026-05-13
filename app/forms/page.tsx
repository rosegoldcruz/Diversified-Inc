"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardText, FileText, Plus, UploadSimple } from "phosphor-react";
import { FadeContent } from "@/components/ui/FadeContent";
import { ShinyText } from "@/components/ui/ShinyText";

type FormName =
  | "Work Order Request"
  | "Vehicle Request"
  | "Claim Report"
  | "PO Request"
  | "Microsoft 365 Access Request";

type FormDefinition = {
  name: FormName;
  category: string;
  description: string;
  fields: Array<
    | {
        type: "text" | "date" | "time" | "number";
        name: string;
        label: string;
        required?: boolean;
      }
    | { type: "textarea"; name: string; label: string; required?: boolean }
    | {
        type: "select";
        name: string;
        label: string;
        options: string[];
        required?: boolean;
      }
  >;
};

const formDefinitions: FormDefinition[] = [
  {
    name: "Work Order Request",
    category: "Operations",
    description:
      "Submit an operational issue for scheduling, assignment, and completion tracking.",
    fields: [
      {
        type: "select",
        name: "priority",
        label: "Priority",
        options: ["High", "Medium", "Low"],
      },
      {
        type: "select",
        name: "division",
        label: "Division",
        options: ["Operations", "Install", "Service", "Warranty"],
      },
      {
        type: "textarea",
        name: "description",
        label: "Description of Issues",
        required: true,
      },
      { type: "date", name: "date", label: "Date" },
      { type: "text", name: "truck_number", label: "Truck #" },
      { type: "text", name: "reported_by", label: "Reported By" },
    ],
  },
  {
    name: "Vehicle Request",
    category: "Operations",
    description:
      "Request a vehicle reservation for internal transport and field coordination.",
    fields: [
      {
        type: "text",
        name: "requested_by",
        label: "Requested By",
        required: true,
      },
      {
        type: "date",
        name: "needed_date",
        label: "Vehicle Needed Date",
        required: true,
      },
      { type: "time", name: "pickup_time", label: "Pickup Time" },
      { type: "time", name: "return_time", label: "Return Time" },
      {
        type: "select",
        name: "division",
        label: "Division",
        options: ["Operations", "Install", "Sales", "Service"],
      },
      { type: "textarea", name: "purpose", label: "Purpose", required: true },
    ],
  },
  {
    name: "Claim Report",
    category: "Claims",
    description:
      "Report claim incidents with severity, summary details, and supporting documentation.",
    fields: [
      { type: "date", name: "claim_date", label: "Claim Date", required: true },
      {
        type: "text",
        name: "reported_by",
        label: "Reported By",
        required: true,
      },
      {
        type: "select",
        name: "division",
        label: "Division",
        options: ["Claims", "Install", "Service", "Warranty"],
      },
      {
        type: "select",
        name: "severity",
        label: "Severity",
        options: ["High", "Medium", "Low"],
      },
      {
        type: "textarea",
        name: "incident_summary",
        label: "Incident Summary",
        required: true,
      },
    ],
  },
  {
    name: "PO Request",
    category: "Purchasing",
    description:
      "Submit a purchase order request with vendor, timeline, and budget visibility.",
    fields: [
      { type: "text", name: "vendor", label: "Vendor", required: true },
      {
        type: "text",
        name: "requested_by",
        label: "Requested By",
        required: true,
      },
      { type: "date", name: "needed_by", label: "Needed By" },
      { type: "number", name: "estimated_amount", label: "Estimated Amount" },
      {
        type: "select",
        name: "division",
        label: "Division",
        options: ["Purchasing", "Operations", "Install", "Service"],
      },
      {
        type: "textarea",
        name: "purchase_details",
        label: "Purchase Details",
        required: true,
      },
    ],
  },
  {
    name: "Microsoft 365 Access Request",
    category: "IT / Access",
    description:
      "Request a Microsoft 365 license, account setup, or access modification for a team member.",
    fields: [
      { type: "text", name: "full_name", label: "Full Name", required: true },
      { type: "text", name: "employee_id", label: "Employee ID" },
      {
        type: "select",
        name: "access_type",
        label: "Access Type",
        options: ["New Account", "License Upgrade", "Access Removal"],
      },
      { type: "text", name: "requested_software", label: "Requested Software" },
      { type: "text", name: "manager_name", label: "Manager Name" },
      { type: "date", name: "effective_date", label: "Effective Date" },
      { type: "textarea", name: "notes", label: "Notes" },
    ],
  },
];

type FormRecord = {
  id: number;
  title: string;
  type: FormName | string;
  status: string | null;
  submitted_at: string | null;
  submitted_by: number | null;
  submitted_by_name: string | null;
  linked_request: {
    id: number;
    request_id: string | null;
    status: string;
  } | null;
};

export default function FormsCenterPage() {
  const [activeForm, setActiveForm] = useState<FormName>("Work Order Request");
  const [records, setRecords] = useState<FormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);

  const activeFormDefinition = useMemo(
    () => formDefinitions.find((form) => form.name === activeForm)!,
    [activeForm],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/forms", { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          body?.error || `Failed to load forms (${response.status})`,
        );
      }
      const data = (await response.json()) as FormRecord[];
      setRecords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load forms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeRecords = useMemo(
    () => records.filter((record) => record.type === activeForm),
    [activeForm, records],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFlash(null);
    setError(null);
    try {
      const formEl = event.currentTarget;
      const formData = new FormData(formEl);
      const data: Record<string, string> = {};
      formData.forEach((value, key) => {
        if (typeof value === "string") data[key] = value;
      });

      const priority =
        (data.priority as string | undefined) ||
        (data.severity as string | undefined) ||
        "Medium";

      const response = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeForm,
          title:
            `${activeForm} – ${data.reported_by || data.requested_by || data.full_name || data.vendor || ""}`.trim(),
          priority,
          data,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || `Submit failed (${response.status})`);
      }
      formEl.reset();
      setFormKey((k) => k + 1);
      setFlash("Submitted. A request was created in the Requests queue.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 font-sans">
      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={50}
        className="space-y-2"
      >
        <h1 className="text-3xl font-semibold tracking-normal text-textPrimary md:text-4xl">
          <ShinyText>Forms Center</ShinyText>
        </h1>
        <p className="max-w-3xl text-base text-textSecondary">
          Submit operational requests and track each record through assignment
          and review.
        </p>
      </FadeContent>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}
      {flash ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {flash}
        </div>
      ) : null}

      <FadeContent
        blur={true}
        duration={800}
        delay={100}
        className="grid gap-5 lg:grid-cols-[19rem_minmax(0,1fr)]"
      >
        <aside className="glass-surface p-4">
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold text-textPrimary">
            <ClipboardText className="h-4 w-4" weight="duotone" />
            Forms
          </div>
          <div className="space-y-2">
            {formDefinitions.map((form) => {
              const count = records.filter((r) => r.type === form.name).length;
              return (
                <button
                  key={form.name}
                  type="button"
                  onClick={() => setActiveForm(form.name)}
                  className={[
                    "w-full rounded-xl border px-4 py-4 text-left transition-all duration-200",
                    activeForm === form.name
                      ? "border-white/50 bg-white/80 text-accent shadow-glass dark:border-white/20 dark:bg-white/10 dark:text-blue-300"
                      : "border-white/25 bg-white/35 text-textPrimary hover:border-white/45 hover:bg-white/60 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10",
                  ].join(" ")}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold">{form.name}</span>
                      <span
                        className={[
                          "rounded-md px-2 py-0.5 text-[11px] font-medium",
                          activeForm === form.name
                            ? "bg-blue-100 text-accent dark:bg-blue-500/20 dark:text-blue-200"
                            : "bg-surface text-textMuted",
                        ].join(" ")}
                      >
                        {count}
                      </span>
                    </div>
                    <span
                      className={[
                        "inline-flex rounded-md px-2 py-0.5 text-[11px] font-medium",
                        activeForm === form.name
                          ? "bg-blue-100 text-accent dark:bg-blue-500/20 dark:text-blue-200"
                          : "bg-surface text-textMuted",
                      ].join(" ")}
                    >
                      {form.category}
                    </span>
                    <p
                      className={[
                        "text-xs leading-5",
                        activeForm === form.name
                          ? "text-textSecondary"
                          : "text-textMuted",
                      ].join(" ")}
                    >
                      {form.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="glass-surface overflow-hidden">
          <div className="border-b border-white/30 px-6 py-5 dark:border-white/10">
            <h2 className="text-lg font-semibold text-textPrimary">
              {activeForm}
            </h2>
            <p className="mt-1 text-sm text-textMuted">
              {activeFormDefinition.description}
            </p>
          </div>
          <form
            key={formKey}
            onSubmit={handleSubmit}
            className="space-y-6 px-6 py-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              {activeFormDefinition.fields.map((field) => (
                <FieldRenderer key={field.name} field={field} />
              ))}
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/30 bg-accent/90 px-5 text-sm font-semibold text-white shadow-glass ring-1 ring-white/20 backdrop-blur-2xl transition-all hover:-translate-y-px hover:border-white/50 hover:bg-accent hover:shadow-glassHover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus className="h-4 w-4" weight="bold" />
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </form>
        </section>
      </FadeContent>

      <FadeContent
        as="section"
        blur={true}
        duration={800}
        delay={140}
        className="glass-surface overflow-hidden"
      >
        <div className="flex items-center gap-2 border-b border-white/30 px-6 py-5 dark:border-white/10">
          <FileText className="h-4 w-4 text-accent" weight="duotone" />
          <h2 className="text-sm font-semibold text-textPrimary">
            Trackable Records
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-white/35 text-xs uppercase tracking-wide text-textMuted dark:bg-white/5">
              <tr>
                <th className="px-5 py-4 font-semibold">Request</th>
                <th className="px-5 py-4 font-semibold">Form</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Submitted By</th>
                <th className="px-5 py-4 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/30 dark:divide-white/10">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-textMuted"
                  >
                    Loading…
                  </td>
                </tr>
              ) : activeRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-textMuted"
                  >
                    No records have been submitted for this form.
                  </td>
                </tr>
              ) : (
                activeRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-white/45 dark:hover:bg-white/5"
                  >
                    <td className="px-5 py-4 font-semibold text-accent">
                      {record.linked_request?.request_id ? (
                        <Link
                          href="/requests"
                          className="hover:underline"
                          title="Open in Requests"
                        >
                          {record.linked_request.request_id}
                        </Link>
                      ) : (
                        `FORM-${record.id}`
                      )}
                    </td>
                    <td className="px-5 py-4 text-textPrimary">
                      {record.type}
                    </td>
                    <td className="px-5 py-4">
                      <RecordStatus
                        status={
                          record.linked_request?.status ||
                          record.status ||
                          "Submitted"
                        }
                      />
                    </td>
                    <td className="px-5 py-4 text-textSecondary">
                      {record.submitted_by_name || "—"}
                    </td>
                    <td className="px-5 py-4 text-textSecondary">
                      {record.submitted_at
                        ? new Intl.DateTimeFormat("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(record.submitted_at))
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </FadeContent>
    </div>
  );
}

function FieldRenderer({ field }: { field: FormDefinition["fields"][number] }) {
  const inputClass =
    "h-11 w-full rounded-xl border border-borderSubtle bg-bgDark/80 px-3 text-sm text-textPrimary outline-none transition-all focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10";

  if (field.type === "textarea") {
    return (
      <label className="space-y-1.5 md:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
          {field.label}
          {field.required ? " *" : ""}
        </span>
        <textarea
          name={field.name}
          required={field.required}
          rows={4}
          className="w-full rounded-xl border border-borderSubtle bg-bgDark/80 px-3 py-3 text-sm text-textPrimary outline-none transition-all focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/10"
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
          {field.label}
          {field.required ? " *" : ""}
        </span>
        <select
          name={field.name}
          required={field.required}
          defaultValue={field.options[0]}
          className={inputClass}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {field.label}
        {field.required ? " *" : ""}
      </span>
      <input
        type={field.type}
        name={field.name}
        required={field.required}
        className={inputClass}
      />
    </label>
  );
}

function RecordStatus({ status }: { status: string }) {
  const lower = status.toLowerCase();
  let className =
    "bg-blue-50 text-accent dark:bg-blue-500/10 dark:text-blue-300";
  if (lower.includes("approv") || lower.includes("assigned")) {
    className =
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300";
  } else if (lower.includes("review") || lower.includes("progress")) {
    className =
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  } else if (lower.includes("denied") || lower.includes("rejected")) {
    className = "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";
  }
  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}

// Reference unused import to satisfy linters/keep accessible upload symbol for future enhancement.
void UploadSimple;
