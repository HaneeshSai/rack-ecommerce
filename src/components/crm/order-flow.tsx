"use client";

import { useState, type ReactNode } from "react";
import clsx from "clsx";
import { Badge, Button, Card, inputCls } from "@/components/ui";
import {
  bookVehicle, dispatchOrder, issueProforma, logFollowup, markDelivered, recordInvoice, recordPayment, reportPayment, sendDocsToDealer, sendToAccounts,
} from "@/lib/actions/crm";
import { LOGISTICS_PROVIDERS, VEHICLE_TYPES, waLink } from "@/lib/crm";
import { useToast } from "@/components/admin/toast";
import type { Check, CrmDTO } from "@/lib/crm-data";
import { inr } from "@/lib/money";
import { fmtDate, fmtDateTime } from "@/components/admin/format";
import { useRun } from "./use-run";

const STEPS = [
  "Sales order received",
  "Screened and sent to accounts",
  "Invoice and DC from accounts",
  "Vehicle arranged",
  "Dispatched, sales guy informed",
  "Invoice, DC and driver details to dealer",
  "Payment follow-up",
  "Payment reported to accounts",
];

// Index of the step the coordinator should work on now.
function activeStep(o: CrmDTO) {
  switch (o.stage) {
    case "NEW": return 1;
    case "WITH_ACCOUNTS": return 2;
    case "INVOICED": return 3;
    case "LOGISTICS": return 4;
    case "DISPATCHED": return 5;
    case "DOCS_SENT": return o.payment ? 7 : 6;
    default: return 8;
  }
}

type Recent = { provider: string; vehicleType: string; vehicleNo: string; driverName: string; driverPhone: string };

// Copy a message to the clipboard, or open it in WhatsApp.
function MessageBox({ text, phone }: { text: string; phone?: string }) {
  const toast = useToast();
  return (
    <div className="space-y-2">
      <pre className="whitespace-pre-wrap rounded-lg bg-white p-3 text-xs ring-1 ring-line">{text}</pre>
      <div className="flex gap-2">
        <Button variant="ghost" className="!py-1.5" onClick={() => { navigator.clipboard?.writeText(text); toast("Message copied"); }}>Copy message</Button>
        {phone && <a href={waLink(phone, text)} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold hover:border-slate-300">Open in WhatsApp</a>}
      </div>
    </div>
  );
}

export function OrderFlow({ order: o, checks, recent }: { order: CrmDTO; checks: Check[]; recent: Recent[] }) {
  const cur = activeStep(o);
  return (
    <Card className="p-5">
      <h2 className="mb-4 font-bold">Process</h2>
      <ol className="mb-5 space-y-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-sm">
            <span className={clsx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", i < cur ? "bg-emerald-500 text-white" : i === cur ? "bg-accent text-white ring-4 ring-accent/20" : "bg-slate-100 text-slate-500")}>
              {i < cur ? "✓" : i + 1}
            </span>
            <span className={clsx(i === cur ? "font-semibold" : i > cur && "text-muted")}>{s}</span>
          </li>
        ))}
      </ol>
      <div className="rounded-xl border border-line bg-slate-50 p-4">
        {o.stage === "NEW" && <Screening o={o} checks={checks} />}
        {o.stage === "WITH_ACCOUNTS" && <InvoiceStep o={o} />}
        {o.stage === "INVOICED" && <VehicleStep o={o} recent={recent} />}
        {o.stage === "LOGISTICS" && <DispatchStep o={o} />}
        {o.stage === "DISPATCHED" && <DocsStep o={o} />}
        {o.stage === "DOCS_SENT" && <PaymentStep o={o} />}
        {o.stage === "PAID" && <p className="text-sm font-medium text-emerald-700">All done. Payment of {o.payment ? inr(o.payment.amount) : ""} is reported to accounts.</p>}
      </div>
    </Card>
  );
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="block text-sm"><span className="text-xs text-muted">{label}</span>{children}</label>
);

function Screening({ o, checks }: { o: CrmDTO; checks: Check[] }) {
  const { run, pending } = useRun();
  const blocked = checks.some((c) => !c.ok && c.blocking);
  const [override, setOverride] = useState(false);
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Step 2: screen and send to accounts</h3>
      <ul className="space-y-2 text-sm">
        {checks.map((c) => (
          <li key={c.label} className="flex items-start gap-2">
            <span className={clsx("mt-0.5 text-base leading-none", c.ok ? "text-emerald-600" : c.blocking ? "text-red-600" : "text-amber-600")}>{c.ok ? "✓" : c.blocking ? "✗" : "!"}</span>
            <span><b className="font-medium">{c.label}</b><span className="block text-xs text-muted">{c.detail}</span></span>
          </li>
        ))}
      </ul>
      {blocked && (
        <label className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800">
          <input type="checkbox" checked={override} onChange={(e) => setOverride(e.target.checked)} className="mt-0.5" />
          A blocking check failed. Tick to send to accounts anyway after speaking to the sales manager.
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || (blocked && !override)} onClick={() => run(() => sendToAccounts(o.id))}>Send to accounts</Button>
        {o.terms.startsWith("Advance") && <Button variant="ghost" disabled={pending} onClick={() => run(() => issueProforma(o.id))}>Issue proforma (NEFT/RTGS)</Button>}
      </div>
    </div>
  );
}

function InvoiceStep({ o }: { o: CrmDTO }) {
  const { run, pending } = useRun();
  const [invoiceNo, setInvoice] = useState("");
  const [dcNo, setDc] = useState("");
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Step 3: record the invoice and DC from accounts</h3>
      <p className="text-xs text-muted">Waiting for Accounts. Enter the numbers when they send them over.</p>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Invoice number"><input className={inputCls} value={invoiceNo} onChange={(e) => setInvoice(e.target.value)} placeholder="RH/25-26/0123" /></Field>
        <Field label="DC number"><input className={inputCls} value={dcNo} onChange={(e) => setDc(e.target.value)} placeholder="DC-123" /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => run(() => recordInvoice(o.id, { invoiceNo, dcNo }))}>Save invoice and DC</Button>
        {o.terms.startsWith("Advance") && <Button variant="ghost" disabled={pending} onClick={() => run(() => issueProforma(o.id))}>Resend proforma</Button>}
      </div>
    </div>
  );
}

function VehicleStep({ o, recent }: { o: CrmDTO; recent: Recent[] }) {
  const { run, pending } = useRun();
  const [v, setV] = useState({ provider: LOGISTICS_PROVIDERS[0], vehicleType: VEHICLE_TYPES[0], vehicleNo: "", driverName: "", driverPhone: "", bookingId: "" });
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Step 4: arrange the vehicle from {o.hub}</h3>
      {recent.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">Use a recent one:</span>
          {recent.map((r) => (
            <button key={r.vehicleNo} type="button" className="rounded-full border border-line bg-white px-3 py-1 hover:border-accent" onClick={() => setV({ ...v, ...r, bookingId: "" })}>{r.vehicleNo} · {r.driverName}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Field label="Provider"><select className={inputCls} value={v.provider} onChange={set("provider")}>{LOGISTICS_PROVIDERS.map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Vehicle type"><select className={inputCls} value={v.vehicleType} onChange={set("vehicleType")}>{VEHICLE_TYPES.map((p) => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Vehicle number"><input className={inputCls} value={v.vehicleNo} onChange={set("vehicleNo")} placeholder="TS09 AB 1234" /></Field>
        <Field label="Booking ID"><input className={inputCls} value={v.bookingId} onChange={set("bookingId")} placeholder="PRT-1234" /></Field>
        <Field label="Driver name"><input className={inputCls} value={v.driverName} onChange={set("driverName")} /></Field>
        <Field label="Driver phone"><input className={inputCls} value={v.driverPhone} onChange={set("driverPhone")} /></Field>
      </div>
      <Button disabled={pending} onClick={() => run(() => bookVehicle(o.id, v))}>Save vehicle booking</Button>
    </div>
  );
}

function DispatchStep({ o }: { o: CrmDTO }) {
  const { run, pending } = useRun();
  const v = o.vehicle!;
  const advance = o.terms.startsWith("Advance");
  const [paid, setPaid] = useState(!advance);
  const msg = `${o.number} dispatched from ${o.hub}.
Dealer: ${o.dealerName}, ${o.dealerCity}
Vehicle: ${v.vehicleNo} (${v.provider})
Driver: ${v.driverName} ${v.driverPhone}`;
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Step 5: dispatch and inform {o.fieldRep}</h3>
      <div className="rounded-lg bg-white p-3 text-sm ring-1 ring-line">
        <b>{v.provider}</b> · {v.vehicleType} · {v.vehicleNo}<br />Driver {v.driverName} {v.driverPhone} · Booking {v.bookingId || "-"}
      </div>
      {advance && (
        <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="mt-0.5" />
          This order is advance payment. Tick once the NEFT/RTGS payment has cleared.
        </label>
      )}
      <div>
        <div className="mb-1 text-xs text-muted">Message for the sales guy (sent when you dispatch)</div>
        <MessageBox text={msg} />
      </div>
      <Button disabled={pending || !paid} onClick={() => run(() => dispatchOrder(o.id))}>Mark dispatched and inform sales</Button>
    </div>
  );
}

function DocsStep({ o }: { o: CrmDTO }) {
  const { run, pending } = useRun();
  const v = o.vehicle!;
  const msg = `Hello ${o.dealerName}, your order ${o.number} is on its way.
Invoice: ${o.invoiceNo}
DC: ${o.dcNo}
Vehicle: ${v.vehicleNo} (${v.vehicleType})
Driver: ${v.driverName} ${v.driverPhone}`;
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Step 6: send documents to the dealer</h3>
      <MessageBox text={msg} phone={o.dealerPhone} />
      <Button disabled={pending} onClick={() => run(() => sendDocsToDealer(o.id))}>Mark documents as sent</Button>
    </div>
  );
}

function PaymentStep({ o }: { o: CrmDTO }) {
  const { run, pending } = useRun();
  const [note, setNote] = useState("");
  const [promise, setPromise] = useState("");
  const [pay, setPay] = useState({ utr: "", amount: Math.round(o.total / 100), mode: "NEFT" });
  const reminder = `Hello ${o.dealerName}, a gentle reminder for invoice ${o.invoiceNo} (${inr(o.total)}) against order ${o.number}, due ${fmtDate(o.dueDate)}. Please share the payment details once done. Thank you.`;

  if (o.payment) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold">Step 8: report the payment to accounts</h3>
        <div className="rounded-lg bg-white p-3 text-sm ring-1 ring-line"><b>{inr(o.payment.amount)}</b> via {o.payment.mode} · {o.payment.utr}<div className="text-xs text-muted">Received {fmtDateTime(o.payment.at)}</div></div>
        <Button disabled={pending} onClick={() => run(() => reportPayment(o.id))}>Report to accounts and close</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Step 7: follow up for payment</h3>
        <p className="text-xs text-muted">
          Due {fmtDate(o.dueDate)} {o.overdueDays > 0 ? <Badge tone="red">{o.overdueDays} days overdue</Badge> : null} · coordinate with {o.fieldRep}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <a href={`tel:${o.dealerPhone}`} className="rounded-lg border border-line bg-white px-3 py-1.5 font-semibold hover:border-slate-300">Call {o.dealerPhone}</a>
          <a href={waLink(o.dealerPhone, reminder)} target="_blank" rel="noreferrer" className="rounded-lg border border-line bg-white px-3 py-1.5 font-semibold hover:border-slate-300">WhatsApp reminder</a>
          {o.delivered ? <Badge tone="green">Goods delivered</Badge> : <Button variant="ghost" className="!py-1" disabled={pending} onClick={() => run(() => markDelivered(o.id))}>Mark goods delivered</Button>}
        </div>
        {o.followups.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs">
            {o.followups.map((f, i) => <li key={i} className="rounded bg-white p-2 ring-1 ring-line">{f.note}{f.promiseDate && <b> · promised {fmtDate(f.promiseDate)}</b>}<span className="text-muted"> · {f.by}, {fmtDateTime(f.at)}</span></li>)}
          </ul>
        )}
        <div className="mt-2 grid grid-cols-[1fr_140px] gap-2">
          <input className={inputCls} placeholder="What did the dealer say?" value={note} onChange={(e) => setNote(e.target.value)} />
          <input type="date" className={inputCls} value={promise} onChange={(e) => setPromise(e.target.value)} aria-label="Promised date" />
        </div>
        <Button variant="ghost" className="mt-2 !py-1.5" disabled={pending} onClick={() => run(() => logFollowup(o.id, { note, promiseDate: promise }), () => { setNote(""); setPromise(""); })}>Save follow-up</Button>
      </div>
      <div className="border-t border-line pt-3">
        <div className="mb-2 text-sm font-semibold">Payment received?</div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="UTR / reference"><input className={inputCls} value={pay.utr} onChange={(e) => setPay({ ...pay, utr: e.target.value })} /></Field>
          <Field label="Amount (Rs)"><input type="number" className={inputCls} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} /></Field>
          <Field label="Mode"><select className={inputCls} value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })}><option>NEFT</option><option>RTGS</option><option>UPI</option><option>Cheque</option></select></Field>
        </div>
        <Button className="mt-2" disabled={pending} onClick={() => run(() => recordPayment(o.id, pay))}>Record payment</Button>
      </div>
    </div>
  );
}
