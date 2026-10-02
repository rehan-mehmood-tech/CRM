"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Card, ErrorPanel, SectionHeader } from "@/components/ui/Primitives";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { deleteOrganization, updateOrganization } from "@/lib/db/orgs";
import { INDUSTRIES } from "@/lib/db/companies";
import { can, planById } from "@/lib/roles";
import { errorMessage, formatDate } from "@/lib/format";

const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "INR", "CAD", "AUD"];

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { org, orgId, role, signOut, members } = useAuth();
  const toast = useToast();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = can(role, "org:manage");
  const canDelete = can(role, "org:delete");

  useEffect(() => {
    if (!org) return;
    setName(org.name);
    setWebsite(org.website ?? "");
    setIndustry(org.industry ?? "");
    setCurrency(org.currency ?? "USD");
  }, [org]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId) return;
    if (!name.trim()) {
      setError("The workspace needs a name.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await updateOrganization(orgId, {
        name: name.trim(),
        website: website.trim() || null,
        industry: industry || null,
        currency,
      });
      toast.success("Workspace updated.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const destroy = async () => {
    if (!orgId || !org) return;
    setDeleting(true);
    try {
      await deleteOrganization(orgId);
      toast.success("Workspace deleted.");
      setDeleteOpen(false);
      await signOut();
      router.replace("/");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const plan = planById(org?.plan);

  return (
    <div className="space-y-5">
      <Card>
        <SectionHeader
          title="Workspace details"
          subtitle="The name and currency used across records, reports and invoices."
        />
        <form onSubmit={save} className="mt-5 space-y-4">
          {error ? <ErrorPanel message={error} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Workspace name" required>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={!canManage}
                required
              />
            </Field>
            <Field label="Website">
              <Input
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                disabled={!canManage}
                placeholder="https://agency.com"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <Select
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
                disabled={!canManage}
              >
                <option value="">Not set</option>
                {INDUSTRIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Currency" hint="Changes how every deal value is displayed.">
              <Select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                disabled={!canManage}
              >
                {CURRENCIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {canManage ? (
            <Button type="submit" loading={pending} icon={<Save className="size-4" />}>
              Save changes
            </Button>
          ) : (
            <p className="text-xs text-slate-500">Your role can view these settings but not change them.</p>
          )}
        </form>
      </Card>

      <Card>
        <SectionHeader title="Workspace facts" />
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Plan", value: `${plan.name} (${org?.planStatus ?? "unknown"})` },
            { label: "Members", value: String(members.length) },
            { label: "Created", value: formatDate(org?.createdAt) },
            { label: "Workspace id", value: orgId ?? "—" },
          ].map((row) => (
            <div key={row.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <dt className="text-[11px] uppercase tracking-wide text-slate-500">{row.label}</dt>
              <dd className="mt-1 truncate text-sm text-white" title={row.value}>
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {canDelete ? (
        <Card className="border-rose-500/30 bg-rose-500/[0.04]">
          <SectionHeader
            title="Delete this workspace"
            subtitle="Removes the workspace and every lead, contact, company, deal, task and activity inside it."
          />
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-300" />
            <p>This cannot be undone, and it affects every member of the workspace.</p>
          </div>
          <Button
            variant="danger"
            className="mt-4"
            icon={<Trash2 className="size-4" />}
            onClick={() => {
              setConfirmText("");
              setDeleteOpen(true);
            }}
          >
            Delete workspace
          </Button>
        </Card>
      ) : null}

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete workspace permanently"
        description="Type the workspace name to confirm."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting}
              disabled={confirmText !== org?.name}
              onClick={destroy}
            >
              Delete everything
            </Button>
          </>
        }
      >
        <Field label={`Type "${org?.name}" to confirm`}>
          <Input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} />
        </Field>
      </Modal>
    </div>
  );
}
