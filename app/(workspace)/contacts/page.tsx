"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Building2, Mail, Pencil, Phone, Plus, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import {
  Avatar,
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
import { ContactForm } from "@/components/forms/ContactForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { contactName, deleteContact } from "@/lib/db/contacts";
import { can } from "@/lib/roles";
import { errorMessage, formatNumber, relativeTime } from "@/lib/format";
import type { Contact } from "@/lib/types";

export default function ContactsPage() {
  const router = useRouter();
  const { orgId, actor, role, members } = useAuth();
  const { contacts, companies, deals, loading } = useData();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [term, setTerm] = useState("");
  const [company, setCompany] = useState("all");
  const [owner, setOwner] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Contact | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const canCreate = can(role, "records:create");
  const canUpdate = can(role, "records:update");
  const canDelete = can(role, "records:delete");

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (company !== "all" && contact.companyId !== company) return false;
      if (owner !== "all" && contact.ownerId !== owner) return false;
      if (status !== "all" && contact.status !== status) return false;
      if (!needle) return true;
      return [contactName(contact), contact.email, contact.phone, contact.companyName, contact.title]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [contacts, term, company, owner, status]);

  const dealsByContact = useMemo(() => {
    const map = new Map<string, number>();
    deals.forEach((deal) => {
      if (!deal.contactId) return;
      map.set(deal.contactId, (map.get(deal.contactId) ?? 0) + 1);
    });
    return map;
  }, [deals]);

  const remove = async (contact: Contact) => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Delete this contact?",
      message: `${contactName(contact)} will be removed. Deals and tasks that referenced them are kept but unlinked.`,
      confirmLabel: "Delete contact",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteContact(orgId, actor, contact);
      toast.success("Contact deleted.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Contacts"
        description="The people you talk to, linked to their company and their deals."
        actions={
          canCreate ? (
            <Button
              icon={<Plus className="size-4" />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              New contact
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Contacts" value={formatNumber(contacts.length)} icon={<Users className="size-5" />} />
          <StatCard
            label="Active"
            value={formatNumber(contacts.filter((contact) => contact.status === "active").length)}
            tone="green"
          />
          <StatCard
            label="Linked to a company"
            value={formatNumber(contacts.filter((contact) => contact.companyId).length)}
            tone="sky"
          />
        </div>
      </PageHeader>

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search name, email, phone"
          />
          <Select value={company} onChange={(event) => setCompany(event.target.value)}>
            <option value="all">All companies</option>
            {companies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
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
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingPanel label="Loading contacts" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={contacts.length ? "No contacts match these filters" : "No contacts yet"}
          message={
            contacts.length
              ? "Try a different company, owner or search term."
              : "Add a contact directly, or convert a qualified lead into one."
          }
          action={
            canCreate && !contacts.length ? (
              <Button
                icon={<Plus className="size-4" />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Create a contact
              </Button>
            ) : null
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Contact</Th>
              <Th>Company</Th>
              <Th>Title</Th>
              <Th>Status</Th>
              <Th>Deals</Th>
              <Th>Owner</Th>
              <Th>Added</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((contact) => (
              <Tr key={contact.id} onClick={() => router.push(`/contacts/${contact.id}`)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={contactName(contact)} size={32} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{contactName(contact)}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {contact.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="size-3" />
                            {contact.email}
                          </span>
                        ) : null}
                        {contact.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="size-3" />
                            {contact.phone}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </Td>
                <Td>
                  {contact.companyId ? (
                    <Link
                      href={`/companies/${contact.companyId}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200"
                    >
                      <Building2 className="size-3.5" />
                      {contact.companyName}
                    </Link>
                  ) : (
                    <span className="text-sm text-slate-500">—</span>
                  )}
                </Td>
                <Td className="text-sm text-slate-300">{contact.title ?? "—"}</Td>
                <Td>
                  <Badge tone={contact.status === "active" ? "green" : "neutral"}>{contact.status}</Badge>
                </Td>
                <Td className="text-sm">{dealsByContact.get(contact.id) ?? 0}</Td>
                <Td className="text-xs text-slate-400">{contact.ownerName ?? "Unassigned"}</Td>
                <Td className="text-xs text-slate-500">{relativeTime(contact.createdAt)}</Td>
                <Td>
                  <Dropdown
                    items={[
                      {
                        label: "Open record",
                        onSelect: () => router.push(`/contacts/${contact.id}`),
                      },
                      {
                        label: "Edit contact",
                        icon: <Pencil className="size-4" />,
                        disabled: !canUpdate,
                        onSelect: () => {
                          setEditing(contact);
                          setFormOpen(true);
                        },
                      },
                      {
                        label: "Delete contact",
                        icon: <Trash2 className="size-4" />,
                        tone: "danger",
                        disabled: !canDelete,
                        onSelect: () => remove(contact),
                      },
                    ]}
                  />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}

      <ContactForm open={formOpen} onClose={() => setFormOpen(false)} contact={editing} />
      {dialog}
    </>
  );
}
