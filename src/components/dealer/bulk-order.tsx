"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { gstBreakup } from "@/lib/gst";
import { inr, inr2 } from "@/lib/money";

export type BulkRow = {
  id: string; name: string; label: string; sku: string; price: number; retail: number; moq: number; stock: number;
  klass: "THREE_WHEELER" | "TATA_ACE"; gstRate: number; extra?: boolean;
};
type Freight = Record<"THREE_WHEELER" | "TATA_ACE", { local: number; state: number; inter: number }>;
export type BulkDealer = {
  approved: boolean; pending: boolean; tier: string; available: number; overdue: boolean;
  sellerState: string; buyerState: string; band: "local" | "state" | "inter";
};

export function BulkOrderForm({ rows, initialQty, dealer, freight, bank }: {
  rows: BulkRow[]; initialQty: Record<string, number>; dealer: BulkDealer; freight: Freight; bank: string;
}) {
  const [qty, setQty] = useState<Record<string, number>>(initialQty);
  const [q, setQ] = useState("");
  const [freightMode, setFreightMode] = useState<"PREPAID" | "SELF">("PREPAID");
  const [payment, setPayment] = useState<"ONLINE" | "BANK" | "CREDIT">("ONLINE");
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ number: string; payment: string } | null>(null);

  const visible = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    return !s || r.name.toLowerCase().includes(s) || r.sku.toLowerCase().includes(s) || r.label.toLowerCase().includes(s);
  });
  const lines = rows.filter((r) => (qty[r.id] ?? 0) > 0);

  const calc = useMemo(() => {
    const goods = lines.map((r) => ({ amount: r.price * qty[r.id], rate: r.gstRate }));
    let freightAmt = 0;
    if (freightMode === "PREPAID" && lines.length > 0) {
      const klass = lines.some((r) => r.klass === "TATA_ACE") ? "TATA_ACE" : "THREE_WHEELER";
      freightAmt = freight[klass][dealer.band];
    }
    const all = freightAmt ? [...goods, { amount: freightAmt, rate: 18 }] : goods;
    const g = gstBreakup(all, dealer.sellerState, dealer.buyerState);
    return { g, freightAmt, goods: goods.reduce((n, l) => n + l.amount, 0) };
  }, [lines, qty, freightMode, freight, dealer]);

  const creditReason = !dealer.approved
    ? "Available once your dealer account is approved."
    : dealer.overdue
      ? "Blocked: you have overdue invoices. Pay online or by bank transfer."
      : dealer.available <= 0
        ? "No credit limit available."
        : calc.g.total > dealer.available
          ? `Order exceeds your available credit (${inr(dealer.available)}).`
          : null;

  const place = () => {
    setError(null);
    for (const r of lines) {
      const n = qty[r.id];
      if (n < r.moq) return setError(`${r.name} (${r.label}): minimum order quantity is ${r.moq}.`);
      if (n > r.stock) return setError(`Only ${r.stock} in stock for ${r.name} (${r.label}).`);
    }
    if (lines.length === 0) return setError("Enter a quantity for at least one item.");
    if (payment === "CREDIT" && creditReason) return setError(creditReason);
    setPlaced({ number: `RK-${10008 + Math.floor(Math.random() * 90)}`, payment });
  };

  if (placed) {
    return (
      <Card className="space-y-3 p-8 text-center">
        <div className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Order placed (demo)</div>
        <h2 className="text-2xl font-bold">Order {placed.number}</h2>
        {placed.payment === "BANK" ? (
          <div className="mx-auto max-w-xl space-y-2 text-sm">
            <p>Stock is reserved and a proforma invoice has been emailed to you. Pay by NEFT / RTGS and enter the UTR under Orders.</p>
            <p className="rounded-lg bg-slate-50 p-3 text-xs text-muted">{bank}</p>
          </div>
        ) : placed.payment === "CREDIT" ? (
          <p className="text-sm text-muted">Confirmed against your credit. The amount is added to your outstanding balance.</p>
        ) : (
          <p className="text-sm text-muted">Payment received (mock) and your order is confirmed.</p>
        )}
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="ghost" onClick={() => { setPlaced(null); setQty({}); }}>New order</Button>
        </div>
      </Card>
    );
  }

  const PAY = [
    { key: "ONLINE", label: "Online payment", note: "UPI, cards, net banking (Razorpay / Cashfree)", off: null },
    { key: "BANK", label: "Bank transfer (NEFT / RTGS)", note: "Against a proforma invoice; stock held for the hold period", off: dealer.approved ? null : "Approved dealers only." },
    { key: "CREDIT", label: "Credit (pay later)", note: "Added to your outstanding balance", off: creditReason },
  ] as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-3">
        <input className={inputCls} placeholder="Search by name, size or SKU..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Retail</th>
                <th className="p-3 text-right">{dealer.approved ? "Your price" : "Price"}</th>
                <th className="p-3 text-right">MOQ</th>
                <th className="p-3 text-right">Stock</th>
                <th className="p-3">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((r) => (
                <tr key={r.id}>
                  <td className="p-3">
                    {r.name} <span className="text-muted">({r.label})</span>
                    <div className="text-xs text-muted">{r.sku}{r.extra && " - from your reorder"}</div>
                  </td>
                  <td className="p-3 text-right text-muted">{dealer.approved ? <span className="line-through">{inr(r.retail)}</span> : "incl. GST"}</td>
                  <td className="p-3 text-right font-semibold">
                    {inr(dealer.approved ? r.price : r.retail)}
                    {dealer.approved && <span className="ml-1 text-xs font-normal text-muted">+ GST</span>}
                  </td>
                  <td className="p-3 text-right text-muted">{r.moq}</td>
                  <td className="p-3 text-right">
                    <span className={r.stock < 5 ? "font-semibold text-red-600" : ""}>{r.stock}</span>
                  </td>
                  <td className="p-3">
                    <input
                      type="number" min={0} max={r.stock} value={qty[r.id] ?? 0} disabled={!dealer.approved}
                      onChange={(e) => setQty((c) => ({ ...c, [r.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) }))}
                      className="w-20 rounded-lg border border-line px-2 py-1.5 disabled:bg-slate-50"
                    />
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted">No items match your search.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
        <p className="text-xs text-muted">
          {dealer.approved ? `Trade prices for your ${dealer.tier.toLowerCase()} tier, excluding GST.` : "Retail prices are shown until your dealer account is approved."}
        </p>
      </div>

      <Card className="h-fit space-y-4 p-5 text-sm lg:sticky lg:top-4">
        <h2 className="font-bold">Order summary</h2>
        {lines.length === 0 ? (
          <p className="text-muted">Enter quantities to build your order.</p>
        ) : (
          <ul className="space-y-1">
            {lines.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span>{r.name} <span className="text-muted">x {qty[r.id]}</span></span>
                <span>{inr(r.price * qty[r.id])}</span>
              </li>
            ))}
          </ul>
        )}

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Freight</div>
          {([
            ["PREPAID", "Prepaid freight", "We book Porter; charge added to the invoice"],
            ["SELF", "Self-booked (Rs 0)", "You book your own vehicle or pay the driver"],
          ] as const).map(([k, l, n]) => (
            <label key={k} className="mb-1 flex cursor-pointer gap-2 rounded-lg border border-line p-2 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
              <input type="radio" name="freight" checked={freightMode === k} onChange={() => setFreightMode(k)} />
              <span><b>{l}</b><span className="block text-xs text-muted">{n}</span></span>
            </label>
          ))}
        </div>

        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Payment</div>
          {PAY.map((p) => (
            <label key={p.key} className={`mb-1 flex gap-2 rounded-lg border border-line p-2 ${p.off ? "cursor-not-allowed opacity-60" : "cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-soft"}`}>
              <input type="radio" name="payment" disabled={!!p.off} checked={payment === p.key} onChange={() => setPayment(p.key)} />
              <span>
                <b>{p.label}</b>
                <span className="block text-xs text-muted">{p.off ?? p.note}</span>
              </span>
            </label>
          ))}
        </div>

        <div className="space-y-1 border-t border-line pt-3">
          <Row k="Goods (ex-GST)" v={inr2(calc.goods)} />
          {freightMode === "PREPAID" && <Row k="Freight" v={calc.freightAmt ? inr2(calc.freightAmt) : "-"} />}
          {calc.g.intraState ? (
            <>
              <Row k="CGST" v={inr2(calc.g.cgst)} />
              <Row k="SGST" v={inr2(calc.g.sgst)} />
            </>
          ) : (
            <Row k="IGST" v={inr2(calc.g.igst)} />
          )}
          <div className="flex justify-between pt-1 text-base font-bold"><span>Total</span><span>{inr2(calc.g.total)}</span></div>
          <p className="text-xs text-muted">
            Ships from {dealer.sellerState} to {dealer.buyerState}: {calc.g.intraState ? "CGST + SGST" : "IGST"} applies.
          </p>
        </div>

        {error && <p className="rounded-lg bg-red-50 p-2 text-red-700">{error}</p>}
        <Button className="w-full" disabled={!dealer.approved || dealer.pending} onClick={place}>
          {dealer.approved ? "Place order" : "Ordering unlocks after approval"}
        </Button>
        {dealer.approved && <Badge tone="gray">Demo: no real order is created</Badge>}
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted">{k}</span><span>{v}</span></div>;
}
