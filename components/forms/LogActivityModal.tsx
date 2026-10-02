"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { RelatedSelect } from "./shared";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { logActivity } from "@/lib/db/activities";
import { errorMessage } from "@/lib/format";
import type { ActivityType, RelatedType } from "@/lib/types";

const LOGGABLE: { id: ActivityType; label: string }[] = [
  { id: "note", label: "Note" },
  { id: "call", label: "Call" },
  { id: "email", label: "Email" },
  { id: "meeting", label: "Meeting" },
];

export function LogActivityModal({
  open,
  onClose,
  preset,
}: {
  open: boolean;
  onClose: () => void;
  preset?: { relatedType: RelatedType; relatedId: string; relatedName: string } | null;
}) {
  const { orgId, actor } = useAuth();
  const toast = useToast();
  const [type, setType] = useState<ActivityType>("note");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [related, setRelated] = useState<{
    type: RelatedType | null;
    id: string | null;
    name: string | null;
  }>({ type: null, id: null, name: null });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setType("note");
    setSummary("");
    setBody("");
    setError(null);
    setRelated({
      type: preset?.relatedType ?? null,
      id: preset?.relatedId ?? null,
      name: preset?.relatedName ?? null,
    });
  }, [open, preset]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId || !actor) return;
    if (!summary.trim()) {
      setError("Write a short summary of what happened.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await logActivity(orgId, actor, {
        type,
        summary: summary.trim(),
        body: body.trim() || null,
        relatedType: related.type,
        relatedId: related.id,
        relatedName: related.name,
      });
      toast.success("Activity logged.");
      onClose();
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
      title="Log activity"
      description="Record a call, an email, a meeting or a note on the timeline."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button form="activity-form" type="submit" loading={pending}>
            Log it
          </Button>
        </>
      }
    >
      <form id="activity-form" onSubmit={submit} className="space-y-4">
        {error ? <ErrorPanel message={error} /> : null}

        <Field label="Type">
          <Select value={type} onChange={(event) => setType(event.target.value as ActivityType)}>
            {LOGGABLE.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Summary" required>
          <Input
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Discovery call — agreed on scope"
            required
          />
        </Field>

        <Field label="Linked record">
          <RelatedSelect
            type={related.type}
            id={related.id}
            onChange={(type, id, name) => setRelated({ type, id, name })}
          />
        </Field>

        <Field label="Details">
          <Textarea rows={4} value={body} onChange={(event) => setBody(event.target.value)} />
        </Field>
      </form>
    </Modal>
  );
}
