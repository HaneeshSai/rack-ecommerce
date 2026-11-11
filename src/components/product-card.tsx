import Link from "next/link";
import { Badge, Card } from "@/components/ui";
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
    <Link href={href}>
      <Card className="h-full p-4 transition hover:border-accent hover:shadow-md">
        <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-slate-100 text-3xl font-black text-slate-300">
          {uHeight ? `${uHeight}U` : "▤"}
        </div>
        <h3 className="font-semibold leading-snug">{name}</h3>
        {depths.length > 0 && (
          <p className="mt-1 text-xs text-muted">
            Depth: {[...new Set(depths)].join(" / ")} mm
          </p>
        )}
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-muted">{dealer ? "Dealer price from" : "From"}</div>
            <div className="text-lg font-bold">{inr(min)}</div>
          </div>
          <Badge tone={inStock ? "green" : "red"}>{inStock ? "In stock" : "Out of stock"}</Badge>
        </div>
      </Card>
    </Link>
  );
}
