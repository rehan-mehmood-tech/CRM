"use client";

import { useMemo, useState } from "react";
import { BarChart3, Download } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RevenueChart, SourceChart, StageChart } from "@/components/app/Charts";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import {
  Card,
  EmptyState,
  LoadingPanel,
  SectionHeader,
  StatCard,
  Table,
  Tabs,
  Td,
  Th,
  Tr,
} from "@/components/ui/Primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  averageDealSize,
  conversionRate,
  leaderboard,
  monthlySeries,
  sourceBreakdown,
  stageBreakdown,
  weightedPipelineValue,
  winRate,
  wonValue,
  pipelineValue,
} from "@/lib/metrics";
import { formatCurrency, formatNumber, titleCase } from "@/lib/format";

export default function ReportsPage() {
  const { org, members } = useAuth();
  const { leads, deals, tasks, pipelines, defaultPipeline, loading } = useData();
  const toast = useToast();
  const [months, setMonths] = useState(6);
  const [pipelineId, setPipelineId] = useState("");
  const [view, setView] = useState<"charts" | "tables">("charts");

  const currency = org?.currency ?? "USD";
  const pipeline = pipelines.find((item) => item.id === pipelineId) ?? defaultPipeline;

  const scopedDeals = useMemo(
    () => (pipeline ? deals.filter((deal) => deal.pipelineId === pipeline.id) : deals),
    [deals, pipeline],
  );

  const series = useMemo(() => monthlySeries(scopedDeals, months), [scopedDeals, months]);
  const stages = useMemo(
    () => stageBreakdown(scopedDeals, pipeline?.stages ?? []),
    [scopedDeals, pipeline],
  );
  const sources = useMemo(() => sourceBreakdown(leads), [leads]);
  const board = useMemo(() => leaderboard(members, scopedDeals, tasks), [members, scopedDeals, tasks]);

  const exportCsv = () => {
    const rows = [
      ["Metric", "Value"],
      ["Open pipeline", String(pipelineValue(scopedDeals))],
      ["Weighted forecast", String(Math.round(weightedPipelineValue(scopedDeals)))],
      ["Won value", String(wonValue(scopedDeals))],
      ["Win rate %", String(winRate(scopedDeals))],
      ["Average won deal", String(Math.round(averageDealSize(scopedDeals)))],
      ["Lead conversion %", String(conversionRate(leads))],
      [],
      ["Stage", "Open deals", "Open value"],
      ...stages.map((stage) => [stage.stage, String(stage.count), String(stage.value)]),
      [],
      ["Source", "Leads", "Converted"],
      ...sources.map((source) => [source.source, String(source.leads), String(source.converted)]),
      [],
      ["Teammate", "Won value", "Won deals", "Open value", "Open deals"],
      ...board.map((row) => [
        row.name,
        String(row.wonValue),
        String(row.wonCount),
        String(row.openValue),
        String(row.openCount),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${org?.slug ?? "workspace"}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported.");
  };

  const hasData = deals.length > 0 || leads.length > 0;

  return (
    <>
      <PageHeader
        title="Reports"
        description="Computed live from your own records — nothing here is pre-seeded."
        actions={
          hasData ? (
            <Button variant="secondary" icon={<Download className="size-4" />} onClick={exportCsv}>
              Export CSV
            </Button>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Open pipeline"
            value={formatCurrency(pipelineValue(scopedDeals), currency)}
            icon={<BarChart3 className="size-5" />}
          />
          <StatCard
            label="Weighted forecast"
            value={formatCurrency(weightedPipelineValue(scopedDeals), currency)}
            tone="violet"
          />
          <StatCard
            label="Average won deal"
            value={formatCurrency(averageDealSize(scopedDeals), currency)}
            tone="green"
          />
          <StatCard
            label="Lead conversion"
            value={`${conversionRate(leads)}%`}
            sub={`${formatNumber(leads.length)} leads captured`}
            tone="sky"
          />
        </div>
      </PageHeader>

      <Card className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            tabs={[
              { id: "charts", label: "Charts" },
              { id: "tables", label: "Tables" },
            ]}
            active={view}
            onChange={setView}
          />
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <Select value={pipelineId} onChange={(event) => setPipelineId(event.target.value)}>
              <option value="">Default pipeline</option>
              {pipelines.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
            <Select value={months} onChange={(event) => setMonths(Number(event.target.value))}>
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingPanel label="Crunching your numbers" />
      ) : !hasData ? (
        <EmptyState
          icon={<BarChart3 className="size-5" />}
          title="No data to report on yet"
          message="Capture a few leads and open some deals. Every chart on this page is built from your records."
        />
      ) : view === "charts" ? (
        <div className="space-y-5">
          <Card>
            <SectionHeader
              title="Closed revenue by month"
              subtitle="Won against lost, by the month each deal closed."
            />
            <div className="mt-4">
              <RevenueChart data={series} currency={currency} />
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <SectionHeader
                title="Open pipeline by stage"
                subtitle={pipeline?.name ?? "No pipeline selected"}
              />
              <div className="mt-4">
                {stages.length ? (
                  <StageChart data={stages} currency={currency} />
                ) : (
                  <p className="py-10 text-center text-sm text-slate-500">This pipeline has no stages.</p>
                )}
              </div>
            </Card>

            <Card>
              <SectionHeader title="Leads by source" subtitle="How many came in, and how many converted." />
              <div className="mt-4">
                {sources.length ? (
                  <SourceChart data={sources} />
                ) : (
                  <p className="py-10 text-center text-sm text-slate-500">No leads captured yet.</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <Card padded={false} className="overflow-hidden p-5">
            <SectionHeader title="Pipeline by stage" />
            <div className="mt-4">
              <Table>
                <thead>
                  <tr>
                    <Th>Stage</Th>
                    <Th>Open deals</Th>
                    <Th>Open value</Th>
                    <Th>Share of pipeline</Th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((stage) => {
                    const total = stages.reduce((sum, item) => sum + item.value, 0) || 1;
                    return (
                      <Tr key={stage.stage}>
                        <Td>
                          <span className="inline-flex items-center gap-2">
                            <span className="size-2 rounded-full" style={{ backgroundColor: stage.color }} />
                            {stage.stage}
                          </span>
                        </Td>
                        <Td>{formatNumber(stage.count)}</Td>
                        <Td>{formatCurrency(stage.value, currency)}</Td>
                        <Td>{Math.round((stage.value / total) * 100)}%</Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Leads by source" />
            <div className="mt-4">
              <Table>
                <thead>
                  <tr>
                    <Th>Source</Th>
                    <Th>Leads</Th>
                    <Th>Converted</Th>
                    <Th>Conversion rate</Th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((source) => (
                    <Tr key={source.source}>
                      <Td>{titleCase(source.source)}</Td>
                      <Td>{formatNumber(source.leads)}</Td>
                      <Td>{formatNumber(source.converted)}</Td>
                      <Td>{source.leads ? Math.round((source.converted / source.leads) * 100) : 0}%</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>

          <Card className="p-5">
            <SectionHeader title="Team leaderboard" />
            <div className="mt-4">
              <Table>
                <thead>
                  <tr>
                    <Th>Teammate</Th>
                    <Th>Won value</Th>
                    <Th>Won deals</Th>
                    <Th>Open value</Th>
                    <Th>Open deals</Th>
                    <Th>Open tasks</Th>
                  </tr>
                </thead>
                <tbody>
                  {board.map((row) => (
                    <Tr key={row.id}>
                      <Td className="font-medium text-white">{row.name}</Td>
                      <Td>{formatCurrency(row.wonValue, currency)}</Td>
                      <Td>{formatNumber(row.wonCount)}</Td>
                      <Td>{formatCurrency(row.openValue, currency)}</Td>
                      <Td>{formatNumber(row.openCount)}</Td>
                      <Td>{formatNumber(row.tasksOpen)}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
