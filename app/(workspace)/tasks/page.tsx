"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  ListChecks,
  Mail,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import {
  Badge,
  Card,
  EmptyState,
  LoadingPanel,
  StatCard,
  Tabs,
  type BadgeTone,
} from "@/components/ui/Primitives";
import { Dropdown } from "@/components/ui/Dropdown";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { TaskForm } from "@/components/forms/TaskForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { deleteTask, toggleTask } from "@/lib/db/tasks";
import { can } from "@/lib/roles";
import { errorMessage, formatNumber, isOverdue, titleCase } from "@/lib/format";
import { dueTodayTasks, overdueTasks } from "@/lib/metrics";
import type { Task, TaskPriority, TaskType } from "@/lib/types";

type Filter = "open" | "today" | "overdue" | "mine" | "completed" | "all";

const PRIORITY_TONES: Record<TaskPriority, BadgeTone> = {
  low: "neutral",
  medium: "sky",
  high: "amber",
  urgent: "rose",
};

const TYPE_ICONS: Record<TaskType, typeof ListChecks> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  follow_up: CalendarClock,
  todo: ListChecks,
};

export default function TasksPage() {
  const searchParams = useSearchParams();
  const { orgId, actor, role, user, members } = useAuth();
  const { tasks, loading } = useData();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [filter, setFilter] = useState<Filter>("open");
  const [assignee, setAssignee] = useState("all");
  const [term, setTerm] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const canCreate = can(role, "records:create");
  const canUpdate = can(role, "records:update");
  const canDelete = can(role, "records:delete");

  useEffect(() => {
    const preset = searchParams.get("filter");
    if (preset === "overdue" || preset === "today" || preset === "mine" || preset === "completed") {
      setFilter(preset);
    }
  }, [searchParams]);

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const overdueIds = new Set(overdueTasks(tasks).map((task) => task.id));
    const todayIds = new Set(dueTodayTasks(tasks).map((task) => task.id));

    return tasks
      .filter((task) => {
        if (filter === "open" && task.completed) return false;
        if (filter === "completed" && !task.completed) return false;
        if (filter === "overdue" && !overdueIds.has(task.id)) return false;
        if (filter === "today" && !todayIds.has(task.id)) return false;
        if (filter === "mine" && task.assigneeId !== user?.uid) return false;
        if (assignee !== "all" && task.assigneeId !== assignee) return false;
        if (!needle) return true;
        return [task.title, task.description, task.relatedName]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99");
      });
  }, [tasks, filter, assignee, term, user?.uid]);

  const toggle = async (task: Task) => {
    if (!orgId || !actor) return;
    try {
      await toggleTask(orgId, actor, task);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (task: Task) => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Delete this task?",
      message: `"${task.title}" will be removed permanently.`,
      confirmLabel: "Delete task",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteTask(orgId, actor, task);
      toast.success("Task deleted.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const open = tasks.filter((task) => !task.completed);
  const overdue = overdueTasks(tasks);
  const today = dueTodayTasks(tasks);

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Calls, emails, meetings and follow-ups, with an owner and a date."
        actions={
          canCreate ? (
            <Button
              icon={<Plus className="size-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New task
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Open tasks" value={formatNumber(open.length)} icon={<ListChecks className="size-5" />} />
          <StatCard label="Due today" value={formatNumber(today.length)} tone="sky" />
          <StatCard label="Overdue" value={formatNumber(overdue.length)} tone="rose" />
          <StatCard
            label="Completed"
            value={formatNumber(tasks.filter((task) => task.completed).length)}
            tone="green"
          />
        </div>
      </PageHeader>

      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            tabs={[
              { id: "open", label: "Open", count: open.length },
              { id: "today", label: "Today", count: today.length },
              { id: "overdue", label: "Overdue", count: overdue.length },
              { id: "mine", label: "Mine" },
              { id: "completed", label: "Done" },
              { id: "all", label: "All", count: tasks.length },
            ]}
            active={filter}
            onChange={setFilter}
          />
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Select value={assignee} onChange={(event) => setAssignee(event.target.value)}>
              <option value="all">Anyone</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search tasks"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingPanel label="Loading tasks" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title={tasks.length ? "Nothing in this view" : "No tasks yet"}
          message={
            tasks.length
              ? "Switch tabs or clear the filters to see other tasks."
              : "Schedule the next step on a lead, contact or deal so it does not depend on memory."
          }
          action={
            canCreate && !tasks.length ? (
              <Button
                icon={<Plus className="size-4" />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Create a task
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((task) => {
            const Icon = TYPE_ICONS[task.type] ?? ListChecks;
            const late = isOverdue(task.dueDate, task.completed);
            return (
              <li
                key={task.id}
                className={clsx(
                  "flex items-start gap-3 rounded-xl border bg-white/[0.02] p-4 transition",
                  late ? "border-rose-400/30" : "border-white/10",
                )}
              >
                <button
                  type="button"
                  onClick={() => canUpdate && toggle(task)}
                  disabled={!canUpdate}
                  aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`}
                  className={clsx(
                    "mt-0.5 transition",
                    task.completed ? "text-emerald-400" : "text-slate-500 hover:text-emerald-400",
                    !canUpdate && "cursor-not-allowed opacity-50",
                  )}
                >
                  {task.completed ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={clsx(
                      "text-sm font-medium",
                      task.completed ? "text-slate-500 line-through" : "text-white",
                    )}
                  >
                    {task.title}
                  </p>
                  {task.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-slate-400">{task.description}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Icon className="size-3" />
                      {titleCase(task.type)}
                    </span>
                    <span className={late ? "text-rose-300" : undefined}>
                      <CalendarClock className="mr-1 inline size-3" />
                      {task.dueDate ?? "No due date"}
                      {task.dueTime ? ` ${task.dueTime}` : ""}
                    </span>
                    {task.assigneeName ? <span>· {task.assigneeName}</span> : null}
                    {task.relatedName ? (
                      <span>
                        · {titleCase(task.relatedType ?? "")}: {task.relatedName}
                      </span>
                    ) : null}
                  </div>
                </div>

                <Badge tone={PRIORITY_TONES[task.priority]}>{task.priority}</Badge>

                <Dropdown
                  items={[
                    {
                      label: task.completed ? "Mark as open" : "Mark as complete",
                      icon: <CheckCircle2 className="size-4" />,
                      disabled: !canUpdate,
                      onSelect: () => toggle(task),
                    },
                    {
                      label: "Edit task",
                      icon: <Pencil className="size-4" />,
                      disabled: !canUpdate,
                      onSelect: () => {
                        setEditing(task);
                        setFormOpen(true);
                      },
                    },
                    {
                      label: "Delete task",
                      icon: <Trash2 className="size-4" />,
                      tone: "danger",
                      disabled: !canDelete,
                      onSelect: () => remove(task),
                    },
                  ]}
                />
              </li>
            );
          })}
        </ul>
      )}

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} task={editing} />
      {dialog}
    </>
  );
}
