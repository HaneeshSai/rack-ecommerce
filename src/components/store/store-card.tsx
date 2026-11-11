"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";
import { RackArt } from "@/components/rack-art";
import { CompareToggle } from "@/components/store/compare";
import { Price, useViewer } from "@/components/store/viewer";
import { STOCK_LABEL, STOCK_TONE, type CardData } from "@/components/store/stock";

export function StoreCard({ d }: { d: CardData }) {
  const v = useViewer();
  return (
    <div className="group relative h-full">
      <Link href={`/product/${d.slug}`} className="block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow)] transition duration-200 group-hover:-translate-y-1 group-hover:border-accent/60 group-hover:shadow-[var(--shadow-lg)]">
          <div className="relative flex h-40 items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 p-3">
            {d.uHeight ? <RackArt units={Math.min(d.uHeight, 14)} className="h-full" /> : <div className="text-5xl text-slate-300">&#9636;</div>}
            {d.uHeight && (
              <span className="absolute left-3 top-3 rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-white">{d.uHeight}U</span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="font-semibold leading-snug">{d.name}</h3>
            {d.depths.length > 0 && <p className="mt-1 text-xs text-muted">Depth: {d.depths.join(" / ")} mm</p>}
            <div className="mt-auto flex items-end justify-between gap-2 pt-4">
              <div>
                <div className="text-xs text-muted">{v.isDealer ? "Your price from" : "From"}</div>
                <Price retail={d.retail} dealer={d.dealer} className="text-lg font-extrabold" />
              </div>
              <Badge tone={STOCK_TONE[d.stock]}>{STOCK_LABEL[d.stock]}</Badge>
            </div>
          </div>
        </div>
      </Link>
      <CompareToggle slug={d.slug} className="absolute right-3 top-3 z-10" />
    </div>
  );
}
