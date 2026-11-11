"use client";

import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { Badge, Button, Card, LinkButton, PageTitle, inputCls } from "@/components/ui";
import { inr, inr2 } from "@/lib/money";
import { EWAY_THRESHOLD } from "@/lib/logistics";
import { STATUS_LABEL, STATUS_TONE, fmtDate, fmtDateTime } from "@/components/admin/format";
import { useToast } from "@/components/admin/toast";
import type { OrderDTO } from "@/components/admin/data";

const FLOW = ["PLACED", "PAYMENT_PENDING", "CONFIRMED", "PACKED", "DISPATCHED", "DELIVERED"];

function nextStep(status: string, mode: string): { to: string; label: string } | null {
  switch (status) {
    case "PLACED": return mode.startsWith("BANK") ? { to: "PAYMENT_PENDING", label: "Send proforma and hold stock" } : { to: "CONFIRMED", label: "Confirm order" };
    case "PAYMENT_PENDING": return { to: "CONFIRMED", label: "Mark payment received" };
    case "CONFIRMED": return { to: "PACKED", label: "Mark packed" };
    case "PACKED": return { to: "DISPATCHED", label: "Dispatch" };
    case "DISPATCHED": return { to: "DELIVERED", label: "Mark delivered" };
    default: return null;
  }
}

export function OrderDetail({
  order, role, staffName, invoiceSeries, nextInvoiceNo, fromCity,
}: { order: OrderDTO; role: string; staffName: string; invoiceSeries: string; nextInvoiceNo: number; fromCity: string }) {
  const toast = useToast();
  const [status, setStatus] = useState(order.status);
  const [timeline, setTimeline] = useState(order.timeline);
  const [invoiceNo, setInvoiceNo] = useState(order.invoiceNo);
  const [dispatch, setDispatch] = useState(order.dispatch ?? { vehicleType: "Three-wheeler", vehicleNo: "", driverPhone: "", bookingId: "" });
  const [eway, setEway] = useState(order.ewayBill ?? "");
  const [podFile, setPodFile] = useState(order.pod ? "Delivery photo (uploaded)" : "");
  const [utr, setUtr] = useState(order.utr ?? "");

  const mode = order.paymentMode;
  const flow = FLOW.filter((s) => s !== "PAYMENT_PENDING" || mode.startsWith("BANK"));
  const idx = flow.indexOf(status);
  const step = nextStep(status, mode);
  const canMove = role === "ADMIN" || role === "WAREHOUSE" || role === "ACCOUNTS";
  const canPay = role === "ADMIN" || role === "ACCOUNTS";
  const needsEway = order.ewayRequired || order.total > EWAY_THRESHOLD;
  const cancellable = ["PLACED", "PAYMENT_PENDING", "CONFIRMED", "PACKED"].includes(status);

  const go = (to: string, note?: string) => {
    if (to === "CONFIRMED" && status === "PAYMENT_PENDING" && !canPay) return toast("Only Accounts or Admin can confirm a bank transfer.");
    if (to === "DISPATCHED" && !dispatch.vehicleNo.trim()) return toast("Enter the vehicle number before dispatching.");
    if (to === "DISPATCHED" && needsEway && !eway.trim()) return toast("E-way bill is required above Rs 50,000. Generate or enter one.");
    setStatus(to);
    setTimeline((t) => [{ status: to, at: new Date().toISOString(), by: staffName, note }, ...t]);
    if (to === "CONFIRMED" && !invoiceNo) setInvoiceNo(`${invoiceSeries}${String(nextInvoiceNo).padStart(4, "0")}`);
    const buyerMsg = ["CONFIRMED", "DISPATCHED", "DELIVERED"].includes(to) ? " Buyer notified by email + WhatsApp." : "";
    toast(`${order.number} is now ${STATUS_LABEL[to].toLowerCase()}.${buyerMsg}`);
  };

  const tax = order.igst > 0 ? [["IGST", order.igst]] : [["CGST", order.cgst], ["SGST", order.sgst]];

  return (
    <>
      <div className="print:hidden">
        <Link href="/orders" className="text-sm text-muted hover:text-foreground">&larr; All orders</Link>
        <div className="mt-2">
          <PageTitle
            title={`Order ${order.number}`}
            sub={`${order.customerName} - ${order.city}, ${order.shipState} - placed ${fmtDate(order.createdAt)}`}
            action={<Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>}
          />
        </div>

        <Card className="mb-6 p-5">
          <ol className="flex flex-wrap items-center gap-2 text-sm">
            {flow.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className={clsx("flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold",
                  idx >= i ? "bg-accent text-white" : "bg-slate-100 text-muted")}>{i + 1}</span>
                <span className={clsx(idx === i ? "font-bold" : idx > i ? "" : "text-muted")}>{STATUS_LABEL[s]}</span>
                {i < flow.length - 1 && <span className="text-slate-300">&mdash;</span>}
              </li>
            ))}
          </ol>
          {(status === "CANCELLED" || status === "RETURNED") && <p className="mt-3 text-sm font-semibold text-red-600">This order is {STATUS_LABEL[status].toLowerCase()}. Stock is released or returned per the ticket.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {step && canMove && <Button onClick={() => go(step.to)}>{step.label}</Button>}
            {step && !canMove && <span className="text-sm text-muted">Your role can view this order but not change its status.</span>}
            {cancellable && canMove && <Button variant="ghost" onClick={() => go("CANCELLED", "Cancelled by staff; stock released")}>Cancel order</Button>}
            {status === "DELIVERED" && canMove && <Button variant="ghost" onClick={() => go("RETURNED", "Return raised; ticket created")}>Raise return</Button>}
          </div>
          {mode.startsWith("BANK") && status === "PAYMENT_PENDING" && (
            <p className="mt-3 text-xs text-muted">Held until {fmtDate(order.holdUntil)}; reminder is sent, then the order is cancelled and stock released.</p>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <Card className="overflow-x-auto p-5 text-sm">
              <h2 className="mb-3 font-bold">Items</h2>
              <table className="w-full">
                <thead className="border-b border-line text-left text-xs uppercase text-muted">
                  <tr><th className="py-2">Item</th><th className="py-2">HSN</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Unit</th><th className="py-2 text-right">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((i) => (
                    <tr key={i.sku}>
                      <td className="py-2">{i.name}<div className="text-xs text-muted">{i.label} - {i.sku}</div></td>
                      <td className="py-2 text-muted">{i.hsn}</td>
                      <td className="py-2 text-right">{i.qty}</td>
                      <td className="py-2 text-right">{inr(i.unitPrice)}</td>
                      <td className="py-2 text-right">{inr(i.unitPrice * i.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 ml-auto max-w-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted">Taxable value</span><span>{inr2(order.subtotal)}</span></div>
                {tax.map(([k, v]) => <div key={k as string} className="flex justify-between"><span className="text-muted">{k}</span><span>{inr2(v as number)}</span></div>)}
                {order.shipping > 0 && <div className="flex justify-between"><span className="text-muted">Freight</span><span>{inr2(order.shipping)}</span></div>}
                <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{inr2(order.total)}</span></div>
                <p className="text-xs text-muted">{order.igst > 0 ? "Different state from the dispatching hub: IGST." : "Same state as the dispatching hub: CGST + SGST."}</p>
              </div>
            </Card>

            {["CONFIRMED", "PACKED", "DISPATCHED", "DELIVERED"].includes(status) && (
              <Card className="space-y-3 p-5 text-sm">
                <h2 className="font-bold">Dispatch details</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="font-medium">Vehicle type
                    <select value={dispatch.vehicleType} onChange={(e) => setDispatch({ ...dispatch, vehicleType: e.target.value })} className={inputCls + " mt-1"}>
                      <option>Three-wheeler</option><option>Tata Ace</option><option>Dealer&apos;s own vehicle</option>
                    </select>
                  </label>
                  <label className="font-medium">Vehicle number
                    <input value={dispatch.vehicleNo} onChange={(e) => setDispatch({ ...dispatch, vehicleNo: e.target.value.toUpperCase() })} placeholder="TS09 UB 1234" className={inputCls + " mt-1"} />
                  </label>
                  <label className="font-medium">Driver phone
                    <input value={dispatch.driverPhone} onChange={(e) => setDispatch({ ...dispatch, driverPhone: e.target.value })} className={inputCls + " mt-1"} />
                  </label>
                  <label className="font-medium">Porter booking ID
                    <input value={dispatch.bookingId} onChange={(e) => setDispatch({ ...dispatch, bookingId: e.target.value })} className={inputCls + " mt-1"} />
                  </label>
                </div>
                <p className="text-xs text-muted">Sent to the buyer by email and WhatsApp on dispatch. Freight: {order.delivery === "FREIGHT" ? "prepaid, booked by us" : order.delivery === "SELF" ? "self-booked by the dealer" : "store pickup"}.</p>
              </Card>
            )}

            {needsEway && ["PACKED", "DISPATCHED", "DELIVERED"].includes(status) && (
              <Card className="space-y-3 p-5 text-sm">
                <h2 className="font-bold">E-way bill <Badge tone="amber">order above Rs 50,000</Badge></h2>
                <div className="flex flex-wrap gap-2">
                  <input value={eway} onChange={(e) => setEway(e.target.value)} placeholder="E-way bill number" className={inputCls + " max-w-xs"} />
                  <Button variant="ghost" onClick={() => { setEway("EWB" + String(Math.floor(Math.random() * 9e11) + 1e11)); toast("E-way bill generated (mock)."); }}>Generate (mock)</Button>
                </div>
                <p className="text-xs text-muted">Generated through the GST service provider, or enter a number made outside the platform.</p>
              </Card>
            )}

            {["DISPATCHED", "DELIVERED"].includes(status) && (
              <Card className="space-y-3 p-5 text-sm">
                <h2 className="font-bold">Proof of delivery</h2>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPodFile(f.name); toast("Proof of delivery attached."); } }} className="text-sm" />
                {podFile && <p className="text-emerald-700">Attached: {podFile}</p>}
                <Button variant="ghost" onClick={() => toast("Buyer marked as received (demo).")}>Buyer marked received</Button>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="space-y-2 p-5 text-sm">
              <h2 className="mb-1 font-bold">Buyer and payment</h2>
              {[
                ["Buyer", `${order.customerName} (${order.buyerType.toLowerCase()})`], ["Phone", order.customerPhone],
                ["GSTIN", order.customerGstin ?? "-"], ["Ship to", `${order.city}, ${order.shipState}`],
                ["Dispatch hub", order.warehouses.join(", ") + (order.split ? " (split)" : "") + (fromCity ? ` - ${fromCity}` : "")],
                ["Payment", mode.toLowerCase()], ["Invoice", invoiceNo ?? "Not issued yet"],
              ].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><span className="text-muted">{k}</span><span className="text-right">{v}</span></div>)}
              {order.proformaNo && <div className="flex justify-between"><span className="text-muted">Proforma</span><span>{order.proformaNo}</span></div>}
              {status === "PAYMENT_PENDING" && (
                <label className="block pt-2 font-medium">UTR reference
                  <input value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="From the dealer or bank statement" className={inputCls + " mt-1"} />
                </label>
              )}
            </Card>

            <Card className="space-y-2 p-5 text-sm">
              <h2 className="mb-1 font-bold">Documents</h2>
              <div className="flex flex-wrap gap-2">
                <LinkButton href={`/orders/${order.number}/invoice`} variant="ghost">{invoiceNo ? "Tax invoice" : "Proforma invoice"}</LinkButton>
                <Button variant="ghost" onClick={() => window.print()}>Print packing slip</Button>
              </div>
            </Card>

            <Card className="p-5 text-sm">
              <h2 className="mb-3 font-bold">Timeline</h2>
              <ul className="space-y-3">
                {timeline.map((t, i) => (
                  <li key={i} className="border-l-2 border-accent/40 pl-3">
                    <div className="font-semibold">{STATUS_LABEL[t.status] ?? t.status}</div>
                    <div className="text-xs text-muted">{t.by} - {fmtDateTime(t.at)}</div>
                    {t.note && <div className="text-xs">{t.note}</div>}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>

      {/* Packing slip: hidden on screen, printed by "Print packing slip". */}
      <section className="hidden text-sm print:block">
        <h1 className="text-xl font-bold">Packing slip - {order.number}</h1>
        <p>Ship to: {order.customerName}, {order.city}, {order.shipState} - {order.customerPhone}</p>
        <p>Dispatch hub: {order.warehouses.join(", ")}</p>
        <table className="mt-4 w-full border-collapse">
          <thead><tr className="border-b text-left"><th className="py-1">Item</th><th>SKU</th><th className="text-right">Qty</th><th className="text-right">Packed</th></tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.sku} className="border-b"><td className="py-1">{i.name} ({i.label})</td><td>{i.sku}</td><td className="text-right">{i.qty}</td><td className="text-right">[ ]</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6">Vehicle: {dispatch.vehicleType} {dispatch.vehicleNo} - Driver {dispatch.driverPhone}</p>
      </section>
    </>
  );
}
