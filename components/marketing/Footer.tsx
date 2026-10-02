import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/#workflow", label: "How it works" },
      { href: "/#roles", label: "Team roles" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Get started",
    links: [
      { href: "/signup", label: "Create workspace" },
      { href: "/login", label: "Sign in" },
      { href: "/join", label: "Accept an invite" },
      { href: "/forgot-password", label: "Reset password" },
    ],
  },
  {
    title: "Workspace",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/deals", label: "Pipeline" },
      { href: "/reports", label: "Reports" },
      { href: "/billing", label: "Billing" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#04060f]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            The customer platform for agencies: leads, pipeline, tasks and team permissions in a single
            workspace backed by Firebase.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-300">{column.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/5 px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Rehan CRM Agency. All rights reserved.</p>
          <p>Built on Next.js and Firebase.</p>
        </div>
      </div>
    </footer>
  );
}
