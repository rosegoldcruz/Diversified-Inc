"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  Filter,
  LockKeyhole,
  Paperclip,
  Plus,
  Save,
  X,
} from "lucide-react";

type Task = {
  ref: string;
  task: string;
  division: string;
  assignedTo: string;
  priority: "High" | "Medium" | "Low";
  dueDate: string;
  status: "Open" | "In Progress" | "Pending" | "Completed" | "Overdue";
};

type Filters = {
  user: string;
  priority: string;
  status: string;
  division: string;
  dueDate: string;
};

const tasks: Task[] = [
  {
    ref: "TASK-1048",
    task: "Review PO request for cabinet hardware",
    division: "Purchasing",
    assignedTo: "Maya Chen",
    priority: "High",
    dueDate: "2026-05-08",
    status: "Open",
  },
  {
    ref: "TASK-1049",
    task: "Schedule installer follow-up for Mesa remodel",
    division: "Operations",
    assignedTo: "Andre Lawson",
    priority: "Medium",
    dueDate: "2026-05-08",
    status: "In Progress",
  },
  {
    ref: "TASK-1050",
    task: "Upload claim photos and notes",
    division: "Claims",
    assignedTo: "Riley Patel",
    priority: "High",
    dueDate: "2026-05-06",
    status: "Overdue",
  },
  {
    ref: "TASK-1051",
    task: "Confirm vehicle request availability",
    division: "Fleet",
    assignedTo: "Maya Chen",
    priority: "Low",
    dueDate: "2026-05-10",
    status: "Pending",
  },
  {
    ref: "TASK-1052",
    task: "Close completed work order packet",
    division: "Work Orders",
    assignedTo: "Jordan Blake",
    priority: "Medium",
    dueDate: "2026-05-07",
    status: "Completed",
  },
];

const emptyFilters: Filters = {
  user: "All",
  priority: "All",
  status: "All",
  division: "All",
  dueDate: "",
};

const divisions = ["Operations", "Purchasing", "Claims", "Fleet", "Work Orders"];
const users = ["Maya Chen", "Andre Lawson", "Riley Patel", "Jordan Blake"];
const priorities = ["High", "Medium", "Low"];
const statuses = ["Open", "In Progress", "Pending", "Completed", "Overdue"];

export default function TasksPage() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task>(tasks[0]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      return (
        (filters.user === "All" || task.assignedTo === filters.user) &&
        (filters.priority === "All" || task.priority === filters.priority) &&
        (filters.status === "All" || task.status === filters.status) &&
        (filters.division === "All" || task.division === filters.division) &&
        (!filters.dueDate || task.dueDate === filters.dueDate)
      );
    });
  }, [filters]);

  const openEditor = (task: Task) => {
    setSelectedTask(task);
    setEditorOpen(true);
  };

  return (
    <>
      <div className="space-y-5 font-sans">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-navy">Tasks</h1>
            <p className="text-sm text-textMuted">
              Manage assignments, priorities, due dates, and task details across divisions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openEditor(tasks[0])}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-[#243B63]"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>

        <section className="rounded-lg border border-borderSubtle bg-white p-4 shadow-soft">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-navy">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SelectFilter
              label="User"
              value={filters.user}
              options={["All", ...users]}
              onChange={(value) => setFilters((current) => ({ ...current, user: value }))}
            />
            <SelectFilter
              label="Priority"
              value={filters.priority}
              options={["All", ...priorities]}
              onChange={(value) => setFilters((current) => ({ ...current, priority: value }))}
            />
            <SelectFilter
              label="Status"
              value={filters.status}
              options={["All", ...statuses]}
              onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
            />
            <SelectFilter
              label="Division"
              value={filters.division}
              options={["All", ...divisions]}
              onChange={(value) => setFilters((current) => ({ ...current, division: value }))}
            />
            <label className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                Due Date
              </span>
              <input
                type="date"
                value={filters.dueDate}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, dueDate: event.target.value }))
                }
                className="h-10 w-full rounded-md border border-borderSubtle bg-white px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-borderSubtle bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-bgDark text-xs uppercase tracking-wide text-textMuted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Ref#</th>
                  <th className="px-4 py-3 font-semibold">Task</th>
                  <th className="px-4 py-3 font-semibold">Division</th>
                  <th className="px-4 py-3 font-semibold">Assigned To</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 font-semibold">Due Date</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderSubtle">
                {filteredTasks.map((task) => (
                  <tr key={task.ref} className="hover:bg-bgDark">
                    <td className="px-4 py-3 font-semibold text-navy">{task.ref}</td>
                    <td className="px-4 py-3 text-textPrimary">{task.task}</td>
                    <td className="px-4 py-3 text-textSecondary">{task.division}</td>
                    <td className="px-4 py-3 text-textSecondary">{task.assignedTo}</td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="px-4 py-3 text-textSecondary">{formatDate(task.dueDate)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openEditor(task)}
                        className="inline-flex h-8 items-center gap-2 rounded-md border border-borderSubtle px-3 text-xs font-semibold text-navy transition-colors hover:bg-bgDark"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-textMuted">
                      No tasks match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editorOpen && (
        <TaskEditorModal task={selectedTask} onClose={() => setEditorOpen(false)} />
      )}
    </>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-borderSubtle bg-white px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
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

function TaskEditorModal({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-lg border border-borderSubtle bg-white shadow-cyberLg">
        <div className="flex items-start justify-between gap-4 border-b border-borderSubtle px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-navy">Task Editor</h2>
            <p className="mt-1 text-sm text-textMuted">
              Update task details, scheduling, assignments, attachments, and links.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md text-textMuted transition-colors hover:bg-bgDark hover:text-textPrimary"
            aria-label="Close task editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-5 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="Division" defaultValue={task.division} options={divisions} />
            <SelectField
              label="Task Type"
              defaultValue="Operational"
              options={["Operational", "Administrative", "Field", "Approval"]}
            />
            <TextField label="Topic" defaultValue="Daily Operations" />
            <TextField label="Ref#" defaultValue={task.ref} />
            <TextField label="Task Title" defaultValue={task.task} />
            <SelectField label="Priority" defaultValue={task.priority} options={priorities} />
            <SelectField
              label="Sub Priority"
              defaultValue="Standard"
              options={["Critical", "Standard", "Low Impact"]}
            />
            <TextField label="Due Date" type="date" defaultValue={task.dueDate} />
            <label className="flex items-center gap-2 rounded-md border border-borderSubtle px-3 py-2.5 text-sm font-medium text-textSecondary">
              <input type="checkbox" className="h-4 w-4 rounded border-borderSubtle" />
              Private
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TextAreaField label="Description" defaultValue="Enter task description and acceptance details." />
            <TextAreaField label="Notes" defaultValue="Add internal notes or follow-up context." />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="Assigned To" defaultValue={task.assignedTo} options={users} />
            <TextField label="Start Date" type="date" defaultValue="2026-05-08" />
            <TextField label="Start Time" type="time" defaultValue="09:00" />
            <TextField label="End Date" type="date" defaultValue="2026-05-08" />
            <TextField label="End Time" type="time" defaultValue="10:30" />
            <SelectField
              label="Repeat"
              defaultValue="Does Not Repeat"
              options={["Does Not Repeat", "Daily", "Weekly", "Monthly"]}
            />
            <TextField label="Estimate of Time" defaultValue="1.5 hours" />
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
                File Upload
              </span>
              <span className="flex h-10 items-center gap-2 rounded-md border border-dashed border-borderHover bg-bgDark px-3 text-sm text-textMuted">
                <Paperclip className="h-4 w-4" />
                <input type="file" className="w-full text-sm" multiple />
              </span>
            </label>
          </div>

          <TextAreaField label="Hyperlinks" defaultValue="https://example.com/project-reference" />

          <div className="flex flex-col-reverse gap-2 border-t border-borderSubtle pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-borderSubtle px-4 text-sm font-semibold text-navy transition-colors hover:bg-bgDark"
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete Task
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-borderSubtle px-4 text-sm font-semibold text-navy transition-colors hover:bg-bgDark"
            >
              <LockKeyhole className="h-4 w-4" />
              Save and Lock
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-[#243B63]"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({
  label,
  type = "text",
  defaultValue,
}: {
  label: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      <input
        type={type}
        defaultValue={defaultValue}
        className="h-10 w-full rounded-md border border-borderSubtle bg-white px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

function SelectField({
  label,
  defaultValue,
  options,
}: {
  label: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      <select
        defaultValue={defaultValue}
        className="h-10 w-full rounded-md border border-borderSubtle bg-white px-3 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
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

function TextAreaField({ label, defaultValue }: { label: string; defaultValue?: string }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      <textarea
        defaultValue={defaultValue}
        rows={4}
        className="w-full rounded-md border border-borderSubtle bg-white px-3 py-2 text-sm text-textPrimary outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const styles = {
    High: "bg-red-50 text-cyber-red",
    Medium: "bg-amber-50 text-cyber-yellow",
    Low: "bg-blue-50 text-accent",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: Task["status"] }) {
  const styles = {
    Open: "bg-blue-50 text-accent",
    "In Progress": "bg-indigo-50 text-indigo-700",
    Pending: "bg-amber-50 text-cyber-yellow",
    Completed: "bg-green-50 text-cyber-green",
    Overdue: "bg-red-50 text-cyber-red",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
