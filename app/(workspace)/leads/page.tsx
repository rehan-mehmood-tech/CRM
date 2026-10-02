"use client";

import { useMemo, useState } from "react";
import { ArrowRightLeft, Mail, Pencil, Phone, Plus, Target, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import {
  Badge,
  Card,
  EmptyState,
  LoadingPanel,
  ProgressBar,
  StatCard,
  Table,
  Td,
  Th,
  Tr,
  type BadgeTone,
} from "@/components/ui/Primitives";
import { Dropdown } from "@/components/ui/Dropdown";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { LeadForm } from "@/components/forms/LeadForm";
import { ConvertLeadModal } from "@/components/forms/ConvertLeadModal";
import { sourceLabel } from "@/components/forms/shared";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { deleteLead } from "@/lib/db/leads";
import { can } from "@/lib/roles";
import { errorMessage, formatCurrency, formatNumber, relativeTime } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUS_TONES: Record<LeadStatus, BadgeTone> = {
  new: "sky",
  contacted: "indigo",
  qualified: "green",
  unqualified: "rose",
  converted: "violet",
};

export default function LeadsPage() {
  const { orgId, actor, role, org, members } = useAuth();
  const { leads, loading } = useData();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [owner, setOwner] = useState("all");
  const [sort, setSort] = useState<"recent" | "score" | "value" | "name">("recent");
  const [editing, setEditing] = useState<Lead | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [converting, setConverting] = useState<Lead | null>(null);

  const currency = org?.currency ?? "USD";
  const canCreate = can(role, "records:create");
  const canUpdate = can(role, "records:update");
  const canDelete = can(role, "records:delete");

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const filtered = leads.filter((lead) => {
      if (status !== "all" && lead.status !== status) return false;
      if (owner !== "all" && lead.ownerId !== owner) return false;
      if (!needle) return true;
      return [lead.name, lead.email, lead.company, lead.phone, lead.title]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
    const sorted = [...filtered];
    if (sort === "score") sorted.sort((a, b) => b.score - a.score);
    if (sort === "value") sorted.sort((a, b) => b.value - a.value);
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [leads, term, status, owner, sort]);

  const qualified = leads.filter((lead) => lead.status === "qualified").length;
  const converted = leads.filter((lead) => lead.status === "converted").length;
  const pipelineFromLeads = leads
    .filter((lead) => lead.status !== "unqualified" && lead.status !== "converted")
    .reduce((total, lead) => total + (lead.value || 0), 0);

  const remove = async (lead: Lead) => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Delete this lead?",
      message: `${lead.name} will be removed permanently. Tasks linked to this lead stay, but lose the link.`,
      confirmLabel: "Delete lead",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteLead(orgId, actor, lead);
      toast.success("Lead deleted.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Leads"
        description="Everyone who has shown interest but is not yet a customer."
        actions={
          canCreate ? (
            <Button
              icon={<Plus className="size-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New lead
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total leads" value={formatNumber(leads.length)} icon={<Target className="size-5" />} />
          <StatCard label="Qualified" value={formatNumber(qualified)} tone="green" />
          <StatCard
            label="Converted"
            value={formatNumber(converted)}
            sub={leads.length ? `${Math.round((converted / leads.length) * 100)}% of all leads` : undefined}
            tone="violet"
          />
          <StatCard
            label="Estimated value in play"
            value={formatCurrency(pipelineFromLeads, currency)}
            tone="sky"
          />
        </div>
      </PageHeader>

      <Card padded={false} className="mb-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search name, email, company"
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">All statuses</option>
            {(["new", "contacted", "qualified", "unqualified", "converted"] as LeadStatus[]).map((item) => (
              <option key={item} value={item}>
                {sourceLabel(item)}
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
          <Select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
            <option value="recent">Newest first</option>
            <option value="score">Highest score</option>
            <option value="value">Highest value</option>
            <option value="name">Name A–Z</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingPanel label="Loading leads" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Target className="size-5" />}
          title={leads.length ? "No leads match these filters" : "No leads yet"}
          message={
            leads.length
              ? "Clear the filters above, or widen your search."
              : "Add the first person who reached out, or whom you reached out to."
          }
          action={
            canCreate && !leads.length ? (
              <Button
                icon={<Plus className="size-4" />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Create a lead
              </Button>
            ) : null
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Lead</Th>
              <Th>Company</Th>
              <Th>Status</Th>
              <Th>Source</Th>
              <Th>Score</Th>
              <Th>Value</Th>
              <Th>Owner</Th>
              <Th>Added</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((lead) => (
              <Tr key={lead.id}>
                <Td>
                  <p className="font-medium text-white">{lead.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1 hover:text-indigo-300"
                      >
                        <Mail className="size-3" />
                        {lead.email}
                      </a>
                    ) : null}
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="inline-flex items-center gap-1 hover:text-indigo-300"
                      >
                        <Phone className="size-3" />
                        {lead.phone}
                      </a>
                    ) : null}
                  </p>
                </Td>
                <Td>
                  <span className="text-sm">{lead.company ?? "—"}</span>
                  {lead.title ? <p className="text-xs text-slate-500">{lead.title}</p> : null}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONES[lead.status]}>{sourceLabel(lead.status)}</Badge>
                </Td>
                <Td className="text-xs text-slate-400">{sourceLabel(lead.source)}</Td>
                <Td>
                  <div className="w-20">
                    <p className="text-xs text-slate-400">{lead.score}</p>
                    <ProgressBar
                      value={lead.score}
                      tone={lead.score >= 70 ? "#199e70" : lead.score >= 40 ? "#c98500" : "#64748b"}
                    />
                  </div>
                </Td>
                <Td>{formatCurrency(lead.value, currency)}</Td>
                <Td className="text-xs text-slate-400">{lead.ownerName ?? "Unassigned"}</Td>
                <Td className="text-xs text-slate-500">{relativeTime(lead.createdAt)}</Td>
                <Td>
                  <Dropdown
                    items={[
                      {
                        label: "Edit lead",
                        icon: <Pencil className="size-4" />,
                        disabled: !canUpdate,
                        onSelect: () => {
                          setEditing(lead);
                          setFormOpen(true);
                        },
                      },
                      {
                        label: "Convert lead",
                        icon: <ArrowRightLeft className="size-4" />,
                        disabled: !canCreate || lead.status === "converted",
                        onSelect: () => setConverting(lead),
                      },
                      {
                        label: "Delete lead",
                        icon: <Trash2 className="size-4" />,
                        tone: "danger",
                        disabled: !canDelete,
                        onSelect: () => remove(lead),
                      },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <LeadForm open={formOpen} onClose={() => setFormOpen(false)} lead={editing} />
      <ConvertLeadModal open={converting !== null} onClose={() => setConverting(null)} lead={converting} />
      {dialog}
    </>
  );
}
