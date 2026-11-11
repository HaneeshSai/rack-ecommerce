import Link from "next/link";
import { Badge } from "@/components/ui";
import { RackArt } from "@/components/rack-art";
import { inr } from "@/lib/money";

type Props = {
  href: string;
  name: string;
  uHeight: number | null;
  variants: { retailPrice: number; dealerPrice: number; depthMm: number | null; stock?: { qty: number }[] }[];
  dealer?: boolean;
};

export function ProductCard({ href, name, uHeight, variants, dealer }: Props) {
  const prices = variants.map((v) => (dealer ? v.dealerPrice : v.retailPrice));
  const min = Math.min(...prices);
  const depths = variants.map((v) => v.depthMm).filter((d): d is number => !!d);
  const inStock = variants.some((v) => (v.stock ?? []).reduce((n, s) => n + s.qty, 0) > 0);
  return (
    <Link href={href} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-[var(--shadow)] transition duration-200 group-hover:-translate-y-1 group-hover:border-accent/60 group-hover:shadow-[var(--shadow-lg)]">
        <div className="relative flex h-40 items-center justify-center bg-linear-to-b from-slate-50 to-slate-100 p-3">
          {uHeight ? <RackArt units={Math.min(uHeight, 14)} className="h-full" /> : <div className="text-5xl text-slate-300">▤</div>}
          {uHeight && (
            <span className="absolute left-3 top-3 rounded-md bg-brand px-2 py-0.5 text-xs font-bold text-white">{uHeight}U</span>
          )}
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-semibold leading-snug">{name}</h3>
          {depths.length > 0 && <p className="mt-1 text-xs text-muted">Depth: {[...new Set(depths)].join(" / ")} mm</p>}
          <div className="mt-auto flex items-end justify-between pt-4">
            <div>
              <div className="text-xs text-muted">{dealer ? "Dealer price from" : "From"}</div>
              <div className="text-lg font-extrabold">{inr(min)}</div>
            </div>
            <Badge tone={inStock ? "green" : "red"}>{inStock ? "In stock" : "Out of stock"}</Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
