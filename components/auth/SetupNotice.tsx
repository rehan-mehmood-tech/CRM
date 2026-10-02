import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Logo } from "@/components/marketing/Logo";

const STEPS = [
  "Create a project at console.firebase.google.com.",
  "Add a Web app, then copy its config values.",
  "Copy .env.local.example to .env.local and paste each value in.",
  "In Authentication, enable the Email/Password and Google providers.",
  "In Firestore, create a database and deploy the rules in firestore.rules.",
  "Restart the dev server so the new environment variables are picked up.",
];

/** Rendered instead of the app when the Firebase environment variables are missing. */
export function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <Logo />
        <div className="mt-8 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-300" />
            <h1 className="text-base font-semibold text-white">Firebase is not configured yet</h1>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-amber-100/80">
            Rehan CRM Agency stores everything in your own Firebase project, so the app needs your project
            keys before you can sign in.
          </p>
          <ol className="mt-5 space-y-2.5">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm text-amber-50/90">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[11px] font-semibold text-amber-200">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-6 text-sm text-slate-400">
          Full instructions live in{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-slate-300">README.md</code>.{" "}
          <Link href="/" className="text-indigo-300 hover:text-indigo-200">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
