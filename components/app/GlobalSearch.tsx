"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Columns3, ListChecks, Search, Target, Users } from "lucide-react";
import { useData } from "@/components/providers/DataProvider";
import { contactName } from "@/lib/db/contacts";

interface Hit {
  id: string;
  label: string;
  sub: string;
  href: string;
  kind: "Lead" | "Contact" | "Company" | "Deal" | "Task";
}

const ICONS = {
  Lead: Target,
  Contact: Users,
  Company: Building2,
  Deal: Columns3,
  Task: ListChecks,
} as const;

export function GlobalSearch() {
  const router = useRouter();
  const { leads, contacts, companies, deals, tasks } = useData();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const needle = term.trim().toLowerCase();
    if (needle.length < 2) return [];
    const matches = (...values: (string | null | undefined)[]) =>
      values.some((value) => value?.toLowerCase().includes(needle));

    const results: Hit[] = [];
    leads
      .filter((lead) => matches(lead.name, lead.email, lead.company, lead.phone))
      .slice(0, 5)
      .forEach((lead) =>
        results.push({
          id: lead.id,
          label: lead.name,
          sub: lead.company ?? lead.email ?? "Lead",
          href: `/leads?focus=${lead.id}`,
          kind: "Lead",
        }),
      );
    contacts
      .filter((contact) => matches(contactName(contact), contact.email, contact.companyName, contact.phone))
      .slice(0, 5)
      .forEach((contact) =>
        results.push({
          id: contact.id,
          label: contactName(contact),
          sub: contact.companyName ?? contact.email ?? "Contact",
          href: `/contacts/${contact.id}`,
          kind: "Contact",
        }),
      );
    companies
      .filter((company) => matches(company.name, company.domain, company.industry))
      .slice(0, 5)
      .forEach((company) =>
        results.push({
          id: company.id,
          label: company.name,
          sub: company.domain ?? company.industry ?? "Company",
          href: `/companies/${company.id}`,
          kind: "Company",
        }),
      );
    deals
      .filter((deal) => matches(deal.title, deal.companyName, deal.contactName))
      .slice(0, 5)
      .forEach((deal) =>
        results.push({
          id: deal.id,
          label: deal.title,
          sub: deal.companyName ?? deal.contactName ?? "Deal",
          href: `/deals?focus=${deal.id}`,
          kind: "Deal",
        }),
      );
    tasks
      .filter((task) => matches(task.title, task.relatedName))
      .slice(0, 4)
      .forEach((task) =>
        results.push({
          id: task.id,
          label: task.title,
          sub: task.relatedName ?? "Task",
          href: `/tasks?focus=${task.id}`,
          kind: "Task",
        }),
      );
    return results;
  }, [term, leads, contacts, companies, deals, tasks]);

  const go = (href: string) => {
    setOpen(false);
    setTerm("");
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={inputRef}
          value={term}
          onChange={(event) => {
            setTerm(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search leads, contacts, companies, deals"
          className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] pl-9 pr-14 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400/60 focus:outline-none"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-500">
          Ctrl K
        </kbd>
      </div>

      {open && term.trim().length >= 2 ? (
        <div className="animate-fade-up absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-white/10 bg-[#0d1228] shadow-2xl">
          {hits.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Nothing matches “{term.trim()}” yet.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto py-1">
              {hits.map((hit) => {
                const Icon = ICONS[hit.kind];
                return (
                  <li key={`${hit.kind}-${hit.id}`}>
                    <button
                      type="button"
                      onClick={() => go(hit.href)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/5"
                    >
                      <Icon className="size-4 shrink-0 text-indigo-300" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{hit.label}</span>
                        <span className="block truncate text-xs text-slate-500">{hit.sub}</span>
                      </span>
                      <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {hit.kind}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
