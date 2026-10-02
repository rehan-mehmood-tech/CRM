"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, TagInput, Textarea } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { LEAD_SOURCES, OwnerSelect, sourceLabel } from "./shared";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { createLead, emptyLead, updateLead, type LeadDraft } from "@/lib/db/leads";
import { errorMessage } from "@/lib/format";
import type { Lead, LeadSource, LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "unqualified"];

export function LeadForm({
  open,
  onClose,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
}) {
  const { orgId, actor } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<LeadDraft>(emptyLead());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (lead) {
      const { id, orgId: _orgId, createdAt, updatedAt, createdBy, ...rest } = lead;
      setDraft(rest);
    } else {
      setDraft({ ...emptyLead(), ownerId: actor?.id ?? null, ownerName: actor?.name ?? null });
    }
  }, [open, lead, actor]);

  const set = <K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId || !actor) return;
    if (!draft.name.trim()) {
      setError("A lead needs a name.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (lead) {
        await updateLead(orgId, actor, lead, draft);
        toast.success("Lead updated.");
      } else {
        await createLead(orgId, actor, draft);
        toast.success("Lead created.");
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
      title={lead ? "Edit lead" : "New lead"}
      description="Capture who they are, where they came from and who owns the follow-up."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="lead-form" type="submit" loading={pending}>
            {lead ? "Save changes" : "Create lead"}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={submit} className="space-y-4">
        {error ? <ErrorPanel message={error} /> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input value={draft.name} onChange={(event) => set("name", event.target.value)} required />
          </Field>
          <Field label="Job title">
            <Input
              value={draft.title ?? ""}
              onChange={(event) => set("title", event.target.value || null)}
              placeholder="Head of Marketing"
            />
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
            <Input
              value={draft.phone ?? ""}
              onChange={(event) => set("phone", event.target.value || null)}
            />
          </Field>
        </div>

        <Field label="Company">
          <Input
            value={draft.company ?? ""}
            onChange={(event) => set("company", event.target.value || null)}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Status">
            <Select value={draft.status} onChange={(event) => set("status", event.target.value as LeadStatus)}>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {sourceLabel(status)}
                </option>
              ))}
              {draft.status === "converted" ? <option value="converted">Converted</option> : null}
            </Select>
          </Field>
          <Field label="Source">
            <Select value={draft.source} onChange={(event) => set("source", event.target.value as LeadSource)}>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={`Lead score (${draft.score})`} hint="0 to 100.">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.score}
              onChange={(event) => set("score", Number(event.target.value))}
              className="w-full accent-indigo-500"
            />
          </Field>
          <Field label="Estimated value">
            <Input
              type="number"
              min={0}
              step={100}
              value={draft.value}
              onChange={(event) => set("value", Number(event.target.value) || 0)}
            />
          </Field>
        </div>

        <Field label="Tags">
          <TagInput value={draft.tags} onChange={(tags) => set("tags", tags)} />
        </Field>

        <Field label="Notes">
          <Textarea
            rows={3}
            value={draft.notes ?? ""}
            onChange={(event) => set("notes", event.target.value || null)}
            placeholder="What do they need, and what did you agree to next?"
          />
        </Field>
      </form>
    </Modal>
  );
}
