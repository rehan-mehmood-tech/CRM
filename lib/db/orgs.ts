import {
  arrayRemove,
  arrayUnion,
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
  type Unsubscribe,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "@/lib/firebase/client";
import type { Invitation, Member, Organization, PipelineStage, PlanId, Role, UserProfile } from "@/lib/types";
import { COLLECTIONS, clean, createRecord, withId } from "./base";
import { logActivity, type Actor } from "./activities";

export const DEFAULT_STAGES: PipelineStage[] = [
  { id: "new", name: "New", probability: 10, color: "#64748b" },
  { id: "qualified", name: "Qualified", probability: 25, color: "#0ea5e9" },
  { id: "proposal", name: "Proposal sent", probability: 50, color: "#8b5cf6" },
  { id: "negotiation", name: "Negotiation", probability: 75, color: "#f59e0b" },
  { id: "closing", name: "Closing", probability: 90, color: "#10b981" },
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function userDoc(uid: string) {
  return doc(getDb(), COLLECTIONS.users, uid);
}

function orgDoc(orgId: string) {
  return doc(getDb(), COLLECTIONS.organizations, orgId);
}

export function membersCollection(orgId: string) {
  return collection(getDb(), COLLECTIONS.organizations, orgId, "members");
}

export function memberDoc(orgId: string, uid: string) {
  return doc(getDb(), COLLECTIONS.organizations, orgId, "members", uid);
}

/** Creates the user profile document on first sign-in, or refreshes its auth-derived fields. */
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const ref = userDoc(user.uid);
  const snap = await getDoc(ref);
  const name = user.displayName || user.email?.split("@")[0] || "Teammate";

  if (!snap.exists()) {
    const profile = {
      email: user.email ?? "",
      name,
      photoUrl: user.photoURL ?? null,
      phone: user.phoneNumber ?? null,
      title: null,
      orgIds: [] as string[],
      defaultOrgId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    const created = await getDoc(ref);
    return withId<UserProfile>(user.uid, created.data() ?? profile);
  }

  const existing = snap.data();
  const patch: Record<string, unknown> = {};
  if (user.email && existing.email !== user.email) patch.email = user.email;
  if (user.photoURL && existing.photoUrl !== user.photoURL) patch.photoUrl = user.photoURL;
  if (Object.keys(patch).length) {
    patch.updatedAt = serverTimestamp();
    await updateDoc(ref, patch);
  }
  return withId<UserProfile>(user.uid, { ...existing, ...patch });
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userDoc(uid),
    (snap) => onData(snap.exists() ? withId<UserProfile>(snap.id, snap.data()) : null),
    onError,
  );
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(userDoc(uid), { ...clean(data as Record<string, unknown>), updatedAt: serverTimestamp() });
}

export interface CreateOrgInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  currency: string;
  plan: PlanId;
}

/**
 * Creates a workspace, its owner membership, its default pipeline and links the
 * org to the user profile, all in one atomic batch.
 */
export async function createOrganization(user: User, input: CreateOrgInput): Promise<string> {
  const db = getDb();
  const batch = writeBatch(db);
  const org = doc(collection(db, COLLECTIONS.organizations));
  const name = user.displayName || user.email?.split("@")[0] || "Owner";

  batch.set(org, {
    name: input.name,
    slug: `${slugify(input.name)}-${org.id.slice(0, 5).toLowerCase()}`,
    website: input.website ?? null,
    industry: input.industry ?? null,
    currency: input.currency,
    ownerId: user.uid,
    plan: input.plan,
    planStatus: "trialing",
    trialEndsAt: null,
    memberCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(memberDoc(org.id, user.uid), {
    orgId: org.id,
    email: user.email ?? "",
    name,
    photoUrl: user.photoURL ?? null,
    role: "owner" satisfies Role,
    status: "active",
    joinedAt: serverTimestamp(),
  });

  const pipeline = doc(collection(db, COLLECTIONS.pipelines));
  batch.set(pipeline, {
    orgId: org.id,
    name: "Sales pipeline",
    isDefault: true,
    stages: DEFAULT_STAGES,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  batch.set(
    userDoc(user.uid),
    {
      email: user.email ?? "",
      name,
      photoUrl: user.photoURL ?? null,
      orgIds: arrayUnion(org.id),
      defaultOrgId: org.id,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
  await logActivity(
    org.id,
    { id: user.uid, name },
    { type: "created", summary: `created the ${input.name} workspace` },
  );
  return org.id;
}

export function subscribeOrganization(
  orgId: string,
  onData: (org: Organization | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    orgDoc(orgId),
    (snap) => onData(snap.exists() ? withId<Organization>(snap.id, snap.data()) : null),
    onError,
  );
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const snap = await getDoc(orgDoc(orgId));
  return snap.exists() ? withId<Organization>(snap.id, snap.data()) : null;
}

export async function listUserOrganizations(orgIds: string[]): Promise<Organization[]> {
  const orgs = await Promise.all(orgIds.map((id) => getOrganization(id)));
  return orgs.filter((org): org is Organization => org !== null);
}

export async function updateOrganization(orgId: string, data: Partial<Organization>): Promise<void> {
  await updateDoc(orgDoc(orgId), { ...clean(data as Record<string, unknown>), updatedAt: serverTimestamp() });
}

export async function changePlan(orgId: string, plan: PlanId, actor: Actor): Promise<void> {
  await updateDoc(orgDoc(orgId), { plan, planStatus: "active", updatedAt: serverTimestamp() });
  await logActivity(orgId, actor, { type: "updated", summary: `switched the workspace to the ${plan} plan` });
}

export async function cancelPlan(orgId: string, actor: Actor): Promise<void> {
  await updateDoc(orgDoc(orgId), { planStatus: "canceled", updatedAt: serverTimestamp() });
  await logActivity(orgId, actor, { type: "updated", summary: "canceled the workspace subscription" });
}

export function subscribeMembers(
  orgId: string,
  onData: (members: Member[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(membersCollection(orgId), orderBy("joinedAt", "asc")),
    (snap) => onData(snap.docs.map((d) => withId<Member>(d.id, d.data()))),
    onError,
  );
}

export async function getMember(orgId: string, uid: string): Promise<Member | null> {
  const snap = await getDoc(memberDoc(orgId, uid));
  return snap.exists() ? withId<Member>(snap.id, snap.data()) : null;
}

export async function updateMemberRole(orgId: string, uid: string, role: Role, actor: Actor): Promise<void> {
  await updateDoc(memberDoc(orgId, uid), { role });
  const member = await getMember(orgId, uid);
  await logActivity(orgId, actor, {
    type: "updated",
    summary: `changed the role of ${member?.name ?? "a teammate"} to ${role}`,
  });
}

export async function setMemberStatus(
  orgId: string,
  uid: string,
  status: Member["status"],
  actor: Actor,
): Promise<void> {
  await updateDoc(memberDoc(orgId, uid), { status });
  await logActivity(orgId, actor, {
    type: "updated",
    summary: status === "disabled" ? "suspended the access of a teammate" : "restored the access of a teammate",
  });
}

export async function removeMember(orgId: string, uid: string, actor: Actor): Promise<void> {
  const member = await getMember(orgId, uid);
  const db = getDb();
  const batch = writeBatch(db);
  batch.delete(memberDoc(orgId, uid));
  batch.update(userDoc(uid), { orgIds: arrayRemove(orgId), updatedAt: serverTimestamp() });
  await batch.commit();
  const org = await getOrganization(orgId);
  if (org) await updateDoc(orgDoc(orgId), { memberCount: Math.max(1, (org.memberCount ?? 1) - 1) });
  await logActivity(orgId, actor, {
    type: "deleted",
    summary: `removed ${member?.name ?? "a teammate"} from the workspace`,
  });
}

/** Moves ownership to another member; the previous owner becomes an admin. */
export async function transferOwnership(orgId: string, newOwnerUid: string, actor: Actor): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  batch.update(memberDoc(orgId, newOwnerUid), { role: "owner" });
  batch.update(memberDoc(orgId, actor.id), { role: "admin" });
  batch.update(orgDoc(orgId), { ownerId: newOwnerUid, updatedAt: serverTimestamp() });
  await batch.commit();
  await logActivity(orgId, actor, { type: "updated", summary: "transferred workspace ownership" });
}

export interface InviteInput {
  email: string;
  role: Role;
}

export async function createInvitation(
  orgId: string,
  orgName: string,
  actor: Actor,
  input: InviteInput,
): Promise<string> {
  const email = input.email.trim().toLowerCase();
  const existing = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.invitations),
      where("orgId", "==", orgId),
      where("email", "==", email),
      where("status", "==", "pending"),
    ),
  );
  if (!existing.empty) throw new Error("An invitation is already pending for this email address.");

  const id = await createRecord(COLLECTIONS.invitations, orgId, actor.id, {
    orgName,
    email,
    role: input.role,
    status: "pending",
    invitedBy: actor.id,
    invitedByName: actor.name,
    acceptedAt: null,
  });
  await logActivity(orgId, actor, { type: "created", summary: `invited ${email} as ${input.role}` });
  return id;
}

export function subscribeInvitations(
  orgId: string,
  onData: (rows: Invitation[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    query(
      collection(getDb(), COLLECTIONS.invitations),
      where("orgId", "==", orgId),
      orderBy("createdAt", "desc"),
    ),
    (snap) => onData(snap.docs.map((d) => withId<Invitation>(d.id, d.data()))),
    onError,
  );
}

export async function revokeInvitation(id: string, orgId: string, actor: Actor): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTIONS.invitations, id), {
    status: "revoked",
    updatedAt: serverTimestamp(),
  });
  await logActivity(orgId, actor, { type: "deleted", summary: "revoked a pending invitation" });
}

export async function deleteInvitation(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.invitations, id));
}

/** Invitations addressed to the email address of the signed-in user. */
export async function listPendingInvitationsForEmail(email: string): Promise<Invitation[]> {
  const snap = await getDocs(
    query(
      collection(getDb(), COLLECTIONS.invitations),
      where("email", "==", email.toLowerCase()),
      where("status", "==", "pending"),
    ),
  );
  return snap.docs.map((d) => withId<Invitation>(d.id, d.data()));
}

export async function acceptInvitation(invitation: Invitation, user: User): Promise<string> {
  const db = getDb();
  const name = user.displayName || user.email?.split("@")[0] || "Teammate";
  const batch = writeBatch(db);

  batch.set(memberDoc(invitation.orgId, user.uid), {
    orgId: invitation.orgId,
    email: user.email ?? invitation.email,
    name,
    photoUrl: user.photoURL ?? null,
    role: invitation.role,
    status: "active",
    joinedAt: serverTimestamp(),
  });
  batch.update(doc(db, COLLECTIONS.invitations, invitation.id), {
    status: "accepted",
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(
    userDoc(user.uid),
    {
      email: user.email ?? invitation.email,
      name,
      photoUrl: user.photoURL ?? null,
      orgIds: arrayUnion(invitation.orgId),
      defaultOrgId: invitation.orgId,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await batch.commit();

  const org = await getOrganization(invitation.orgId);
  if (org) await updateDoc(orgDoc(invitation.orgId), { memberCount: (org.memberCount ?? 1) + 1 });
  await logActivity(
    invitation.orgId,
    { id: user.uid, name },
    { type: "created", summary: `joined the workspace as ${invitation.role}` },
  );
  return invitation.orgId;
}

/** Removes the workspace and every record scoped to it. Owner only. */
export async function deleteOrganization(orgId: string): Promise<void> {
  const db = getDb();
  const scoped = [
    COLLECTIONS.leads,
    COLLECTIONS.contacts,
    COLLECTIONS.companies,
    COLLECTIONS.deals,
    COLLECTIONS.tasks,
    COLLECTIONS.activities,
    COLLECTIONS.pipelines,
    COLLECTIONS.invitations,
  ];

  for (const name of scoped) {
    const snap = await getDocs(query(collection(db, name), where("orgId", "==", orgId)));
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db);
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  const members = await getDocs(membersCollection(orgId));
  for (let i = 0; i < members.docs.length; i += 200) {
    const batch = writeBatch(db);
    members.docs.slice(i, i + 200).forEach((d) => {
      batch.delete(d.ref);
      batch.update(userDoc(d.id), { orgIds: arrayRemove(orgId) });
    });
    await batch.commit();
  }

  await deleteDoc(orgDoc(orgId));
}
