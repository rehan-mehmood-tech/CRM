"use client";

import { useMemo, useState } from "react";
import { Activity as ActivityIcon, MessageSquarePlus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Card, EmptyState, LoadingPanel } from "@/components/ui/Primitives";
import { LogActivityModal } from "@/components/forms/LogActivityModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { can } from "@/lib/roles";
import { titleCase } from "@/lib/format";
import type { ActivityType } from "@/lib/types";

const TYPES: ActivityType[] = [
  "note",
  "call",
  "email",
  "meeting",
  "stage_change",
  "created",
  "updated",
  "deleted",
  "won",
  "lost",
  "converted",
  "task_completed",
];

export default function ActivityPage() {
  const { role, members } = useAuth();
  const { activities, loading } = useData();
  const [type, setType] = useState<"all" | ActivityType>("all");
  const [actorId, setActorId] = useState("all");
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return activities.filter((activity) => {
      if (type !== "all" && activity.type !== type) return false;
      if (actorId !== "all" && activity.actorId !== actorId) return false;
      if (!needle) return true;
      return [activity.summary, activity.body, activity.relatedName, activity.actorName]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [activities, type, actorId, term]);

  return (
    <>
      <PageHeader
        title="Activity"
        description="Every create, update, stage change and logged conversation in this workspace."
        actions={
          can(role, "records:create") ? (
            <Button icon={<MessageSquarePlus className="size-4" />} onClick={() => setOpen(true)}>
              Log activity
            </Button>
          ) : null
        }
      />

      <Card className="mb-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search the timeline"
          />
          <Select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            <option value="all">All activity types</option>
            {TYPES.map((item) => (
              <option key={item} value={item}>
                {titleCase(item)}
              </option>
            ))}
          </Select>
          <Select value={actorId} onChange={(event) => setActorId(event.target.value)}>
            <option value="all">Everyone</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {loading ? (
        <LoadingPanel label="Loading activity" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<ActivityIcon className="size-5" />}
          title={activities.length ? "No activity matches these filters" : "No activity yet"}
          message={
            activities.length
              ? "Try another type, person or search term."
              : "As soon as your team creates records or logs calls, the timeline fills in here."
          }
        />
      ) : (
        <Card>
          <ActivityFeed activities={rows} />
          {activities.length >= 200 ? (
            <p className="mt-4 border-t border-white/5 pt-3 text-xs text-slate-500">
              Showing the 200 most recent entries.
            </p>
          ) : null}
        </Card>
      )}

      <LogActivityModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
