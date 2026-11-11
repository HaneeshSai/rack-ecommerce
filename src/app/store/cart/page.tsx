"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Card, LinkButton, PageTitle } from "@/components/ui";
import { useCart } from "@/components/cart";
import { inr } from "@/lib/money";

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

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
          {items.map((i) => (
            <Card key={i.variantId} className="flex items-center justify-between gap-4 p-4">
              <div>
                <div className="font-semibold">{i.name}</div>
                <div className="text-sm text-muted">{i.label} - {i.sku}</div>
                <div className="mt-1 text-sm">{inr(i.price)} each</div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number" min={1} value={i.qty}
                  onChange={(e) => setQty(i.variantId, Number(e.target.value) || 1)}
                  className="w-16 rounded-lg border border-line px-2 py-1.5 text-sm"
                />
                <div className="w-24 text-right font-semibold">{inr(i.price * i.qty)}</div>
                <button onClick={() => remove(i.variantId)} aria-label="Remove" className="text-muted hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))}
          <Link href="/" className="inline-block text-sm text-muted hover:text-foreground">Continue shopping</Link>
        </div>
        <Card className="h-fit space-y-3 p-5">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
          <p className="text-xs text-muted">GST is calculated at checkout based on your state.</p>
          <LinkButton href="/checkout" className="w-full">Checkout</LinkButton>
        </Card>
      </div>
    </>
  );
}
