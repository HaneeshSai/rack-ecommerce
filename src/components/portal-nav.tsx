import Link from "next/link";
import { SignOut } from "@/components/sign-out";

export function PortalNav({
  title,
  links,
  who,
}: {
  title: string;
  links: { href: string; label: string }[];
  who?: string;
}) {
  return (
    <header className="border-b border-white/10 bg-linear-to-r from-brand to-brand-2 text-white shadow-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm">R</span>
            <span>
              <span className="text-accent">Rack</span>Hub <span className="font-normal text-slate-300">{title}</span>
            </span>
          </Link>
          {who && (
            <nav className="flex gap-1 text-sm">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 text-slate-200 transition hover:bg-white/10 hover:text-white">
                  {l.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        {who && (
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1 text-slate-200">{who}</span>
            <SignOut />
          </div>
        )}
      </div>
    </header>
  );
}
