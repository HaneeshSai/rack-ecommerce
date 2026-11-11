"use client";

// Demo "who is browsing" switcher. No real accounts: the choice is kept in
// localStorage so the storefront can show guest / pending / approved-dealer pricing.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { tierPrice, type Tier } from "@/lib/logistics";
import { inr } from "@/lib/money";

export type ViewerKind = "guest" | "pending" | "dealer";
const KEY = "rack-viewer-v1";
const TIER: Tier = "GOLD";

type Ctx = {
  kind: ViewerKind;
  setKind: (k: ViewerKind) => void;
  isDealer: boolean;
  tier: Tier;
  /** Unit price (paise) this viewer pays: retail incl. GST, or trade price ex-GST. */
  unit: (retail: number, dealer: number) => number;
};

const ViewerCtx = createContext<Ctx | null>(null);

export function ViewerProvider({ children }: { children: ReactNode }) {
  const [kind, setKindState] = useState<ViewerKind>("guest");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw === "pending" || raw === "dealer" || raw === "guest") setKindState(raw);
    } catch {}
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      kind,
      setKind: (k) => {
        setKindState(k);
        try {
          localStorage.setItem(KEY, k);
        } catch {}
      },
      isDealer: kind === "dealer",
      tier: TIER,
      unit: (retail, dealer) => (kind === "dealer" ? tierPrice(dealer, TIER) : retail),
    }),
    [kind],
  );
  return <ViewerCtx.Provider value={value}>{children}</ViewerCtx.Provider>;
}

export function useViewer() {
  const c = useContext(ViewerCtx);
  if (!c) throw new Error("useViewer must be used inside ViewerProvider");
  return c;
}

/** Price for the current viewer. Dealers get the trade price with a "+ GST" suffix. */
export function Price({ retail, dealer, className }: { retail: number; dealer: number; className?: string }) {
  const v = useViewer();
  return (
    <span className={className}>
      {inr(v.unit(retail, dealer))}
      {v.isDealer && <span className="ml-1 text-xs font-medium text-muted">+ GST</span>}
    </span>
  );
}

const OPTIONS: { kind: ViewerKind; label: string; sub: string }[] = [
  { kind: "guest", label: "Guest", sub: "Retail prices incl. GST" },
  { kind: "pending", label: "Pending dealer", sub: "Tirumala Electronics - under review" },
  { kind: "dealer", label: "Approved dealer", sub: "Sri Sai Networks - Gold tier" },
];

export function ViewerMenu() {
  const v = useViewer();
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.kind === v.kind)!;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-slate-50"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] text-white">
          {current.label[0]}
        </span>
        <span className="hidden sm:inline">{current.label}</span>
        <span aria-hidden className="text-xs text-muted">&#9662;</span>
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-line bg-white p-1.5 shadow-[var(--shadow-lg)]">
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">View store as (demo)</div>
          {OPTIONS.map((o) => (
            <button
              key={o.kind}
              onClick={() => {
                v.setKind(o.kind);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${o.kind === v.kind ? "bg-accent-soft" : ""}`}
            >
              <div className="font-semibold">{o.label}</div>
              <div className="text-xs text-muted">{o.sub}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ViewerBanner() {
  const v = useViewer();
  if (v.kind === "pending")
    return (
      <div className="border-b border-amber-200 bg-amber-50 text-sm text-amber-900">
        <div className="mx-auto max-w-6xl px-4 py-2">
          <b>Your dealer application is under review.</b> You are seeing retail prices until we approve your account.
        </div>
      </div>
    );
  if (v.kind === "dealer")
    return (
      <div className="border-b border-emerald-200 bg-emerald-50 text-sm text-emerald-900">
        <div className="mx-auto max-w-6xl px-4 py-2">
          Dealer view: <b>Gold tier</b> trade prices shown <b>excluding GST</b>.
        </div>
      </div>
    );
  return null;
}
