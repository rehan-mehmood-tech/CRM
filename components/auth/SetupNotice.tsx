import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Logo } from "@/components/marketing/Logo";

const LOCAL_STEPS = [
  "Create a project at console.firebase.google.com.",
  "Add a Web app, then copy its config values.",
  "Open .env and replace each REPLACE_ME with the matching value.",
  "In Authentication, enable the Email/Password and Google providers.",
  "In Firestore, create a database and deploy the rules in firestore.rules.",
  "Restart the dev server so the new environment variables are picked up.",
];

const HOSTED_STEPS = [
  "Open your hosting project settings (on Vercel: Settings > Environment Variables).",
  "Add all six NEXT_PUBLIC_FIREBASE_* variables from .env, for every environment.",
  "Redeploy. Env vars are read at build time, so an existing build will not pick them up.",
  "Add this site's domain under Firebase Authentication > Settings > Authorized domains.",
];

/** Rendered instead of the app when the Firebase environment variables are missing. */
export function SetupNotice() {
  // On a deployed build the fix is in the host's dashboard, not in a local file:
  // Next.js inlines NEXT_PUBLIC_* at build time and hosts ignore a committed .env.
  const hosted = typeof window !== "undefined" && !/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const steps = hosted ? HOSTED_STEPS : LOCAL_STEPS;

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
            {hosted
              ? "This deployed build was compiled without the Firebase keys. Next.js inlines NEXT_PUBLIC_* variables at build time, and hosting platforms ignore a .env file committed to the repository — so the keys have to be set on the host and the site redeployed."
              : "Rehan CRM Agency stores everything in your own Firebase project, so the app needs your project keys before you can sign in."}
          </p>
          <ol className="mt-5 space-y-2.5">
            {steps.map((step, index) => (
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
