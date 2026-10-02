import { orderBy, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import type { Deal, Pipeline } from "@/lib/types";
import {
  COLLECTIONS,
  createRecord,
  deleteRecord,
  detachWhere,
  getRecord,
  listRecords,
  subscribeRecords,
  updateRecord,
} from "./base";
import { logActivity, type Actor } from "./activities";

export type DealDraft = Omit<Deal, "id" | "orgId" | "createdAt" | "updatedAt" | "createdBy">;

export function emptyDeal(pipeline: Pipeline | null, currency = "USD"): DealDraft {
  const stage = pipeline?.stages[0];
  return {
    title: "",
    pipelineId: pipeline?.id ?? "",
    stageId: stage?.id ?? "",
    value: 0,
    currency,
    probability: stage?.probability ?? 10,
    status: "open",
    lostReason: null,
    expectedCloseDate: null,
    closedAt: null,
    contactId: null,
    contactName: null,
    companyId: null,
    companyName: null,
    ownerId: null,
    ownerName: null,
    source: null,
    description: null,
    tags: [],
    order: Date.now(),
  };
}

export function subscribeDeals(
  orgId: string,
  onData: (rows: Deal[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return subscribeRecords<Deal>(COLLECTIONS.deals, orgId, [orderBy("createdAt", "desc")], onData, onError);
}

export function listDeals(orgId: string) {
  return listRecords<Deal>(COLLECTIONS.deals, orgId, [orderBy("createdAt", "desc")]);
}

export function getDeal(id: string) {
  return getRecord<Deal>(COLLECTIONS.deals, id);
}

export async function createDeal(orgId: string, actor: Actor, draft: DealDraft): Promise<string> {
  const id = await createRecord(COLLECTIONS.deals, orgId, actor.id, draft);
  await logActivity(orgId, actor, {
    type: "created",
    summary: `created deal ${draft.title}`,
    relatedType: "deal",
    relatedId: id,
    relatedName: draft.title,
  });
  return id;
}

export async function updateDeal(
  orgId: string,
  actor: Actor,
  deal: Deal,
  patch: Partial<DealDraft>,
): Promise<void> {
  await updateRecord(COLLECTIONS.deals, deal.id, patch);
  await logActivity(orgId, actor, {
    type: "updated",
    summary: `updated deal ${patch.title ?? deal.title}`,
    relatedType: "deal",
    relatedId: deal.id,
    relatedName: patch.title ?? deal.title,
  });
}

/** Kanban drag-drop: moves a deal to another stage and records the transition. */
export async function moveDealToStage(
  orgId: string,
  actor: Actor,
  deal: Deal,
  pipeline: Pipeline,
  stageId: string,
  order: number,
): Promise<void> {
  const stage = pipeline.stages.find((s) => s.id === stageId);
  await updateRecord(COLLECTIONS.deals, deal.id, {
    stageId,
    order,
    probability: stage?.probability ?? deal.probability,
    status: "open",
    closedAt: null,
    lostReason: null,
  });
  await logActivity(orgId, actor, {
    type: "stage_change",
    summary: `moved ${deal.title} to ${stage?.name ?? stageId}`,
    relatedType: "deal",
    relatedId: deal.id,
    relatedName: deal.title,
  });
}

export async function markDealWon(orgId: string, actor: Actor, deal: Deal): Promise<void> {
  await updateRecord(COLLECTIONS.deals, deal.id, {
    status: "won",
    probability: 100,
    closedAt: serverTimestamp(),
    lostReason: null,
  });
  await logActivity(orgId, actor, {
    type: "won",
    summary: `won ${deal.title}`,
    relatedType: "deal",
    relatedId: deal.id,
    relatedName: deal.title,
  });
}

export async function markDealLost(
  orgId: string,
  actor: Actor,
  deal: Deal,
  reason: string,
): Promise<void> {
  await updateRecord(COLLECTIONS.deals, deal.id, {
    status: "lost",
    probability: 0,
    closedAt: serverTimestamp(),
    lostReason: reason || null,
  });
  await logActivity(orgId, actor, {
    type: "lost",
    summary: `lost ${deal.title}${reason ? ` (${reason})` : ""}`,
    relatedType: "deal",
    relatedId: deal.id,
    relatedName: deal.title,
  });
}

export async function reopenDeal(orgId: string, actor: Actor, deal: Deal, pipeline: Pipeline | null): Promise<void> {
  const stage = pipeline?.stages.find((s) => s.id === deal.stageId) ?? pipeline?.stages[0];
  await updateRecord(COLLECTIONS.deals, deal.id, {
    status: "open",
    closedAt: null,
    lostReason: null,
    probability: stage?.probability ?? 10,
    stageId: stage?.id ?? deal.stageId,
  });
  await logActivity(orgId, actor, {
    type: "updated",
    summary: `reopened ${deal.title}`,
    relatedType: "deal",
    relatedId: deal.id,
    relatedName: deal.title,
  });
}

export async function deleteDeal(orgId: string, actor: Actor, deal: Deal): Promise<void> {
  await deleteRecord(COLLECTIONS.deals, deal.id);
  await detachWhere(COLLECTIONS.tasks, orgId, "relatedId", deal.id, {
    relatedId: null,
    relatedType: null,
    relatedName: null,
  });
  await logActivity(orgId, actor, { type: "deleted", summary: `deleted deal ${deal.title}` });
}
