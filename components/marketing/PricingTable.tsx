"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Check } from "lucide-react";
import { PLANS } from "@/lib/roles";

export function PricingTable({ ctaHref = "/signup" }: { ctaHref?: string }) {
  const [yearly, setYearly] = useState(false);

  return (
    <div>
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={clsx(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition",
              !yearly ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={clsx(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition",
              yearly ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white",
            )}
          >
            Yearly
            <span className="ml-1.5 text-[10px] text-emerald-300">2 months free</span>
          </button>
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={clsx(
              "relative flex flex-col rounded-2xl border p-6",
              plan.highlight
                ? "border-indigo-400/40 bg-gradient-to-b from-indigo-500/10 to-transparent shadow-xl shadow-indigo-500/10"
                : "border-white/10 bg-white/[0.02]",
            )}
          >
            {plan.highlight ? (
              <span className="absolute -top-3 left-6 rounded-full bg-indigo-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                Most popular
              </span>
            ) : null}
            <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
            <p className="mt-1 min-h-10 text-sm text-slate-400">{plan.tagline}</p>
            <p className="mt-5 flex items-end gap-1">
              <span className="text-4xl font-semibold tracking-tight text-white">
                ${yearly ? plan.priceYearly : plan.priceMonthly}
              </span>
              <span className="pb-1 text-sm text-slate-400">/{yearly ? "year" : "month"}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href={`${ctaHref}?plan=${plan.id}`}
              className={clsx(
                "mt-7 rounded-lg px-4 py-2.5 text-center text-sm font-medium transition",
                plan.highlight
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-400"
                  : "border border-white/15 text-white hover:bg-white/5",
              )}
            >
              Start with {plan.name}
            </Link>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">
        Every plan includes a 14-day trial. Plans are stored on your workspace record and can be changed any
        time from workspace billing.
      </p>
    </div>
  );
}
