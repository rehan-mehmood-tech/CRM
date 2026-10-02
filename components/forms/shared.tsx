"use client";

import { Select } from "@/components/ui/Field";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { contactName } from "@/lib/db/contacts";
import type { LeadSource, Member, RelatedType } from "@/lib/types";

export const LEAD_SOURCES: LeadSource[] = [
  "website",
  "referral",
  "cold_call",
  "email_campaign",
  "social",
  "event",
  "paid_ads",
  "other",
];

export function sourceLabel(source: string): string {
  return source.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function memberById(members: Member[], id: string | null): Member | null {
  return members.find((member) => member.id === id) ?? null;
}

/** Owner picker that writes both the id and the denormalised display name. */
export function OwnerSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (ownerId: string | null, ownerName: string | null) => void;
}) {
  const { members } = useAuth();
  return (
    <Select
      value={value ?? ""}
      onChange={(event) => {
        const id = event.target.value || null;
        onChange(id, memberById(members, id)?.name ?? null);
      }}
    >
      <option value="">Unassigned</option>
      {members.map((member) => (
        <option key={member.id} value={member.id}>
          {member.name}
        </option>
      ))}
    </Select>
  );
}

export function CompanySelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (companyId: string | null, companyName: string | null) => void;
}) {
  const { companies } = useData();
  return (
    <Select
      value={value ?? ""}
      onChange={(event) => {
        const id = event.target.value || null;
        const company = companies.find((item) => item.id === id);
        onChange(id, company?.name ?? null);
      }}
    >
      <option value="">No company</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </Select>
  );
}

export function ContactSelect({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (contactId: string | null, name: string | null) => void;
}) {
  const { contacts } = useData();
  return (
    <Select
      value={value ?? ""}
      onChange={(event) => {
        const id = event.target.value || null;
        const contact = contacts.find((item) => item.id === id);
        onChange(id, contact ? contactName(contact) : null);
      }}
    >
      <option value="">No contact</option>
      {contacts.map((contact) => (
        <option key={contact.id} value={contact.id}>
          {contactName(contact)}
          {contact.companyName ? ` — ${contact.companyName}` : ""}
        </option>
      ))}
    </Select>
  );
}

/** Links a task to any CRM record. */
export function RelatedSelect({
  type,
  id,
  onChange,
}: {
  type: RelatedType | null;
  id: string | null;
  onChange: (type: RelatedType | null, id: string | null, name: string | null) => void;
}) {
  const { leads, contacts, companies, deals } = useData();

  const options =
    type === "lead"
      ? leads.map((lead) => ({ id: lead.id, label: lead.name }))
      : type === "contact"
        ? contacts.map((contact) => ({ id: contact.id, label: contactName(contact) }))
        : type === "company"
          ? companies.map((company) => ({ id: company.id, label: company.name }))
          : type === "deal"
            ? deals.map((deal) => ({ id: deal.id, label: deal.title }))
            : [];

  return (
    <div className="grid grid-cols-2 gap-2">
      <Select
        value={type ?? ""}
        onChange={(event) => {
          const next = (event.target.value || null) as RelatedType | null;
          onChange(next, null, null);
        }}
      >
        <option value="">Not linked</option>
        <option value="lead">Lead</option>
        <option value="contact">Contact</option>
        <option value="company">Company</option>
        <option value="deal">Deal</option>
      </Select>
      <Select
        value={id ?? ""}
        disabled={!type}
        onChange={(event) => {
          const nextId = event.target.value || null;
          const option = options.find((item) => item.id === nextId);
          onChange(type, nextId, option?.label ?? null);
        }}
      >
        <option value="">{type ? "Select a record" : "Pick a type first"}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
