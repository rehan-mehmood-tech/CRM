"use client";

import Link from "next/link";
import { useState } from "react";
import { Building2, Pencil, RotateCcw, Trash2, Trophy, User, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Badge, ProgressBar, SectionHeader } from "@/components/ui/Primitives";
import { RecordTimeline } from "./RecordTimeline";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { deleteDeal, markDealLost, markDealWon, moveDealToStage, reopenDeal } from "@/lib/db/deals";
import { can } from "@/lib/roles";
import { errorMessage, formatCurrency, formatDate } from "@/lib/format";
import type { Deal } from "@/lib/types";

export function DealDetail({
  deal,
  onClose,
  onEdit,
}: {
  deal: Deal | null;
  onClose: () => void;
  onEdit: (deal: Deal) => void;
}) {
  const { orgId, actor, role } = useAuth();
  const { pipelines } = useData();
  const toast = useToast();
  const [lostReason, setLostReason] = useState("");
  const [askLost, setAskLost] = useState(false);
  const [pending, setPending] = useState(false);

  if (!deal) return null;

  const pipeline = pipelines.find((item) => item.id === deal.pipelineId) ?? null;
  const stage = pipeline?.stages.find((item) => item.id === deal.stageId) ?? null;
  const canUpdate = can(role, "records:update");
  const canDelete = can(role, "records:delete");

  const run = async (action: () => Promise<void>, message: string) => {
    if (!orgId || !actor) return;
    setPending(true);
    try {
      await action();
      toast.success(message);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const changeStage = (stageId: string) => {
    if (!orgId || !actor || !pipeline) return;
    run(() => moveDealToStage(orgId, actor, deal, pipeline, stageId, deal.order), "Stage updated.");
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={deal.title}
      description={`${formatCurrency(deal.value, deal.currency)} · ${stage?.name ?? "No stage"}`}
      size="lg"
      footer={
        <>
          {canDelete ? (
            <Button
              variant="ghost"
              icon={<Trash2 className="size-4" />}
              disabled={pending}
              onClick={async () => {
                if (!orgId || !actor) return;
                await run(() => deleteDeal(orgId, actor, deal), "Deal deleted.");
                onClose();
              }}
            >
              Delete
            </Button>
          ) : null}
          <span className="flex-1" />
          {canUpdate ? (
            <>
              <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => onEdit(deal)}>
                Edit
              </Button>
              {deal.status === "open" ? (
                <>
                  <Button
                    variant="outline"
                    icon={<XCircle className="size-4" />}
                    disabled={pending}
                    onClick={() => setAskLost(true)}
                  >
                    Mark lost
                  </Button>
                  <Button
                    icon={<Trophy className="size-4" />}
                    loading={pending}
                    onClick={() =>
                      orgId && actor && run(() => markDealWon(orgId, actor, deal), "Deal marked won.")
                    }
                  >
                    Mark won
                  </Button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  icon={<RotateCcw className="size-4" />}
                  loading={pending}
                  onClick={() =>
                    orgId && actor && run(() => reopenDeal(orgId, actor, deal, pipeline), "Deal reopened.")
                  }
                >
                  Reopen deal
                </Button>
              )}
            </>
          ) : null}
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={deal.status === "won" ? "green" : deal.status === "lost" ? "rose" : "indigo"}>
            {deal.status}
          </Badge>
          {stage ? (
            <Badge tone="neutral">
              <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
              {stage.name}
            </Badge>
          ) : null}
          {deal.tags.map((tag) => (
            <Badge key={tag} tone="violet">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Info label="Value">{formatCurrency(deal.value, deal.currency)}</Info>
          <Info label="Weighted">
            {formatCurrency((deal.value * (deal.probability ?? 0)) / 100, deal.currency)}
          </Info>
          <Info label="Expected close">{deal.expectedCloseDate ?? "Not set"}</Info>
        </div>

        <div>
          <p className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
            <span>Probability</span>
            <span>{deal.probability}%</span>
          </p>
          <ProgressBar value={deal.probability} tone={stage?.color ?? "#6366f1"} />
        </div>

        {canUpdate && deal.status === "open" && pipeline ? (
          <Field label="Move to stage">
            <Select value={deal.stageId} onChange={(event) => changeStage(event.target.value)}>
              {pipeline.stages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.probability}%)
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        {askLost ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
            <Field label="Why was it lost?" hint="Stored on the deal and written to the timeline.">
              <Input
                value={lostReason}
                onChange={(event) => setLostReason(event.target.value)}
                placeholder="Budget, timing, chose a competitor…"
              />
            </Field>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setAskLost(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={pending}
                onClick={async () => {
                  if (!orgId || !actor) return;
                  await run(() => markDealLost(orgId, actor, deal, lostReason), "Deal marked lost.");
                  setAskLost(false);
                }}
              >
                Confirm lost
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Contact</p>
            {deal.contactId ? (
              <Link
                href={`/contacts/${deal.contactId}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200"
              >
                <User className="size-3.5" />
                {deal.contactName}
              </Link>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Not linked</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Company</p>
            {deal.companyId ? (
              <Link
                href={`/companies/${deal.companyId}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:text-indigo-200"
              >
                <Building2 className="size-3.5" />
                {deal.companyName}
              </Link>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Not linked</p>
            )}
          </div>
        </div>

        {deal.description ? (
          <div>
            <SectionHeader title="Description" />
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
              {deal.description}
            </p>
          </div>
        ) : null}

        {deal.lostReason ? (
          <p className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            Lost reason: {deal.lostReason}
          </p>
        ) : null}

        <div className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
          <p>Owner: {deal.ownerName ?? "Unassigned"}</p>
          <p>Source: {deal.source ? deal.source.replace(/_/g, " ") : "Unknown"}</p>
          <p>Created {formatDate(deal.createdAt)}</p>
          {deal.closedAt ? <p>Closed {formatDate(deal.closedAt)}</p> : null}
        </div>

        <RecordTimeline relatedType="deal" relatedId={deal.id} relatedName={deal.title} />
      </div>
    </Modal>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-white">{children}</p>
    </div>
  );
}
