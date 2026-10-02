"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, Globe, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import {
  Badge,
  Card,
  EmptyState,
  LoadingPanel,
  StatCard,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui/Primitives";
import { Dropdown } from "@/components/ui/Dropdown";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { CompanyForm } from "@/components/forms/CompanyForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { INDUSTRIES, deleteCompany } from "@/lib/db/companies";
import { can } from "@/lib/roles";
import { errorMessage, formatCurrency, formatNumber, relativeTime } from "@/lib/format";
import type { Company } from "@/lib/types";

export default function CompaniesPage() {
  const router = useRouter();
  const { orgId, actor, role, org, members } = useAuth();
  const { companies, contacts, deals, loading } = useData();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [term, setTerm] = useState("");
  const [industry, setIndustry] = useState("all");
  const [owner, setOwner] = useState("all");
  const [editing, setEditing] = useState<Company | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const currency = org?.currency ?? "USD";
  const canCreate = can(role, "records:create");
  const canUpdate = can(role, "records:update");
  const canDelete = can(role, "records:delete");

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return companies.filter((company) => {
      if (industry !== "all" && company.industry !== industry) return false;
      if (owner !== "all" && company.ownerId !== owner) return false;
      if (!needle) return true;
      return [company.name, company.domain, company.city, company.country]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [companies, term, industry, owner]);

  const counts = useMemo(() => {
    const contactsBy = new Map<string, number>();
    const dealsBy = new Map<string, number>();
    const valueBy = new Map<string, number>();
    contacts.forEach((contact) => {
      if (!contact.companyId) return;
      contactsBy.set(contact.companyId, (contactsBy.get(contact.companyId) ?? 0) + 1);
    });
    deals.forEach((deal) => {
      if (!deal.companyId) return;
      dealsBy.set(deal.companyId, (dealsBy.get(deal.companyId) ?? 0) + 1);
      if (deal.status === "open") {
        valueBy.set(deal.companyId, (valueBy.get(deal.companyId) ?? 0) + (deal.value || 0));
      }
    });
    return { contactsBy, dealsBy, valueBy };
  }, [contacts, deals]);

  const remove = async (company: Company) => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Delete this company?",
      message: `${company.name} will be removed. Its contacts and deals are kept, but no longer linked to a company.`,
      confirmLabel: "Delete company",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteCompany(orgId, actor, company);
      toast.success("Company deleted.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Companies"
        description="Accounts that group your contacts and deals together."
        actions={
          canCreate ? (
            <Button
              icon={<Plus className="size-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New company
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Companies"
            value={formatNumber(companies.length)}
            icon={<Building2 className="size-5" />}
          />
          <StatCard
            label="With open deals"
            value={formatNumber(counts.valueBy.size)}
            tone="violet"
          />
          <StatCard
            label="Combined annual revenue"
            value={formatCurrency(
              companies.reduce((total, company) => total + (company.annualRevenue || 0), 0),
              currency,
            )}
            tone="sky"
          />
        </div>
      </PageHeader>

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search name, domain, city"
          />
          <Select value={industry} onChange={(event) => setIndustry(event.target.value)}>
            <option value="all">All industries</option>
            {INDUSTRIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
          <Select value={owner} onChange={(event) => setOwner(event.target.value)}>
            <option value="all">All owners</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingPanel label="Loading companies" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Building2 className="size-5" />}
          title={companies.length ? "No companies match these filters" : "No companies yet"}
          message={
            companies.length
              ? "Try another industry, owner or search term."
              : "Add the organisations you sell to so contacts and deals group under one account."
          }
          action={
            canCreate && !companies.length ? (
              <Button
                icon={<Plus className="size-4" />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Create a company
              </Button>
            ) : null
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Company</Th>
              <Th>Industry</Th>
              <Th>Size</Th>
              <Th>Contacts</Th>
              <Th>Deals</Th>
              <Th>Open value</Th>
              <Th>Owner</Th>
              <Th>Added</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((company) => (
              <Tr key={company.id} onClick={() => router.push(`/companies/${company.id}`)}>
                <Td>
                  <p className="font-medium text-white">{company.name}</p>
                  {company.domain ? (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                      <Globe className="size-3" />
                      {company.domain}
                    </p>
                  ) : null}
                </Td>
                <Td className="text-sm text-slate-300">{company.industry ?? "—"}</Td>
                <Td className="text-sm text-slate-300">{company.size ?? "—"}</Td>
                <Td className="text-sm">{counts.contactsBy.get(company.id) ?? 0}</Td>
                <Td className="text-sm">{counts.dealsBy.get(company.id) ?? 0}</Td>
                <Td className="text-sm">
                  {formatCurrency(counts.valueBy.get(company.id) ?? 0, currency)}
                </Td>
                <Td className="text-xs text-slate-400">{company.ownerName ?? "Unassigned"}</Td>
                <Td className="text-xs text-slate-500">{relativeTime(company.createdAt)}</Td>
                <Td>
                  <Dropdown
                    items={[
                      { label: "Open record", onSelect: () => router.push(`/companies/${company.id}`) },
                      {
                        label: "Edit company",
                        icon: <Pencil className="size-4" />,
                        disabled: !canUpdate,
                        onSelect: () => {
                          setEditing(company);
                          setFormOpen(true);
                        },
                      },
                      {
                        label: "Delete company",
                        icon: <Trash2 className="size-4" />,
                        tone: "danger",
                        disabled: !canDelete,
                        onSelect: () => remove(company),
                      },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <CompanyForm open={formOpen} onClose={() => setFormOpen(false)} company={editing} />
      {dialog}
    </>
  );
}
