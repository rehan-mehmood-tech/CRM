"use client";

import { useEffect, useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { ActivityFeed } from "./ActivityFeed";
import { Button } from "@/components/ui/Button";
import { Card, SectionHeader, Spinner } from "@/components/ui/Primitives";
import { LogActivityModal } from "@/components/forms/LogActivityModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { subscribeRecordActivities } from "@/lib/db/activities";
import { can } from "@/lib/roles";
import type { Activity, RelatedType } from "@/lib/types";

/** Live timeline for one record, with a button to log something new against it. */
export function RecordTimeline({
  relatedType,
  relatedId,
  relatedName,
}: {
  relatedType: RelatedType;
  relatedId: string;
  relatedName: string;
}) {
  const { orgId, role } = useAuth();
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    setActivities(null);
    return subscribeRecordActivities(
      orgId,
      relatedType,
      relatedId,
      setActivities,
      () => setActivities([]),
    );
  }, [orgId, relatedType, relatedId]);

  return (
    <Card>
      <SectionHeader
        title="Timeline"
        subtitle="Everything logged against this record."
        actions={
          can(role, "records:create") ? (
            <Button
              size="sm"
              variant="secondary"
              icon={<MessageSquarePlus className="size-3.5" />}
              onClick={() => setOpen(true)}
            >
              Log activity
            </Button>
          ) : null
        }
      />
      <div className="mt-3">
        {activities === null ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <ActivityFeed activities={activities} />
        )}
      </div>
      <LogActivityModal
        open={open}
        onClose={() => setOpen(false)}
        preset={{ relatedType, relatedId, relatedName }}
      />
    </Card>
  );
}
