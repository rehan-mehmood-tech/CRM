import { orderBy, type Unsubscribe } from "firebase/firestore";
import type { Company } from "@/lib/types";
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

export type CompanyDraft = Omit<Company, "id" | "orgId" | "createdAt" | "updatedAt" | "createdBy">;

export function emptyCompany(): CompanyDraft {
  return {
    name: "",
    domain: null,
    industry: null,
    size: null,
    phone: null,
    address: null,
    city: null,
    country: null,
    annualRevenue: 0,
    notes: null,
    ownerId: null,
    ownerName: null,
    tags: [],
  };
}

export const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

export const INDUSTRIES = [
  "Advertising",
  "Construction",
  "Consulting",
  "E-commerce",
  "Education",
  "Finance",
  "Healthcare",
  "Hospitality",
  "Manufacturing",
  "Media",
  "Real estate",
  "Retail",
  "SaaS",
  "Technology",
  "Transport",
  "Other",
];

export function subscribeCompanies(
  orgId: string,
  onData: (rows: Company[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return subscribeRecords<Company>(COLLECTIONS.companies, orgId, [orderBy("createdAt", "desc")], onData, onError);
}

export function listCompanies(orgId: string) {
  return listRecords<Company>(COLLECTIONS.companies, orgId, [orderBy("createdAt", "desc")]);
}

export function getCompany(id: string) {
  return getRecord<Company>(COLLECTIONS.companies, id);
}

export async function createCompany(orgId: string, actor: Actor, draft: CompanyDraft): Promise<string> {
  const id = await createRecord(COLLECTIONS.companies, orgId, actor.id, draft);
  await logActivity(orgId, actor, {
    type: "created",
    summary: `created company ${draft.name}`,
    relatedType: "company",
    relatedId: id,
    relatedName: draft.name,
  });
  return id;
}

export async function updateCompany(
  orgId: string,
  actor: Actor,
  company: Company,
  patch: Partial<CompanyDraft>,
): Promise<void> {
  await updateRecord(COLLECTIONS.companies, company.id, patch);
  const name = patch.name ?? company.name;
  await logActivity(orgId, actor, {
    type: "updated",
    summary: `updated company ${name}`,
    relatedType: "company",
    relatedId: company.id,
    relatedName: name,
  });
  if (patch.name && patch.name !== company.name) {
    await detachWhere(COLLECTIONS.contacts, orgId, "companyId", company.id, { companyName: name });
    await detachWhere(COLLECTIONS.deals, orgId, "companyId", company.id, { companyName: name });
  }
}

export async function deleteCompany(orgId: string, actor: Actor, company: Company): Promise<void> {
  await deleteRecord(COLLECTIONS.companies, company.id);
  await detachWhere(COLLECTIONS.contacts, orgId, "companyId", company.id, {
    companyId: null,
    companyName: null,
  });
  await detachWhere(COLLECTIONS.deals, orgId, "companyId", company.id, {
    companyId: null,
    companyName: null,
  });
  await detachWhere(COLLECTIONS.tasks, orgId, "relatedId", company.id, {
    relatedId: null,
    relatedType: null,
    relatedName: null,
  });
  await logActivity(orgId, actor, { type: "deleted", summary: `deleted company ${company.name}` });
}
