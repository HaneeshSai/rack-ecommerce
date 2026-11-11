import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { getProduct } from "@/lib/data/catalog";
import { VariantPicker } from "./variant-picker";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const variants = p.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    label: v.label || "Standard",
    depthMm: v.depthMm,
    widthMm: v.widthMm,
    heightMm: v.heightMm,
    price: v.retailPrice,
    needsConfirmation: v.needsConfirmation,
    stock: v.stock.map((s) => ({ city: s.warehouse.city, qty: s.qty })),
  }));

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex h-80 items-center justify-center rounded-2xl bg-slate-100 text-7xl font-black text-slate-300">
        {p.uHeight ? `${p.uHeight}U` : "▤"}
      </div>
      <div>
        <div className="mb-2 flex gap-2">
          <Badge tone="blue">{p.category.name}</Badge>
          {p.sourcing === "MANUFACTURED" && <Badge tone="gray">Made in-house</Badge>}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{p.name}</h1>
        <p className="mt-2 text-muted">{p.description}</p>
        <VariantPicker variants={variants} productName={p.name} gstRate={p.gstRate} />
        <Card className="mt-6 p-4 text-sm text-muted">
          GST {p.gstRate}% extra{p.hsn ? ` - HSN ${p.hsn}` : ""}. Tax invoice emailed after payment.
        </Card>
      </div>
    </div>
  );
}
