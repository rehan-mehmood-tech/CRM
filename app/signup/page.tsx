"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { errorMessage } from "@/lib/format";

export default function SignupPage() {
  const router = useRouter();
  const { configured, status, signUpWithEmail, signInWithGoogle } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
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
    if (password.length < 6) {
      setError("Choose a password with at least 6 characters.");
      return;
    }
    setPending("email");
    try {
      await signUpWithEmail(name, email, password);
      router.replace("/onboarding");
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
      router.replace("/onboarding");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(null);
    }
  };

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start a 14-day trial. No credit card, no sample data to clean up."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="space-y-4">
        <GoogleButton
          onClick={google}
          loading={pending === "google"}
          disabled={pending !== null}
          label="Sign up with Google"
        />

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="h-px flex-1 bg-white/10" />
          or use an email address
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {error ? <ErrorPanel message={error} /> : null}

        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" required>
            <Input
              autoComplete="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Rehan Mehmood"
            />
          </Field>
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
          <Field label="Password" required hint="At least 6 characters.">
            <Input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </Field>
          <Checkbox
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            label="I agree to the terms of service and privacy policy"
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={pending === "email"}
            disabled={!accepted}
          >
            Create account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
