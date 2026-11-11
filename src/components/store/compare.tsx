"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "rack-compare-v1";
const MAX = 4;

type Ctx = { slugs: string[]; has: (s: string) => boolean; toggle: (s: string) => void; clear: () => void };
const CompareCtx = createContext<Ctx | null>(null);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setSlugs(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(slugs));
    } catch {}
  }, [slugs, ready]);

  const value = useMemo<Ctx>(
    () => ({
      slugs,
      has: (s) => slugs.includes(s),
      toggle: (s) => setSlugs((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : cur.length >= MAX ? cur : [...cur, s])),
      clear: () => setSlugs([]),
    }),
    [slugs],
  );
  return <CompareCtx.Provider value={value}>{children}</CompareCtx.Provider>;
}

export function useCompare() {
  const c = useContext(CompareCtx);
  if (!c) throw new Error("useCompare must be used inside CompareProvider");
  return c;
}

export function CompareToggle({ slug, className = "" }: { slug: string; className?: string }) {
  const { has, toggle, slugs } = useCompare();
  const on = has(slug);
  const full = !on && slugs.length >= MAX;
  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      disabled={full}
      title={full ? `You can compare up to ${MAX} products` : undefined}
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40 ${
        on ? "border-accent bg-accent text-white" : "border-line bg-white/90 text-muted hover:border-accent hover:text-foreground"
      } ${className}`}
    >
      {on ? "✓ Compare" : "+ Compare"}
    </button>
  );
}

export function CompareBar() {
  const { slugs, clear } = useCompare();
  if (slugs.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full bg-brand px-4 py-2.5 text-sm text-white shadow-[var(--shadow-lg)]">
        <span>{slugs.length} selected</span>
        <Link
          href={`/compare?p=${slugs.join(",")}`}
          className="rounded-full bg-accent px-3 py-1 font-semibold hover:brightness-110"
        >
          Compare now
        </Link>
        <button onClick={clear} className="text-slate-300 hover:text-white">Clear</button>
      </div>
    </div>
  );
}
