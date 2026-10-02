import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase/client";

export const COLLECTIONS = {
  users: "users",
  organizations: "organizations",
  invitations: "invitations",
  pipelines: "pipelines",
  leads: "leads",
  contacts: "contacts",
  companies: "companies",
  deals: "deals",
  tasks: "tasks",
  activities: "activities",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/** Strips `undefined` values — Firestore rejects them. */
export function clean<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function withId<T>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

export function collectionRef(name: CollectionName) {
  return collection(getDb(), name);
}

export function docRef(name: CollectionName, id: string) {
  return doc(getDb(), name, id);
}

/** Creates an org-scoped document and returns its id. */
export async function createRecord(
  name: CollectionName,
  orgId: string,
  actorId: string,
  data: Record<string, unknown>,
): Promise<string> {
  const ref = await addDoc(collectionRef(name), {
    ...clean(data),
    orgId,
    createdBy: actorId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRecord(
  name: CollectionName,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await updateDoc(docRef(name, id), { ...clean(data), updatedAt: serverTimestamp() });
}

export async function deleteRecord(name: CollectionName, id: string): Promise<void> {
  await deleteDoc(docRef(name, id));
}

export async function getRecord<T>(name: CollectionName, id: string): Promise<T | null> {
  const snap = await getDoc(docRef(name, id));
  return snap.exists() ? withId<T>(snap.id, snap.data()) : null;
}

/** One-shot org-scoped read. */
export async function listRecords<T>(
  name: CollectionName,
  orgId: string,
  constraints: QueryConstraint[] = [],
): Promise<T[]> {
  const snap = await getDocs(query(collectionRef(name), where("orgId", "==", orgId), ...constraints));
  return snap.docs.map((d) => withId<T>(d.id, d.data()));
}

/** Realtime org-scoped subscription. Returns the unsubscribe function. */
export function subscribeRecords<T>(
  name: CollectionName,
  orgId: string,
  constraints: QueryConstraint[],
  onData: (rows: T[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(collectionRef(name), where("orgId", "==", orgId), ...constraints),
    (snap) => onData(snap.docs.map((d) => withId<T>(d.id, d.data()))),
    (error) => onError(error),
  );
}

/** Deletes every document in `name` that references `field === value`. Used for cascades. */
export async function deleteWhere(
  name: CollectionName,
  orgId: string,
  field: string,
  value: string,
): Promise<number> {
  const snap = await getDocs(
    query(collectionRef(name), where("orgId", "==", orgId), where(field, "==", value)),
  );
  if (snap.empty) return 0;
  const batch = writeBatch(getDb());
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

/** Nulls out a reference on every document pointing at a deleted record. */
export async function detachWhere(
  name: CollectionName,
  orgId: string,
  field: string,
  value: string,
  patch: Record<string, unknown>,
): Promise<number> {
  const snap = await getDocs(
    query(collectionRef(name), where("orgId", "==", orgId), where(field, "==", value)),
  );
  if (snap.empty) return 0;
  const batch = writeBatch(getDb());
  snap.docs.forEach((d) => batch.update(d.ref, patch));
  await batch.commit();
  return snap.size;
}

export { addDoc, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, where, writeBatch };
