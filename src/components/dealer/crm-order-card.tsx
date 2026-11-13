import Link from "next/link";
import clsx from "clsx";
import { Badge, Card } from "@/components/ui";
import { inr } from "@/lib/money";
import { dateStr } from "./format";
import type { CrmDTO } from "@/lib/crm-data";

const STEPS = ["Received", "Processing", "Invoiced", "Vehicle booked", "Dispatched", "Delivered", "Paid"];
const stepOf = (o: CrmDTO) => ({ NEW: 0, WITH_ACCOUNTS: 1, INVOICED: 2, LOGISTICS: 3, DISPATCHED: 4, DOCS_SENT: o.delivered ? 5 : 4, PAID: 6 })[o.stage];

// Orders the dealer placed through their sales rep, with live tracking and driver details.
export function CrmOrderCard({ o }: { o: CrmDTO }) {
  const at = stepOf(o);
  return (
    <Card className="space-y-4 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><b className="text-base">{o.number}</b><span className="ml-2 text-muted">{dateStr(o.createdAt)} · via {o.fieldRep}</span></div>
        <div className="flex items-center gap-2">
          {o.overdueDays > 0 && <Badge tone="red">Payment overdue</Badge>}
          <Badge tone={o.stage === "PAID" ? "green" : "blue"}>{STEPS[at]}</Badge>
          <b>{inr(o.total)}</b>
        </div>
      </div>
      <ol className="flex items-start">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={clsx("h-0.5 flex-1", i === 0 ? "bg-transparent" : i <= at ? "bg-accent" : "bg-line")} />
              <div className={clsx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2", i < at && "bg-accent text-white ring-accent", i === at && "bg-white text-accent ring-accent", i > at && "bg-white text-muted ring-line")}>{i < at ? "✓" : i + 1}</div>
              <div className={clsx("h-0.5 flex-1", i === STEPS.length - 1 ? "bg-transparent" : i < at ? "bg-accent" : "bg-line")} />
            </div>
            <span className={clsx("mt-1 text-[11px] leading-tight", i === at ? "font-semibold" : "text-muted")}>{s}</span>
          </li>
        ))}
      </ol>
      <ul className="text-muted">{o.lines.map((l, i) => <li key={i}>{l.name} ({l.label}) x {l.qty}</li>)}</ul>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
        <span>Terms: {o.terms}</span><span>Dispatch from: {o.hub}</span>
        {o.invoiceNo && <span>Invoice {o.invoiceNo} · DC {o.dcNo}</span>}
        {o.dueDate && <span>Payment due: {dateStr(o.dueDate)}</span>}
      </div>
      {o.vehicle && (
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Vehicle and driver</div>
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[["Vehicle", o.vehicle.vehicleType], ["Vehicle no.", o.vehicle.vehicleNo], ["Driver", `${o.vehicle.driverName} ${o.vehicle.driverPhone}`], ["Booking", o.vehicle.bookingId || "-"]].map(([k, v]) => (
              <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>
            ))}
          </dl>
        </div>
      )}
      <div className="flex gap-2">
        <Link href={`/catalog?reorder=${o.number}`} className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Reorder</Link>
        {o.invoiceNo && o.stage !== "PAID" && <Link href="/invoices" className="inline-flex items-center rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">Pay invoice</Link>}
      </div>
    </Card>
  );
}
