"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, ErrorPanel, LoadingPanel } from "@/components/ui/Primitives";
import { Logo } from "@/components/marketing/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { acceptInvitation, listPendingInvitationsForEmail } from "@/lib/db/orgs";
import { ROLE_LABELS } from "@/lib/roles";
import { errorMessage, formatDate } from "@/lib/format";
import type { Invitation } from "@/lib/types";

export default function JoinPage() {
  const router = useRouter();
  const toast = useToast();
  const { configured, status, user, switchOrg } = useAuth();
  const [invites, setInvites] = useState<Invitation[] | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    listPendingInvitationsForEmail(user.email)
      .then(setInvites)
      .catch((err) => {
        setError(errorMessage(err));
        setInvites([]);
      });
  }, [user?.email]);

  if (!configured) return <SetupNotice />;

  if (status === "loading") {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-24">
        <LoadingPanel label="Checking your invitations" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-20">
        <Logo />
        <h1 className="mt-10 text-2xl font-semibold text-white">Accept your invitation</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in with the email address the invitation was sent to, and it will appear here.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  const join = async (invitation: Invitation) => {
    setError(null);
    setPending(invitation.id);
    try {
      const orgId = await acceptInvitation(invitation, user!);
      switchOrg(orgId);
      toast.success(`You joined ${invitation.orgName}.`);
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-20">
      <Logo />
      <h1 className="mt-10 text-2xl font-semibold tracking-tight text-white">Your invitations</h1>
      <p className="mt-2 text-sm text-slate-400">Invitations sent to {user?.email}.</p>

      {error ? <div className="mt-6"><ErrorPanel message={error} /></div> : null}

      <div className="mt-8">
        {invites === null ? (
          <LoadingPanel label="Loading invitations" />
        ) : invites.length === 0 ? (
          <EmptyState
            icon={<Mail className="size-5" />}
            title="No pending invitations"
            message="Ask a workspace admin to invite this email address, or create a workspace of your own."
            action={
              <Link
                href="/onboarding"
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
              >
                Create a workspace
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {invites.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div>
                  <p className="text-sm font-medium text-white">{invitation.orgName}</p>
                  <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <Badge tone="indigo">{ROLE_LABELS[invitation.role]}</Badge>
                    Invited by {invitation.invitedByName} on {formatDate(invitation.createdAt)}
                  </p>
                </div>
                <Button loading={pending === invitation.id} onClick={() => join(invitation)}>
                  Accept and join
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
