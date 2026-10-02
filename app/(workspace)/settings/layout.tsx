"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Building2, Columns3, User } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";

const TABS = [
  { href: "/settings", label: "Workspace", icon: Building2 },
  { href: "/settings/profile", label: "My profile", icon: User },
  { href: "/settings/pipelines", label: "Pipelines", icon: Columns3 },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <PageHeader title="Settings" description="Workspace details, your own profile and pipeline stages.">
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition",
                  active ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <tab.icon className="size-3.5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </PageHeader>
      {children}
    </>
  );
}
