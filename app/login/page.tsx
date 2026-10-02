"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { errorMessage } from "@/lib/format";

export default function LoginPage() {
  const router = useRouter();
  const { configured, status, signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "ready") router.replace("/dashboard");
    if (status === "no-workspace") router.replace("/onboarding");
  }, [status, router]);

  if (!configured) return <SetupNotice />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending("email");
    try {
      await signInWithEmail(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  };

  const google = async () => {
    setError(null);
    setPending("google");
    try {
      await signInWithGoogle();
      router.replace("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <AuthShell
      title="Sign in to your workspace"
      subtitle="Welcome back. Pick up where your pipeline left off."
      footer={
        <p>
          New to Rehan CRM Agency?{" "}
          <Link href="/signup" className="font-medium text-indigo-300 hover:text-indigo-200">
            Create a workspace
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <GoogleButton onClick={google} loading={pending === "google"} disabled={pending !== null} />

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          or sign in with email
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {error ? <ErrorPanel message={error} /> : null}

        <form onSubmit={submit} className="space-y-4">
          <Field label="Work email" required>
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@agency.com"
            />
          </Field>
          <Field label="Password" required>
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-slate-400 transition hover:text-white">
              Forgot your password?
            </Link>
          </div>
          <Button type="submit" className="w-full" size="lg" loading={pending === "email"}>
            Sign in
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
