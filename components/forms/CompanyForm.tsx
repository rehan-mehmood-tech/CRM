"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, TagInput, Textarea } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { OwnerSelect } from "./shared";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  COMPANY_SIZES,
  INDUSTRIES,
  createCompany,
  emptyCompany,
  updateCompany,
  type CompanyDraft,
} from "@/lib/db/companies";
import { errorMessage } from "@/lib/format";
import type { Company } from "@/lib/types";

export function CompanyForm({
  open,
  onClose,
  company,
}: {
  open: boolean;
  onClose: () => void;
  company: Company | null;
}) {
  const { orgId, actor } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<CompanyDraft>(emptyCompany());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (company) {
      const { id, orgId: _orgId, createdAt, updatedAt, createdBy, ...rest } = company;
      setDraft(rest);
    } else {
      setDraft({ ...emptyCompany(), ownerId: actor?.id ?? null, ownerName: actor?.name ?? null });
    }
  }, [open, company, actor]);

  const set = <K extends keyof CompanyDraft>(key: K, value: CompanyDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId || !actor) return;
    if (!draft.name.trim()) {
      setError("A company needs a name.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (company) {
        await updateCompany(orgId, actor, company, draft);
        toast.success("Company updated.");
      } else {
        await createCompany(orgId, actor, draft);
        toast.success("Company created.");
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
      title={company ? "Edit company" : "New company"}
      description="The organisations behind your contacts and deals."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="company-form" type="submit" loading={pending}>
            {company ? "Save changes" : "Create company"}
          </Button>
        </>
      }
    >
      <form id="company-form" onSubmit={submit} className="space-y-4">
        {error ? <ErrorPanel message={error} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" required>
            <Input value={draft.name} onChange={(event) => set("name", event.target.value)} required />
          </Field>
          <Field label="Domain">
            <Input
              value={draft.domain ?? ""}
              onChange={(event) => set("domain", event.target.value || null)}
              placeholder="agency.com"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Industry">
            <Select
              value={draft.industry ?? ""}
              onChange={(event) => set("industry", event.target.value || null)}
            >
              <option value="">Not set</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Employees">
            <Select value={draft.size ?? ""} onChange={(event) => set("size", event.target.value || null)}>
              <option value="">Not set</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <Input value={draft.phone ?? ""} onChange={(event) => set("phone", event.target.value || null)} />
          </Field>
          <Field label="Annual revenue">
            <Input
              type="number"
              min={0}
              step={1000}
              value={draft.annualRevenue}
              onChange={(event) => set("annualRevenue", Number(event.target.value) || 0)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Address" className="sm:col-span-1">
            <Input
              value={draft.address ?? ""}
              onChange={(event) => set("address", event.target.value || null)}
            />
          </Field>
          <Field label="City">
            <Input value={draft.city ?? ""} onChange={(event) => set("city", event.target.value || null)} />
          </Field>
          <Field label="Country">
            <Input
              value={draft.country ?? ""}
              onChange={(event) => set("country", event.target.value || null)}
            />
          </Field>
        </div>

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
