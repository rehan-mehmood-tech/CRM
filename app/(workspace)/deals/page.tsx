"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Columns3, GripVertical, LayoutList, Plus, Settings2, Trophy } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { DealDetail } from "@/components/app/DealDetail";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import {
  Badge,
  Card,
  EmptyState,
  LoadingPanel,
  StatCard,
  Table,
  Tabs,
  Td,
  Th,
  Tr,
} from "@/components/ui/Primitives";
import { DealForm } from "@/components/forms/DealForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { moveDealToStage } from "@/lib/db/deals";
import { can } from "@/lib/roles";
import { errorMessage, formatCurrency, formatNumber } from "@/lib/format";
import { pipelineValue, weightedPipelineValue, winRate, wonValue } from "@/lib/metrics";
import type { Deal } from "@/lib/types";

export default function DealsPage() {
  const searchParams = useSearchParams();
  const { orgId, actor, role, org, members } = useAuth();
  const { deals, pipelines, defaultPipeline, loading } = useData();
  const toast = useToast();

  const [view, setView] = useState<"board" | "list">("board");
  const [pipelineId, setPipelineId] = useState<string>("");
  const [owner, setOwner] = useState("all");
  const [term, setTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"open" | "won" | "lost" | "all">("open");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);
  const [presetStage, setPresetStage] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const currency = org?.currency ?? "USD";
  const canCreate = can(role, "records:create");
  const canUpdate = can(role, "records:update");

  useEffect(() => {
    if (!pipelineId && defaultPipeline) setPipelineId(defaultPipeline.id);
  }, [defaultPipeline, pipelineId]);

  useEffect(() => {
    const focus = searchParams.get("focus");
    if (focus) setSelected(focus);
  }, [searchParams]);

  const pipeline = pipelines.find((item) => item.id === pipelineId) ?? defaultPipeline;

  const scoped = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return deals.filter((deal) => {
      if (pipeline && deal.pipelineId !== pipeline.id) return false;
      if (owner !== "all" && deal.ownerId !== owner) return false;
      if (!needle) return true;
      return [deal.title, deal.companyName, deal.contactName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [deals, pipeline, owner, term]);

  const listRows = useMemo(
    () => (statusFilter === "all" ? scoped : scoped.filter((deal) => deal.status === statusFilter)),
    [scoped, statusFilter],
  );

  const selectedDeal = deals.find((deal) => deal.id === selected) ?? null;

  const onDrop = async (stageId: string) => {
    setDropTarget(null);
    const deal = deals.find((item) => item.id === dragging);
    setDragging(null);
    if (!deal || !orgId || !actor || !pipeline) return;
    if (deal.stageId === stageId && deal.status === "open") return;
    // Dropped cards go to the top of the target column.
    const topOrder = Math.max(0, ...scoped.filter((item) => item.stageId === stageId).map((item) => item.order));
    try {
      await moveDealToStage(orgId, actor, deal, pipeline, stageId, topOrder + 1);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Drag deals between stages, or open one to log activity and close it."
        actions={
          <>
            {can(role, "pipelines:manage") ? (
              <Link href="/settings/pipelines">
                <Button variant="ghost" icon={<Settings2 className="size-4" />}>
                  Stages
                </Button>
              </Link>
            ) : null}
            {canCreate ? (
              <Button
                icon={<Plus className="size-4" />}
                onClick={() => {
                  setEditing(null);
                  setPresetStage(null);
                  setFormOpen(true);
                }}
              >
                New deal
              </Button>
            ) : null}
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Open pipeline"
            value={formatCurrency(pipelineValue(scoped), currency)}
            sub={`${formatNumber(scoped.filter((deal) => deal.status === "open").length)} open deals`}
            icon={<Columns3 className="size-5" />}
          />
          <StatCard
            label="Weighted forecast"
            value={formatCurrency(weightedPipelineValue(scoped), currency)}
            tone="violet"
          />
          <StatCard label="Won value" value={formatCurrency(wonValue(scoped), currency)} tone="green" icon={<Trophy className="size-5" />} />
          <StatCard label="Win rate" value={`${winRate(scoped)}%`} tone="sky" />
        </div>
      </PageHeader>

      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            tabs={[
              { id: "board", label: "Board" },
              { id: "list", label: "List" },
            ]}
            active={view}
            onChange={setView}
          />
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <Select value={pipelineId} onChange={(event) => setPipelineId(event.target.value)}>
              {pipelines.length === 0 ? <option value="">No pipeline yet</option> : null}
              {pipelines.map((item) => (
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
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search deals"
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingPanel label="Loading pipeline" />
      ) : !pipeline ? (
        <EmptyState
          icon={<Columns3 className="size-5" />}
          title="No pipeline yet"
          message="Create a pipeline with stages in workspace settings, then your deals have somewhere to live."
          action={
            <Link href="/settings/pipelines">
              <Button>Set up a pipeline</Button>
            </Link>
          }
        />
      ) : view === "board" ? (
        <div className="-mx-1 flex gap-3 overflow-x-auto pb-4">
          {pipeline.stages.map((stage) => {
            const stageDeals = scoped
              .filter((deal) => deal.status === "open" && deal.stageId === stage.id)
              .sort((a, b) => b.order - a.order);
            const total = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            return (
              <div
                key={stage.id}
                onDragOver={(event) => {
                  if (!canUpdate) return;
                  event.preventDefault();
                  setDropTarget(stage.id);
                }}
                onDragLeave={() => setDropTarget((current) => (current === stage.id ? null : current))}
                onDrop={() => canUpdate && onDrop(stage.id)}
                className={clsx(
                  "flex w-72 shrink-0 flex-col rounded-2xl border bg-white/[0.02] transition",
                  dropTarget === stage.id
                    ? "border-indigo-400/60 bg-indigo-500/5"
                    : "border-white/10",
                )}
              >
                <div className="border-b border-white/5 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-medium text-white">
                      <span className="size-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.name}
                    </p>
                    <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                      {stageDeals.length}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatCurrency(total, currency)} · {stage.probability}% likely
                  </p>
                </div>

                <div className="flex-1 space-y-2 p-2">
                  {stageDeals.map((deal) => (
                    <article
                      key={deal.id}
                      draggable={canUpdate}
                      onDragStart={() => setDragging(deal.id)}
                      onDragEnd={() => setDragging(null)}
                      onClick={() => setSelected(deal.id)}
                      className={clsx(
                        "cursor-pointer rounded-xl border border-white/10 bg-[#0c1026] p-3 transition hover:border-indigo-400/40",
                        dragging === deal.id && "opacity-50",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {canUpdate ? (
                          <GripVertical className="mt-0.5 size-3.5 shrink-0 cursor-grab text-slate-600" />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">{deal.title}</p>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {deal.companyName ?? deal.contactName ?? "No account linked"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">
                          {formatCurrency(deal.value, deal.currency)}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {deal.expectedCloseDate ?? "No date"}
                        </span>
                      </div>
                      {deal.ownerName ? (
                        <p className="mt-1.5 truncate text-[11px] text-slate-500">{deal.ownerName}</p>
                      ) : null}
                    </article>
                  ))}

                  {canCreate ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(null);
                        setPresetStage(stage.id);
                        setFormOpen(true);
                      }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2 text-xs text-slate-500 transition hover:border-indigo-400/40 hover:text-indigo-300"
                    >
                      <Plus className="size-3.5" />
                      Add deal
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Tabs
              tabs={[
                { id: "open", label: "Open", count: scoped.filter((d) => d.status === "open").length },
                { id: "won", label: "Won", count: scoped.filter((d) => d.status === "won").length },
                { id: "lost", label: "Lost", count: scoped.filter((d) => d.status === "lost").length },
                { id: "all", label: "All", count: scoped.length },
              ]}
              active={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          {listRows.length === 0 ? (
            <EmptyState
              icon={<LayoutList className="size-5" />}
              title="No deals here"
              message="Create a deal, or switch to another status tab."
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Deal</Th>
                  <Th>Stage</Th>
                  <Th>Value</Th>
                  <Th>Weighted</Th>
                  <Th>Close date</Th>
                  <Th>Owner</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {listRows.map((deal) => {
                  const stage = pipeline.stages.find((item) => item.id === deal.stageId);
                  return (
                    <Tr key={deal.id} onClick={() => setSelected(deal.id)}>
                      <Td>
                        <p className="font-medium text-white">{deal.title}</p>
                        <p className="text-xs text-slate-500">
                          {deal.companyName ?? deal.contactName ?? "No account"}
                        </p>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: stage?.color ?? "#64748b" }}
                          />
                          {stage?.name ?? "—"}
                        </span>
                      </Td>
                      <Td>{formatCurrency(deal.value, deal.currency)}</Td>
                      <Td className="text-slate-400">
                        {formatCurrency((deal.value * (deal.probability ?? 0)) / 100, deal.currency)}
                      </Td>
                      <Td className="text-xs text-slate-400">{deal.expectedCloseDate ?? "—"}</Td>
                      <Td className="text-xs text-slate-400">{deal.ownerName ?? "Unassigned"}</Td>
                      <Td>
                        <Badge
                          tone={deal.status === "won" ? "green" : deal.status === "lost" ? "rose" : "indigo"}
                        >
                          {deal.status}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </>
      )}

      <DealForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        deal={editing}
        presetStageId={presetStage}
      />
      <DealDetail
        deal={selectedDeal}
        onClose={() => setSelected(null)}
        onEdit={(deal) => {
          setSelected(null);
          setEditing(deal);
          setPresetStage(null);
          setFormOpen(true);
        }}
      />
    </>
  );
}
