import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui";
import { RackArt } from "@/components/rack-art";
import { getProduct } from "@/lib/data/catalog";
import { db } from "@/lib/db";
import { SHIPPING_CLASS_LABEL } from "@/lib/logistics";
import { stockKind } from "@/components/store/stock";
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
    retail: v.retailPrice,
    dealer: v.dealerPrice,
    needsConfirmation: v.needsConfirmation,
    weightKg: v.weightKg,
    packedKg: v.packedKg,
    boxSize: v.boxSize,
    shipping: SHIPPING_CLASS_LABEL[v.shippingClass],
    moq: v.moq,
    stock: stockKind(v.stock.reduce((n, s) => n + s.qty, 0)),
  }));

  // Rack pages suggest a few compatible accessories as add-ons.
  const isRack = p.kind !== "ACCESSORY";
  const addons = isRack
    ? (await db.product.findMany({ where: { kind: { in: ["ACCESSORY"] } } }))
        .filter((a) => ["power-strips", "cable-organisers", "cooling-fans", "patch-panels", "cage-nuts-and-bolts"].includes(a.slug))
        .map((a) => ({
          variantId: a.variants[0].id,
          name: a.name,
          sku: a.variants[0].sku,
          label: a.variants[0].label || "Standard",
          retail: a.variants[0].retailPrice,
          dealer: a.variants[0].dealerPrice,
          gstRate: a.gstRate,
        }))
    : [];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex h-80 items-center justify-center rounded-2xl bg-linear-to-b from-slate-50 to-slate-100 p-6 ring-1 ring-line md:h-[34rem]">
        {p.uHeight ? <RackArt units={Math.min(p.uHeight, 20)} className="h-full" /> : <div className="text-8xl text-slate-300">&#9636;</div>}
      </div>
      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          <Badge tone="blue">{p.category.name}</Badge>
          {p.sourcing === "MANUFACTURED" && <Badge tone="gray">Made in-house</Badge>}
          {p.uHeight && <Badge tone="gray">{p.uHeight}U</Badge>}
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">{p.name}</h1>
        <p className="mt-2 text-muted">{p.description}</p>
        <VariantPicker
          variants={variants}
          productName={p.name}
          productSlug={p.slug}
          gstRate={p.gstRate}
          hsn={p.hsn}
          addons={addons}
        />
        <Card className="mt-6 p-4 text-sm text-muted">
          Retail prices include {p.gstRate}% GST. Dealer prices are shown ex-GST (+ GST){p.hsn ? ` - HSN ${p.hsn}` : ""}. Tax invoice emailed after payment.
        </Card>
      </div>
    </div>
  );
}
