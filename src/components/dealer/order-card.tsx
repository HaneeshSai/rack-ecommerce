"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import { StatusTracker } from "./status-tracker";
import { STATUS_LABEL, dateStr, statusTone } from "./format";
import { inr } from "@/lib/money";

export type OrderView = {
  number: string; status: string; createdAt: string; total: number; paymentMode: string; delivery: string;
  warehouses: string[]; ewayRequired: boolean; ewayBill: string | null; invoiceNo: string | null; proformaNo: string | null;
  holdDaysLeft: number | null; overdue: boolean; dueDate: string | null;
  dispatch: { vehicleType: string; vehicleNo: string; driverPhone: string; bookingId: string } | null;
  items: { id: string; name: string; label: string; qty: number }[];
};

export function OrderCard({ o, bank }: { o: OrderView; bank: string }) {
  const [utr, setUtr] = useState("");
  const [sent, setSent] = useState(false);
  const bankOrder = o.paymentMode === "BANK TRANSFER" || o.status === "PAYMENT_PENDING";

  return (
    <Card className="space-y-4 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <b className="text-base">{o.number}</b>
          <span className="ml-2 text-muted">{dateStr(o.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          {o.overdue && <Badge tone="red">Payment overdue</Badge>}
          <Badge tone={statusTone(o.status)}>{STATUS_LABEL[o.status]}</Badge>
          <b>{inr(o.total)}</b>
        </div>
      </div>

      <StatusTracker status={o.status} withPayment={bankOrder} />

      <ul className="text-muted">
        {o.items.map((i) => (
          <li key={i.id}>{i.name} ({i.label}) x {i.qty}</li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
        <span>Payment: {o.paymentMode.toLowerCase()}</span>
        <span>Freight: {o.delivery === "FREIGHT" ? "prepaid by us" : o.delivery === "SELF" ? "self-booked" : "pickup"}</span>
        <span>Dispatch from: {o.warehouses.join(", ")}</span>
        {o.dueDate && <span>Payment due: {dateStr(o.dueDate)}</span>}
      </div>

      {o.dispatch && (
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Dispatch details</div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[["Vehicle", o.dispatch.vehicleType], ["Vehicle no.", o.dispatch.vehicleNo], ["Driver phone", o.dispatch.driverPhone], ["Porter booking", o.dispatch.bookingId]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </div>
      )}

      {o.ewayRequired && (
        <p className="text-xs text-muted">
          E-way bill required (order above Rs 50,000): {o.ewayBill ? <b>{o.ewayBill}</b> : "will be generated at dispatch."}
        </p>
      )}

      {o.status === "PAYMENT_PENDING" && (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="font-semibold text-amber-900">
            Waiting for bank transfer. Stock is reserved{o.holdDaysLeft !== null ? ` for ${o.holdDaysLeft} more day${o.holdDaysLeft === 1 ? "" : "s"}` : ""}; unpaid orders are cancelled after the hold period.
          </p>
          <p className="text-xs text-amber-900">{bank}</p>
          {sent ? (
            <p className="text-xs font-semibold text-emerald-700">Thanks! UTR {utr} sent to our accounts team for matching (demo).</p>
          ) : (
            <div className="flex gap-2">
              <input className={inputCls} placeholder="I have paid: enter UTR / transaction reference" value={utr} onChange={(e) => setUtr(e.target.value)} />
              <Button disabled={utr.trim().length < 6} onClick={() => setSent(true)}>Submit UTR</Button>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/catalog?reorder=${o.number}`} className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
          Reorder
        </Link>
        {(o.invoiceNo || o.proformaNo) && (
          <Link href={`/invoices/${o.number}`} className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
            {o.invoiceNo ? "Tax invoice" : "Proforma invoice"}
          </Link>
        )}
      </div>
    </Card>
  );
}
