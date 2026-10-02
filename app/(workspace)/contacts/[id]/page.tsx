"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Columns3,
  Linkedin,
  ListChecks,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { RecordTimeline } from "@/components/app/RecordTimeline";
import { Button } from "@/components/ui/Button";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  LoadingPanel,
  SectionHeader,
} from "@/components/ui/Primitives";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { ContactForm } from "@/components/forms/ContactForm";
import { TaskForm } from "@/components/forms/TaskForm";
import { DealForm } from "@/components/forms/DealForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { contactName, deleteContact } from "@/lib/db/contacts";
import { toggleTask } from "@/lib/db/tasks";
import { can } from "@/lib/roles";
import { errorMessage, formatCurrency, formatDate, isOverdue } from "@/lib/format";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { orgId, actor, role, org } = useAuth();
  const { contacts, deals, tasks, loading } = useData();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [dealOpen, setDealOpen] = useState(false);

  const contact = contacts.find((item) => item.id === id) ?? null;
  const currency = org?.currency ?? "USD";
  const canUpdate = can(role, "records:update");
  const canDelete = can(role, "records:delete");
  const canCreate = can(role, "records:create");

  if (loading) return <LoadingPanel label="Loading contact" />;

  if (!contact) {
    return (
      <EmptyState
        title="Contact not found"
        message="This contact may have been deleted, or it belongs to another workspace."
        action={
          <Button variant="secondary" onClick={() => router.push("/contacts")}>
            Back to contacts
          </Button>
        }
      />
    );
  }

  const name = contactName(contact);
  const relatedDeals = deals.filter((deal) => deal.contactId === contact.id);
  const relatedTasks = tasks.filter(
    (task) => task.relatedType === "contact" && task.relatedId === contact.id,
  );

  const remove = async () => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Delete this contact?",
      message: `${name} will be removed permanently.`,
      confirmLabel: "Delete contact",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await deleteContact(orgId, actor, contact);
      toast.success("Contact deleted.");
      router.push("/contacts");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const complete = async (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || !orgId || !actor) return;
    try {
      await toggleTask(orgId, actor, task);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <>
      <Link
        href="/contacts"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        All contacts
      </Link>

      <PageHeader
        title={name}
        description={[contact.title, contact.companyName].filter(Boolean).join(" · ") || undefined}
        actions={
          <>
            {canCreate ? (
              <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => setDealOpen(true)}>
                New deal
              </Button>
            ) : null}
            {canUpdate ? (
              <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={remove}>
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-4">
              <Avatar name={name} size={56} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-white">{name}</p>
                <Badge tone={contact.status === "active" ? "green" : "neutral"} className="mt-1">
                  {contact.status}
                </Badge>
              </div>
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              {contact.email ? (
                <Row icon={<Mail className="size-4" />} label="Email">
                  <a href={`mailto:${contact.email}`} className="text-indigo-300 hover:text-indigo-200">
                    {contact.email}
                  </a>
                </Row>
              ) : null}
              {contact.phone ? (
                <Row icon={<Phone className="size-4" />} label="Phone">
                  <a href={`tel:${contact.phone}`} className="text-indigo-300 hover:text-indigo-200">
                    {contact.phone}
                  </a>
                </Row>
              ) : null}
              {contact.companyId ? (
                <Row icon={<Building2 className="size-4" />} label="Company">
                  <Link
                    href={`/companies/${contact.companyId}`}
                    className="text-indigo-300 hover:text-indigo-200"
                  >
                    {contact.companyName}
                  </Link>
                </Row>
              ) : null}
              {contact.linkedin ? (
                <Row icon={<Linkedin className="size-4" />} label="LinkedIn">
                  <span className="break-all">{contact.linkedin}</span>
                </Row>
              ) : null}
              {contact.city || contact.country || contact.address ? (
                <Row icon={<MapPin className="size-4" />} label="Location">
                  {[contact.address, contact.city, contact.country].filter(Boolean).join(", ")}
                </Row>
              ) : null}
            </dl>

            <div className="mt-5 space-y-2 border-t border-white/5 pt-4 text-xs text-slate-500">
              <p>Owner: {contact.ownerName ?? "Unassigned"}</p>
              <p>Source: {contact.source ? contact.source.replace(/_/g, " ") : "Unknown"}</p>
              <p>Added {formatDate(contact.createdAt)}</p>
            </div>

            {contact.tags.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {contact.tags.map((tag) => (
                  <Badge key={tag} tone="indigo">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Card>

          {contact.notes ? (
            <Card>
              <SectionHeader title="Notes" />
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                {contact.notes}
              </p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionHeader
              title="Deals"
              subtitle={`${relatedDeals.length} deal${relatedDeals.length === 1 ? "" : "s"} linked to this contact`}
            />
            {relatedDeals.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No deals yet for this contact.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-white/5">
                {relatedDeals.map((deal) => (
                  <li key={deal.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-white">{deal.title}</p>
                      <p className="text-xs text-slate-500">
                        {deal.companyName ?? "No company"} · {formatCurrency(deal.value, deal.currency)}
                      </p>
                    </div>
                    <Badge
                      tone={deal.status === "won" ? "green" : deal.status === "lost" ? "rose" : "indigo"}
                    >
                      {deal.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/deals" className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-300">
              <Columns3 className="size-3.5" />
              Open the pipeline
            </Link>
          </Card>

          <Card>
            <SectionHeader
              title="Tasks"
              subtitle={`${relatedTasks.filter((task) => !task.completed).length} open`}
              actions={
                canCreate ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Plus className="size-3.5" />}
                    onClick={() => setTaskOpen(true)}
                  >
                    Add task
                  </Button>
                ) : null
              }
            />
            {relatedTasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                <ListChecks className="mx-auto mb-2 size-5 text-slate-600" />
                Nothing scheduled with this contact.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-white/5">
                {relatedTasks.map((task) => (
                  <li key={task.id} className="flex items-start gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => complete(task.id)}
                      className="mt-1 size-4 accent-indigo-500"
                      aria-label={`Toggle ${task.title}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm ${task.completed ? "text-slate-500 line-through" : "text-white"}`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        <CalendarClock className="mr-1 inline size-3" />
                        <span className={isOverdue(task.dueDate, task.completed) ? "text-rose-300" : ""}>
                          {task.dueDate ?? "No due date"}
                        </span>
                        {task.assigneeName ? ` · ${task.assigneeName}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <RecordTimeline relatedType="contact" relatedId={contact.id} relatedName={name} />
        </div>
      </div>

      <ContactForm open={editOpen} onClose={() => setEditOpen(false)} contact={contact} />
      <TaskForm
        open={taskOpen}
        onClose={() => setTaskOpen(false)}
        task={null}
        preset={{ relatedType: "contact", relatedId: contact.id, relatedName: name }}
      />
      <DealForm open={dealOpen} onClose={() => setDealOpen(false)} deal={null} />
      {dialog}
    </>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-500">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
        <dd className="text-sm text-slate-200">{children}</dd>
      </div>
    </div>
  );
}
