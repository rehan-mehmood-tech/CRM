"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  Copy,
  Crown,
  Mail,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import {
  Avatar,
  Badge,
  Card,
  EmptyState,
  ErrorPanel,
  SectionHeader,
  StatCard,
  Table,
  Td,
  Th,
  Tr,
} from "@/components/ui/Primitives";
import { Dropdown } from "@/components/ui/Dropdown";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import {
  createInvitation,
  removeMember,
  revokeInvitation,
  setMemberStatus,
  subscribeInvitations,
  transferOwnership,
  updateMemberRole,
} from "@/lib/db/orgs";
import { ASSIGNABLE_ROLES, ROLES, ROLE_LABELS, can, planById } from "@/lib/roles";
import { errorMessage, formatDate, relativeTime } from "@/lib/format";
import type { Invitation, Member, Role } from "@/lib/types";

export default function TeamPage() {
  const { orgId, org, actor, role, user, members } = useAuth();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();

  const [invites, setInvites] = useState<Invitation[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("sales_rep");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManage = can(role, "team:manage");
  const isOwner = role === "owner";
  const plan = planById(org?.plan);
  const pendingInvites = invites.filter((invite) => invite.status === "pending");
  const seatsUsed = members.length + pendingInvites.length;
  const seatsLeft = Math.max(0, plan.seats - seatsUsed);

  useEffect(() => {
    if (!orgId) return;
    return subscribeInvitations(orgId, setInvites, () => setInvites([]));
  }, [orgId]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!orgId || !org || !actor) return;
    if (seatsLeft <= 0) {
      setError(`Your ${plan.name} plan allows ${plan.seats} seats. Upgrade to invite more teammates.`);
      return;
    }
    if (members.some((member) => member.email.toLowerCase() === email.trim().toLowerCase())) {
      setError("That person is already a member of this workspace.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await createInvitation(orgId, org.name, actor, { email, role: inviteRole });
      toast.success(`Invitation created for ${email.trim().toLowerCase()}.`);
      setEmail("");
      setInviteOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const changeRole = async (member: Member, next: Role) => {
    if (!orgId || !actor) return;
    try {
      await updateMemberRole(orgId, member.id, next, actor);
      toast.success(`${member.name} is now ${ROLE_LABELS[next].toLowerCase()}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const suspend = async (member: Member) => {
    if (!orgId || !actor) return;
    const next = member.status === "disabled" ? "active" : "disabled";
    const ok = await confirm({
      title: next === "disabled" ? "Suspend this teammate?" : "Restore access?",
      message:
        next === "disabled"
          ? `${member.name} will be signed out of this workspace until you restore their access.`
          : `${member.name} will be able to use this workspace again.`,
      confirmLabel: next === "disabled" ? "Suspend" : "Restore",
      tone: next === "disabled" ? "danger" : "primary",
    });
    if (!ok) return;
    try {
      await setMemberStatus(orgId, member.id, next, actor);
      toast.success(next === "disabled" ? "Access suspended." : "Access restored.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const remove = async (member: Member) => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Remove this teammate?",
      message: `${member.name} loses access to ${org?.name}. Records they created stay in the workspace.`,
      confirmLabel: "Remove from workspace",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await removeMember(orgId, member.id, actor);
      toast.success(`${member.name} removed.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handOver = async (member: Member) => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Transfer ownership?",
      message: `${member.name} becomes the owner of ${org?.name}, and you become an admin. Only the owner can manage billing or delete the workspace.`,
      confirmLabel: "Transfer ownership",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await transferOwnership(orgId, member.id, actor);
      toast.success(`${member.name} is now the owner.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const revoke = async (invitation: Invitation) => {
    if (!orgId || !actor) return;
    try {
      await revokeInvitation(invitation.id, orgId, actor);
      toast.success("Invitation revoked.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/join`);
      toast.success("Invite link copied. Your teammate signs in with the invited email to accept.");
    } catch {
      toast.error("Could not copy the link. Share this path manually: /join");
    }
  };

  return (
    <>
      <PageHeader
        title="Team"
        description="Who can get into this workspace, and what each of them is allowed to do."
        actions={
          canManage ? (
            <>
              <Button variant="secondary" icon={<Copy className="size-4" />} onClick={copyLink}>
                Copy invite link
              </Button>
              <Button icon={<UserPlus className="size-4" />} onClick={() => setInviteOpen(true)}>
                Invite teammate
              </Button>
            </>
          ) : null
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Members" value={String(members.length)} icon={<Users className="size-5" />} />
          <StatCard label="Pending invitations" value={String(pendingInvites.length)} tone="amber" />
          <StatCard
            label="Seats left"
            value={String(seatsLeft)}
            sub={`${plan.name} plan allows ${plan.seats}`}
            tone={seatsLeft === 0 ? "rose" : "green"}
          />
        </div>
      </PageHeader>

      <Card className="mb-5 p-5">
        <SectionHeader title="Members" subtitle="Roles take effect immediately, in the app and in Firestore." />
        <div className="mt-4">
          <Table>
            <thead>
              <tr>
                <Th>Teammate</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isMe = member.id === user?.uid;
                const memberIsOwner = member.role === "owner";
                return (
                  <Tr key={member.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} src={member.photoUrl} size={34} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {member.name}
                            {isMe ? <span className="ml-2 text-xs text-slate-500">(you)</span> : null}
                          </p>
                          <p className="truncate text-xs text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      {canManage && !memberIsOwner && !isMe ? (
                        <Select
                          value={member.role}
                          onChange={(event) => changeRole(member, event.target.value as Role)}
                          className="h-8 py-1 text-xs"
                        >
                          {ASSIGNABLE_ROLES.map((item) => (
                            <option key={item} value={item}>
                              {ROLE_LABELS[item]}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge tone={memberIsOwner ? "violet" : "indigo"}>
                          {memberIsOwner ? <Crown className="size-3" /> : <ShieldCheck className="size-3" />}
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={member.status === "active" ? "green" : "rose"}>{member.status}</Badge>
                    </Td>
                    <Td className="text-xs text-slate-500">{formatDate(member.joinedAt)}</Td>
                    <Td>
                      <Dropdown
                        items={[
                          {
                            label: "Transfer ownership",
                            icon: <Crown className="size-4" />,
                            disabled: !isOwner || isMe || memberIsOwner,
                            onSelect: () => handOver(member),
                          },
                          {
                            label: member.status === "disabled" ? "Restore access" : "Suspend access",
                            icon: <Ban className="size-4" />,
                            disabled: !canManage || isMe || memberIsOwner,
                            onSelect: () => suspend(member),
                          },
                          {
                            label: "Remove from workspace",
                            icon: <Trash2 className="size-4" />,
                            tone: "danger",
                            disabled: !canManage || isMe || memberIsOwner,
                            onSelect: () => remove(member),
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      </Card>

      <Card className="mb-5 p-5">
        <SectionHeader
          title="Invitations"
          subtitle="A teammate accepts by signing in with the invited email address and opening /join."
        />
        <div className="mt-4">
          {invites.length === 0 ? (
            <EmptyState
              icon={<Mail className="size-5" />}
              title="No invitations yet"
              message="Invite a teammate and their pending invitation shows up here until they accept."
              action={
                canManage ? (
                  <Button icon={<UserPlus className="size-4" />} onClick={() => setInviteOpen(true)}>
                    Invite teammate
                  </Button>
                ) : null
              }
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {invites.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{invitation.email}</p>
                    <p className="text-xs text-slate-500">
                      {ROLE_LABELS[invitation.role]} · invited by {invitation.invitedByName} ·{" "}
                      {relativeTime(invitation.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={
                        invitation.status === "pending"
                          ? "amber"
                          : invitation.status === "accepted"
                            ? "green"
                            : "neutral"
                      }
                    >
                      {invitation.status}
                    </Badge>
                    {canManage && invitation.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<X className="size-3.5" />}
                        onClick={() => revoke(invitation)}
                      >
                        Revoke
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <SectionHeader title="What each role can do" />
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {ROLES.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <Badge tone={item.id === "owner" ? "violet" : "indigo"}>{item.label}</Badge>
              <p className="mt-2 text-sm text-slate-400">{item.description}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a teammate"
        description="They join this workspace with the role you pick here."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button form="invite-form" type="submit" loading={pending}>
              Send invitation
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={invite} className="space-y-4">
          {error ? <ErrorPanel message={error} /> : null}
          <Field label="Email address" required hint="They must sign in with this exact address to accept.">
            <Input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@agency.com"
            />
          </Field>
          <Field label="Role">
            <Select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as Role)}>
              {ASSIGNABLE_ROLES.map((item) => (
                <option key={item} value={item}>
                  {ROLE_LABELS[item]}
                </option>
              ))}
            </Select>
          </Field>
          <p className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs leading-relaxed text-slate-400">
            {ROLES.find((item) => item.id === inviteRole)?.description}
          </p>
          <p className="text-xs text-slate-500">
            {seatsLeft} of {plan.seats} seats available on the {plan.name} plan.
          </p>
        </form>
      </Modal>

      {dialog}
    </>
  );
}
