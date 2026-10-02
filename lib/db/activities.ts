import { limit, orderBy, where, type QueryConstraint } from "firebase/firestore";
import type { Activity, ActivityType, RelatedType } from "@/lib/types";
import { COLLECTIONS, createRecord, deleteRecord, listRecords, subscribeRecords, updateRecord } from "./base";

export interface Actor {
  id: string;
  name: string;
}

export interface LogInput {
  type: ActivityType;
  summary: string;
  body?: string | null;
  relatedType?: RelatedType | null;
  relatedId?: string | null;
  relatedName?: string | null;
}

/**
 * Appends an entry to the org activity timeline. Logging must never break the
 * action that triggered it, so failures are swallowed after a console warning.
 */
export async function logActivity(orgId: string, actor: Actor, input: LogInput): Promise<void> {
  try {
    await createRecord(COLLECTIONS.activities, orgId, actor.id, {
      type: input.type,
      summary: input.summary,
      body: input.body ?? null,
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
      relatedName: input.relatedName ?? null,
      actorId: actor.id,
      actorName: actor.name,
    });
  } catch (error) {
    console.warn("Failed to log activity", error);
  }
}

export function subscribeActivities(
  orgId: string,
  onData: (rows: Activity[]) => void,
  onError: (error: Error) => void,
  max = 200,
) {
  return subscribeRecords<Activity>(
    COLLECTIONS.activities,
    orgId,
    [orderBy("createdAt", "desc"), limit(max)],
    onData,
    onError,
  );
}

export function subscribeRecordActivities(
  orgId: string,
  relatedType: RelatedType,
  relatedId: string,
  onData: (rows: Activity[]) => void,
  onError: (error: Error) => void,
) {
  const constraints: QueryConstraint[] = [
    where("relatedType", "==", relatedType),
    where("relatedId", "==", relatedId),
    orderBy("createdAt", "desc"),
    limit(100),
  ];
  return subscribeRecords<Activity>(COLLECTIONS.activities, orgId, constraints, onData, onError);
}

export function listActivities(orgId: string) {
  return listRecords<Activity>(COLLECTIONS.activities, orgId, [orderBy("createdAt", "desc"), limit(500)]);
}

export function updateActivity(id: string, data: Partial<Activity>) {
  return updateRecord(COLLECTIONS.activities, id, data as Record<string, unknown>);
}

export function deleteActivity(id: string) {
  return deleteRecord(COLLECTIONS.activities, id);
}
