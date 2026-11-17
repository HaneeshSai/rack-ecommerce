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
  "Order received",
  "Checked and sent to Accounts",
  "Invoice and DC received",
  "Vehicle booked",
  "Dispatched, sales person told",
  "Papers sent to dealer",
  "Dealer pays",
  "Accounts told about the payment",
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
      <h2 className="mb-1 font-bold">Where this order is</h2>
      <p className="mb-4 text-xs text-muted">Green ticks are done. The blue number is what to do now.</p>
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

// Every step says where you are, what to do and why, in plain words.
const StepHead = ({ n, title, hint }: { n: number; title: string; hint: string }) => (
  <div>
    <div className="text-xs font-semibold uppercase tracking-wide text-accent">Step {n} of 8</div>
    <h3 className="text-base font-bold">{title}</h3>
    <p className="mt-0.5 text-xs text-muted">{hint}</p>
  </div>
);

function Screening({ o, checks }: { o: CrmDTO; checks: Check[] }) {
  const { run, pending } = useRun();
  const blocked = checks.some((c) => !c.ok && c.blocking);
  const [override, setOverride] = useState(false);
  return (
    <div className="space-y-3">
      <StepHead n={2} title="Check the order, then send it to Accounts" hint="Look at the checks below. If they are fine, send it. Accounts will then prepare the invoice and delivery challan (DC)." />
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
          A check marked with a red cross failed. Talk to the sales manager first. If they agree, tick this box to send the order anyway.
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || (blocked && !override)} onClick={() => run(() => sendToAccounts(o.id))}>Send to Accounts</Button>
        {o.terms.startsWith("Advance") && <Button variant="ghost" disabled={pending} onClick={() => run(() => issueProforma(o.id))}>Send proforma (bill for bank transfer)</Button>}
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
      <StepHead n={3} title="Enter the invoice and DC numbers" hint="Accounts is preparing these. When they send them to you, type the numbers here. The DC (delivery challan) is the paper that travels with the goods." />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Invoice number"><input className={inputCls} value={invoiceNo} onChange={(e) => setInvoice(e.target.value)} placeholder="RH/25-26/0123" /></Field>
        <Field label="DC number"><input className={inputCls} value={dcNo} onChange={(e) => setDc(e.target.value)} placeholder="DC-123" /></Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => run(() => recordInvoice(o.id, { invoiceNo, dcNo }))}>Save invoice and DC</Button>
        {o.terms.startsWith("Advance") && <Button variant="ghost" disabled={pending} onClick={() => run(() => issueProforma(o.id))}>Send proforma again</Button>}
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
      <StepHead n={4} title={`Book a vehicle from the ${o.hub} hub`} hint="Book a Porter or another vehicle, then write down who is driving. Tap a recent vehicle to fill the details quickly." />
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
      <Button disabled={pending} onClick={() => run(() => bookVehicle(o.id, v))}>Save vehicle details</Button>
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
      <StepHead n={5} title="Send it off and tell the sales person" hint={`Press the button when the vehicle leaves. ${o.fieldRep} gets the message below.`} />
      <div className="rounded-lg bg-white p-3 text-sm ring-1 ring-line">
        <b>{v.provider}</b> · {v.vehicleType} · {v.vehicleNo}<br />Driver {v.driverName} {v.driverPhone} · Booking {v.bookingId || "-"}
      </div>
      {advance && (
        <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
          <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="mt-0.5" />
          The dealer pays before delivery for this order. Tick this box once their bank transfer has reached us.
        </label>
      )}
      <div>
        <div className="mb-1 text-xs text-muted">Message for the sales person</div>
        <MessageBox text={msg} />
      </div>
      <Button disabled={pending || !paid} onClick={() => run(() => dispatchOrder(o.id))}>Dispatch and tell sales</Button>
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
      <StepHead n={6} title="Send the papers to the dealer" hint="Send this message on WhatsApp (or copy it). Then press the button so we know it is done." />
      <MessageBox text={msg} phone={o.dealerPhone} />
      <Button disabled={pending} onClick={() => run(() => sendDocsToDealer(o.id))}>I have sent the papers</Button>
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
        <StepHead n={8} title="Tell Accounts the payment came in" hint="The payment is recorded. Press the button to report it to Accounts and finish this order." />
        <div className="rounded-lg bg-white p-3 text-sm ring-1 ring-line"><b>{inr(o.payment.amount)}</b> via {o.payment.mode} · {o.payment.utr}<div className="text-xs text-muted">Received {fmtDateTime(o.payment.at)}</div></div>
        <Button disabled={pending} onClick={() => run(() => reportPayment(o.id))}>Tell Accounts and finish</Button>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div>
        <StepHead n={7} title="Follow up until the dealer pays" hint={`Call or message the dealer, and write down what they say. Keep ${o.fieldRep} in the loop.`} />
        <p className="mt-1 text-xs">
          Payment due {fmtDate(o.dueDate)} {o.overdueDays > 0 ? <Badge tone="red">{o.overdueDays} days late</Badge> : null}
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
        <div className="mb-2 text-sm font-semibold">Did the dealer pay?</div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Bank reference (UTR)"><input className={inputCls} value={pay.utr} onChange={(e) => setPay({ ...pay, utr: e.target.value })} /></Field>
          <Field label="Amount (Rs)"><input type="number" className={inputCls} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: Number(e.target.value) })} /></Field>
          <Field label="Mode"><select className={inputCls} value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })}><option>NEFT</option><option>RTGS</option><option>UPI</option><option>Cheque</option></select></Field>
        </div>
        <Button className="mt-2" disabled={pending} onClick={() => run(() => recordPayment(o.id, pay))}>Record payment</Button>
      </div>
    </div>
  );
}
