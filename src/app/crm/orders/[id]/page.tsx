import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { screenOrder, serializeCrm } from "@/lib/crm-data";
import { nextAction } from "@/lib/crm";
import { inr } from "@/lib/money";
import { fmtDate, fmtDateTime } from "@/components/admin/format";
import { StageBadge } from "@/components/crm/bits";
import { OrderFlow } from "@/components/crm/order-flow";

export default async function CrmOrderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser("CRM");
  const { id } = await params;
  const S = mock.S();
  const raw = S.crmOrders.find((o) => o.id === id);
  if (!raw) notFound();
  const o = serializeCrm(raw);
  const checks = raw.stage === "NEW" ? screenOrder(raw) : [];
  const seen = new Set<string>();
  const recent = S.crmOrders.flatMap((x) => (x.vehicle ? [x.vehicle] : [])).filter((v) => !seen.has(v.vehicleNo) && seen.add(v.vehicleNo)).slice(0, 3)
    .map((v) => ({ provider: v.provider, vehicleType: v.vehicleType, vehicleNo: v.vehicleNo, driverName: v.driverName, driverPhone: v.driverPhone }));
  const messages = S.notifications
    .filter((n) => n.ref === o.number)
    .map((n) => ({ id: n.id, event: n.event, to: S.dealers.find((d) => d.id === n.to)?.businessName ?? n.to, channels: n.channels, text: n.text, at: n.at.toISOString() }));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm text-muted hover:text-accent">&larr; All sales orders</Link>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">{o.number}</h1>
          <p className="text-sm text-muted">{o.dealerName}, {o.dealerCity} · entered by {o.fieldRep}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/orders/new?copy=${o.id}`} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold hover:border-slate-300">Repeat this order</Link>
          {(o.proformaNo || o.terms.startsWith("Advance")) && <Link href={`/orders/${o.id}/proforma`} className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold hover:border-slate-300">Print proforma</Link>}
          <StageBadge stage={o.stage} />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-accent-soft px-5 py-3 text-sm">
        <span><span className="text-muted">Next step:</span> <b className="text-base">{nextAction(o)}</b></span>
        <span className="text-muted">{o.fieldRep} · {o.terms}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Order details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Dealer</dt><dd><Link href={`/dealers/${o.dealerId}`} className="hover:text-accent">{o.dealerName}</Link> · {o.dealerPhone}</dd>
              <dt className="text-muted">Payment terms</dt><dd>{o.terms}</dd>
              <dt className="text-muted">Dispatch hub</dt><dd>{o.hub}</dd>
              <dt className="text-muted">Field sales</dt><dd>{o.fieldRep}</dd>
              {o.proformaNo && <><dt className="text-muted">Proforma</dt><dd>{o.proformaNo}</dd></>}
              {o.invoiceNo && <><dt className="text-muted">Invoice / DC</dt><dd>{o.invoiceNo} / {o.dcNo}</dd></>}
              {o.dueDate && <><dt className="text-muted">Payment due</dt><dd>{fmtDate(o.dueDate)}{o.overdueDays > 0 && <span className="ml-2 font-semibold text-red-600">{o.overdueDays} days overdue</span>}</dd></>}
              {o.notes && <><dt className="text-muted">Notes</dt><dd>{o.notes}</dd></>}
            </dl>
            <table className="mt-4 w-full text-sm">
              <thead><tr className="border-b border-line text-left text-xs uppercase text-muted"><th className="py-2">Item</th><th className="py-2 text-right">Qty</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Amount</th></tr></thead>
              <tbody>
                {o.lines.map((l, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="py-2">{l.name}<div className="text-xs text-muted">{l.label} · {l.sku}</div></td>
                    <td className="py-2 text-right">{l.qty}</td><td className="py-2 text-right">{inr(l.price)}</td><td className="py-2 text-right">{inr(l.qty * l.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-sm">
                <tr><td colSpan={3} className="pt-2 text-right text-muted">Subtotal</td><td className="pt-2 text-right">{inr(o.sub)}</td></tr>
                <tr><td colSpan={3} className="text-right text-muted">GST</td><td className="text-right">{inr(o.gst)}</td></tr>
                <tr className="font-bold"><td colSpan={3} className="pt-1 text-right">Total</td><td className="pt-1 text-right">{inr(o.total)}</td></tr>
              </tfoot>
            </table>
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 font-bold">Activity</h2>
            <ul className="space-y-3 border-l-2 border-line pl-4 text-sm">
              {[...o.timeline].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
                  <div>{t.text}</div><div className="text-xs text-muted">{t.by} · {fmtDateTime(t.at)}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <OrderFlow order={o} checks={checks} recent={recent} />
          {messages.length > 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-bold">Messages sent</h2>
              <ul className="space-y-3 text-sm">
                {messages.map((m) => (
                  <li key={m.id} className="rounded-lg bg-slate-50 p-3">
                    <div className="flex justify-between text-xs text-muted"><span>To {m.to} · {m.channels.join(", ")}</span><span>{fmtDateTime(m.at)}</span></div>
                    <div className="mt-1 font-medium">{m.event}</div><div>{m.text}</div>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
