"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, LogOut, Mail } from "lucide-react";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Field";
import { Badge, ErrorPanel, LoadingPanel } from "@/components/ui/Primitives";
import { Logo } from "@/components/marketing/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { acceptInvitation, createOrganization, listPendingInvitationsForEmail } from "@/lib/db/orgs";
import { INDUSTRIES } from "@/lib/db/companies";
import { PLANS, ROLE_LABELS } from "@/lib/roles";
import { errorMessage } from "@/lib/format";
import type { Invitation, PlanId } from "@/lib/types";

const CURRENCIES = ["USD", "EUR", "GBP", "PKR", "AED", "INR", "CAD", "AUD"];

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const { configured, status, user, profile, signOut, switchOrg } = useAuth();

  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [plan, setPlan] = useState<PlanId>("growth");
  const [invites, setInvites] = useState<Invitation[] | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    const plans = PLANS.map((item) => item.id);
    const fromQuery = new URLSearchParams(window.location.search).get("plan");
    if (fromQuery && plans.includes(fromQuery as PlanId)) setPlan(fromQuery as PlanId);
  }, []);

  // Pending invitations addressed to this email let the user join instead of creating a workspace.
  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;
    listPendingInvitationsForEmail(user.email)
      .then((rows) => {
        if (!cancelled) setInvites(rows);
      })
      .catch(() => {
        if (!cancelled) setInvites([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  if (!configured) return <SetupNotice />;
  if (status === "loading" || !user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-24">
        <LoadingPanel label="Loading your account" />
      </div>
    );
  }

  const createWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give your workspace a name.");
      return;
    }
    setPending(true);
    try {
      const orgId = await createOrganization(user, {
        name: name.trim(),
        website: website.trim() || null,
        industry: industry || null,
        currency,
        plan,
      });
      switchOrg(orgId);
      toast.success("Workspace created. Welcome aboard.");
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const join = async (invitation: Invitation) => {
    setError(null);
    setPending(true);
    try {
      const orgId = await acceptInvitation(invitation, user);
      switchOrg(orgId);
      toast.success(`You joined ${invitation.orgName}.`);
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const hasWorkspaces = (profile?.orgIds?.length ?? 0) > 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-20">
      <div className="flex items-center justify-between">
        <Logo />
        <Button variant="ghost" size="sm" icon={<LogOut className="size-4" />} onClick={signOut}>
          Sign out
        </Button>
      </div>

      <div className="mt-10">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {hasWorkspaces ? "Add another workspace" : "Set up your agency workspace"}
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Signed in as {user.email}. A workspace holds your pipeline, your records and your team.
        </p>
      </div>

      {error ? <div className="mt-6"><ErrorPanel message={error} /></div> : null}

      {invites === null ? null : invites.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-indigo-400/30 bg-indigo-500/5 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Mail className="size-4 text-indigo-300" />
            You have {invites.length} pending invitation{invites.length > 1 ? "s" : ""}
          </h2>
          <ul className="mt-4 space-y-2.5">
            {invites.map((invitation) => (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-white">{invitation.orgName}</p>
                  <p className="text-xs text-slate-400">
                    Invited by {invitation.invitedByName} as{" "}
                    <Badge tone="indigo">{ROLE_LABELS[invitation.role]}</Badge>
                  </p>
                </div>
                <Button size="sm" loading={pending} onClick={() => join(invitation)}>
                  Accept and join
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form onSubmit={createWorkspace} className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Building2 className="size-4 text-indigo-300" />
          Create a workspace
        </h2>

        <Field label="Workspace name" required hint="Usually your agency name.">
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rehan Media Agency" required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website">
            <Input
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://agency.com"
            />
          </Field>
          <Field label="Industry">
            <Select value={industry} onChange={(event) => setIndustry(event.target.value)}>
              <option value="">Select an industry</option>
              {INDUSTRIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency" hint="Used for deal values and reports.">
            <Select value={currency} onChange={(event) => setCurrency(event.target.value)}>
              {CURRENCIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Plan" hint="Changeable later from billing.">
            <Select value={plan} onChange={(event) => setPlan(event.target.value as PlanId)}>
              {PLANS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — ${item.priceMonthly}/mo, {item.seats} seats
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={pending} icon={<ArrowRight className="size-4" />}>
          Create workspace
        </Button>
      </form>

      {hasWorkspaces ? (
        <p className="mt-6 text-center text-sm text-slate-400">
          <Link href="/dashboard" className="text-indigo-300 hover:text-indigo-200">
            Back to your current workspace
          </Link>
        </p>
      ) : null}
    </div>
  );
}
