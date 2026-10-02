"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RecordTimeline } from "@/components/app/RecordTimeline";
import { Button } from "@/components/ui/Button";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  LoadingPanel,
  SectionHeader,
  StatCard,
} from "@/components/ui/Primitives";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { CompanyForm } from "@/components/forms/CompanyForm";
import { ContactForm } from "@/components/forms/ContactForm";
import { DealForm } from "@/components/forms/DealForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { contactName } from "@/lib/db/contacts";
import { deleteCompany } from "@/lib/db/companies";
import { can } from "@/lib/roles";
import { errorMessage, formatCurrency, formatDate } from "@/lib/format";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { orgId, actor, role, org } = useAuth();
  const { companies, contacts, deals, loading } = useData();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [editOpen, setEditOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);

  const company = companies.find((item) => item.id === id) ?? null;
  const currency = org?.currency ?? "USD";
  const canUpdate = can(role, "records:update");
  const canDelete = can(role, "records:delete");
  const canCreate = can(role, "records:create");

  if (loading) return <LoadingPanel label="Loading company" />;

  if (!company) {
    return (
      <EmptyState
        title="Company not found"
        message="This company may have been deleted, or it belongs to another workspace."
        action={
          <Button variant="secondary" onClick={() => router.push("/companies")}>
            Back to companies
          </Button>
        }
      />
    );
  }

  const companyContacts = contacts.filter((contact) => contact.companyId === company.id);
  const companyDeals = deals.filter((deal) => deal.companyId === company.id);
  const openValue = companyDeals
    .filter((deal) => deal.status === "open")
    .reduce((total, deal) => total + (deal.value || 0), 0);
  const wonValue = companyDeals
    .filter((deal) => deal.status === "won")
    .reduce((total, deal) => total + (deal.value || 0), 0);

  const remove = async () => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Delete this company?",
      message: `${company.name} will be removed permanently.`,
      confirmLabel: "Delete company",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteCompany(orgId, actor, company);
      toast.success("Company deleted.");
      router.push("/companies");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <Link
        href="/companies"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        All companies
      </Link>

      <PageHeader
        title={company.name}
        description={[company.industry, company.size ? `${company.size} employees` : null]
          .filter(Boolean)
          .join(" · ")}
        actions={
          <>
            {canCreate ? (
              <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setDealOpen(true)}>
                New deal
              </Button>
            ) : null}
            {canUpdate ? (
              <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={remove}>
                Delete
              </Button>
            ) : null}
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Contacts" value={String(companyContacts.length)} icon={<Users className="size-5" />} />
          <StatCard label="Deals" value={String(companyDeals.length)} tone="indigo" />
          <StatCard label="Open value" value={formatCurrency(openValue, currency)} tone="violet" />
          <StatCard label="Won value" value={formatCurrency(wonValue, currency)} tone="green" />
        </div>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card>
            <SectionHeader title="Company details" />
            <dl className="mt-4 space-y-3 text-sm">
              {company.domain ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <Globe className="size-4 text-slate-500" />
                  <a
                    href={`https://${company.domain.replace(/^https?:\/\//, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-300 hover:text-indigo-200"
                  >
                    {company.domain}
                  </a>
                </div>
              ) : null}
              {company.phone ? (
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="size-4 text-slate-500" />
                  {company.phone}
                </div>
              ) : null}
              {company.address || company.city || company.country ? (
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="mt-0.5 size-4 text-slate-500" />
                  {[company.address, company.city, company.country].filter(Boolean).join(", ")}
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-slate-300">
                <Building2 className="size-4 text-slate-500" />
                {formatCurrency(company.annualRevenue, currency)} annual revenue
              </div>
            </dl>

            <div className="mt-5 space-y-1.5 border-t border-white/5 pt-4 text-xs text-slate-500">
              <p>Owner: {company.ownerName ?? "Unassigned"}</p>
              <p>Added {formatDate(company.createdAt)}</p>
            </div>

            {company.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {company.tags.map((tag) => (
                  <Badge key={tag} tone="indigo">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Card>

          {company.notes ? (
            <Card>
              <SectionHeader title="Notes" />
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {company.notes}
              </p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionHeader
              title="Contacts"
              subtitle={`${companyContacts.length} person${companyContacts.length === 1 ? "" : "s"} at this company`}
              actions={
                canCreate ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Plus className="size-3.5" />}
                    onClick={() => setContactOpen(true)}
                  >
                    Add contact
                  </Button>
                ) : null
              }
            />
            {companyContacts.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No contacts linked to this company yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-white/5">
                {companyContacts.map((contact) => (
                  <li key={contact.id}>
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="flex items-center gap-3 py-3 transition hover:opacity-80"
                    >
                      <Avatar name={contactName(contact)} size={32} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-white">{contactName(contact)}</p>
                        <p className="truncate text-xs text-slate-500">
                          {[contact.title, contact.email].filter(Boolean).join(" · ") || "No details yet"}
                        </p>
                      </div>
                      <Badge tone={contact.status === "active" ? "green" : "neutral"}>{contact.status}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <SectionHeader title="Deals" subtitle={`${companyDeals.length} total`} />
            {companyDeals.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No deals for this company yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-white/5">
                {companyDeals.map((deal) => (
                  <li key={deal.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{deal.title}</p>
                      <p className="text-xs text-slate-500">
                        {deal.contactName ?? "No contact"} · {deal.ownerName ?? "Unassigned"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white">{formatCurrency(deal.value, deal.currency)}</p>
                      <Badge
                        tone={deal.status === "won" ? "green" : deal.status === "lost" ? "rose" : "indigo"}
                      >
                        {deal.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <RecordTimeline relatedType="company" relatedId={company.id} relatedName={company.name} />
        </div>
      </div>

      <CompanyForm open={editOpen} onClose={() => setEditOpen(false)} company={company} />
      <ContactForm
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        contact={null}
        presetCompany={{ id: company.id, name: company.name }}
      />
      <DealForm open={dealOpen} onClose={() => setDealOpen(false)} deal={null} />
      {dialog}
    </>
  );
}
