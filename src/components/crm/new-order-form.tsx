"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, inputCls } from "@/components/ui";
import { createSalesOrder } from "@/lib/actions/crm";
import { FIELD_REPS, PAYMENT_TERMS } from "@/lib/crm";
import { tierPrice, type Tier } from "@/lib/logistics";
import { inr } from "@/lib/money";
import { useRun } from "./use-run";

type Dealer = { id: string; name: string; tier: Tier; hub: string; termsDays: number };
type Variant = { id: string; name: string; dealerPrice: number; moq: number };
type Line = { variantId: string; qty: number; price: number }; // price in rupees

export function NewOrderForm({ dealers, variants, hubs, initialDealer, initialLines, initialTerms }: {
  dealers: Dealer[]; variants: Variant[]; hubs: { code: string; city: string }[]; initialDealer?: string; initialLines?: Line[]; initialTerms?: string;
}) {
  const router = useRouter();
  const { run, pending } = useRun();
  const start = dealers.find((d) => d.id === initialDealer) ?? dealers[0];
  const [dealerId, setDealerId] = useState(start?.id ?? "");
  const [rep, setRep] = useState(FIELD_REPS[0]);
  const [terms, setTerms] = useState(initialTerms ?? (start && start.termsDays === 0 ? PAYMENT_TERMS[2] : PAYMENT_TERMS[start?.termsDays === 15 ? 0 : 1]));
  const [hub, setHub] = useState(start?.hub ?? "HYD");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>(initialLines?.length ? initialLines : [{ variantId: "", qty: 1, price: 0 }]);

  const dealer = dealers.find((d) => d.id === dealerId);
  const priceFor = (variantId: string, d = dealer) => {
    const v = variants.find((x) => x.id === variantId);
    return v && d ? tierPrice(v.dealerPrice, d.tier) / 100 : 0;
  };
  const setLine = (i: number, patch: Partial<Line>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const sub = lines.reduce((n, l) => n + l.qty * l.price, 0);

  function pickDealer(id: string) {
    const d = dealers.find((x) => x.id === id)!;
    setDealerId(id);
    setHub(d.hub);
    setTerms(d.termsDays === 0 ? PAYMENT_TERMS[2] : d.termsDays === 15 ? PAYMENT_TERMS[0] : PAYMENT_TERMS[1]);
    setLines(lines.map((l) => (l.variantId ? { ...l, price: priceFor(l.variantId, d) } : l)));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <Card className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm"><span className="font-semibold">Dealer</span>
            <select className={inputCls + " mt-1"} value={dealerId} onChange={(e) => pickDealer(e.target.value)}>
              {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
          <label className="text-sm"><span className="font-semibold">Field sales person</span>
            <select className={inputCls + " mt-1"} value={rep} onChange={(e) => setRep(e.target.value)}>{FIELD_REPS.map((r) => <option key={r}>{r}</option>)}</select></label>
          <label className="text-sm"><span className="font-semibold">Payment terms</span>
            <select className={inputCls + " mt-1"} value={terms} onChange={(e) => setTerms(e.target.value)}>{PAYMENT_TERMS.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="text-sm"><span className="font-semibold">Dispatch hub</span>
            <select className={inputCls + " mt-1"} value={hub} onChange={(e) => setHub(e.target.value)}>{hubs.map((h) => <option key={h.code} value={h.code}>{h.city}</option>)}</select></label>
        </div>

        <div>
          <div className="mb-2 text-sm font-semibold">Items</div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-[1fr_72px_100px_32px] items-center gap-2">
                <select className={inputCls} value={l.variantId} onChange={(e) => setLine(i, { variantId: e.target.value, price: priceFor(e.target.value) })}>
                  <option value="">Choose a variant</option>
                  {variants.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
                <input type="number" min={1} className={inputCls} value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} aria-label="Quantity" />
                <input type="number" min={0} className={inputCls} value={l.price} onChange={(e) => setLine(i, { price: Number(e.target.value) })} aria-label="Unit price in rupees" />
                <button type="button" className="text-lg text-muted hover:text-red-600" onClick={() => setLines(lines.length > 1 ? lines.filter((_, j) => j !== i) : lines)} aria-label="Remove line">×</button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">Columns: variant, quantity, unit price in Rs (ex-GST, filled from the dealer&apos;s tier). You can change the price.</p>
          <Button variant="ghost" className="mt-2 !py-1.5" onClick={() => setLines([...lines, { variantId: "", qty: 1, price: 0 }])}>+ Add item</Button>
        </div>

        <label className="block text-sm"><span className="font-semibold">Notes from the field</span>
          <textarea className={inputCls + " mt-1"} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery date, site contact, special requests" /></label>
      </Card>

      <Card className="h-fit space-y-3 p-5 text-sm">
        <h2 className="font-bold">Summary</h2>
        <div className="flex justify-between"><span className="text-muted">Dealer</span><b>{dealer?.name}</b></div>
        <div className="flex justify-between"><span className="text-muted">Terms</span><span>{terms}</span></div>
        <div className="flex justify-between"><span className="text-muted">Subtotal (ex-GST)</span><span>{inr(sub * 100)}</span></div>
        <div className="flex justify-between"><span className="text-muted">GST at 18%</span><span>{inr(Math.round(sub * 18))}</span></div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{inr(Math.round(sub * 118))}</span></div>
        <Button
          className="w-full"
          disabled={pending}
          onClick={() => run(
            () => createSalesOrder({ dealerId, rep, terms, hub, notes, lines: lines.map((l) => ({ variantId: l.variantId, qty: l.qty, price: Math.round(l.price * 100) })) }),
            (r) => router.push(`/orders/${r.id}`),
          )}
        >
          Create sales order
        </Button>
      </Card>
    </div>
  );
}
