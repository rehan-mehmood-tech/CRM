import Link from "next/link";
import clsx from "clsx";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-500/25",
        className,
      )}
      aria-hidden
    >
      R
    </span>
  );
}

export function Logo({
  href = "/",
  compact = false,
}: {
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <LogoMark />
      {compact ? null : (
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-white">Rehan CRM</span>
          <span className="block text-[11px] font-medium tracking-wide text-indigo-300/80">AGENCY</span>
        </span>
      )}
    </Link>
  );
}
