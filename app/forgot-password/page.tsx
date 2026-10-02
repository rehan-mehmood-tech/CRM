"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { ErrorPanel } from "@/components/ui/Primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { errorMessage } from "@/lib/format";

export default function ForgotPasswordPage() {
  const { configured, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!configured) return <SetupNotice />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a link to choose a new password."
      footer={
        <p>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-5">
          <MailCheck className="size-5 text-emerald-300" />
          <h2 className="mt-3 text-sm font-semibold text-white">Check your inbox</h2>
          <p className="mt-1 text-sm text-emerald-100/80">
            If an account exists for {email}, a reset link is on its way. The link expires in one hour.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error ? <ErrorPanel message={error} /> : null}
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
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
