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
    <header className="border-b border-line bg-brand text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-extrabold tracking-tight">
            <span className="text-accent">Rack</span>Hub <span className="font-normal text-slate-300">{title}</span>
          </Link>
          {who && (
            <nav className="flex gap-4 text-sm text-slate-200">
              {links.map((l) => <Link key={l.href} href={l.href} className="hover:text-white">{l.label}</Link>)}
            </nav>
          )}
        </div>
        {who && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-300">{who}</span>
            <SignOut />
          </div>
        )}
      </div>
    </header>
  );
}
