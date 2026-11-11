"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, LinkButton } from "@/components/ui";
import { useCompare } from "@/components/store/compare";
import { Price } from "@/components/store/viewer";

export type CompareProduct = {
  slug: string; name: string; category: string; uHeight: number | null; variantCount: number;
  depthMm: number | null; widthMm: number | null; heightMm: number | null; weightKg: number;
  shippingClass: string; sourcing: string; retail: number; dealer: number;
};

const mm = (n: number | null) => (n ? `${n} mm` : "To confirm");

export function CompareView({ products }: { products: CompareProduct[] }) {
  const sp = useSearchParams();
  const { slugs, clear } = useCompare();
  const fromUrl = (sp.get("p") ?? "").split(",").filter(Boolean);
  const wanted = fromUrl.length ? fromUrl : slugs;
  const picked = wanted.map((s) => products.find((p) => p.slug === s)).filter((p): p is CompareProduct => !!p).slice(0, 4);

  if (picked.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted">Nothing to compare yet. Use the &quot;+ Compare&quot; button on product cards.</p>
        <div className="mt-5"><LinkButton href="/category/network">Browse racks</LinkButton></div>
      </div>
    );
  }

  const without = (slug: string) => `/compare?p=${picked.filter((p) => p.slug !== slug).map((p) => p.slug).join(",")}`;
  const rows: [string, (p: CompareProduct) => React.ReactNode][] = [
    ["Category", (p) => p.category],
    ["Height", (p) => (p.uHeight ? `${p.uHeight}U` : "-")],
    ["Depth", (p) => mm(p.depthMm)],
    ["Width", (p) => mm(p.widthMm)],
    ["Height (mm)", (p) => mm(p.heightMm)],
    ["Net weight", (p) => `${p.weightKg} kg`],
    ["Shipping class", (p) => p.shippingClass],
    ["Made", (p) => p.sourcing],
    ["Variants", (p) => `${p.variantCount} option${p.variantCount > 1 ? "s" : ""}`],
    ["Price from", (p) => <Price retail={p.retail} dealer={p.dealer} className="font-extrabold" />],
  ];

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="w-36 p-4 text-left text-xs uppercase text-muted">Spec</th>
            {picked.map((p) => (
              <th key={p.slug} className="p-4 text-left align-top">
                <Link href={`/product/${p.slug}`} className="font-bold hover:text-accent">{p.name}</Link>
                <div>
                  <Link href={without(p.slug)} className="text-xs font-normal text-muted hover:text-red-600">Remove</Link>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([label, f]) => (
            <tr key={label}>
              <td className="p-4 text-muted">{label}</td>
              {picked.map((p) => <td key={p.slug} className="p-4">{f(p)}</td>)}
            </tr>
          ))}
          <tr>
            <td className="p-4" />
            {picked.map((p) => (
              <td key={p.slug} className="p-4"><LinkButton href={`/product/${p.slug}`} variant="dark">View product</LinkButton></td>
            ))}
          </tr>
        </tbody>
      </table>
      <div className="border-t border-line p-3 text-right">
        <button onClick={clear} className="text-xs text-muted hover:text-foreground">Clear compare list</button>
      </div>
    </Card>
  );
}
