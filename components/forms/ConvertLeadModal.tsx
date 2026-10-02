"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input, Select } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { convertLead } from "@/lib/db/leads";
import { errorMessage } from "@/lib/format";
import type { Lead } from "@/lib/types";

export function ConvertLeadModal({
  open,
  onClose,
  lead,
}: {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
}) {
  const router = useRouter();
  const { orgId, actor } = useAuth();
  const { pipelines, defaultPipeline } = useData();
  const toast = useToast();
  const [createDeal, setCreateDeal] = useState(true);
  const [pipelineId, setPipelineId] = useState("");
  const [stageId, setStageId] = useState("");
  const [value, setValue] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !lead) return;
    setError(null);
    setCreateDeal(true);
    setValue(lead.value ?? 0);
    const pipeline = defaultPipeline ?? pipelines[0] ?? null;
    setPipelineId(pipeline?.id ?? "");
    setStageId(pipeline?.stages[0]?.id ?? "");
  }, [open, lead, defaultPipeline, pipelines]);

  const pipeline = pipelines.find((item) => item.id === pipelineId) ?? null;

  if (!lead) return null;

  const run = async () => {
    if (!orgId || !actor) return;
    setPending(true);
    setError(null);
    try {
      const result = await convertLead(orgId, actor, lead, {
        createDeal,
        pipelineId: pipelineId || undefined,
        stageId: stageId || undefined,
        dealValue: value,
      });
      toast.success(createDeal ? "Lead converted to a contact and a deal." : "Lead converted to a contact.");
      onClose();
      router.push(result.dealId ? "/deals" : `/contacts/${result.contactId}`);
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
      title={`Convert ${lead.name}`}
      description="Creates a contact from this lead, and optionally an open deal, keeping the lead on record as converted."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button loading={pending} onClick={run} icon={<ArrowRightLeft className="size-4" />}>
            Convert lead
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <ErrorPanel message={error} /> : null}

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300">
          <p>
            <span className="text-slate-500">Contact will be created as</span> {lead.name}
            {lead.company ? ` · ${lead.company}` : ""}
          </p>
          {lead.email ? <p className="mt-1 text-xs text-slate-500">{lead.email}</p> : null}
        </div>

        <Checkbox
          checked={createDeal}
          onChange={(event) => setCreateDeal(event.target.checked)}
          label="Also open a deal in the pipeline"
        />

        {createDeal ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Pipeline">
              <Select
                value={pipelineId}
                onChange={(event) => {
                  setPipelineId(event.target.value);
                  const next = pipelines.find((item) => item.id === event.target.value);
                  setStageId(next?.stages[0]?.id ?? "");
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
            <Field label="Stage">
              <Select value={stageId} onChange={(event) => setStageId(event.target.value)}>
                {(pipeline?.stages ?? []).map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Deal value">
              <Input
                type="number"
                min={0}
                step={100}
                value={value}
                onChange={(event) => setValue(Number(event.target.value) || 0)}
              />
            </Field>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
