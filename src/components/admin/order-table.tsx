"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Card, inputCls } from "@/components/ui";
import { inr } from "@/lib/money";
import { STATUS_LABEL, STATUS_TONE, fmtDate } from "@/components/admin/format";

type Row = {
  number: string; createdAt: string; customer: string; phone: string; buyerType: string; dealerId: string | null;
  city: string; warehouses: string[]; paymentMode: string; status: string; total: number;
};

export function OrderTable({
  rows, dealers, warehouses, fixedWarehouse,
}: { rows: Row[]; dealers: { id: string; name: string }[]; warehouses: string[]; fixedWarehouse: string | null }) {
  const [status, setStatus] = useState("");
  const [wh, setWh] = useState(fixedWarehouse ?? "");
  const [dealer, setDealer] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const shown = rows.filter((r) => {
    if (status && r.status !== status) return false;
    if (wh && !r.warehouses.includes(wh)) return false;
    if (dealer === "retail" ? r.buyerType !== "RETAIL" : dealer && r.dealerId !== dealer) return false;
    const day = r.createdAt.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3 text-sm">
        <label className="font-medium">Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls + " mt-1"}>
            <option value="">All</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="font-medium">Warehouse
          <select value={wh} disabled={!!fixedWarehouse} onChange={(e) => setWh(e.target.value)} className={inputCls + " mt-1"}>
            <option value="">All hubs</option>
            {warehouses.map((w) => <option key={w}>{w}</option>)}
          </select>
        </label>
        <label className="font-medium">Buyer
          <select value={dealer} onChange={(e) => setDealer(e.target.value)} className={inputCls + " mt-1"}>
            <option value="">All</option><option value="retail">Retail customers</option>
            {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <label className="font-medium">From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls + " mt-1"} /></label>
        <label className="font-medium">To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls + " mt-1"} /></label>
        <span className="pb-2 text-muted">{shown.length} orders</span>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Buyer</th><th className="p-3">City</th>
              <th className="p-3">Hub</th><th className="p-3">Payment</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((o) => (
              <tr key={o.number} className="hover:bg-slate-50">
                <td className="p-3 font-semibold"><Link href={`/orders/${o.number}`} className="text-accent hover:underline">{o.number}</Link></td>
                <td className="p-3 text-muted">{fmtDate(o.createdAt)}</td>
                <td className="p-3">{o.customer}<div className="text-xs text-muted"><Badge tone={o.buyerType === "DEALER" ? "blue" : "gray"}>{o.buyerType.toLowerCase()}</Badge> {o.phone}</div></td>
                <td className="p-3">{o.city}</td>
                <td className="p-3">{o.warehouses.join(", ")}</td>
                <td className="p-3 text-muted">{o.paymentMode.toLowerCase()}</td>
                <td className="p-3 text-right font-medium">{inr(o.total)}</td>
                <td className="p-3"><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted">No orders match these filters.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
