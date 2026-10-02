"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, TagInput, Textarea } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { CompanySelect, ContactSelect, LEAD_SOURCES, OwnerSelect, sourceLabel } from "./shared";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { createDeal, emptyDeal, updateDeal, type DealDraft } from "@/lib/db/deals";
import { errorMessage } from "@/lib/format";
import type { Deal, LeadSource } from "@/lib/types";

export function DealForm({
  open,
  onClose,
  deal,
  presetStageId,
}: {
  open: boolean;
  onClose: () => void;
  deal: Deal | null;
  presetStageId?: string | null;
}) {
  const { orgId, actor, org } = useAuth();
  const { pipelines, defaultPipeline } = useData();
  const toast = useToast();
  const [draft, setDraft] = useState<DealDraft>(emptyDeal(null));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (deal) {
      const { id, orgId: _orgId, createdAt, updatedAt, createdBy, ...rest } = deal;
      setDraft(rest);
    } else {
      const base = emptyDeal(defaultPipeline, org?.currency ?? "USD");
      setDraft({
        ...base,
        stageId: presetStageId ?? base.stageId,
        probability:
          defaultPipeline?.stages.find((stage) => stage.id === (presetStageId ?? base.stageId))
            ?.probability ?? base.probability,
        ownerId: actor?.id ?? null,
        ownerName: actor?.name ?? null,
      });
    }
  }, [open, deal, defaultPipeline, org?.currency, presetStageId, actor]);

  const pipeline = pipelines.find((item) => item.id === draft.pipelineId) ?? defaultPipeline;

  const set = <K extends keyof DealDraft>(key: K, value: DealDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId || !actor) return;
    if (!draft.title.trim()) {
      setError("A deal needs a title.");
      return;
    }
    if (!draft.pipelineId || !draft.stageId) {
      setError("Pick a pipeline and a stage for this deal.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      if (deal) {
        await updateDeal(orgId, actor, deal, draft);
        toast.success("Deal updated.");
      } else {
        await createDeal(orgId, actor, draft);
        toast.success("Deal created.");
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
      title={deal ? "Edit deal" : "New deal"}
      description="Deals carry the money. Stage probability feeds the weighted forecast."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="deal-form" type="submit" loading={pending}>
            {deal ? "Save changes" : "Create deal"}
          </Button>
        </>
      }
    >
      <form id="deal-form" onSubmit={submit} className="space-y-4">
        {error ? <ErrorPanel message={error} /> : null}

        <Field label="Deal title" required>
          <Input
            value={draft.title}
            onChange={(event) => set("title", event.target.value)}
            placeholder="Website retainer — Q3"
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pipeline" required>
            <Select
              value={draft.pipelineId}
              onChange={(event) => {
                const next = pipelines.find((item) => item.id === event.target.value);
                setDraft((current) => ({
                  ...current,
                  pipelineId: event.target.value,
                  stageId: next?.stages[0]?.id ?? "",
                  probability: next?.stages[0]?.probability ?? current.probability,
                }));
              }}
            >
              {pipelines.length === 0 ? <option value="">No pipeline yet</option> : null}
              {pipelines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stage" required>
            <Select
              value={draft.stageId}
              onChange={(event) => {
                const stage = pipeline?.stages.find((item) => item.id === event.target.value);
                setDraft((current) => ({
                  ...current,
                  stageId: event.target.value,
                  probability: stage?.probability ?? current.probability,
                }));
              }}
            >
              {(pipeline?.stages ?? []).map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={`Value (${draft.currency})`}>
            <Input
              type="number"
              min={0}
              step={100}
              value={draft.value}
              onChange={(event) => set("value", Number(event.target.value) || 0)}
            />
          </Field>
          <Field label={`Probability (${draft.probability}%)`}>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.probability}
              onChange={(event) => set("probability", Number(event.target.value))}
              className="w-full accent-indigo-500"
            />
          </Field>
          <Field label="Expected close">
            <Input
              type="date"
              value={draft.expectedCloseDate ?? ""}
              onChange={(event) => set("expectedCloseDate", event.target.value || null)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact">
            <ContactSelect
              value={draft.contactId}
              onChange={(contactId, contactName) =>
                setDraft((current) => ({ ...current, contactId, contactName }))
              }
            />
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner">
            <OwnerSelect
              value={draft.ownerId}
              onChange={(ownerId, ownerName) =>
                setDraft((current) => ({ ...current, ownerId, ownerName }))
              }
            />
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
        </div>

        <Field label="Tags">
          <TagInput value={draft.tags} onChange={(tags) => set("tags", tags)} />
        </Field>

        <Field label="Description">
          <Textarea
            value={draft.description ?? ""}
            onChange={(event) => set("description", event.target.value || null)}
            placeholder="Scope, decision makers, next step."
          />
        </Field>
      </form>
    </Modal>
  );
}
