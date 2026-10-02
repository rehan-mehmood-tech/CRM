import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/marketing/Logo";

const POINTS = [
  "Leads, contacts, companies and deals in one workspace",
  "Drag-and-drop pipeline with live forecasting",
  "Five roles enforced in Firestore security rules",
  "Invite your whole team on any plan",
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-4 py-12 sm:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Logo />
          <h1 className="mt-10 text-2xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-6 text-sm text-slate-400">{footer}</div> : null}
          <p className="mt-10 text-xs text-slate-600">
            <Link href="/" className="transition hover:text-slate-400">
              &larr; Back to home
            </Link>
          </p>
        </div>
      </div>

      <div className="aurora relative hidden flex-col justify-center overflow-hidden border-l border-white/5 px-16 lg:flex">
        <div className="grid-lines absolute inset-0 opacity-30" aria-hidden />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white">
            The CRM your agency team can actually share
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-400">
            Your workspace starts empty on purpose. Every record you see in the app is one you or a teammate
            created, stored in your own Firebase project.
          </p>
        </div>
      </div>
    </div>
  );
}
