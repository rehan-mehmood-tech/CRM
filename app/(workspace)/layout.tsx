"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { SetupNotice } from "@/components/auth/SetupNotice";
import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Primitives";
import { useAuth } from "@/components/providers/AuthProvider";
import { DataProvider } from "@/components/providers/DataProvider";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { configured, status, user, members, signOut } = useAuth();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "no-workspace") router.replace("/onboarding");
  }, [status, router]);

  if (!configured) return <SetupNotice />;

  if (status !== "ready") {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 text-sm text-slate-400">
        <Spinner />
        Loading your workspace
      </div>
    );
  }

  const me = members.find((member) => member.id === user?.uid);
  if (me?.status === "disabled") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6 text-center">
          <ShieldAlert className="mx-auto size-6 text-amber-300" />
          <h1 className="mt-3 text-base font-semibold text-white">Your access is suspended</h1>
          <p className="mt-2 text-sm text-amber-100/80">
            An administrator has paused your access to this workspace. Ask them to restore it, then sign in
            again.
          </p>
          <Button variant="secondary" className="mt-5" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DataProvider>
      <div className="flex min-h-screen">
        <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenNav={() => setNavOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </DataProvider>
  );
}
