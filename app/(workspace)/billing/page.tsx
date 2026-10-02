"use client";

import { useState } from "react";
import clsx from "clsx";
import { AlertTriangle, Check, CreditCard, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Badge,
  Card,
  ErrorPanel,
  ProgressBar,
  SectionHeader,
  StatCard,
} from "@/components/ui/Primitives";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { cancelPlan, changePlan } from "@/lib/db/orgs";
import { PLANS, can, planById } from "@/lib/roles";
import { errorMessage, formatDate, formatNumber } from "@/lib/format";
import type { PlanId } from "@/lib/types";

export default function BillingPage() {
  const { org, orgId, actor, role, members } = useAuth();
  const { contacts, leads, deals } = useData();
  const toast = useToast();
  const { confirm, dialog } = useConfirm();
  const [pending, setPending] = useState<PlanId | "cancel" | null>(null);

  const canManage = can(role, "billing:manage");
  const current = planById(org?.plan);
  const seatsUsed = members.length;
  const contactsUsed = contacts.length;

  if (!canManage) {
    return (
      <>
        <PageHeader title="Billing" description="Only the workspace owner can manage the subscription." />
        <ErrorPanel message="Your role does not include billing access. Ask the workspace owner to change the plan." />
      </>
    );
  }

  const switchTo = async (planId: PlanId) => {
    if (!orgId || !actor) return;
    const plan = planById(planId);
    if (plan.seats < seatsUsed) {
      toast.error(
        `The ${plan.name} plan allows ${plan.seats} seats and this workspace has ${seatsUsed} members. Remove members first.`,
      );
      return;
    }
    const ok = await confirm({
      title: `Switch to the ${plan.name} plan?`,
      message: `Your workspace moves to ${plan.name} at $${plan.priceMonthly} per month, with ${plan.seats} seats and ${formatNumber(plan.contactLimit)} contacts.`,
      confirmLabel: `Switch to ${plan.name}`,
    });
    if (!ok) return;
    setPending(planId);
    try {
      await changePlan(orgId, planId, actor);
      toast.success(`You are now on the ${plan.name} plan.`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(null);
    }
  };

  const cancel = async () => {
    if (!orgId || !actor) return;
    const ok = await confirm({
      title: "Cancel the subscription?",
      message:
        "Your records stay exactly where they are. The workspace is marked cancelled and you can reactivate by picking a plan again.",
      confirmLabel: "Cancel subscription",
      tone: "danger",
    });
    if (!ok) return;
    setPending("cancel");
    try {
      await cancelPlan(orgId, actor);
      toast.success("Subscription cancelled.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setPending(null);
    }
  };

  const seatPercent = (seatsUsed / current.seats) * 100;
  const contactPercent = (contactsUsed / current.contactLimit) * 100;

  return (
    <>
      <PageHeader
        title="Billing"
        description="Your plan, your usage against its limits, and how to change it."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Current plan"
            value={current.name}
            sub={`$${current.priceMonthly} per month`}
            icon={<CreditCard className="size-5" />}
          />
          <StatCard
            label="Status"
            value={org?.planStatus === "trialing" ? "Trial" : org?.planStatus === "active" ? "Active" : "Cancelled"}
            sub={org ? `Since ${formatDate(org.createdAt)}` : undefined}
            tone={org?.planStatus === "canceled" ? "rose" : "green"}
          />
          <StatCard
            label="Seats"
            value={`${seatsUsed} / ${current.seats}`}
            icon={<Users className="size-5" />}
            tone={seatPercent > 90 ? "amber" : "indigo"}
          />
          <StatCard
            label="Contacts"
            value={`${formatNumber(contactsUsed)} / ${formatNumber(current.contactLimit)}`}
            tone={contactPercent > 90 ? "amber" : "sky"}
          />
        </div>
      </PageHeader>

      {org?.planStatus === "canceled" ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p>
            This subscription is cancelled. Nothing has been deleted — pick a plan below to reactivate the
            workspace.
          </p>
        </div>
      ) : null}

      <Card className="mb-5">
        <SectionHeader title="Usage against your plan" subtitle="Counted live from this workspace." />
        <div className="mt-5 space-y-5">
          {[
            { label: "Team seats", used: seatsUsed, limit: current.seats, percent: seatPercent },
            {
              label: "Contacts",
              used: contactsUsed,
              limit: current.contactLimit,
              percent: contactPercent,
            },
          ].map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{row.label}</span>
                <span className="text-slate-400">
                  {formatNumber(row.used)} of {formatNumber(row.limit)}
                </span>
              </div>
              <div className="mt-2">
                <ProgressBar
                  value={row.percent}
                  tone={row.percent > 90 ? "#e66767" : row.percent > 70 ? "#c98500" : "#3987e5"}
                />
              </div>
            </div>
          ))}
          <div className="grid gap-4 border-t border-white/5 pt-4 text-sm sm:grid-cols-3">
            <p className="text-slate-400">
              Leads: <span className="text-white">{formatNumber(leads.length)}</span>
            </p>
            <p className="text-slate-400">
              Deals: <span className="text-white">{formatNumber(deals.length)}</span>
            </p>
            <p className="text-slate-400">
              Members: <span className="text-white">{formatNumber(members.length)}</span>
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === org?.plan && org?.planStatus !== "canceled";
          return (
            <Card
              key={plan.id}
              className={clsx(
                "flex flex-col",
                isCurrent ? "border-indigo-400/40 bg-indigo-500/[0.06]" : undefined,
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{plan.tagline}</p>
                </div>
                {isCurrent ? <Badge tone="indigo">Current</Badge> : null}
              </div>

              <p className="mt-5 flex items-end gap-1">
                <span className="text-3xl font-semibold text-white">${plan.priceMonthly}</span>
                <span className="pb-1 text-sm text-slate-400">/month</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">or ${plan.priceYearly} billed yearly</p>

              <ul className="mt-5 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6"
                variant={isCurrent ? "secondary" : plan.highlight ? "primary" : "outline"}
                disabled={isCurrent}
                loading={pending === plan.id}
                onClick={() => switchTo(plan.id)}
              >
                {isCurrent ? "Your current plan" : `Switch to ${plan.name}`}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="mt-5">
        <SectionHeader
          title="Payments"
          subtitle="This build stores the plan on your workspace record and enforces its limits. Connect a payment provider to charge for it."
        />
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Plan changes are written to the workspace document in Firestore and logged on the activity timeline,
          so upgrades, downgrades and cancellations are all auditable. No card details are collected or stored
          anywhere in this application.
        </p>
        {org?.planStatus !== "canceled" ? (
          <Button variant="ghost" className="mt-4" loading={pending === "cancel"} onClick={cancel}>
            Cancel subscription
          </Button>
        ) : null}
      </Card>

      {dialog}
    </>
  );
}
