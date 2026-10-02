"use client";

import { useEffect, useState } from "react";
import { KeyRound, Save } from "lucide-react";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Avatar, Badge, Card, ErrorPanel, SectionHeader } from "@/components/ui/Primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { updateUserProfile } from "@/lib/db/orgs";
import { ROLE_LABELS } from "@/lib/roles";
import { errorMessage, formatDate } from "@/lib/format";

export default function ProfileSettingsPage() {
  const { user, profile, role, org, resetPassword, members } = useAuth();
  const toast = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? "");
    setPhone(profile.phone ?? "");
    setTitle(profile.title ?? "");
  }, [profile]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setError("Your name cannot be empty.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await updateUserProfile(user.uid, {
        name: name.trim(),
        phone: phone.trim() || null,
        title: title.trim() || null,
      });
      if (user.displayName !== name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }
      toast.success("Profile updated.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  const sendReset = async () => {
    if (!user?.email) return;
    try {
      await resetPassword(user.email);
      toast.success("Password reset email sent.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const me = members.find((member) => member.id === user?.uid);
  const providers = user?.providerData.map((item) => item.providerId) ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={profile?.name} src={profile?.photoUrl} size={64} />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{profile?.name}</p>
            <p className="truncate text-sm text-slate-400">{profile?.email}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {role ? <Badge tone="indigo">{ROLE_LABELS[role]}</Badge> : null}
              {org ? <Badge tone="neutral">{org.name}</Badge> : null}
            </div>
          </div>
        </div>

        <form onSubmit={save} className="mt-6 space-y-4">
          {error ? <ErrorPanel message={error} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Job title">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Account director"
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
            <Field label="Email" hint="Your email comes from your sign-in method and cannot be edited here.">
              <Input value={profile?.email ?? ""} disabled />
            </Field>
          </div>

          <Button type="submit" loading={pending} icon={<Save className="size-4" />}>
            Save profile
          </Button>
        </form>
      </Card>

      <Card>
        <SectionHeader title="Sign-in and security" />
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-400">Sign-in methods</dt>
            <dd className="flex gap-1.5">
              {providers.includes("google.com") ? <Badge tone="sky">Google</Badge> : null}
              {providers.includes("password") ? <Badge tone="neutral">Email and password</Badge> : null}
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-400">Email verified</dt>
            <dd>
              <Badge tone={user?.emailVerified ? "green" : "amber"}>
                {user?.emailVerified ? "Verified" : "Not verified"}
              </Badge>
            </dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-400">Joined this workspace</dt>
            <dd className="text-slate-300">{formatDate(me?.joinedAt)}</dd>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-slate-400">Workspaces you belong to</dt>
            <dd className="text-slate-300">{profile?.orgIds?.length ?? 0}</dd>
          </div>
        </dl>

        {providers.includes("password") ? (
          <Button
            variant="secondary"
            className="mt-5"
            icon={<KeyRound className="size-4" />}
            onClick={sendReset}
          >
            Email me a password reset link
          </Button>
        ) : (
          <p className="mt-5 text-xs text-slate-500">
            You sign in with Google, so your password is managed by Google.
          </p>
        )}
      </Card>
    </div>
  );
}
