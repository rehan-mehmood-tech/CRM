"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Columns3,
  ListChecks,
  Plus,
  Target,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { RevenueChart, StageChart } from "@/components/app/Charts";
import { Button } from "@/components/ui/Button";
import {
  Badge,
  Card,
  EmptyState,
  ErrorPanel,
  LoadingPanel,
  ProgressBar,
  SectionHeader,
  StatCard,
} from "@/components/ui/Primitives";
import { LeadForm } from "@/components/forms/LeadForm";
import { DealForm } from "@/components/forms/DealForm";
import { TaskForm } from "@/components/forms/TaskForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { toggleTask } from "@/lib/db/tasks";
import { can } from "@/lib/roles";
import { errorMessage, formatCurrency, formatNumber, isOverdue } from "@/lib/format";
import {
  dueTodayTasks,
  leaderboard,
  monthlySeries,
  openDeals,
  overdueTasks,
  pipelineValue,
  stageBreakdown,
  thisMonth,
  weightedPipelineValue,
  winRate,
  wonDeals,
  wonValue,
} from "@/lib/metrics";

export default function DashboardPage() {
  const { org, orgId, actor, profile, role, members } = useAuth();
  const { leads, contacts, companies, deals, tasks, activities, defaultPipeline, loading, error } = useData();
  const toast = useToast();
  const [modal, setModal] = useState<"lead" | "deal" | "task" | null>(null);

  const currency = org?.currency ?? "USD";
  const canWrite = can(role, "records:create");

  const stages = useMemo(
    () => stageBreakdown(deals, defaultPipeline?.stages ?? []),
    [deals, defaultPipeline],
  );
  const months = useMemo(() => monthlySeries(deals, 6), [deals]);
  const board = useMemo(() => leaderboard(members, deals, tasks), [members, deals, tasks]);

  const open = openDeals(deals);
  const won = wonDeals(deals);
  const closedThisMonth = thisMonth(deals).filter((deal) => deal.status === "won");
  const overdue = overdueTasks(tasks);
  const dueToday = dueTodayTasks(tasks);
  const upcoming = [...tasks]
    .filter((task) => !task.completed)
    .sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"))
    .slice(0, 6);

  const isEmpty =
    !loading && leads.length === 0 && contacts.length === 0 && companies.length === 0 && deals.length === 0;

  const complete = async (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || !orgId || !actor) return;
    try {
      await toggleTask(orgId, actor, task);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const firstName = (profile?.name ?? "there").split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`Here is where ${org?.name ?? "your workspace"} stands right now.`}
        actions={
          canWrite ? (
            <>
              <Button variant="secondary" icon={<Target className="size-4" />} onClick={() => setModal("lead")}>
                New lead
              </Button>
              <Button icon={<Plus className="size-4" />} onClick={() => setModal("deal")}>
                New deal
              </Button>
            </>
          ) : null
        }
      />

      {error ? <div className="mb-6"><ErrorPanel message={error} /></div> : null}

      {loading ? (
        <LoadingPanel label="Loading workspace data" />
      ) : isEmpty ? (
        <FirstRun canWrite={canWrite} onNewLead={() => setModal("lead")} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Open pipeline"
              value={formatCurrency(pipelineValue(deals), currency)}
              sub={`${formatNumber(open.length)} open deal${open.length === 1 ? "" : "s"}`}
              icon={<Columns3 className="size-5" />}
            />
            <StatCard
              label="Weighted forecast"
              value={formatCurrency(weightedPipelineValue(deals), currency)}
              sub="Open value × stage probability"
              icon={<TrendingUp className="size-5" />}
              tone="violet"
            />
            <StatCard
              label="Won this month"
              value={formatCurrency(
                closedThisMonth.reduce((total, deal) => total + (deal.value || 0), 0),
                currency,
              )}
              sub={`${formatNumber(closedThisMonth.length)} closed · ${formatCurrency(wonValue(deals), currency)} all time`}
              icon={<Trophy className="size-5" />}
              tone="green"
            />
            <StatCard
              label="Win rate"
              value={`${winRate(deals)}%`}
              sub={`${formatNumber(won.length)} won of ${formatNumber(deals.length)} deals`}
              icon={<BarChart3 className="size-5" />}
              tone="sky"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <SectionHeader
                title="Closed revenue by month"
                subtitle="Deals by the month they were marked won or lost."
                actions={
                  <Link href="/reports" className="text-xs text-indigo-300 hover:text-indigo-200">
                    Full reports
                  </Link>
                }
              />
              <div className="mt-4">
                <RevenueChart data={months} currency={currency} />
              </div>
            </Card>

            <Card>
              <SectionHeader
                title="Open pipeline by stage"
                subtitle={defaultPipeline?.name ?? "No pipeline yet"}
              />
              <div className="mt-4">
                {stages.length ? (
                  <StageChart data={stages} currency={currency} />
                ) : (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Add stages in workspace settings to see this breakdown.
                  </p>
                )}
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <SectionHeader
                title="What needs doing"
                subtitle={
                  overdue.length
                    ? `${overdue.length} overdue · ${dueToday.length} due today`
                    : `${dueToday.length} due today`
                }
                actions={
                  canWrite ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Plus className="size-3.5" />}
                      onClick={() => setModal("task")}
                    >
                      Add task
                    </Button>
                  ) : null
                }
              />
              <div className="mt-4">
                {upcoming.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">
                    No open tasks. Everything is handled.
                  </p>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {upcoming.map((task) => (
                      <li key={task.id} className="flex items-start gap-3 py-3">
                        <button
                          type="button"
                          onClick={() => complete(task.id)}
                          aria-label={`Complete ${task.title}`}
                          className="mt-0.5 text-slate-500 transition hover:text-emerald-400"
                        >
                          <CheckCircle2 className="size-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{task.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {task.dueDate ? (
                              <span
                                className={
                                  isOverdue(task.dueDate, task.completed) ? "text-rose-300" : undefined
                                }
                              >
                                <CalendarClock className="mr-1 inline size-3" />
                                {task.dueDate}
                                {task.dueTime ? ` ${task.dueTime}` : ""}
                              </span>
                            ) : (
                              <span>No due date</span>
                            )}
                            {task.assigneeName ? <span>· {task.assigneeName}</span> : null}
                            {task.relatedName ? <span>· {task.relatedName}</span> : null}
                          </p>
                        </div>
                        <Badge
                          tone={
                            task.priority === "urgent"
                              ? "rose"
                              : task.priority === "high"
                                ? "amber"
                                : "neutral"
                          }
                        >
                          {task.priority}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href="/tasks"
                  className="mt-3 inline-block text-xs text-indigo-300 hover:text-indigo-200"
                >
                  See all tasks
                </Link>
              </div>
            </Card>

            <Card>
              <SectionHeader title="Recent activity" subtitle="Live from your workspace timeline." />
              <div className="mt-2">
                <ActivityFeed activities={activities} limit={7} />
                <Link
                  href="/activity"
                  className="mt-3 inline-block text-xs text-indigo-300 hover:text-indigo-200"
                >
                  Full timeline
                </Link>
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <SectionHeader title="Team performance" subtitle="Won and open value per teammate." />
              <ul className="mt-4 space-y-4">
                {board.map((row) => {
                  const max = Math.max(...board.map((item) => item.wonValue + item.openValue), 1);
                  return (
                    <li key={row.id}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-white">{row.name}</span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatCurrency(row.wonValue, currency)} won ·{" "}
                          {formatCurrency(row.openValue, currency)} open
                        </span>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={((row.wonValue + row.openValue) / max) * 100} />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {row.wonCount} won · {row.openCount} open · {row.tasksOpen} open tasks
                      </p>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card>
              <SectionHeader title="Workspace at a glance" />
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  { label: "Leads", value: formatNumber(leads.length), href: "/leads", icon: Target },
                  { label: "Contacts", value: formatNumber(contacts.length), href: "/contacts", icon: Users },
                  {
                    label: "Companies",
                    value: formatNumber(companies.length),
                    href: "/companies",
                    icon: Building2,
                  },
                  { label: "Deals", value: formatNumber(deals.length), href: "/deals", icon: Columns3 },
                  {
                    label: "Open tasks",
                    value: formatNumber(tasks.filter((task) => !task.completed).length),
                    href: "/tasks",
                    icon: ListChecks,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-slate-400">
                      <row.icon className="size-4 text-indigo-300" />
                      <Link href={row.href} className="transition hover:text-white">
                        {row.label}
                      </Link>
                    </dt>
                    <dd className="font-medium text-white">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {overdue.length ? (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-amber-100">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
                  <span>
                    {overdue.length} task{overdue.length === 1 ? " is" : "s are"} past their due date.{" "}
                    <Link href="/tasks?filter=overdue" className="underline">
                      Review them
                    </Link>
                    .
                  </span>
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      )}

      <LeadForm open={modal === "lead"} onClose={() => setModal(null)} lead={null} />
      <DealForm open={modal === "deal"} onClose={() => setModal(null)} deal={null} />
      <TaskForm open={modal === "task"} onClose={() => setModal(null)} task={null} />
    </>
  );
}

/** Shown while the workspace genuinely has no records yet. */
function FirstRun({ canWrite, onNewLead }: { canWrite: boolean; onNewLead: () => void }) {
  const steps = [
    {
      title: "Capture your first lead",
      body: "Add someone who has shown interest, with their source and a score.",
      href: "/leads",
      icon: Target,
    },
    {
      title: "Add the company behind it",
      body: "Companies group contacts and deals so account history stays together.",
      href: "/companies",
      icon: Building2,
    },
    {
      title: "Open a deal",
      body: "Put a value on the opportunity and drop it into your pipeline.",
      href: "/deals",
      icon: Columns3,
    },
    {
      title: "Invite your team",
      body: "Send role-scoped invitations so your closers work in the same workspace.",
      href: "/team",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <EmptyState
        icon={<Target className="size-5" />}
        title="Your workspace is empty, exactly as it should be"
        message="Nothing here is sample data. Create your first records and every number on this dashboard starts filling in."
        action={
          canWrite ? (
            <Button icon={<Plus className="size-4" />} onClick={onNewLead}>
              Create your first lead
            </Button>
          ) : null
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <Link
            key={step.title}
            href={step.href}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-indigo-400/30 hover:bg-white/[0.04]"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-500/15 text-xs font-semibold text-indigo-200">
              {index + 1}
            </span>
            <h3 className="mt-4 flex items-center gap-2 text-sm font-semibold text-white">
              <step.icon className="size-4 text-indigo-300" />
              {step.title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-400">{step.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
