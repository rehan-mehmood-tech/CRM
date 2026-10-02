import { orderBy, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import type { Task } from "@/lib/types";
import {
  COLLECTIONS,
  createRecord,
  deleteRecord,
  getRecord,
  listRecords,
  subscribeRecords,
  updateRecord,
} from "./base";
import { logActivity, type Actor } from "./activities";

export type TaskDraft = Omit<Task, "id" | "orgId" | "createdAt" | "updatedAt" | "createdBy">;

export function emptyTask(): TaskDraft {
  return {
    title: "",
    description: null,
    type: "todo",
    priority: "medium",
    completed: false,
    completedAt: null,
    dueDate: null,
    dueTime: null,
    assigneeId: null,
    assigneeName: null,
    relatedType: null,
    relatedId: null,
    relatedName: null,
  };
}

export function subscribeTasks(
  orgId: string,
  onData: (rows: Task[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return subscribeRecords<Task>(COLLECTIONS.tasks, orgId, [orderBy("createdAt", "desc")], onData, onError);
}

export function listTasks(orgId: string) {
  return listRecords<Task>(COLLECTIONS.tasks, orgId, [orderBy("createdAt", "desc")]);
}

export function getTask(id: string) {
  return getRecord<Task>(COLLECTIONS.tasks, id);
}

export async function createTask(orgId: string, actor: Actor, draft: TaskDraft): Promise<string> {
  const id = await createRecord(COLLECTIONS.tasks, orgId, actor.id, draft);
  await logActivity(orgId, actor, {
    type: "created",
    summary: `created task ${draft.title}`,
    relatedType: draft.relatedType,
    relatedId: draft.relatedId,
    relatedName: draft.relatedName,
  });
  return id;
}

export async function updateTask(
  orgId: string,
  actor: Actor,
  task: Task,
  patch: Partial<TaskDraft>,
): Promise<void> {
  await updateRecord(COLLECTIONS.tasks, task.id, patch);
  await logActivity(orgId, actor, {
    type: "updated",
    summary: `updated task ${patch.title ?? task.title}`,
    relatedType: patch.relatedType ?? task.relatedType,
    relatedId: patch.relatedId ?? task.relatedId,
    relatedName: patch.relatedName ?? task.relatedName,
  });
}

export async function toggleTask(orgId: string, actor: Actor, task: Task): Promise<void> {
  const completed = !task.completed;
  await updateRecord(COLLECTIONS.tasks, task.id, {
    completed,
    completedAt: completed ? serverTimestamp() : null,
  });
  if (completed) {
    await logActivity(orgId, actor, {
      type: "task_completed",
      summary: `completed task ${task.title}`,
      relatedType: task.relatedType,
      relatedId: task.relatedId,
      relatedName: task.relatedName,
    });
  }
}

export async function deleteTask(orgId: string, actor: Actor, task: Task): Promise<void> {
  await deleteRecord(COLLECTIONS.tasks, task.id);
  await logActivity(orgId, actor, { type: "deleted", summary: `deleted task ${task.title}` });
}
