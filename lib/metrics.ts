import type { Activity, Company, Contact, Deal, Lead, Member, Task } from "./types";
import { toDate } from "./format";

export interface Snapshot {
  leads: Lead[];
  contacts: Contact[];
  companies: Company[];
  deals: Deal[];
  tasks: Task[];
  activities?: Activity[];
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + (Number.isFinite(value) ? value : 0), 0);
}

export function openDeals(deals: Deal[]): Deal[] {
  return deals.filter((deal) => deal.status === "open");
}

export function wonDeals(deals: Deal[]): Deal[] {
  return deals.filter((deal) => deal.status === "won");
}

export function lostDeals(deals: Deal[]): Deal[] {
  return deals.filter((deal) => deal.status === "lost");
}

export function pipelineValue(deals: Deal[]): number {
  return sum(openDeals(deals).map((deal) => deal.value));
}

/** Open pipeline multiplied by each stage probability. */
export function weightedPipelineValue(deals: Deal[]): number {
  return sum(openDeals(deals).map((deal) => (deal.value * (deal.probability ?? 0)) / 100));
}

export function wonValue(deals: Deal[]): number {
  return sum(wonDeals(deals).map((deal) => deal.value));
}

export function winRate(deals: Deal[]): number {
  const closed = wonDeals(deals).length + lostDeals(deals).length;
  if (!closed) return 0;
  return Math.round((wonDeals(deals).length / closed) * 100);
}

export function averageDealSize(deals: Deal[]): number {
  const won = wonDeals(deals);
  if (!won.length) return 0;
  return wonValue(deals) / won.length;
}

export function conversionRate(leads: Lead[]): number {
  if (!leads.length) return 0;
  const converted = leads.filter((lead) => lead.status === "converted").length;
  return Math.round((converted / leads.length) * 100);
}

export function overdueTasks(tasks: Task[]): Task[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.filter((task) => {
    if (task.completed || !task.dueDate) return false;
    const [year, month, day] = task.dueDate.split("-").map(Number);
    if (!year) return false;
    return new Date(year, month - 1, day).getTime() < today.getTime();
  });
}

export function dueTodayTasks(tasks: Task[]): Task[] {
  const today = new Date();
  const key = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, "0")}-${`${today.getDate()}`.padStart(2, "0")}`;
  return tasks.filter((task) => !task.completed && task.dueDate === key);
}

export interface MonthPoint {
  month: string;
  won: number;
  lost: number;
  created: number;
}

/** Last `months` calendar months of deal activity, oldest first. */
export function monthlySeries(deals: Deal[], months = 6): MonthPoint[] {
  const now = new Date();
  const buckets: MonthPoint[] = [];
  const index = new Map<string, MonthPoint>();

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const point: MonthPoint = {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      won: 0,
      lost: 0,
      created: 0,
    };
    buckets.push(point);
    index.set(key, point);
  }

  const keyOf = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

  deals.forEach((deal) => {
    const created = toDate(deal.createdAt);
    if (created) {
      const point = index.get(keyOf(created));
      if (point) point.created += deal.value || 0;
    }
    const closed = toDate(deal.closedAt);
    if (closed) {
      const point = index.get(keyOf(closed));
      if (point) {
        if (deal.status === "won") point.won += deal.value || 0;
        if (deal.status === "lost") point.lost += deal.value || 0;
      }
    }
  });

  return buckets;
}

export interface StagePoint {
  stage: string;
  color: string;
  count: number;
  value: number;
}

export function stageBreakdown(
  deals: Deal[],
  stages: { id: string; name: string; color: string }[],
): StagePoint[] {
  return stages.map((stage) => {
    const inStage = openDeals(deals).filter((deal) => deal.stageId === stage.id);
    return {
      stage: stage.name,
      color: stage.color,
      count: inStage.length,
      value: sum(inStage.map((deal) => deal.value)),
    };
  });
}

export interface SourcePoint {
  source: string;
  leads: number;
  converted: number;
}

export function sourceBreakdown(leads: Lead[]): SourcePoint[] {
  const map = new Map<string, SourcePoint>();
  leads.forEach((lead) => {
    const label = (lead.source ?? "other").replace(/_/g, " ");
    const point = map.get(label) ?? { source: label, leads: 0, converted: 0 };
    point.leads += 1;
    if (lead.status === "converted") point.converted += 1;
    map.set(label, point);
  });
  return [...map.values()].sort((a, b) => b.leads - a.leads);
}

export interface LeaderboardRow {
  id: string;
  name: string;
  openValue: number;
  wonValue: number;
  wonCount: number;
  openCount: number;
  tasksOpen: number;
}

export function leaderboard(members: Member[], deals: Deal[], tasks: Task[]): LeaderboardRow[] {
  return members
    .map((member) => {
      const mine = deals.filter((deal) => deal.ownerId === member.id);
      return {
        id: member.id,
        name: member.name,
        openValue: sum(openDeals(mine).map((deal) => deal.value)),
        openCount: openDeals(mine).length,
        wonValue: sum(wonDeals(mine).map((deal) => deal.value)),
        wonCount: wonDeals(mine).length,
        tasksOpen: tasks.filter((task) => task.assigneeId === member.id && !task.completed).length,
      };
    })
    .sort((a, b) => b.wonValue - a.wonValue || b.openValue - a.openValue);
}

export function thisMonth(deals: Deal[]): Deal[] {
  const now = new Date();
  return deals.filter((deal) => {
    const closed = toDate(deal.closedAt);
    return closed ? closed.getMonth() === now.getMonth() && closed.getFullYear() === now.getFullYear() : false;
  });
}
