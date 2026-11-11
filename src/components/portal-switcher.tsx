"use client";

import { useEffect, useState, type ReactNode } from "react";

const PORTALS = [
  { key: "store", label: "Store" },
  { key: "dealers", label: "Dealer Portal" },
  { key: "admin", label: "Admin" },
] as const;

type PortalKey = (typeof PORTALS)[number]["key"];
const KNOWN: string[] = PORTALS.map((p) => p.key);

// Preview hosts (name.netlify.app) can't have subdomains, so portals switch by cookie there.
const HOSTED_PREVIEW = /\.(netlify|vercel)\.app$/;

function savedPortal(): PortalKey {
  try {
    const m = document.cookie.match(/(?:^|; )rack_portal=([^;]+)/);
    if (m?.[1] === "dealer") return "dealers";
    if (m?.[1] === "admin") return "admin";
  } catch {}
  return "store";
}

// Builds each portal's link from the current host:
//  - hosted preview: /api/portal/<name> (sets a cookie, then shows that portal at "/")
//  - localhost and real domains: the matching subdomain
//    (store.localhost / dealers.localhost / admin.localhost, or dealers.example.com)
function usePortals() {
  const [loc, setLoc] = useState<{ protocol: string; host: string; cookiePortal: PortalKey } | null>(null);
  useEffect(() => {
    setLoc({ protocol: window.location.protocol, host: window.location.host, cookiePortal: savedPortal() });
  }, []);

  const hostname = loc?.host.split(":")[0] ?? "";
  const hosted = HOSTED_PREVIEW.test(hostname);
  const parts = loc?.host.split(".") ?? [];
  const onPortalHost = parts.length > 1 && KNOWN.includes(parts[0]);
  const current: PortalKey = hosted ? loc!.cookiePortal : onPortalHost ? (parts[0] as PortalKey) : "store";
  const base = onPortalHost ? parts.slice(1).join(".") : (loc?.host ?? "");

  function href(key: PortalKey) {
    if (!loc) return "#";
    if (hosted) return `/api/portal/${key}`;
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
