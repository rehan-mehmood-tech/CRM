"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Check, Columns3, Plus, Save, Star, Trash2, X } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Badge, Card, EmptyState, ErrorPanel, SectionHeader } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { createPipeline, deletePipeline, newStage, updatePipeline } from "@/lib/db/pipelines";
import { DEFAULT_STAGES } from "@/lib/db/orgs";
import { can } from "@/lib/roles";
import { errorMessage, formatCurrency } from "@/lib/format";
import type { Pipeline, PipelineStage } from "@/lib/types";

const COLORS = ["#64748b", "#0ea5e9", "#6366f1", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899"];

export default function PipelineSettingsPage() {
  const { orgId, actor, role, org } = useAuth();
  const { pipelines, deals, loading } = useData();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [selectedId, setSelectedId] = useState("");
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [name, setName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const canManage = can(role, "pipelines:manage");
  const currency = org?.currency ?? "USD";
  const selected: Pipeline | null =
    pipelines.find((item) => item.id === selectedId) ?? pipelines[0] ?? null;

  useEffect(() => {
    if (!selected) return;
    setSelectedId(selected.id);
    setStages(selected.stages);
    setName(selected.name);
    setDirty(false);
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const editStage = (index: number, patch: Partial<PipelineStage>) => {
    setStages((current) => current.map((stage, i) => (i === index ? { ...stage, ...patch } : stage)));
    setDirty(true);
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...stages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setStages(next);
    setDirty(true);
  };

  const removeStage = async (index: number) => {
    const stage = stages[index];
    const inUse = deals.filter(
      (deal) => deal.pipelineId === selected?.id && deal.stageId === stage.id && deal.status === "open",
    );
    if (inUse.length) {
      toast.error(
        `${inUse.length} open deal${inUse.length === 1 ? " is" : "s are"} in ${stage.name}. Move them first.`,
      );
      return;
    }
    const ok = await confirm({
      title: `Remove the ${stage.name} stage?`,
      message: "The stage is removed when you save. Deals already closed keep their stage reference.",
      confirmLabel: "Remove stage",
      tone: "danger",
    });
    if (!ok) return;
    setStages((current) => current.filter((_, i) => i !== index));
    setDirty(true);
  };

  const save = async () => {
    if (!orgId || !actor || !selected) return;
    if (!name.trim()) {
      setError("The pipeline needs a name.");
      return;
    }
    if (!stages.length) {
      setError("Keep at least one stage.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await updatePipeline(orgId, actor, selected, { name: name.trim(), stages });
      toast.success("Pipeline saved.");
      setDirty(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId || !actor) return;
    if (!newName.trim()) return;
    setPending(true);
    try {
      const id = await createPipeline(orgId, actor, newName.trim(), DEFAULT_STAGES, pipelines.length === 0);
      toast.success("Pipeline created.");
      setSelectedId(id);
      setNewName("");
      setCreateOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const makeDefault = async (pipeline: Pipeline) => {
    if (!orgId || !actor) return;
    try {
      await Promise.all(
        pipelines.map((item) =>
          item.isDefault === (item.id === pipeline.id)
            ? Promise.resolve()
            : updatePipeline(orgId, actor, item, { isDefault: item.id === pipeline.id }),
        ),
      );
      toast.success(`${pipeline.name} is now the default pipeline.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const destroy = async (pipeline: Pipeline) => {
    if (!orgId || !actor) return;
    const used = deals.filter((deal) => deal.pipelineId === pipeline.id);
    if (used.length) {
      toast.error(`${used.length} deal${used.length === 1 ? "" : "s"} still use this pipeline.`);
      return;
    }
    const ok = await confirm({
      title: `Delete the ${pipeline.name} pipeline?`,
      message: "This cannot be undone.",
      confirmLabel: "Delete pipeline",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deletePipeline(orgId, actor, pipeline);
      toast.success("Pipeline deleted.");
      setSelectedId("");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <Card>Loading pipelines…</Card>;

  if (!pipelines.length) {
    return (
      <>
        <EmptyState
          icon={<Columns3 className="size-5" />}
          title="No pipelines yet"
          message="A pipeline is the set of stages your deals move through. Create one to start tracking deals."
          action={
            canManage ? (
              <Button icon={<Plus className="size-4" />} onClick={() => setCreateOpen(true)}>
                Create a pipeline
              </Button>
            ) : null
          }
        />
        <CreateModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          value={newName}
          onChange={setNewName}
          onSubmit={create}
          pending={pending}
        />
      </>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeader
          title="Your pipelines"
          subtitle="Each pipeline has its own stages. One of them is the default for new deals."
          actions={
            canManage ? (
              <Button
                size="sm"
                variant="secondary"
                icon={<Plus className="size-3.5" />}
                onClick={() => setCreateOpen(true)}
              >
                New pipeline
              </Button>
            ) : null
          }
        />
        <ul className="mt-4 space-y-2">
          {pipelines.map((pipeline) => {
            const count = deals.filter((deal) => deal.pipelineId === pipeline.id).length;
            return (
              <li
                key={pipeline.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5 transition ${
                  pipeline.id === selected?.id
                    ? "border-indigo-400/40 bg-indigo-500/5"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(pipeline.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="flex items-center gap-2 text-sm font-medium text-white">
                    {pipeline.name}
                    {pipeline.isDefault ? <Badge tone="violet">Default</Badge> : null}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {pipeline.stages.length} stages · {count} deal{count === 1 ? "" : "s"}
                  </p>
                </button>
                {canManage ? (
                  <div className="flex items-center gap-1">
                    {!pipeline.isDefault ? (
                      <IconButton label="Make default" onClick={() => makeDefault(pipeline)}>
                        <Star className="size-4" />
                      </IconButton>
                    ) : null}
                    <IconButton label="Delete pipeline" onClick={() => destroy(pipeline)}>
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card>

      {selected ? (
        <Card>
          <SectionHeader
            title={`Stages in ${selected.name}`}
            subtitle="Probability feeds the weighted forecast on the dashboard and reports."
            actions={
              canManage && dirty ? (
                <Button size="sm" loading={pending} icon={<Save className="size-3.5" />} onClick={save}>
                  Save changes
                </Button>
              ) : null
            }
          />

          {error ? <div className="mt-4"><ErrorPanel message={error} /></div> : null}

          <div className="mt-4">
            <Field label="Pipeline name">
              <Input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setDirty(true);
                }}
                disabled={!canManage}
              />
            </Field>
          </div>

          <ul className="mt-5 space-y-2">
            {stages.map((stage, index) => {
              const stageDeals = deals.filter(
                (deal) => deal.pipelineId === selected.id && deal.stageId === stage.id && deal.status === "open",
              );
              const value = stageDeals.reduce((total, deal) => total + (deal.value || 0), 0);
              return (
                <li
                  key={stage.id}
                  className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
                    <Input
                      value={stage.name}
                      onChange={(event) => editStage(index, { name: event.target.value })}
                      disabled={!canManage}
                      aria-label={`Stage ${index + 1} name`}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={5}
                      value={stage.probability}
                      onChange={(event) =>
                        editStage(index, { probability: Math.min(100, Math.max(0, Number(event.target.value))) })
                      }
                      disabled={!canManage}
                      aria-label={`Stage ${index + 1} probability`}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Use colour ${color}`}
                        disabled={!canManage}
                        onClick={() => editStage(index, { color })}
                        className={`size-5 rounded-full transition ${
                          stage.color === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0f22]" : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <p className="self-center whitespace-nowrap text-xs text-slate-500">
                    {stageDeals.length} open · {formatCurrency(value, currency)}
                  </p>

                  {canManage ? (
                    <div className="flex items-center gap-1 self-center">
                      <IconButton label="Move stage up" onClick={() => move(index, -1)}>
                        <ArrowUp className="size-4" />
                      </IconButton>
                      <IconButton label="Move stage down" onClick={() => move(index, 1)}>
                        <ArrowDown className="size-4" />
                      </IconButton>
                      <IconButton label="Remove stage" onClick={() => removeStage(index)}>
                        <X className="size-4" />
                      </IconButton>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          {canManage ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="size-3.5" />}
                onClick={() => {
                  setStages((current) => [...current, newStage(`Stage ${current.length + 1}`)]);
                  setDirty(true);
                }}
              >
                Add stage
              </Button>
              {dirty ? (
                <>
                  <Button size="sm" loading={pending} icon={<Check className="size-3.5" />} onClick={save}>
                    Save pipeline
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setStages(selected.stages);
                      setName(selected.name);
                      setDirty(false);
                    }}
                  >
                    Discard
                  </Button>
                </>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500">
              Your role can view pipeline stages but not change them.
            </p>
          )}
        </Card>
      ) : null}

      <CreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        value={newName}
        onChange={setNewName}
        onSubmit={create}
        pending={pending}
      />
      {dialog}
    </div>
  );
}

function CreateModal({
  open,
  onClose,
  value,
  onChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  pending: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New pipeline"
      description="It starts with the default five stages, which you can rename afterwards."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="pipeline-form" type="submit" loading={pending}>
            Create pipeline
          </Button>
        </>
      }
    >
      <form id="pipeline-form" onSubmit={onSubmit}>
        <Field label="Pipeline name" required>
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Retainers"
            required
          />
        </Field>
      </form>
    </Modal>
  );
}
