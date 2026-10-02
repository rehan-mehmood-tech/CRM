"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, TagInput, Textarea } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { CompanySelect, LEAD_SOURCES, OwnerSelect, sourceLabel } from "./shared";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { createContact, emptyContact, updateContact, type ContactDraft } from "@/lib/db/contacts";
import { errorMessage } from "@/lib/format";
import type { Contact, ContactStatus, LeadSource } from "@/lib/types";

export function ContactForm({
  open,
  onClose,
  contact,
  presetCompany,
}: {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
  presetCompany?: { id: string; name: string } | null;
}) {
  const { orgId, actor } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<ContactDraft>(emptyContact());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (contact) {
      const { id, orgId: _orgId, createdAt, updatedAt, createdBy, ...rest } = contact;
      setDraft(rest);
    } else {
      setDraft({
        ...emptyContact(),
        ownerId: actor?.id ?? null,
        ownerName: actor?.name ?? null,
        companyId: presetCompany?.id ?? null,
        companyName: presetCompany?.name ?? null,
      });
    }
  }, [open, contact, actor, presetCompany]);

  const set = <K extends keyof ContactDraft>(key: K, value: ContactDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId || !actor) return;
    if (!draft.firstName.trim()) {
      setError("A contact needs at least a first name.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (contact) {
        await updateContact(orgId, actor, contact, draft);
        toast.success("Contact updated.");
      } else {
        await createContact(orgId, actor, draft);
        toast.success("Contact created.");
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contact ? "Edit contact" : "New contact"}
      description="People you sell to, linked to the company they work for."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="contact-form" type="submit" loading={pending}>
            {contact ? "Save changes" : "Create contact"}
          </Button>
        </>
      }
    >
      <form id="contact-form" onSubmit={submit} className="space-y-4">
        {error ? <ErrorPanel message={error} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name" required>
            <Input
              value={draft.firstName}
              onChange={(event) => set("firstName", event.target.value)}
              required
            />
          </Field>
          <Field label="Last name">
            <Input value={draft.lastName} onChange={(event) => set("lastName", event.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input
              type="email"
              value={draft.email ?? ""}
              onChange={(event) => set("email", event.target.value || null)}
            />
          </Field>
          <Field label="Phone">
            <Input value={draft.phone ?? ""} onChange={(event) => set("phone", event.target.value || null)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job title">
            <Input value={draft.title ?? ""} onChange={(event) => set("title", event.target.value || null)} />
          </Field>
          <Field label="Company">
            <CompanySelect
              value={draft.companyId}
              onChange={(companyId, companyName) =>
                setDraft((current) => ({ ...current, companyId, companyName }))
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <Select
              value={draft.status}
              onChange={(event) => set("status", event.target.value as ContactStatus)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Source">
            <Select
              value={draft.source ?? ""}
              onChange={(event) => set("source", (event.target.value || null) as LeadSource | null)}
            >
              <option value="">Unknown</option>
              {LEAD_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {sourceLabel(source)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Owner">
            <OwnerSelect
              value={draft.ownerId}
              onChange={(ownerId, ownerName) =>
                setDraft((current) => ({ ...current, ownerId, ownerName }))
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City">
            <Input value={draft.city ?? ""} onChange={(event) => set("city", event.target.value || null)} />
          </Field>
          <Field label="Country">
            <Input
              value={draft.country ?? ""}
              onChange={(event) => set("country", event.target.value || null)}
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              value={draft.linkedin ?? ""}
              onChange={(event) => set("linkedin", event.target.value || null)}
              placeholder="linkedin.com/in/…"
            />
          </Field>
        </div>

        <Field label="Address">
          <Input value={draft.address ?? ""} onChange={(event) => set("address", event.target.value || null)} />
        </Field>

        <Field label="Tags">
          <TagInput value={draft.tags} onChange={(tags) => set("tags", tags)} />
        </Field>

        <Field label="Notes">
          <Textarea
            value={draft.notes ?? ""}
            onChange={(event) => set("notes", event.target.value || null)}
          />
        </Field>
      </form>
    </Modal>
  );
}
