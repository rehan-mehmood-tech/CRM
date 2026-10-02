import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Footer } from "@/components/marketing/Footer";
import { PricingTable } from "@/components/marketing/PricingTable";
import { PLANS } from "@/lib/roles";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple per-workspace pricing for Rehan CRM Agency. Starter, Growth and Agency plans with a 14-day trial on every tier.",
};

const MATRIX: { label: string; values: (string | boolean)[] }[] = [
  { label: "Team seats", values: PLANS.map((plan) => formatNumber(plan.seats)) },
  { label: "Contacts", values: PLANS.map((plan) => formatNumber(plan.contactLimit)) },
  { label: "Leads, contacts and companies", values: [true, true, true] },
  { label: "Deal pipeline", values: ["1 pipeline", "Unlimited", "Unlimited"] },
  { label: "Custom pipeline stages", values: [false, true, true] },
  { label: "Tasks and activity timeline", values: [true, true, true] },
  { label: "Role-based permissions", values: [true, true, true] },
  { label: "Revenue and conversion reports", values: [false, true, true] },
  { label: "Full workspace audit trail", values: [false, false, true] },
  { label: "Google sign-in", values: [true, true, true] },
  { label: "Support", values: ["Email", "Priority", "Dedicated manager"] },
];

export default function PricingPage() {
  return (
    <>
      <MarketingNav />
      <main className="flex-1">
        <section className="aurora relative overflow-hidden">
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              One price for the whole workspace
            </h1>
            <p className="mt-5 text-lg text-slate-300">
              Invite your whole team on any plan. Every tier starts with a 14-day trial and can be changed or
              cancelled from workspace billing at any time.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
          <PricingTable />
        </section>

        <section className="border-t border-white/5 bg-white/[0.015]">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Compare plans</h2>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-150 border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Feature
                    </th>
                    {PLANS.map((plan) => (
                      <th
                        key={plan.id}
                        className="border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-300"
                      >
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MATRIX.map((row) => (
                    <tr key={row.label} className="transition hover:bg-white/[0.02]">
                      <td className="border-b border-white/5 px-4 py-3 text-slate-300">{row.label}</td>
                      {row.values.map((value, index) => (
                        <td key={index} className="border-b border-white/5 px-4 py-3 text-slate-200">
                          {value === true ? (
                            <Check className="size-4 text-emerald-400" />
                          ) : value === false ? (
                            <Minus className="size-4 text-slate-600" />
                          ) : (
                            value
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-8 text-center text-sm text-slate-400">
              Ready to start?{" "}
              <Link href="/signup" className="font-medium text-indigo-300 hover:text-indigo-200">
                Create your workspace
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
