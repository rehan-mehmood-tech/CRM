import type { Timestamp } from "firebase/firestore";

export type Role = "owner" | "admin" | "manager" | "sales_rep" | "viewer";

export type PlanId = "starter" | "growth" | "agency";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  photoUrl: string | null;
  phone: string | null;
  title: string | null;
  orgIds: string[];
  defaultOrgId: string | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  industry: string | null;
  currency: string;
  ownerId: string;
  plan: PlanId;
  planStatus: "trialing" | "active" | "canceled";
  trialEndsAt: Timestamp | null;
  memberCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Member {
  id: string; // uid
  orgId: string;
  email: string;
  name: string;
  photoUrl: string | null;
  role: Role;
  status: "active" | "disabled";
  joinedAt: Timestamp | null;
}

export interface Invitation {
  id: string;
  orgId: string;
  orgName: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "revoked";
  invitedBy: string;
  invitedByName: string;
  createdAt: Timestamp | null;
  acceptedAt: Timestamp | null;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "unqualified" | "converted";
export type LeadSource =
  | "website"
  | "referral"
  | "cold_call"
  | "email_campaign"
  | "social"
  | "event"
  | "paid_ads"
  | "other";

export interface Lead {
  id: string;
  orgId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: LeadStatus;
  source: LeadSource;
  score: number;
  value: number;
  notes: string | null;
  ownerId: string | null;
  ownerName: string | null;
  tags: string[];
  convertedContactId: string | null;
  convertedDealId: string | null;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Company {
  id: string;
  orgId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  annualRevenue: number;
  notes: string | null;
  ownerId: string | null;
  ownerName: string | null;
  tags: string[];
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type ContactStatus = "active" | "inactive";

export interface Contact {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  companyId: string | null;
  companyName: string | null;
  status: ContactStatus;
  source: LeadSource | null;
  address: string | null;
  city: string | null;
  country: string | null;
  linkedin: string | null;
  notes: string | null;
  ownerId: string | null;
  ownerName: string | null;
  tags: string[];
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface PipelineStage {
  id: string;
  name: string;
  probability: number;
  color: string;
}

export interface Pipeline {
  id: string;
  orgId: string;
  name: string;
  isDefault: boolean;
  stages: PipelineStage[];
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface Deal {
  id: string;
  orgId: string;
  title: string;
  pipelineId: string;
  stageId: string;
  value: number;
  currency: string;
  probability: number;
  status: "open" | "won" | "lost";
  lostReason: string | null;
  expectedCloseDate: string | null; // yyyy-MM-dd
  closedAt: Timestamp | null;
  contactId: string | null;
  contactName: string | null;
  companyId: string | null;
  companyName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  source: LeadSource | null;
  description: string | null;
  tags: string[];
  order: number;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskType = "call" | "email" | "meeting" | "follow_up" | "todo";

export interface Task {
  id: string;
  orgId: string;
  title: string;
  description: string | null;
  type: TaskType;
  priority: TaskPriority;
  completed: boolean;
  completedAt: Timestamp | null;
  dueDate: string | null; // yyyy-MM-dd
  dueTime: string | null; // HH:mm
  assigneeId: string | null;
  assigneeName: string | null;
  relatedType: RelatedType | null;
  relatedId: string | null;
  relatedName: string | null;
  createdBy: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type RelatedType = "lead" | "contact" | "company" | "deal";

export type ActivityType =
  | "note"
  | "call"
  | "email"
  | "meeting"
  | "stage_change"
  | "created"
  | "updated"
  | "deleted"
  | "won"
  | "lost"
  | "converted"
  | "task_completed";

export interface Activity {
  id: string;
  orgId: string;
  type: ActivityType;
  summary: string;
  body: string | null;
  relatedType: RelatedType | null;
  relatedId: string | null;
  relatedName: string | null;
  actorId: string;
  actorName: string;
  createdAt: Timestamp | null;
}

/** Shape used by create helpers: server-managed fields are filled in for you. */
export type NewDoc<T> = Omit<T, "id" | "orgId" | "createdAt" | "updatedAt" | "createdBy">;
