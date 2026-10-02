"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Activity as ActivityIcon,
  BarChart3,
  Building2,
  Columns3,
  CreditCard,
  LayoutDashboard,
  ListChecks,
  Settings,
  Target,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/marketing/Logo";
import { useAuth } from "@/components/providers/AuthProvider";
import { useData } from "@/components/providers/DataProvider";
import { can, type Permission } from "@/lib/roles";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
  count?: number;
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { role } = useAuth();
  const { leads, contacts, companies, deals, tasks } = useData();

  const openTasks = tasks.filter((task) => !task.completed).length;
  const openDeals = deals.filter((deal) => deal.status === "open").length;

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: "Workspace",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/leads", label: "Leads", icon: Target, count: leads.length },
        { href: "/contacts", label: "Contacts", icon: Users, count: contacts.length },
        { href: "/companies", label: "Companies", icon: Building2, count: companies.length },
        { href: "/deals", label: "Pipeline", icon: Columns3, count: openDeals },
        { href: "/tasks", label: "Tasks", icon: ListChecks, count: openTasks },
        { href: "/activity", label: "Activity", icon: ActivityIcon },
        { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports:read" },
      ],
    },
    {
      title: "Administration",
      items: [
        { href: "/team", label: "Team", icon: UsersRound, permission: "team:read" },
        { href: "/settings", label: "Settings", icon: Settings },
        { href: "/billing", label: "Billing", icon: CreditCard, permission: "billing:manage" },
      ],
    },
  ];

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#070a19] transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4">
          <Logo href="/dashboard" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {sections.map((section) => {
            const items = section.items.filter((item) => !item.permission || can(role, item.permission));
            if (!items.length) return null;
            return (
              <div key={section.title}>
                <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  {section.title}
                </p>
                <ul className="mt-2 space-y-0.5">
                  {items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={clsx(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
                            active
                              ? "bg-indigo-500/15 font-medium text-white ring-1 ring-indigo-400/20"
                              : "text-slate-400 hover:bg-white/5 hover:text-white",
                          )}
                        >
                          <item.icon className={clsx("size-4", active && "text-indigo-300")} />
                          <span className="flex-1">{item.label}</span>
                          {typeof item.count === "number" && item.count > 0 ? (
                            <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                              {item.count}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <Link
            href="/billing"
            onClick={onClose}
            className="block rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/10 p-3 ring-1 ring-indigo-400/20 transition hover:from-indigo-500/25"
          >
            <p className="text-xs font-semibold text-white">Need more seats?</p>
            <p className="mt-0.5 text-[11px] text-slate-400">Compare plans and upgrade in seconds.</p>
          </Link>
        </div>
      </aside>
    </>
  );
}
