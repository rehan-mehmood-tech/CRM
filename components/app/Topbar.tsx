"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Building2, Check, ChevronDown, LogOut, Menu, Plus, Settings, User } from "lucide-react";
import { Avatar, Badge } from "@/components/ui/Primitives";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/components/providers/AuthProvider";
import { listUserOrganizations } from "@/lib/db/orgs";
import { ROLE_LABELS, planById } from "@/lib/roles";
import type { Organization } from "@/lib/types";

export function Topbar({ onOpenNav }: { onOpenNav: () => void }) {
  const { org, profile, role, signOut, switchOrg, orgId } = useAuth();
  const [menu, setMenu] = useState<"none" | "user" | "org">("none");
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile?.orgIds?.length) return;
    listUserOrganizations(profile.orgIds).then(setOrgs).catch(() => setOrgs([]));
  }, [profile?.orgIds]);

  useEffect(() => {
    if (menu === "none") return;
    const onClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setMenu("none");
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menu]);

  const plan = planById(org?.plan);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/5 bg-[#050713]/90 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="inline-flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <div ref={ref} className="flex items-center gap-2">
        {/* Workspace switcher */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setMenu((value) => (value === "org" ? "none" : "org"))}
            className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white transition hover:bg-white/[0.07]"
          >
            <Building2 className="size-4 text-indigo-300" />
            <span className="max-w-32 truncate">{org?.name ?? "Workspace"}</span>
            <ChevronDown className="size-3.5 text-slate-500" />
          </button>
          {menu === "org" ? (
            <div className="animate-fade-up absolute right-0 top-12 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0d1228] py-1 shadow-2xl">
              <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Your workspaces
              </p>
              {orgs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    switchOrg(item.id);
                    setMenu("none");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/5"
                >
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.id === orgId ? <Check className="size-4 text-emerald-400" /> : null}
                </button>
              ))}
              <Link
                href="/onboarding"
                onClick={() => setMenu("none")}
                className="mt-1 flex items-center gap-2 border-t border-white/5 px-3 py-2.5 text-sm text-indigo-300 transition hover:bg-white/5"
              >
                <Plus className="size-4" />
                New workspace
              </Link>
            </div>
          ) : null}
        </div>

        <Badge tone={plan.highlight ? "indigo" : "neutral"} className="hidden md:inline-flex">
          {plan.name}
          {org?.planStatus === "trialing" ? " trial" : ""}
        </Badge>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((value) => (value === "user" ? "none" : "user"))}
            className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-white/5"
            aria-label="Open account menu"
          >
            <Avatar name={profile?.name} src={profile?.photoUrl} size={32} />
            <ChevronDown className="size-3.5 text-slate-500" />
          </button>
          {menu === "user" ? (
            <div className="animate-fade-up absolute right-0 top-12 w-60 overflow-hidden rounded-xl border border-white/10 bg-[#0d1228] py-1 shadow-2xl">
              <div className="border-b border-white/5 px-3 py-3">
                <p className="truncate text-sm font-medium text-white">{profile?.name}</p>
                <p className="truncate text-xs text-slate-500">{profile?.email}</p>
                {role ? (
                  <Badge tone="indigo" className="mt-2">
                    {ROLE_LABELS[role]}
                  </Badge>
                ) : null}
              </div>
              <Link
                href="/settings/profile"
                onClick={() => setMenu("none")}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
              >
                <User className="size-4" />
                My profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenu("none")}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/5"
              >
                <Settings className="size-4" />
                Workspace settings
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-2 border-t border-white/5 px-3 py-2.5 text-left text-sm text-rose-300 transition hover:bg-rose-500/10"
              >
                <LogOut className="size-4" />
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
