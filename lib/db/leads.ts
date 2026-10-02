import { orderBy, type Unsubscribe } from "firebase/firestore";
import type { Contact, Deal, Lead } from "@/lib/types";
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

export type LeadDraft = Omit<Lead, "id" | "orgId" | "createdAt" | "updatedAt" | "createdBy">;

export function emptyLead(): LeadDraft {
  return {
    name: "",
    email: null,
    phone: null,
    company: null,
    title: null,
    status: "new",
    source: "website",
    score: 50,
    value: 0,
    notes: null,
    ownerId: null,
    ownerName: null,
    tags: [],
    convertedContactId: null,
    convertedDealId: null,
  };
}

export function subscribeLeads(
  orgId: string,
  onData: (rows: Lead[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return subscribeRecords<Lead>(COLLECTIONS.leads, orgId, [orderBy("createdAt", "desc")], onData, onError);
}

export function listLeads(orgId: string) {
  return listRecords<Lead>(COLLECTIONS.leads, orgId, [orderBy("createdAt", "desc")]);
}

export function getLead(id: string) {
  return getRecord<Lead>(COLLECTIONS.leads, id);
}

export async function createLead(orgId: string, actor: Actor, draft: LeadDraft): Promise<string> {
  const id = await createRecord(COLLECTIONS.leads, orgId, actor.id, draft);
  await logActivity(orgId, actor, {
    type: "created",
    summary: `created lead ${draft.name}`,
    relatedType: "lead",
    relatedId: id,
    relatedName: draft.name,
  });
  return id;
}

export async function updateLead(
  orgId: string,
  actor: Actor,
  lead: Lead,
  patch: Partial<LeadDraft>,
): Promise<void> {
  await updateRecord(COLLECTIONS.leads, lead.id, patch);
  const statusChanged = patch.status && patch.status !== lead.status;
  await logActivity(orgId, actor, {
    type: "updated",
    summary: statusChanged
      ? `moved lead ${lead.name} to ${patch.status}`
      : `updated lead ${patch.name ?? lead.name}`,
    relatedType: "lead",
    relatedId: lead.id,
    relatedName: patch.name ?? lead.name,
  });
}

export async function deleteLead(orgId: string, actor: Actor, lead: Lead): Promise<void> {
  await deleteRecord(COLLECTIONS.leads, lead.id);
  await detachWhere(COLLECTIONS.tasks, orgId, "relatedId", lead.id, {
    relatedId: null,
    relatedType: null,
    relatedName: null,
  });
  await logActivity(orgId, actor, { type: "deleted", summary: `deleted lead ${lead.name}` });
}

export interface ConvertResult {
  contactId: string;
  dealId: string | null;
}

/**
 * Turns a qualified lead into a contact and, when a pipeline stage is supplied,
 * an open deal. The lead is kept and marked converted so the trail stays intact.
 */
export async function convertLead(
  orgId: string,
  actor: Actor,
  lead: Lead,
  options: { createDeal: boolean; pipelineId?: string; stageId?: string; dealValue?: number },
): Promise<ConvertResult> {
  const [firstName, ...rest] = lead.name.trim().split(/\s+/);
  const contactDraft: Partial<Contact> = {
    firstName: firstName || lead.name,
    lastName: rest.join(" "),
    email: lead.email,
    phone: lead.phone,
    title: lead.title,
    companyId: null,
    companyName: lead.company,
    status: "active",
    source: lead.source,
    address: null,
    city: null,
    country: null,
    linkedin: null,
    notes: lead.notes,
    ownerId: lead.ownerId,
    ownerName: lead.ownerName,
    tags: lead.tags,
  };
  const contactId = await createRecord(
    COLLECTIONS.contacts,
    orgId,
    actor.id,
    contactDraft as Record<string, unknown>,
  );

  let dealId: string | null = null;
  if (options.createDeal && options.pipelineId && options.stageId) {
    const dealDraft: Partial<Deal> = {
      title: `${lead.company ?? lead.name} opportunity`,
      pipelineId: options.pipelineId,
      stageId: options.stageId,
      value: options.dealValue ?? lead.value ?? 0,
      currency: "USD",
      probability: 25,
      status: "open",
      lostReason: null,
      expectedCloseDate: null,
      closedAt: null,
      contactId,
      contactName: lead.name,
      companyId: null,
      companyName: lead.company,
      ownerId: lead.ownerId,
      ownerName: lead.ownerName,
      source: lead.source,
      description: lead.notes,
      tags: lead.tags,
      order: Date.now(),
    };
    dealId = await createRecord(COLLECTIONS.deals, orgId, actor.id, dealDraft as Record<string, unknown>);
  }

  await updateRecord(COLLECTIONS.leads, lead.id, {
    status: "converted",
    convertedContactId: contactId,
    convertedDealId: dealId,
  });

  await logActivity(orgId, actor, {
    type: "converted",
    summary: dealId
      ? `converted lead ${lead.name} into a contact and a deal`
      : `converted lead ${lead.name} into a contact`,
    relatedType: "contact",
    relatedId: contactId,
    relatedName: lead.name,
  });

  return { contactId, dealId };
}
