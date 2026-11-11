"use client";

import { useEffect, useState, type ReactNode } from "react";

const PORTALS = [
  { key: "store", label: "Store", sub: "" },
  { key: "dealers", label: "Dealer Portal", sub: "dealers" },
  { key: "admin", label: "Admin", sub: "admin" },
] as const;

type PortalKey = (typeof PORTALS)[number]["key"];
const KNOWN: string[] = PORTALS.map((p) => p.key);

// Builds each portal's URL from the current host so it works on localhost
// (store.localhost / dealers.localhost / admin.localhost) and on real domains.
function usePortals() {
  const [loc, setLoc] = useState<{ protocol: string; host: string } | null>(null);
  useEffect(() => {
    setLoc({ protocol: window.location.protocol, host: window.location.host });
  }, []);

  const parts = loc?.host.split(".") ?? [];
  const onPortalHost = parts.length > 1 && KNOWN.includes(parts[0]);
  const current: PortalKey = onPortalHost ? (parts[0] as PortalKey) : "store";
  const base = onPortalHost ? parts.slice(1).join(".") : (loc?.host ?? "");

  function href(key: PortalKey) {
    if (!loc) return "#";
    const isLocal = base.split(":")[0] === "localhost";
    const sub = key === "store" ? (isLocal ? "store" : "") : key;
    return `${loc.protocol}//${sub ? `${sub}.` : ""}${base}/`;
  }
  return { current, href };
}

export function PortalLink({ to, className, children }: { to: PortalKey; className?: string; children: ReactNode }) {
  const { href } = usePortals();
  return (
    <a href={href(to)} className={className}>
      {children}
    </a>
  );
}

export function PortalSwitcher() {
  const { current, href } = usePortals();
  return (
    <div className="border-b border-white/10 bg-slate-950 text-xs text-slate-300">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-3 px-4 py-1.5">
        <span className="hidden text-slate-500 sm:inline">Switch portal</span>
        <div className="flex rounded-full bg-white/5 p-0.5 ring-1 ring-white/10">
          {PORTALS.map((p) => (
            <a
              key={p.key}
              href={href(p.key)}
              aria-current={current === p.key ? "page" : undefined}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                current === p.key ? "bg-accent text-white shadow" : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
