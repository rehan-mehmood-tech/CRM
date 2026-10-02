import type { PlanId, Role } from "./types";

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: "owner", label: "Owner", description: "Full access, including billing and deleting the workspace." },
  { id: "admin", label: "Admin", description: "Manages the team, pipelines and all CRM records." },
  { id: "manager", label: "Manager", description: "Full CRM access and team reports, cannot manage billing." },
  { id: "sales_rep", label: "Sales rep", description: "Creates and edits records, limited to their own deletions." },
  { id: "viewer", label: "Viewer", description: "Read-only access to CRM records and reports." },
];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  sales_rep: "Sales rep",
  viewer: "Viewer",
};

/** Roles an owner/admin may assign. Only an owner can hand over ownership. */
export const ASSIGNABLE_ROLES: Role[] = ["admin", "manager", "sales_rep", "viewer"];

export type Permission =
  | "records:read"
  | "records:create"
  | "records:update"
  | "records:delete"
  | "pipelines:manage"
  | "reports:read"
  | "team:read"
  | "team:manage"
  | "billing:manage"
  | "org:manage"
  | "org:delete";

const PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "records:read",
    "records:create",
    "records:update",
    "records:delete",
    "pipelines:manage",
    "reports:read",
    "team:read",
    "team:manage",
    "billing:manage",
    "org:manage",
    "org:delete",
  ],
  admin: [
    "records:read",
    "records:create",
    "records:update",
    "records:delete",
    "pipelines:manage",
    "reports:read",
    "team:read",
    "team:manage",
    "org:manage",
  ],
  manager: [
    "records:read",
    "records:create",
    "records:update",
    "records:delete",
    "pipelines:manage",
    "reports:read",
    "team:read",
  ],
  sales_rep: ["records:read", "records:create", "records:update", "reports:read"],
  viewer: ["records:read", "reports:read"],
};

export function can(role: Role | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_RANK: Record<Role, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  sales_rep: 2,
  viewer: 1,
};

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  tagline: string;
  seats: number;
  contactLimit: number;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    priceYearly: 290,
    tagline: "For solo operators getting their first pipeline in order.",
    seats: 3,
    contactLimit: 1000,
    features: [
      "3 team seats",
      "1,000 contacts",
      "Leads, contacts & companies",
      "1 deal pipeline",
      "Tasks & activity timeline",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 79,
    priceYearly: 790,
    tagline: "For agencies running a real sales team.",
    seats: 10,
    contactLimit: 25000,
    features: [
      "10 team seats",
      "25,000 contacts",
      "Unlimited pipelines",
      "Role-based permissions",
      "Revenue & conversion reports",
      "Priority support",
    ],
    highlight: true,
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: 199,
    priceYearly: 1990,
    tagline: "For multi-team agencies with high deal volume.",
    seats: 100,
    contactLimit: 500000,
    features: [
      "100 team seats",
      "500,000 contacts",
      "Unlimited pipelines & custom stages",
      "Full audit activity trail",
      "Advanced reporting",
      "Dedicated account manager",
    ],
  },
];

export function planById(id: PlanId | undefined | null): Plan {
  return PLANS.find((plan) => plan.id === id) ?? PLANS[0];
}
