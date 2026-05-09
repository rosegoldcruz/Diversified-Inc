"use client";

import { Fragment, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";

type ViewMode = "Day" | "Week" | "Month";
type TaskStatus = "completed" | "rescheduled" | "canceled" | "pending" | "done";

type CalendarTask = {
  id: string;
  title: string;
  division: string;
  status: TaskStatus;
  assignedTo: string;
};

type ScheduledTask = CalendarTask & {
  day: string;
  time: string;
};

const users = ["All Users", "Maya Chen", "Andre Lawson", "Riley Patel", "Jordan Blake"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM"];

const sidebarTasks: CalendarTask[] = [
  {
    id: "task-1",
    title: "Work order packet review",
    division: "Work Orders",
    status: "pending",
    assignedTo: "Maya Chen",
  },
  {
    id: "task-2",
    title: "Vehicle request inspection",
    division: "Fleet",
    status: "rescheduled",
    assignedTo: "Andre Lawson",
  },
  {
    id: "task-3",
    title: "Claim report follow-up",
    division: "Claims",
    status: "canceled",
    assignedTo: "Riley Patel",
  },
  {
    id: "task-4",
    title: "PO approval call",
    division: "Purchasing",
    status: "done",
    assignedTo: "Jordan Blake",
  },
];

const initialScheduled: ScheduledTask[] = [
  {
    ...sidebarTasks[0],
    id: "scheduled-1",
    day: "Monday",
    time: "9:00 AM",
  },
  {
    ...sidebarTasks[1],
    id: "scheduled-2",
    day: "Wednesday",
    time: "1:00 PM",
  },
  {
    id: "scheduled-3",
    title: "Completed installer check-in",
    division: "Operations",
    status: "completed",
    assignedTo: "Maya Chen",
    day: "Friday",
    time: "10:00 AM",
  },
];

const statusStyles: Record<TaskStatus, string> = {
  completed: "border-slate-300 bg-slate-100 text-slate-700",
  rescheduled: "border-blue-200 bg-blue-50 text-blue-700",
  canceled: "border-red-200 bg-red-50 text-red-700",
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  done: "border-green-200 bg-green-50 text-green-700",
};

const statusLabels: Record<TaskStatus, string> = {
  completed: "Completed",
  rescheduled: "Rescheduled",
  canceled: "Canceled",
  pending: "Pending",
  done: "Done",
};

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [selectedUser, setSelectedUser] = useState("All Users");
  const [weekOffset, setWeekOffset] = useState(0);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>(initialScheduled);

  const filteredTasks = useMemo(() => {
    if (selectedUser === "All Users") {
      return scheduledTasks;
    }

    return scheduledTasks.filter((task) => task.assignedTo === selectedUser);
  }, [scheduledTasks, selectedUser]);

  const visibleDays = viewMode === "Day" ? days.slice(0, 1) : days;
  const weekLabel =
    weekOffset === 0 ? "Current Week" : weekOffset < 0 ? "Past Week" : "Future Weeks";

  const handleDrop = (event: React.DragEvent<HTMLDivElement>, day: string, time: string) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    const draggedTask = sidebarTasks.find((task) => task.id === taskId);

    if (!draggedTask) {
      return;
    }

    setScheduledTasks((current) => [
      ...current,
      {
        ...draggedTask,
        id: `${draggedTask.id}-${day}-${time}-${current.length}`,
        day,
        time,
      },
    ]);
  };

  return (
    <div className="space-y-5 font-sans">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-navy">Projection Calendar</h1>
            <p className="text-sm text-textMuted">
              Plan task timing, schedule team work, and place open tasks onto calendar slots.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-borderSubtle bg-white p-1 shadow-soft">
              {(["Day", "Week", "Month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={[
                    "h-8 rounded px-3 text-sm font-semibold transition-colors",
                    viewMode === mode ? "bg-navy text-white" : "text-textMuted hover:bg-bgDark",
                  ].join(" ")}
                >
                  {mode}
                </button>
              ))}
            </div>
            <select
              value={selectedUser}
              onChange={(event) => setSelectedUser(event.target.value)}
              className="h-10 rounded-md border border-borderSubtle bg-white px-3 text-sm font-medium text-textPrimary shadow-soft outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              aria-label="Select user"
            >
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>
        </div>

        <section className="flex flex-col gap-4 lg:flex-row">
          <aside className="w-full rounded-lg border border-borderSubtle bg-white p-4 shadow-soft lg:w-72">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <CalendarDays className="h-4 w-4" />
              Task List
            </div>
            <div className="mt-4 space-y-3">
              {sidebarTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", task.id)}
                  className="cursor-grab rounded-md border border-borderSubtle bg-bgDark p-3 active:cursor-grabbing"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-textDisabled" />
                    <div>
                      <p className="text-sm font-semibold text-textPrimary">{task.title}</p>
                      <p className="mt-1 text-xs text-textMuted">
                        {task.division} • {task.assignedTo}
                      </p>
                    </div>
                  </div>
                  <StatusPill status={task.status} />
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1 rounded-lg border border-borderSubtle bg-white shadow-soft">
            <div className="flex flex-col gap-3 border-b border-borderSubtle p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-navy">{weekLabel}</p>
                <p className="mt-1 text-xs text-textMuted">
                  Drag tasks from the sidebar into an open time slot.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((current) => current - 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-borderSubtle px-3 text-xs font-semibold text-navy transition-colors hover:bg-bgDark"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Past Week
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset(0)}
                  className="h-9 rounded-md border border-borderSubtle px-3 text-xs font-semibold text-navy transition-colors hover:bg-bgDark"
                >
                  Current Week
                </button>
                <button
                  type="button"
                  onClick={() => setWeekOffset((current) => current + 1)}
                  className="inline-flex h-9 items-center gap-1 rounded-md border border-borderSubtle px-3 text-xs font-semibold text-navy transition-colors hover:bg-bgDark"
                >
                  Future Weeks
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {viewMode === "Month" ? (
              <MonthPreview tasks={filteredTasks} />
            ) : (
              <div className="overflow-x-auto">
                <div
                  className="grid min-w-[880px]"
                  style={{
                    gridTemplateColumns: `5rem repeat(${visibleDays.length}, minmax(9rem, 1fr))`,
                  }}
                >
                  <div className="border-b border-r border-borderSubtle bg-bgDark p-3 text-xs font-semibold uppercase tracking-wide text-textMuted">
                    Time
                  </div>
                  {visibleDays.map((day) => (
                    <div
                      key={day}
                      className="border-b border-r border-borderSubtle bg-bgDark p-3 text-xs font-semibold uppercase tracking-wide text-textMuted"
                    >
                      {day}
                    </div>
                  ))}
                  {timeSlots.map((time) => (
                    <Fragment key={time}>
                      <div
                        className="min-h-24 border-r border-borderSubtle p-3 text-xs font-semibold text-textMuted"
                      >
                        {time}
                      </div>
                      {visibleDays.map((day) => {
                        const slotTasks = filteredTasks.filter(
                          (task) => task.day === day && task.time === time,
                        );

                        return (
                          <div
                            key={`${day}-${time}`}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => handleDrop(event, day, time)}
                            className="min-h-24 border-r border-t border-borderSubtle p-2 transition-colors hover:bg-bgDark"
                          >
                            <div className="space-y-2">
                              {slotTasks.map((task) => (
                                <CalendarBlock key={task.id} task={task} />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
  );
}

function CalendarBlock({ task }: { task: ScheduledTask }) {
  return (
    <div className={`rounded-md border p-2 text-xs ${statusStyles[task.status]}`}>
      <p className="font-semibold">{task.title}</p>
      <p className="mt-1 opacity-80">{task.assignedTo}</p>
    </div>
  );
}

function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className={`mt-3 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

function MonthPreview({ tasks }: { tasks: ScheduledTask[] }) {
  return (
    <div className="grid gap-px bg-borderSubtle p-px sm:grid-cols-2 xl:grid-cols-5">
      {days.map((day) => (
        <div key={day} className="min-h-56 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">{day}</p>
          <div className="mt-3 space-y-2">
            {tasks
              .filter((task) => task.day === day)
              .map((task) => (
                <CalendarBlock key={task.id} task={task} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
