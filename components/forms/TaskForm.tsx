"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { OwnerSelect, RelatedSelect } from "./shared";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { createTask, emptyTask, updateTask, type TaskDraft } from "@/lib/db/tasks";
import { errorMessage } from "@/lib/format";
import type { RelatedType, Task, TaskPriority, TaskType } from "@/lib/types";

const TYPES: TaskType[] = ["call", "email", "meeting", "follow_up", "todo"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export function TaskForm({
  open,
  onClose,
  task,
  preset,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  preset?: { relatedType: RelatedType; relatedId: string; relatedName: string } | null;
}) {
  const { orgId, actor } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<TaskDraft>(emptyTask());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (task) {
      const { id, orgId: _orgId, createdAt, updatedAt, createdBy, ...rest } = task;
      setDraft(rest);
    } else {
      setDraft({
        ...emptyTask(),
        assigneeId: actor?.id ?? null,
        assigneeName: actor?.name ?? null,
        relatedType: preset?.relatedType ?? null,
        relatedId: preset?.relatedId ?? null,
        relatedName: preset?.relatedName ?? null,
      });
    }
  }, [open, task, actor, preset]);

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId || !actor) return;
    if (!draft.title.trim()) {
      setError("Describe what needs doing.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (task) {
        await updateTask(orgId, actor, task, draft);
        toast.success("Task updated.");
      } else {
        await createTask(orgId, actor, draft);
        toast.success("Task created.");
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Edit task" : "New task"}
      description="Assign the next step so nothing depends on memory."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="task-form" type="submit" loading={pending}>
            {task ? "Save changes" : "Create task"}
          </Button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit} className="space-y-4">
        {error ? <ErrorPanel message={error} /> : null}

        <Field label="Task" required>
          <Input
            value={draft.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Call back about the proposal"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            <Select value={draft.type} onChange={(event) => set("type", event.target.value as TaskType)}>
              {TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={draft.priority}
              onChange={(event) => set("priority", event.target.value as TaskPriority)}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority.replace(/\b\w/g, (char) => char.toUpperCase())}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Due date">
            <Input
              type="date"
              value={draft.dueDate ?? ""}
              onChange={(event) => set("dueDate", event.target.value || null)}
            />
          </Field>
          <Field label="Due time">
            <Input
              type="time"
              value={draft.dueTime ?? ""}
              onChange={(event) => set("dueTime", event.target.value || null)}
            />
          </Field>
          <Field label="Assignee">
            <OwnerSelect
              value={draft.assigneeId}
              onChange={(assigneeId, assigneeName) =>
                setDraft((current) => ({ ...current, assigneeId, assigneeName }))
              }
            />
          </Field>
        </div>

        <Field label="Linked record" hint="Attach the task to a lead, contact, company or deal.">
          <RelatedSelect
            type={draft.relatedType}
            id={draft.relatedId}
            onChange={(relatedType, relatedId, relatedName) =>
              setDraft((current) => ({ ...current, relatedType, relatedId, relatedName }))
            }
          />
        </Field>

        <Field label="Details">
          <Textarea
            value={draft.description ?? ""}
            onChange={(event) => set("description", event.target.value || null)}
          />
        </Field>
      </form>
    </Modal>
  );
}
