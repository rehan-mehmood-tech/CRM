"use client";

import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { initials } from "@/lib/format";

export function Card({
  className,
  children,
  padded = true,
}: {
  className?: string;
  children: ReactNode;
  padded?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/[0.02] shadow-sm",
        padded && "p-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

const BADGE_TONES = {
  neutral: "bg-white/8 text-slate-300 border-white/10",
  indigo: "bg-indigo-500/15 text-indigo-200 border-indigo-400/20",
  green: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
  amber: "bg-amber-500/15 text-amber-200 border-amber-400/20",
  rose: "bg-rose-500/15 text-rose-200 border-rose-400/20",
  sky: "bg-sky-500/15 text-sky-200 border-sky-400/20",
  violet: "bg-violet-500/15 text-violet-200 border-violet-400/20",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={name ?? "Avatar"}
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-white/10"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-semibold text-white ring-1 ring-white/10"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx("size-5 animate-spin text-indigo-400", className)} />;
}

export function LoadingPanel({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-sm text-slate-400">
      <Spinner />
      {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-6 py-16 text-center">
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
          {icon}
        </div>
      ) : null}
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">{message}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
      {message}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "indigo",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-2 truncate text-2xl font-semibold text-white">{value}</p>
        {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
      </div>
      {icon ? (
        <span
          className={clsx(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border",
            BADGE_TONES[tone],
          )}
        >
          {icon}
        </span>
      ) : null}
    </Card>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-200 border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={clsx(
        "whitespace-nowrap border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <td className={clsx("border-b border-white/5 px-4 py-3 text-slate-200", className)}>{children}</td>
  );
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={clsx("transition hover:bg-white/[0.03]", onClick && "cursor-pointer", className)}
    >
      {children}
    </tr>
  );
}

export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition",
            active === tab.id ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
          )}
        >
          {tab.label}
          {typeof tab.count === "number" ? (
            <span className="ml-1.5 text-[10px] opacity-70">{tab.count}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, tone = "#6366f1" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: tone }}
      />
    </div>
  );
}
