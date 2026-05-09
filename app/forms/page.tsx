"use client";

import { FormEvent, useMemo, useState } from "react";
import { ClipboardList, FileText, Plus, Upload } from "lucide-react";

type FormName = "Work Order Request" | "Vehicle Request" | "Claim Report" | "PO Request";

type SubmittedRecord = {
  id: string;
  form: FormName;
  status: "Submitted" | "Assigned" | "In Review";
  assignedTo: string;
  submittedDate: string;
};

const formNames: FormName[] = [
  "Work Order Request",
  "Vehicle Request",
  "Claim Report",
  "PO Request",
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
          <h1 className="text-2xl font-bold text-navy">Forms Center</h1>
          <p className="text-sm text-textMuted">
            Submit operational requests and track each record through assignment and review.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="rounded-lg border border-borderSubtle bg-white p-3 shadow-soft">
            <div className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold text-navy">
              <ClipboardList className="h-4 w-4" />
              Forms
            </div>
            <div className="space-y-1">
              {formNames.map((form) => (
                <button
                  key={form}
                  type="button"
                  onClick={() => setActiveForm(form)}
                  className={[
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold transition-colors",
                    activeForm === form ? "bg-navy text-white" : "text-textSecondary hover:bg-bgDark",
                  ].join(" ")}
                >
                  <span>{form}</span>
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-xs",
                      activeForm === form ? "bg-white/15 text-white" : "bg-bgDark text-textMuted",
                    ].join(" ")}
                  >
                    {records.filter((record) => record.form === form).length}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-lg border border-borderSubtle bg-white shadow-soft">
            <div className="border-b border-borderSubtle px-5 py-4">
              <h2 className="text-lg font-bold text-navy">{activeForm}</h2>
              <p className="mt-1 text-sm text-textMuted">
                Complete the form fields and submit to create a trackable record.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 px-5 py-5">
              {activeForm === "Work Order Request" && <WorkOrderFields />}
              {activeForm === "Vehicle Request" && <VehicleFields />}
              {activeForm === "Claim Report" && <ClaimFields />}
              {activeForm === "PO Request" && <POFields />}
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-[#243B63]"
              >
                <Plus className="h-4 w-4" />
                Submit
              </button>
            </form>
          </section>
        </div>

        <section className="overflow-hidden rounded-lg border border-borderSubtle bg-white shadow-soft">
          <div className="flex items-center gap-2 border-b border-borderSubtle px-5 py-4">
            <FileText className="h-4 w-4 text-navy" />
            <h2 className="text-sm font-semibold text-navy">Trackable Records</h2>
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
                    <td className="px-4 py-3 font-semibold text-navy">{record.id}</td>
                    <td className="px-4 py-3 text-textPrimary">{record.form}</td>
                    <td className="px-4 py-3">
                      <RecordStatus status={record.status} />
                    </td>
                    <td className="px-4 py-3 text-textSecondary">{record.assignedTo}</td>
                    <td className="px-4 py-3 text-textSecondary">{record.submittedDate}</td>
                  </tr>
                ))}
                {activeRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-textMuted">
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
      <SelectField label="Division" options={["Operations", "Install", "Service", "Warranty"]} />
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
      <SelectField label="Division" options={["Operations", "Install", "Sales", "Service"]} />
      <TextAreaField label="Purpose" />
    </div>
  );
}

function ClaimFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TextField label="Claim Date" type="date" />
      <TextField label="Reported By" />
      <SelectField label="Division" options={["Claims", "Install", "Service", "Warranty"]} />
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
      <SelectField label="Division" options={["Purchasing", "Operations", "Install", "Service"]} />
      <TextAreaField label="Purchase Details" />
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
        className="h-10 w-full rounded-md border border-borderSubtle bg-white px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
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
      <select className="h-10 w-full rounded-md border border-borderSubtle bg-white px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20">
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
        className="w-full rounded-md border border-borderSubtle bg-white px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
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
    Assigned: "bg-green-50 text-cyber-green",
    "In Review": "bg-amber-50 text-cyber-yellow",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
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
  };

  return assignees[form];
}
