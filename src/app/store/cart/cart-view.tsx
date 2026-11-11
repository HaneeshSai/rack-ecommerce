"use client";

import Link from "next/link";
import { Trash2 } from "@/components/icons";
import { Card, LinkButton, PageTitle } from "@/components/ui";
import { useCart } from "@/components/cart";
import { useViewer } from "@/components/store/viewer";
import type { PriceInfo } from "@/components/store/price-map";
import { inr } from "@/lib/money";

export function CartView({ priceMap }: { priceMap: Record<string, PriceInfo> }) {
  const { items, setQty, remove } = useCart();
  const viewer = useViewer();
  const unit = (id: string, fallback: number) => {
    const p = priceMap[id];
    return p ? viewer.unit(p.retail, p.dealer) : fallback;
  };
  const subtotal = items.reduce((n, i) => n + unit(i.variantId, i.price) * i.qty, 0);

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted">Pick a rack to get started.</p>
        <div className="mt-6"><LinkButton href="/category/network">Browse racks</LinkButton></div>
      </div>
    );
  }

  return (
    <>
      <PageTitle title="Cart" />
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {items.map((i) => {
            const u = unit(i.variantId, i.price);
            const moq = priceMap[i.variantId]?.moq ?? 1;
            return (
              <Card key={i.variantId} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <div className="font-semibold">{i.name}</div>
                  <div className="text-sm text-muted">{i.label} - {i.sku}</div>
                  <div className="mt-1 text-sm">
                    {inr(u)} each{viewer.isDealer && <span className="ml-1 text-xs text-muted">+ GST</span>}
                  </div>
                  {viewer.isDealer && i.qty < moq && (
                    <div className="mt-1 text-xs text-amber-700">Dealer minimum order quantity is {moq}.</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={1} value={i.qty}
                    onChange={(e) => setQty(i.variantId, Number(e.target.value) || 1)}
                    className="w-16 rounded-lg border border-line px-2 py-1.5 text-sm"
                    aria-label="Quantity"
                  />
                  <div className="w-24 text-right font-semibold">{inr(u * i.qty)}</div>
                  <button onClick={() => remove(i.variantId)} aria-label="Remove" className="text-muted hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
          <Link href="/" className="inline-block text-sm text-muted hover:text-foreground">Continue shopping</Link>
        </div>
        <Card className="h-fit space-y-3 p-5">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
          <p className="text-xs text-muted">
            {viewer.isDealer
              ? "Trade prices exclude GST. GST and freight are added at checkout."
              : "Prices include GST. Freight is added at checkout based on your city."}
          </p>
          <LinkButton href="/checkout" className="w-full">Checkout</LinkButton>
        </Card>
      </div>
    </>
  );
}
