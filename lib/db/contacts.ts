import { orderBy, type Unsubscribe } from "firebase/firestore";
import type { Contact } from "@/lib/types";
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

export type ContactDraft = Omit<Contact, "id" | "orgId" | "createdAt" | "updatedAt" | "createdBy">;

export function emptyContact(): ContactDraft {
  return {
    firstName: "",
    lastName: "",
    email: null,
    phone: null,
    title: null,
    companyId: null,
    companyName: null,
    status: "active",
    source: null,
    address: null,
    city: null,
    country: null,
    linkedin: null,
    notes: null,
    ownerId: null,
    ownerName: null,
    tags: [],
  };
}

export function contactName(contact: Pick<Contact, "firstName" | "lastName">): string {
  return `${contact.firstName} ${contact.lastName}`.trim();
}

export function subscribeContacts(
  orgId: string,
  onData: (rows: Contact[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return subscribeRecords<Contact>(COLLECTIONS.contacts, orgId, [orderBy("createdAt", "desc")], onData, onError);
}

export function listContacts(orgId: string) {
  return listRecords<Contact>(COLLECTIONS.contacts, orgId, [orderBy("createdAt", "desc")]);
}

export function getContact(id: string) {
  return getRecord<Contact>(COLLECTIONS.contacts, id);
}

export async function createContact(orgId: string, actor: Actor, draft: ContactDraft): Promise<string> {
  const id = await createRecord(COLLECTIONS.contacts, orgId, actor.id, draft);
  await logActivity(orgId, actor, {
    type: "created",
    summary: `created contact ${contactName(draft)}`,
    relatedType: "contact",
    relatedId: id,
    relatedName: contactName(draft),
  });
  return id;
}

export async function updateContact(
  orgId: string,
  actor: Actor,
  contact: Contact,
  patch: Partial<ContactDraft>,
): Promise<void> {
  await updateRecord(COLLECTIONS.contacts, contact.id, patch);
  const name = contactName({ ...contact, ...patch });
  await logActivity(orgId, actor, {
    type: "updated",
    summary: `updated contact ${name}`,
    relatedType: "contact",
    relatedId: contact.id,
    relatedName: name,
  });
  // Keep the denormalised name on related deals in step with the contact.
  await detachWhere(COLLECTIONS.deals, orgId, "contactId", contact.id, { contactName: name });
}

export async function deleteContact(orgId: string, actor: Actor, contact: Contact): Promise<void> {
  await deleteRecord(COLLECTIONS.contacts, contact.id);
  await detachWhere(COLLECTIONS.deals, orgId, "contactId", contact.id, {
    contactId: null,
    contactName: null,
  });
  await detachWhere(COLLECTIONS.tasks, orgId, "relatedId", contact.id, {
    relatedId: null,
    relatedType: null,
    relatedName: null,
  });
  await logActivity(orgId, actor, {
    type: "deleted",
    summary: `deleted contact ${contactName(contact)}`,
  });
}
