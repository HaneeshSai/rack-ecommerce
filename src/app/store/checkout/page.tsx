"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, PageTitle, inputCls } from "@/components/ui";
import { useCart } from "@/components/cart";
import { placeOrder } from "@/lib/actions/orders";
import { gstBreakup, STATES, WAREHOUSE_STATE } from "@/lib/gst";
import { inr, inr2 } from "@/lib/money";

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const router = useRouter();
  const [state, setState] = useState("Telangana");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const g = gstBreakup(
    items.map((i) => ({ amount: i.price * i.qty, rate: i.gstRate })),
    WAREHOUSE_STATE.HYD,
    state,
  );

  const submit = (fd: FormData) => {
    setError(null);
    start(async () => {
      const res = await placeOrder({
        name: fd.get("name"),
        phone: fd.get("phone"),
        gstin: fd.get("gstin") ?? "",
        state,
        items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      });
      if ("error" in res) setError(res.error);
      else {
        clear();
        router.push(`/order/${res.orderNumber}`);
      }
    });
  };

  if (items.length === 0) return <p className="py-20 text-center text-muted">Your cart is empty.</p>;

  return (
    <>
      <PageTitle title="Checkout" />
      <form action={submit} className="grid gap-6 md:grid-cols-[1fr_360px]">
        <Card className="space-y-4 p-5">
          <label className="block text-sm font-medium">Full name
            <input name="name" required className={inputCls + " mt-1"} />
          </label>
          <label className="block text-sm font-medium">Mobile (WhatsApp updates)
            <input name="phone" required inputMode="numeric" maxLength={10} className={inputCls + " mt-1"} />
          </label>
          <label className="block text-sm font-medium">GSTIN <span className="font-normal text-muted">(optional, for ITC)</span>
            <input name="gstin" maxLength={15} className={inputCls + " mt-1 uppercase"} />
          </label>
          <label className="block text-sm font-medium">Delivery state
            <select value={state} onChange={(e) => setState(e.target.value)} className={inputCls + " mt-1"}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </Card>

        <Card className="h-fit space-y-2 p-5 text-sm">
          {items.map((i) => (
            <div key={i.variantId} className="flex justify-between gap-3">
              <span>{i.name} <span className="text-muted">({i.label}) x {i.qty}</span></span>
              <span>{inr(i.price * i.qty)}</span>
            </div>
          ))}
          <hr className="border-line" />
          <Row k="Subtotal" v={inr2(g.subtotal)} />
          {g.intraState ? (
            <>
              <Row k="CGST" v={inr2(g.cgst)} />
              <Row k="SGST" v={inr2(g.sgst)} />
            </>
          ) : (
            <Row k="IGST" v={inr2(g.igst)} />
          )}
          <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
            <span>Total</span><span>{inr2(g.total)}</span>
          </div>
          {error && <p className="rounded-lg bg-red-50 p-2 text-red-700">{error}</p>}
          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Placing order..." : "Pay (mock) and place order"}
          </Button>
          <p className="text-xs text-muted">Prototype: no real payment is taken.</p>
        </Card>
      </form>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted">{k}</span><span>{v}</span></div>;
}
