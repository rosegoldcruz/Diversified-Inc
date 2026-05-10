"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, X } from "lucide-react";

type ViewMode = "Day" | "Week" | "Month";

type Task = {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  division: string | null;
  topic: string | null;
  notes: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  due_date: string | null;
  start_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean | null;
  repeat_schedule: string | null;
  estimated_hours: number | null;
  estimated_minutes: number | null;
  is_private: boolean | null;
  locked: boolean | null;
  completed_at: string | null;
  updated_at: string | null;
};

type Employee = { id: number; name: string };

type EditorState = {
  title: string;
  division: string;
  topic: string;
  priority: string;
  due_date: string;
  start_date: string;
  start_time: string;
  end_time: string;
  assigned_to: string;
  estimated_hours: number;
  estimated_minutes: number;
  description: string;
  notes: string;
  all_day: boolean;
  is_private: boolean;
  repeat_schedule: string;
  locked: boolean;
};

const DIVISIONS = [
  "Diversified",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Legal",
  "Maintenance",
  "Purchasing",
  "HR",
  "IT",
  "Admin",
];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const REPEAT_OPTIONS = ["None", "Daily", "Weekly", "Monthly"];
const TIME_SLOTS = Array.from({ length: 11 }, (_, index) => index + 8);

const EMPTY_EDITOR_STATE: EditorState = {
  title: "",
  division: "Diversified",
  topic: "",
  priority: "Medium",
  due_date: "",
  start_date: "",
  start_time: "09:00",
  end_time: "10:00",
  assigned_to: "",
  estimated_hours: 0,
  estimated_minutes: 0,
  description: "",
  notes: "",
  all_day: false,
  is_private: false,
  repeat_schedule: "None",
  locked: false,
};

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [userFilter, setUserFilter] = useState("All Users");
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTask, setIsNewTask] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorState, setEditorState] =
    useState<EditorState>(EMPTY_EDITOR_STATE);
  const [saving, setSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  async function loadCalendarData(cancelled?: () => boolean) {
    try {
      setLoading(true);
      setError(null);

      const [tasksResponse, employeesResponse] = await Promise.all([
        fetch("/api/tasks", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
      ]);

      if (!tasksResponse.ok) {
        throw new Error(`Failed to load tasks (${tasksResponse.status})`);
      }
      if (!employeesResponse.ok) {
        throw new Error(
          `Failed to load employees (${employeesResponse.status})`,
        );
      }

      const [taskData, employeeData] = (await Promise.all([
        tasksResponse.json(),
        employeesResponse.json(),
      ])) as [Task[], Employee[]];

      if (!cancelled?.()) {
        setTasks(taskData);
        setEmployees(
          employeeData.map((employee) => ({
            id: employee.id,
            name: employee.name,
          })),
        );
      }
    } catch (loadError) {
      if (!cancelled?.()) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load calendar",
        );
      }
    } finally {
      if (!cancelled?.()) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    void loadCalendarData(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editorOpen) return;

    if (isNewTask) {
      setEditorState(EMPTY_EDITOR_STATE);
      setEditorError(null);
      return;
    }

    if (selectedTask) {
      setEditorState(toEditorState(selectedTask));
      setEditorError(null);
    }
  }, [editorOpen, isNewTask, selectedTask]);

  const weekDays = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const visibleDays = viewMode === "Day" ? [weekDays[0]] : weekDays;
  const weekStart = weekDays[0];
  const weekEnd = weekDays[4];

  const calendarTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskDate = getTaskDate(task);
      if (!taskDate) return false;
      const matchesWeek = isWithinInclusive(taskDate, weekStart, weekEnd);
      const matchesUser =
        userFilter === "All Users" || task.assigned_to_name === userFilter;
      return matchesWeek && matchesUser;
    });
  }, [tasks, userFilter, weekEnd, weekStart]);

  const taskListItems = useMemo(() => {
    const query = sidebarSearch.trim().toLowerCase();
    return tasks.filter((task) => {
      const status = normalizeStatus(task.status);
      if (status === "completed") return false;
      if (userFilter !== "All Users" && task.assigned_to_name !== userFilter) {
        return false;
      }
      if (!query) return true;
      return task.title.toLowerCase().includes(query);
    });
  }, [sidebarSearch, tasks, userFilter]);

  function openExistingTask(task: Task) {
    setSelectedTask(task);
    setIsNewTask(false);
    setEditorOpen(true);
  }

  function openNewTask() {
    setSelectedTask(null);
    setIsNewTask(true);
    setEditorOpen(true);
  }

  async function handleSave() {
    if (!editorState.title.trim()) {
      setEditorError("Task title is required.");
      return;
    }

    const payload = buildPayload(editorState);

    try {
      setSaving(true);
      setEditorError(null);

      const response = await fetch(
        isNewTask ? "/api/tasks" : `/api/tasks/${selectedTask?.id}`,
        {
          method: isNewTask ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to save task (${response.status})`);
      }

      const savedTask = (await response.json()) as Task;
      if (isNewTask) {
        await loadCalendarData();
      } else {
        setTasks((current) =>
          current.map((task) => (task.id === savedTask.id ? savedTask : task)),
        );
      }
      setEditorOpen(false);
    } catch (saveError) {
      setEditorError(
        saveError instanceof Error ? saveError.message : "Failed to save task",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    if (!selectedTask) return;
    await patchTask(selectedTask.id, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    setEditorOpen(false);
  }

  async function handleLockToggle() {
    if (!selectedTask) return;
    const updated = await patchTask(selectedTask.id, {
      locked: !editorState.locked,
    });
    if (updated) {
      setEditorState((current) => ({
        ...current,
        locked: Boolean(updated.locked),
      }));
    }
  }

  async function patchTask(taskId: number, payload: Partial<Task>) {
    try {
      setSaving(true);
      setEditorError(null);

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update task (${response.status})`);
      }

      const updatedTask = (await response.json()) as Task;
      setTasks((current) =>
        current.map((task) =>
          task.id === updatedTask.id ? updatedTask : task,
        ),
      );
      setSelectedTask(updatedTask);
      return updatedTask;
    } catch (patchError) {
      setEditorError(
        patchError instanceof Error
          ? patchError.message
          : "Failed to update task",
      );
      return null;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full min-h-[calc(100dvh-8rem)] overflow-hidden rounded-xl border border-borderSubtle bg-bgDark shadow-soft">
      <aside className="flex w-64 shrink-0 flex-col border-r border-borderSubtle bg-surface">
        <div className="border-b border-borderSubtle p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-textPrimary">
              Task List
            </h2>
            <span className="rounded-full border border-borderSubtle bg-bgDark px-2 py-0.5 text-xs font-semibold text-textMuted">
              {taskListItems.length}
            </span>
          </div>
          <input
            type="search"
            value={sidebarSearch}
            onChange={(event) => setSidebarSearch(event.target.value)}
            placeholder="Search tasks"
            className="mt-3 w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={openNewTask}
            className="mt-3 w-full rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            + New Task
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? <LoadingPanel label="Loading tasks..." /> : null}
          {error ? <ErrorPanel message={error} /> : null}
          {!loading && !error
            ? taskListItems.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => openExistingTask(task)}
                  className="block w-full border-b border-borderSubtle p-3 text-left transition hover:bg-bgDark"
                >
                  <p className="text-sm font-medium text-textPrimary">
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs text-textMuted">
                    {task.division || "Diversified"} -{" "}
                    {task.assigned_to_name || "Unassigned"}
                  </p>
                  <div className="mt-2">
                    <StatusBadge status={task.status} compact />
                  </div>
                </button>
              ))
            : null}
          {!loading && !error && taskListItems.length === 0 ? (
            <div className="p-4 text-sm text-textSecondary">
              No open tasks match this view.
            </div>
          ) : null}
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderSubtle px-4 py-3">
          <h1 className="text-xl font-semibold text-textPrimary">
            Projection Calendar
          </h1>
          <p className="text-sm font-medium text-textSecondary">
            {formatWeekHeader(weekDays)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekOffset((current) => current - 1)}
              className="rounded-lg border border-borderSubtle px-3 py-2 text-sm font-semibold text-textPrimary transition hover:bg-bgDark"
            >
              &larr; Past Week
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(0)}
              className="rounded-lg border border-borderSubtle px-3 py-2 text-sm font-semibold text-textPrimary transition hover:bg-bgDark"
            >
              Current Week
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((current) => current + 1)}
              className="rounded-lg border border-borderSubtle px-3 py-2 text-sm font-semibold text-textPrimary transition hover:bg-bgDark"
            >
              Future Weeks &rarr;
            </button>
            <select
              value={userFilter}
              onChange={(event) => setUserFilter(event.target.value)}
              className="rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none"
            >
              <option>All Users</option>
              {employees.map((employee) => (
                <option key={employee.id}>{employee.name}</option>
              ))}
            </select>
            <div className="inline-flex rounded-lg border border-borderSubtle bg-bgDark p-1">
              {(["Day", "Week", "Month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                    viewMode === mode
                      ? "bg-navy text-white"
                      : "text-textSecondary hover:bg-surface"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="min-w-[980px]">
            <div
              className="sticky top-0 z-10 grid bg-surface"
              style={{
                gridTemplateColumns: `5rem repeat(${visibleDays.length}, minmax(10rem, 1fr))`,
              }}
            >
              <div className="border-b border-r border-borderSubtle px-2 py-3 text-xs font-semibold uppercase tracking-wide text-textMuted">
                Time
              </div>
              {visibleDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className="border-b border-r border-borderSubtle px-3 py-3 text-xs font-semibold uppercase tracking-wide text-textMuted"
                >
                  <span className="block">{formatDayName(day)}</span>
                  <span className="block text-textPrimary">
                    {formatShortDate(day)}
                  </span>
                </div>
              ))}
            </div>

            <div>
              {TIME_SLOTS.map((hour) => (
                <div
                  key={hour}
                  className="grid min-h-16"
                  style={{
                    gridTemplateColumns: `5rem repeat(${visibleDays.length}, minmax(10rem, 1fr))`,
                  }}
                >
                  <div className="min-h-16 border-b border-r border-borderSubtle px-2 pt-1 text-xs text-textMuted">
                    {formatHourLabel(hour)}
                  </div>
                  {visibleDays.map((day) => {
                    const slotTasks = calendarTasks.filter((task) =>
                      doesTaskMatchSlot(task, day, hour),
                    );

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="min-h-16 border-b border-r border-borderSubtle p-1 align-top"
                      >
                        {slotTasks.map((task) => (
                          <TaskChip
                            key={task.id}
                            task={task}
                            onClick={() => openExistingTask(task)}
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 border-t border-borderSubtle px-4 py-2 text-xs text-textSecondary">
          <LegendDot className="bg-emerald-500" label="Completed" />
          <LegendDot className="bg-sky-500" label="In Progress" />
          <LegendDot className="bg-red-500" label="Blocked" />
          <LegendDot className="bg-amber-500" label="To-Do" />
          <LegendDot className="bg-slate-500" label="Canceled" />
        </div>
      </main>

      {editorOpen ? (
        <TaskEditorModal
          editorState={editorState}
          setEditorState={setEditorState}
          employees={employees}
          isNewTask={isNewTask}
          saving={saving}
          editorError={editorError}
          onClose={() => setEditorOpen(false)}
          onSave={() => void handleSave()}
          onComplete={() => void handleComplete()}
          onLockToggle={() => void handleLockToggle()}
        />
      ) : null}
    </div>
  );
}

function TaskEditorModal({
  editorState,
  setEditorState,
  employees,
  isNewTask,
  saving,
  editorError,
  onClose,
  onSave,
  onComplete,
  onLockToggle,
}: {
  editorState: EditorState;
  setEditorState: React.Dispatch<React.SetStateAction<EditorState>>;
  employees: Employee[];
  isNewTask: boolean;
  saving: boolean;
  editorError: string | null;
  onClose: () => void;
  onSave: () => void;
  onComplete: () => void;
  onLockToggle: () => void;
}) {
  const isLocked = !isNewTask && editorState.locked;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 pt-10">
      <div className="mx-4 mb-10 w-full max-w-3xl rounded-xl border border-borderSubtle bg-surface shadow-lg">
        <div className="flex items-start justify-between gap-4 border-b border-borderSubtle px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-textPrimary">
                Task Editor
              </h2>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  <Lock className="h-3 w-3" /> Locked
                </span>
              ) : null}
            </div>
            {isLocked ? (
              <p className="mt-1 text-sm text-textSecondary">
                Task is locked. Unlock to edit.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-borderSubtle p-2 text-textSecondary transition hover:bg-bgDark hover:text-textPrimary"
            aria-label="Close task editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          {editorError ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 md:col-span-2 dark:text-red-300">
              {editorError}
            </div>
          ) : null}

          <Field className="md:col-span-2" label="Task *">
            <input
              type="text"
              value={editorState.title}
              disabled={isLocked}
              onChange={(event) =>
                setEditorState((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
            />
          </Field>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            <Field label="Division">
              <select
                value={editorState.division}
                disabled={isLocked}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    division: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
              >
                {DIVISIONS.map((division) => (
                  <option key={division}>{division}</option>
                ))}
              </select>
            </Field>
            <Field label="Task Type">
              <input
                type="text"
                value={editorState.topic}
                disabled={isLocked}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    topic: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </Field>
            <Field label="Priority">
              <select
                value={editorState.priority}
                disabled={isLocked}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    priority: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
              >
                {PRIORITIES.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Due Date">
            <input
              type="date"
              value={editorState.due_date}
              disabled={isLocked}
              onChange={(event) =>
                setEditorState((current) => ({
                  ...current,
                  due_date: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Assigned To">
            <select
              value={editorState.assigned_to}
              disabled={isLocked}
              onChange={(event) =>
                setEditorState((current) => ({
                  ...current,
                  assigned_to: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
            >
              <option value="">Unassigned</option>
              {employees.map((employee) => (
                <option key={employee.id} value={String(employee.id)}>
                  {employee.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
            <Field label="Start Date">
              <input
                type="date"
                value={editorState.start_date}
                disabled={isLocked}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    start_date: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </Field>
            <Field label="Start Time">
              <input
                type="time"
                value={editorState.start_time}
                disabled={isLocked}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    start_time: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </Field>
            <Field label="End Time">
              <input
                type="time"
                value={editorState.end_time}
                disabled={isLocked}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    end_time: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
              />
            </Field>
          </div>

          <Field label="Estimated Hours">
            <input
              type="number"
              min={0}
              value={editorState.estimated_hours}
              disabled={isLocked}
              onChange={(event) =>
                setEditorState((current) => ({
                  ...current,
                  estimated_hours: Number(event.target.value),
                }))
              }
              className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
            />
          </Field>
          <Field label="Estimated Minutes">
            <input
              type="number"
              min={0}
              max={59}
              value={editorState.estimated_minutes}
              disabled={isLocked}
              onChange={(event) =>
                setEditorState((current) => ({
                  ...current,
                  estimated_minutes: Number(event.target.value),
                }))
              }
              className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
            />
          </Field>

          <Field className="md:col-span-2" label="Description">
            <textarea
              value={editorState.description}
              disabled={isLocked}
              onChange={(event) =>
                setEditorState((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              className="min-h-[80px] w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
            />
          </Field>

          <Field className="md:col-span-2" label="Notes">
            <textarea
              value={editorState.notes}
              disabled={isLocked}
              onChange={(event) =>
                setEditorState((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              className="min-h-[80px] w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
            />
          </Field>

          <div className="flex flex-wrap gap-4 md:col-span-2">
            <CheckboxField
              label="All Day Event"
              checked={editorState.all_day}
              disabled={isLocked}
              onChange={(checked) =>
                setEditorState((current) => ({ ...current, all_day: checked }))
              }
            />
            <CheckboxField
              label="Private"
              checked={editorState.is_private}
              disabled={isLocked}
              onChange={(checked) =>
                setEditorState((current) => ({
                  ...current,
                  is_private: checked,
                }))
              }
            />
            <label className="min-w-44 flex-1">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-textMuted">
                Repeat
              </span>
              <select
                value={editorState.repeat_schedule}
                disabled={isLocked}
                onChange={(event) =>
                  setEditorState((current) => ({
                    ...current,
                    repeat_schedule: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-borderSubtle bg-bgDark px-3 py-2 text-sm text-textPrimary focus:border-accent focus:outline-none disabled:opacity-60"
              >
                {REPEAT_OPTIONS.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-borderSubtle px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {!isNewTask ? (
              <button
                type="button"
                disabled
                title="Coming in next release"
                className="cursor-not-allowed rounded-lg border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-600 opacity-50 dark:text-red-300"
              >
                Delete Task
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-borderSubtle px-4 py-2 text-sm font-semibold text-textPrimary transition hover:bg-bgDark"
            >
              Close
            </button>
            {!isNewTask && !editorState.locked ? (
              <button
                type="button"
                onClick={onLockToggle}
                disabled={saving}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:opacity-90 disabled:opacity-50 dark:text-amber-300"
              >
                Save and Lock Task
              </button>
            ) : null}
            {!isNewTask && editorState.locked ? (
              <button
                type="button"
                onClick={onLockToggle}
                disabled={saving}
                className="rounded-lg border border-borderSubtle px-4 py-2 text-sm font-semibold text-textPrimary transition hover:bg-bgDark disabled:opacity-50"
              >
                Unlock Task
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSave}
              disabled={saving || isLocked}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Task
            </button>
            {!isNewTask ? (
              <button
                type="button"
                onClick={onComplete}
                disabled={saving || isLocked}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:text-emerald-300"
              >
                Complete Task
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-textMuted">
        {label}
      </span>
      {children}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-textPrimary">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-borderSubtle bg-bgDark text-accent focus:ring-accent disabled:opacity-60"
      />
      {label}
    </label>
  );
}

function TaskChip({ task, onClick }: { task: Task; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-1 w-full cursor-pointer truncate rounded border px-1.5 py-1 text-left text-xs font-medium ${getChipClassName(task.status)}`}
    >
      <span className="block truncate">{task.title}</span>
      <span className="block truncate text-[10px] opacity-80">
        {task.assigned_to_name || "Unassigned"}
      </span>
    </button>
  );
}

function StatusBadge({
  status,
  compact = false,
}: {
  status: string | null;
  compact?: boolean;
}) {
  const label = getStatusLabel(status);
  return (
    <span
      className={`inline-flex rounded-full border font-semibold ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${getBadgeClassName(status)}`}
    >
      {label}
    </span>
  );
}

function LoadingPanel({ label }: { label: string }) {
  return (
    <div className="m-3 rounded-xl border border-borderSubtle bg-bgDark p-5 text-center text-sm text-textSecondary">
      {label}
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="m-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">
      {message}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function getWeekDays(offset: number): Date[] {
  const today = new Date();
  const day = today.getDay();
  const distanceToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + distanceToMonday + offset * 7);

  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function formatWeekHeader(dates: Date[]): string {
  const start = dates[0];
  const end = dates[dates.length - 1];
  const startLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(end);
  return `Week of ${startLabel} - ${endLabel}`;
}

function formatDayName(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

function formatHourLabel(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${suffix}`;
}

function doesTaskMatchSlot(task: Task, day: Date, hour: number) {
  const taskDate = getTaskDate(task);
  if (!taskDate || toDateKey(taskDate) !== toDateKey(day)) return false;
  const taskHour = parseStartHour(task.start_time);
  return taskHour === hour;
}

function getTaskDate(task: Task) {
  return parseDateOnly(task.start_date || task.due_date);
}

function parseDateOnly(value: string | null | undefined) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isWithinInclusive(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  return time >= start.getTime() && time <= end.getTime();
}

function parseStartHour(value: string | null) {
  if (!value) return 9;
  const hour = Number(value.slice(0, 2));
  return Number.isInteger(hour) ? hour : 9;
}

function normalizeStatus(status: string | null) {
  const normalized = (status || "todo").toLowerCase();
  if (normalized === "done" || normalized === "complete") return "completed";
  if (normalized === "cancelled") return "canceled";
  return normalized;
}

function getChipClassName(status: string | null) {
  const normalized = normalizeStatus(status);
  if (normalized === "completed") {
    return "border-emerald-500/30 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300";
  }
  if (normalized === "in_progress") {
    return "border-sky-500/30 bg-sky-500/20 text-sky-700 dark:text-sky-300";
  }
  if (normalized === "blocked") {
    return "border-red-500/30 bg-red-500/20 text-red-700 dark:text-red-300";
  }
  if (normalized === "canceled") {
    return "border-slate-500/30 bg-slate-500/20 text-slate-600 dark:text-slate-300";
  }
  return "border-amber-500/30 bg-amber-500/20 text-amber-700 dark:text-amber-300";
}

function getBadgeClassName(status: string | null) {
  const normalized = normalizeStatus(status);
  if (normalized === "completed") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  }
  if (normalized === "in_progress") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  }
  if (normalized === "blocked") {
    return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300";
  }
  if (normalized === "canceled") {
    return "border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-300";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function getStatusLabel(status: string | null) {
  const normalized = normalizeStatus(status);
  if (normalized === "in_progress") return "In Progress";
  if (normalized === "completed") return "Completed";
  if (normalized === "blocked") return "Blocked";
  if (normalized === "canceled") return "Canceled";
  return "To-Do";
}

function toEditorState(task: Task): EditorState {
  return {
    title: task.title || "",
    division: task.division || "Diversified",
    topic: task.topic || "",
    priority: normalizePriority(task.priority),
    due_date: toInputDate(task.due_date),
    start_date: toInputDate(task.start_date || task.due_date),
    start_time: task.start_time || "09:00",
    end_time: task.end_time || "10:00",
    assigned_to: task.assigned_to ? String(task.assigned_to) : "",
    estimated_hours: task.estimated_hours || 0,
    estimated_minutes: task.estimated_minutes || 0,
    description: task.description || "",
    notes: task.notes || "",
    all_day: Boolean(task.all_day),
    is_private: Boolean(task.is_private),
    repeat_schedule: task.repeat_schedule || "None",
    locked: Boolean(task.locked),
  };
}

function normalizePriority(priority: string | null) {
  const normalized = (priority || "Medium").toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "high") return "High";
  if (normalized === "urgent") return "Urgent";
  return "Medium";
}

function toInputDate(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function buildPayload(state: EditorState) {
  return {
    title: state.title,
    division: state.division,
    topic: state.topic,
    priority: state.priority.toLowerCase(),
    due_date: state.due_date || null,
    start_date: state.start_date || state.due_date || null,
    start_time: state.start_time,
    end_time: state.end_time,
    assigned_to: state.assigned_to ? Number(state.assigned_to) : null,
    estimated_hours: state.estimated_hours,
    estimated_minutes: state.estimated_minutes,
    description: state.description,
    notes: state.notes,
    all_day: state.all_day,
    is_private: state.is_private,
    repeat_schedule: state.repeat_schedule,
    locked: state.locked,
  };
}
