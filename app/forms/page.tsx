"use client";

import { FormEvent, useMemo, useState } from "react";
import { ClipboardList, FileText, Plus, Upload } from "lucide-react";

type FormName =
  | "Work Order Request"
  | "Vehicle Request"
  | "Claim Report"
  | "PO Request"
  | "Microsoft 365 Access Request";

type SubmittedRecord = {
  id: string;
  form: FormName;
  status: "Submitted" | "Assigned" | "In Review";
  assignedTo: string;
  submittedDate: string;
};

type FormDefinition = {
  name: FormName;
  category: string;
  description: string;
  active: boolean;
  fields: string[];
};

const formDefinitions: FormDefinition[] = [
  {
    name: "Work Order Request",
    category: "Operations",
    description:
      "Submit an operational issue for scheduling, assignment, and completion tracking.",
    active: true,
    fields: [
      "Priority",
      "Division",
      "Description of Issues",
      "Date",
      "Truck#",
      "Reported By",
    ],
  },
  {
    name: "Vehicle Request",
    category: "Operations",
    description:
      "Request a vehicle reservation for internal transport and field coordination.",
    active: true,
    fields: [
      "Requested By",
      "Vehicle Needed Date",
      "Pickup Time",
      "Return Time",
      "Division",
      "Purpose",
    ],
  },
  {
    name: "Claim Report",
    category: "Claims",
    description:
      "Report claim incidents with severity, summary details, and supporting documentation.",
    active: true,
    fields: [
      "Claim Date",
      "Reported By",
      "Division",
      "Severity",
      "Incident Summary",
      "Supporting Photos",
    ],
  },
  {
    name: "PO Request",
    category: "Purchasing",
    description:
      "Submit a purchase order request with vendor, timeline, and budget visibility.",
    active: true,
    fields: [
      "Vendor",
      "Requested By",
      "Needed By",
      "Estimated Amount",
      "Division",
      "Purchase Details",
    ],
  },
  {
    name: "Microsoft 365 Access Request",
    category: "IT / Access",
    description:
      "Request a Microsoft 365 license, account setup, or access modification for a team member.",
    active: true,
    fields: [
      "Full Name",
      "Employee ID",
      "Access Type",
      "Requested Software",
      "Manager Name",
      "Effective Date",
      "Notes",
    ],
  },
];

const initialRecords: SubmittedRecord[] = [
  {
    id: "WO-2026-014",
    form: "Work Order Request",
    status: "Assigned",
    assignedTo: "Andre Lawson",
    submittedDate: "May 8, 2026",
  },
  {
    id: "VR-2026-009",
    form: "Vehicle Request",
    status: "Submitted",
    assignedTo: "Fleet Queue",
    submittedDate: "May 7, 2026",
  },
  {
    id: "PO-2026-021",
    form: "PO Request",
    status: "In Review",
    assignedTo: "Purchasing",
    submittedDate: "May 6, 2026",
  },
];

export default function FormsCenterPage() {
  const [activeForm, setActiveForm] = useState<FormName>("Work Order Request");
  const [records, setRecords] = useState<SubmittedRecord[]>(initialRecords);
  const activeFormDefinition = useMemo(
    () => formDefinitions.find((form) => form.name === activeForm),
    [activeForm],
  );

  const activeRecords = useMemo(
    () => records.filter((record) => record.form === activeForm),
    [activeForm, records],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prefix = activeForm
      .split(" ")
      .map((word) => word[0])
      .join("");
    const record: SubmittedRecord = {
      id: `${prefix}-2026-${String(records.length + 22).padStart(3, "0")}`,
      form: activeForm,
      status: "Submitted",
      assignedTo: defaultAssignee(activeForm),
      submittedDate: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    };

    setRecords((current) => [record, ...current]);
    event.currentTarget.reset();
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-textPrimary">
          Forms Center
        </h1>
        <p className="text-sm text-textMuted">
          Submit operational requests and track each record through assignment
          and review.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-lg border border-borderSubtle bg-surface p-3 shadow-soft">
          <div className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold text-textPrimary">
            <ClipboardList className="h-4 w-4" />
            Forms
          </div>
          <div className="space-y-2">
            {formDefinitions.map((form) => (
              <button
                key={form.name}
                type="button"
                onClick={() => setActiveForm(form.name)}
                className={[
                  "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                  activeForm === form.name
                    ? "border-accent bg-blue-50 text-accent dark:bg-blue-500/10 dark:text-blue-300"
                    : "border-borderSubtle bg-bgDark text-textPrimary hover:border-borderHover",
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
                      {
                        records.filter((record) => record.form === form.name)
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded-md px-2 py-0.5 text-[11px] font-medium",
                        activeForm === form.name
                          ? "bg-blue-100 text-accent dark:bg-blue-500/20 dark:text-blue-200"
                          : "bg-surface text-textMuted",
                      ].join(" ")}
                    >
                      {form.category}
                    </span>
                    {form.active ? (
                      <span
                        className={[
                          "rounded-md px-2 py-0.5 text-[11px] font-medium",
                          activeForm === form.name
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                            : "bg-emerald-500/10 text-emerald-700",
                        ].join(" ")}
                      >
                        Active
                      </span>
                    ) : null}
                  </div>
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
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-borderSubtle bg-surface shadow-soft">
          <div className="border-b border-borderSubtle px-5 py-4">
            <h2 className="text-lg font-semibold text-textPrimary">
              {activeForm}
            </h2>
            <p className="mt-1 text-sm text-textMuted">
              {activeFormDefinition?.description ||
                "Complete the form fields and submit to create a trackable record."}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
            {activeForm === "Work Order Request" && <WorkOrderFields />}
            {activeForm === "Vehicle Request" && <VehicleFields />}
            {activeForm === "Claim Report" && <ClaimFields />}
            {activeForm === "PO Request" && <POFields />}
            {activeForm === "Microsoft 365 Access Request" && (
              <Microsoft365AccessFields />
            )}
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-accent bg-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-accentSoft"
            >
              <Plus className="h-4 w-4" />
              Submit
            </button>
          </form>
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-borderSubtle bg-surface shadow-soft">
        <div className="flex items-center gap-2 border-b border-borderSubtle px-5 py-4">
          <FileText className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-textPrimary">
            Trackable Records
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-left text-sm">
            <thead className="bg-bgDark text-xs uppercase tracking-wide text-textMuted">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Form</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Assigned To</th>
                <th className="px-4 py-3 font-semibold">Submitted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderSubtle">
              {activeRecords.map((record) => (
                <tr key={record.id} className="hover:bg-bgDark">
                  <td className="px-4 py-3 font-semibold text-accent">
                    {record.id}
                  </td>
                  <td className="px-4 py-3 text-textPrimary">{record.form}</td>
                  <td className="px-4 py-3">
                    <RecordStatus status={record.status} />
                  </td>
                  <td className="px-4 py-3 text-textSecondary">
                    {record.assignedTo}
                  </td>
                  <td className="px-4 py-3 text-textSecondary">
                    {record.submittedDate}
                  </td>
                </tr>
              ))}
              {activeRecords.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-textMuted"
                  >
                    No records have been submitted for this form.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function WorkOrderFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SelectField label="Priority" options={["High", "Medium", "Low"]} />
      <SelectField
        label="Division"
        options={["Operations", "Install", "Service", "Warranty"]}
      />
      <TextAreaField label="Description of Issues" />
      <TextField label="Date" type="date" />
      <TextField label="Truck#" />
      <TextField label="Reported By" />
      <FileField label="Photos of Incident" />
    </div>
  );
}

function VehicleFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Requested By" />
      <TextField label="Vehicle Needed Date" type="date" />
      <TextField label="Pickup Time" type="time" />
      <TextField label="Return Time" type="time" />
      <SelectField
        label="Division"
        options={["Operations", "Install", "Sales", "Service"]}
      />
      <TextAreaField label="Purpose" />
    </div>
  );
}

function ClaimFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Claim Date" type="date" />
      <TextField label="Reported By" />
      <SelectField
        label="Division"
        options={["Claims", "Install", "Service", "Warranty"]}
      />
      <SelectField label="Severity" options={["High", "Medium", "Low"]} />
      <TextAreaField label="Incident Summary" />
      <FileField label="Supporting Photos" />
    </div>
  );
}

function POFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Vendor" />
      <TextField label="Requested By" />
      <TextField label="Needed By" type="date" />
      <TextField label="Estimated Amount" />
      <SelectField
        label="Division"
        options={["Purchasing", "Operations", "Install", "Service"]}
      />
      <TextAreaField label="Purchase Details" />
    </div>
  );
}

function Microsoft365AccessFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Full Name" />
      <TextField label="Employee ID" />
      <SelectField
        label="Access Type"
        options={["New Account", "License Upgrade", "Access Removal"]}
      />
      <TextField label="Requested Software" />
      <TextField label="Manager Name" />
      <TextField label="Effective Date" type="date" />
      <TextAreaField label="Notes" />
    </div>
  );
}

function TextField({ label, type = "text" }: { label: string; type?: string }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      <input
        type={type}
        className="h-10 w-full rounded-md border border-borderSubtle bg-surface px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      <select className="h-10 w-full rounded-md border border-borderSubtle bg-surface px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({ label }: { label: string }) {
  return (
    <label className="space-y-1 md:col-span-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      <textarea
        rows={4}
        className="w-full rounded-md border border-borderSubtle bg-surface px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

function FileField({ label }: { label: string }) {
  return (
    <label className="space-y-1 md:col-span-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      <span className="flex min-h-10 items-center gap-2 rounded-md border border-dashed border-borderHover bg-bgDark px-3 py-2 text-sm text-textMuted">
        <Upload className="h-4 w-4" />
        <input type="file" multiple className="w-full text-sm" />
      </span>
    </label>
  );
}

function RecordStatus({ status }: { status: SubmittedRecord["status"] }) {
  const styles = {
    Submitted: "bg-blue-50 text-accent",
    Assigned:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    "In Review":
      "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function defaultAssignee(form: FormName) {
  const assignees: Record<FormName, string> = {
    "Work Order Request": "Work Orders Queue",
    "Vehicle Request": "Fleet Queue",
    "Claim Report": "Claims Queue",
    "PO Request": "Purchasing Queue",
    "Microsoft 365 Access Request": "IT Access Queue",
  };

  return assignees[form];
}
