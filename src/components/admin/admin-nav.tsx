"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { SignOut } from "@/components/sign-out";

export function AdminNav({
  links,
  who,
  role,
}: {
  links: { href: string; label: string }[];
  who?: string;
  role?: string;
}) {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  return (
    <header className="border-b border-white/10 bg-linear-to-r from-brand to-brand-2 text-white shadow-md print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm">R</span>
          <span>
            <span className="text-accent">Rack</span>Hub <span className="font-normal text-slate-300">Back Office</span>
          </span>
        </Link>
        {who && (
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-slate-200">
              {who}
              {role && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold uppercase text-white">{role}</span>}
            </span>
            <SignOut />
          </div>
        )}
      </div>
      {who && (
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={clsx(
                "whitespace-nowrap rounded-lg px-3 py-1.5 transition",
                active(l.href) ? "bg-white/15 font-semibold text-white" : "text-slate-300 hover:bg-white/10 hover:text-white",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
