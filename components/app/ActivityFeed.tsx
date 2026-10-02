"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  FileEdit,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Trash2,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui/Primitives";
import { relativeTime } from "@/lib/format";
import type { Activity, ActivityType } from "@/lib/types";

const ICONS: Record<ActivityType, typeof Plus> = {
  note: MessageSquare,
  call: Phone,
  email: Mail,
  meeting: Users,
  stage_change: TrendingUp,
  created: Plus,
  updated: FileEdit,
  deleted: Trash2,
  won: Trophy,
  lost: XCircle,
  converted: ArrowRightLeft,
  task_completed: CheckCircle2,
};

const TONES: Partial<Record<ActivityType, string>> = {
  won: "text-emerald-300",
  lost: "text-rose-300",
  deleted: "text-rose-300",
  converted: "text-violet-300",
  task_completed: "text-emerald-300",
};

export function ActivityFeed({ activities, limit }: { activities: Activity[]; limit?: number }) {
  const rows = typeof limit === "number" ? activities.slice(0, limit) : activities;

  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Nothing has happened in this workspace yet. Activity appears here as your team works.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/5">
      {rows.map((activity) => {
        const Icon = ICONS[activity.type] ?? FileEdit;
        return (
          <li key={activity.id} className="flex items-start gap-3 py-3">
            <span className="mt-0.5">
              <Avatar name={activity.actorName} size={28} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-200">
                <span className="font-medium text-white">{activity.actorName}</span> {activity.summary}
              </p>
              {activity.body ? (
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-400">{activity.body}</p>
              ) : null}
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                <Icon className={`size-3 ${TONES[activity.type] ?? "text-slate-500"}`} />
                {relativeTime(activity.createdAt)}
                {activity.relatedName ? ` · ${activity.relatedName}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
