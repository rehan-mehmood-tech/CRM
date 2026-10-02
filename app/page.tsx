import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Columns3,
  Contact,
  Filter,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Footer } from "@/components/marketing/Footer";
import { PricingTable } from "@/components/marketing/PricingTable";
import { ROLES } from "@/lib/roles";

export const metadata: Metadata = {
  title: "Rehan CRM Agency — the CRM built for agency sales teams",
  description:
    "Capture leads, run your pipeline, assign work and give every teammate the right level of access. A multi-user SaaS CRM powered by Firebase.",
};

const FEATURES = [
  {
    icon: Target,
    title: "Lead capture and scoring",
    body: "Log every inbound lead with source, score and owner, then qualify or convert it into a contact and an open deal in one step.",
  },
  {
    icon: Columns3,
    title: "Drag-and-drop pipeline",
    body: "Move deals across stages on a kanban board. Win probability, weighted forecast and stage history update as you drag.",
  },
  {
    icon: Contact,
    title: "Contacts and companies",
    body: "Keep people and the organisations they work for linked together, with their deals, tasks and full activity history on one record.",
  },
  {
    icon: ListChecks,
    title: "Tasks and follow-ups",
    body: "Assign calls, emails and meetings with due dates and priorities. Overdue work surfaces on the dashboard for the whole team.",
  },
  {
    icon: BarChart3,
    title: "Live revenue reporting",
    body: "Pipeline value, win rate, conversion by source and per-rep leaderboards, computed from your own records in real time.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based permissions",
    body: "Five roles from owner to viewer, enforced in the interface and again in Firestore security rules on every read and write.",
  },
  {
    icon: Filter,
    title: "Search and filters everywhere",
    body: "Filter by owner, stage, status, source or tag, and search across every record from the workspace header.",
  },
  {
    icon: Zap,
    title: "Realtime by default",
    body: "Every list is a live Firestore subscription, so a change made by one teammate appears instantly for everyone else.",
  },
];

const WORKFLOW = [
  {
    step: "01",
    title: "Create your workspace",
    body: "Sign up with Google or an email address, name your agency, pick a currency and a plan. Your default pipeline is created for you.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Invite your team",
    body: "Send role-scoped invitations. Teammates accept, land in the same workspace and only see what their role allows.",
    icon: Users,
  },
  {
    step: "03",
    title: "Work the pipeline",
    body: "Capture leads, convert the good ones, drag deals through stages and let the dashboard show where revenue actually stands.",
    icon: LayoutDashboard,
  },
];

const PAINS = [
  "Leads sit in a spreadsheet nobody owns",
  "Forecasts are rebuilt by hand every Monday",
  "Everyone can see and edit everything",
  "Follow-ups are remembered, not scheduled",
];

const GAINS = [
  "Every lead has an owner, a source and a score",
  "Weighted pipeline value updates as deals move",
  "Five roles, enforced in the database itself",
  "Tasks with due dates, assignees and reminders",
];

const FAQS = [
  {
    q: "Is this a real multi-tenant SaaS?",
    a: "Yes. Each workspace is its own tenant. Records carry the workspace id, membership is stored per workspace, and Firestore security rules reject any read or write from outside the workspace you belong to.",
  },
  {
    q: "Can one person belong to more than one workspace?",
    a: "Yes. Your profile keeps a list of the workspaces you are a member of, with a different role in each, and you switch between them from the sidebar.",
  },
  {
    q: "How does signing in with Google work?",
    a: "Google sign-in uses Firebase Authentication. The first time you sign in, a profile document is created for you; after that the same account works for both email and Google sign-in on the same address.",
  },
  {
    q: "Where does the data live?",
    a: "In your own Firebase project. Nothing ships with sample records: every lead, contact, company, deal, task and activity in the app is something you or your team created.",
  },
  {
    q: "What happens when the trial ends?",
    a: "Nothing is deleted. The workspace plan is a field on the workspace record, and the owner can switch plans or cancel from the billing page at any time.",
  },
  {
    q: "Can I change the pipeline stages?",
    a: "Owners, admins and managers can rename stages, set win probability, change colours, reorder them and create additional pipelines from workspace settings.",
  },
];

export default function HomePage() {
  return (
    <>
      <MarketingNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="aurora relative overflow-hidden">
          <div className="grid-lines absolute inset-0 opacity-40" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">
                <Sparkles className="size-3.5" />
                Multi-user CRM for agencies
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your agency pipeline,
                <span className="bg-gradient-to-r from-indigo-300 to-violet-400 bg-clip-text text-transparent">
                  {" "}
                  finally under control
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
                Rehan CRM Agency gives your team one place to capture leads, qualify them, move deals through a
                pipeline you designed, and see exactly what every rep is working on — with permissions that
                hold up at the database level.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition hover:bg-indigo-400"
                >
                  Start your workspace free
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  See pricing
                </Link>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                {["14-day trial", "Google sign-in", "No credit card required"].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <PipelinePreview />
          </div>
        </section>

        {/* Capability strip */}
        <section className="border-y border-white/5 bg-white/[0.02]">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {[
              { icon: LayoutDashboard, label: "Dashboard", sub: "Live KPIs and forecast" },
              { icon: Columns3, label: "Pipeline", sub: "Drag-and-drop kanban" },
              { icon: Users, label: "Team", sub: "Invites and 5 roles" },
              { icon: Lock, label: "Security", sub: "Firestore rules per tenant" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Problem / solution */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Spreadsheets stop working the moment you hire a second closer
            </h2>
            <p className="mt-4 text-slate-400">
              The jump from one person selling to a team selling is where deals start slipping. Here is what
              changes when the pipeline lives in a real CRM.
            </p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-300">Without a CRM</h3>
              <ul className="mt-5 space-y-3">
                {PAINS.map((pain) => (
                  <li key={pain} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-400" />
                    {pain}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-indigo-400/30 bg-gradient-to-b from-indigo-500/10 to-transparent p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
                With Rehan CRM Agency
              </h3>
              <ul className="mt-5 space-y-3">
                {GAINS.map((gain) => (
                  <li key={gain} className="flex items-start gap-3 text-sm text-white">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    {gain}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-y border-white/5 bg-white/[0.015]">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Features</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Everything a sales team touches in a day
              </h2>
              <p className="mt-4 text-slate-400">
                Each module is fully functional: create, read, update and delete, synced live to your Firebase
                project.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/10 bg-[#0a0e20] p-5 transition hover:border-indigo-400/30 hover:bg-[#0d1228]"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-300 transition group-hover:bg-indigo-500/20">
                    <feature.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
              How it works
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Running in about three minutes
            </h2>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {WORKFLOW.map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <span className="text-xs font-semibold tracking-widest text-indigo-300">{item.step}</span>
                <span className="mt-4 flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                  <item.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="scroll-mt-20 border-y border-white/5 bg-white/[0.015]">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">
                Multi-user access
              </span>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Five roles, enforced twice
              </h2>
              <p className="mt-4 text-slate-400">
                The interface hides what a role cannot do, and Firestore security rules reject it again on the
                server. A viewer cannot write a record even with a crafted request, and only the owner can
                touch billing or delete the workspace.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2">
                  <KeyRound className="size-4 text-indigo-300" /> Role-scoped invitations
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2">
                  <Building2 className="size-4 text-indigo-300" /> Multiple workspaces per user
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2">
                  <CalendarCheck className="size-4 text-indigo-300" /> Full activity trail
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {ROLES.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start gap-4 rounded-xl border border-white/10 bg-[#0a0e20] p-4"
                >
                  <span className="mt-0.5 rounded-md bg-indigo-500/15 px-2 py-1 text-xs font-semibold text-indigo-200">
                    {role.label}
                  </span>
                  <p className="text-sm text-slate-400">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Pricing</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Priced per workspace, not per record
            </h2>
            <p className="mt-4 text-slate-400">
              Start on any plan, change it whenever your team does. Seat and contact limits are checked live
              against what your workspace actually holds.
            </p>
          </div>
          <div className="mt-12">
            <PricingTable />
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-white/5 bg-white/[0.015]">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <h2 className="text-center text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Questions, answered
            </h2>
            <div className="mt-10 space-y-3">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group rounded-xl border border-white/10 bg-[#0a0e20] px-5 py-4 open:border-indigo-400/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-white">
                    {faq.q}
                    <span className="text-indigo-300 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="aurora relative overflow-hidden">
          <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Bring your next quarter into one pipeline
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">
              Create a workspace, invite your closers and start logging leads today. Your data stays in your
              own Firebase project.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition hover:bg-indigo-400"
              >
                Create your workspace
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
              >
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

/** Abstract pipeline illustration — deliberately contains no record-like sample data. */
function PipelinePreview() {
  const columns = [
    { name: "New", color: "#64748b", cards: 3 },
    { name: "Qualified", color: "#0ea5e9", cards: 2 },
    { name: "Proposal", color: "#8b5cf6", cards: 3 },
    { name: "Closing", color: "#10b981", cards: 2 },
  ];

  return (
    <div className="relative">
      <div className="absolute -inset-4 rounded-3xl bg-indigo-500/10 blur-3xl" aria-hidden />
      <div className="relative rounded-2xl border border-white/10 bg-[#080b1a]/90 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <span className="size-2.5 rounded-full bg-rose-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 text-xs text-slate-500">Pipeline board</span>
        </div>
        <div className="grid grid-cols-4 gap-2.5 pt-4">
          {columns.map((column) => (
            <div key={column.name} className="rounded-xl bg-white/[0.03] p-2.5">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ backgroundColor: column.color }} />
                <span className="truncate text-[10px] font-medium text-slate-300">{column.name}</span>
              </div>
              <div className="mt-2.5 space-y-2">
                {Array.from({ length: column.cards }).map((_, index) => (
                  <div
                    key={index}
                    className="space-y-1.5 rounded-lg border border-white/5 bg-[#0d1228] p-2"
                    style={{ opacity: 1 - index * 0.18 }}
                  >
                    <div className="h-1.5 w-full rounded-full bg-white/15" />
                    <div className="h-1.5 w-2/3 rounded-full bg-white/10" />
                    <div className="h-1.5 w-1/3 rounded-full" style={{ backgroundColor: column.color }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5 border-t border-white/5 pt-4">
          {["Pipeline value", "Win rate", "Open deals"].map((label) => (
            <div key={label} className="rounded-xl bg-white/[0.03] p-2.5">
              <p className="text-[10px] text-slate-500">{label}</p>
              <div className="mt-2 h-2 w-3/4 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
