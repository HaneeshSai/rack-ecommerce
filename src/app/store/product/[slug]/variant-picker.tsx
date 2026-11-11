"use client";

import { useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "@/components/ui";
import { useCart } from "@/components/cart";
import { CompareToggle } from "@/components/store/compare";
import { STOCK_LABEL, STOCK_TONE, type StockKind } from "@/components/store/stock";
import { Price, useViewer } from "@/components/store/viewer";

type V = {
  id: string; sku: string; label: string;
  depthMm: number | null; widthMm: number | null; heightMm: number | null;
  retail: number; dealer: number; needsConfirmation: boolean;
  weightKg: number; packedKg: number; boxSize: string; shipping: string; moq: number;
  stock: StockKind;
};
type Addon = { variantId: string; name: string; sku: string; label: string; retail: number; dealer: number; gstRate: number };

export function VariantPicker({
  variants, productName, productSlug, gstRate, hsn, addons,
}: {
  variants: V[]; productName: string; productSlug: string; gstRate: number; hsn: string; addons: Addon[];
}) {
  const [sel, setSel] = useState(variants[0].id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [addedOn, setAddedOn] = useState<string[]>([]);
  const cart = useCart();
  const viewer = useViewer();
  const router = useRouter();
  const v = variants.find((x) => x.id === sel)!;

  const addToCart = () => {
    cart.add({ variantId: v.id, name: productName, sku: v.sku, label: v.label, price: v.retail, gstRate }, qty);
    setAdded(true);
  };

  const specs: [string, string][] = [
    ["SKU", v.sku],
    ["Width", v.widthMm ? `${v.widthMm} mm` : "To confirm"],
    ["Depth", v.depthMm ? `${v.depthMm} mm` : "-"],
    ["Height", v.heightMm ? `${v.heightMm} mm` : "-"],
    ["Net weight", `${v.weightKg} kg`],
    ["Packed weight", `${v.packedKg} kg`],
    ["Packed box size", v.boxSize],
    ["Shipping class", v.shipping],
    ["HSN code", hsn || "-"],
    ["GST rate", `${gstRate}%`],
  ];

  return (
    <div className="mt-6 space-y-5">
      {variants.length > 1 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Depth / size</div>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <button
                key={x.id}
                onClick={() => { setSel(x.id); setAdded(false); }}
                className={clsx(
                  "rounded-lg border px-3 py-2 text-sm transition",
                  x.id === sel ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white hover:border-accent",
                )}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Price retail={v.retail} dealer={v.dealer} className="text-3xl font-extrabold" />
        <div className="mt-1 text-xs text-muted">
          {viewer.isDealer ? `${viewer.tier.charAt(0)}${viewer.tier.slice(1).toLowerCase()} tier trade price, GST extra` : "Inclusive of GST"}
        </div>
      </div>

      {v.needsConfirmation && <Badge tone="amber">Dimensions pending confirmation</Badge>}

      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        Availability <Badge tone={STOCK_TONE[v.stock]}>{STOCK_LABEL[v.stock]}</Badge>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number" min={1} value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-lg border border-line px-3 py-2.5 text-sm"
          aria-label="Quantity"
        />
        <Button onClick={addToCart}>Add to cart</Button>
        {added && <Button variant="dark" onClick={() => router.push("/cart")}>View cart</Button>}
      </div>
      {viewer.isDealer && v.moq > 1 && <p className="text-xs text-amber-700">Dealer minimum order quantity: {v.moq}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/request-quote?product=${productSlug}`}
          className="inline-flex items-center rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent-soft"
        >
          Request a quote for bulk orders
        </Link>
        <CompareToggle slug={productSlug} />
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">Specifications</div>
        <dl className="divide-y divide-line text-sm">
          {specs.map(([k, val]) => (
            <div key={k} className="flex justify-between gap-4 px-4 py-2">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{val}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {addons.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold">Compatible accessories</div>
          <Card className="divide-y divide-line">
            {addons.map((a) => (
              <div key={a.variantId} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <Price retail={a.retail} dealer={a.dealer} className="text-xs text-muted" />
                </div>
                <Button
                  variant={addedOn.includes(a.variantId) ? "dark" : "ghost"}
                  className="!py-1.5"
                  onClick={() => {
                    cart.add({ variantId: a.variantId, name: a.name, sku: a.sku, label: a.label, price: a.retail, gstRate: a.gstRate }, 1);
                    setAddedOn((cur) => [...cur, a.variantId]);
                  }}
                >
                  {addedOn.includes(a.variantId) ? "Added ✓" : "+ Add"}
                </Button>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
