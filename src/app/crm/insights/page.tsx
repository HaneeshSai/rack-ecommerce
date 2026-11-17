import { Card, PageTitle, StatCard } from "@/components/ui";
import { BarList } from "@/components/admin/bar-list";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { CRM_STAGES } from "@/lib/crm";
import { serializeCrm, dealerHealth, DAY } from "@/lib/crm-data";
import { inr } from "@/lib/money";

const avg = (n: number[]) => (n.length ? n.reduce((a, b) => a + b, 0) / n.length : null);
const days = (n: number | null) => (n === null ? "-" : `${n.toFixed(1)} days`);

export default async function Insights() {
  await requireUser("CRM");
  const S = mock.S();
  const orders = S.crmOrders.map(serializeCrm);
  const raw = (id: string) => S.crmOrders.find((o) => o.id === id)!;

  // Speed: how long from order received to each milestone (read from each order's history).
  const gap = (id: string, text: string) => {
    const o = raw(id);
    const t = o.timeline.find((x) => x.text.startsWith(text));
    return t ? Math.max(0, (t.at.getTime() - o.createdAt.getTime()) / DAY) : null;
  };
  const toInvoice = avg(orders.map((o) => gap(o.id, "Invoice")).filter((x): x is number => x !== null));
  const toDispatch = avg(orders.map((o) => gap(o.id, "Dispatched")).filter((x): x is number => x !== null));
  const toPaid = avg(orders.map((o) => gap(o.id, "Payment received")).filter((x): x is number => x !== null));

  // Money.
  const invoiced = orders.filter((o) => o.invoiceNo);
  const invoicedAmt = invoiced.reduce((n, o) => n + o.total, 0);
  const paidAmt = orders.filter((o) => o.stage === "PAID").reduce((n, o) => n + o.total, 0);
  const lateAmt = orders.filter((o) => o.overdueDays > 0).reduce((n, o) => n + o.total, 0);
  const collectedPct = invoicedAmt ? Math.round((paidAmt / invoicedAmt) * 100) : 0;
  const stuck = orders.filter((o) => o.stage !== "PAID" && o.urgency === "late").length;

  // By dealer, rep and hub.
  const byDealer = new Map<string, number>();
  const byRep = new Map<string, { n: number; value: number; late: number }>();
  const byHub = new Map<string, number>();
  for (const o of orders) {
    byDealer.set(o.dealerName, (byDealer.get(o.dealerName) ?? 0) + o.total);
    const r = byRep.get(o.fieldRep) ?? { n: 0, value: 0, late: 0 };
    r.n++; r.value += o.total; if (o.overdueDays > 0) r.late += o.total;
    byRep.set(o.fieldRep, r);
    byHub.set(o.hub, (byHub.get(o.hub) ?? 0) + o.total);
  }
  const health = S.dealers.filter((d) => d.status === "APPROVED").map((d) => ({ d, h: dealerHealth(d) }));
  const count = (l: string) => health.filter((x) => x.h.level === l).length;

  // Claims and cheques.
  const claimsOpen = S.claims.filter((c) => c.status === "OPEN" || c.status === "APPROVED").length;
  const credited = S.claims.filter((c) => c.outcome === "CREDIT_NOTE").reduce((n, c) => n + c.creditAmount, 0);
  const bounced = S.cheques.filter((c) => c.status === "BOUNCED").length;

  return (
    <>
      <PageTitle title="Insights" sub="How the business is doing: speed, money, dealers and sales people. Based on the orders in this system." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales orders" value={String(orders.length)} />
        <StatCard label="Order value" value={inr(orders.reduce((n, o) => n + o.total, 0))} />
        <StatCard label="Collected so far" value={`${collectedPct}%`} tone={collectedPct >= 70 ? "good" : "warn"} />
        <StatCard label="Orders stuck too long" value={String(stuck)} tone={stuck ? "warn" : "good"} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Order to invoice, on average" value={days(toInvoice)} />
        <StatCard label="Order to dispatch, on average" value={days(toDispatch)} />
        <StatCard label="Order to payment, on average" value={days(toPaid)} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <BarList title="Where orders are now" items={CRM_STAGES.map((s) => ({ label: s.label, value: orders.filter((o) => o.stage === s.key).length }))} format={(n) => String(n)} />
        <BarList title="Biggest dealers by order value" items={[...byDealer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }))} format={inr} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Field sales people</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase text-muted"><th className="py-2">Name</th><th className="py-2 text-right">Orders</th><th className="py-2 text-right">Value</th><th className="py-2 text-right">Late payment</th></tr></thead>
            <tbody>
              {[...byRep.entries()].sort((a, b) => b[1].value - a[1].value).map(([name, r]) => (
                <tr key={name} className="border-b border-line last:border-0">
                  <td className="py-2 font-semibold">{name}</td><td className="py-2 text-right">{r.n}</td><td className="py-2 text-right">{inr(r.value)}</td>
                  <td className={`py-2 text-right ${r.late ? "font-bold text-red-600" : "text-muted"}`}>{r.late ? inr(r.late) : "-"}</td>
                </tr>
              ))}
              {byRep.size === 0 && <tr><td colSpan={4} className="py-4 text-muted">No orders yet.</td></tr>}
            </tbody>
          </table>
        </Card>
        <BarList title="Sales by hub" items={[...byHub.entries()].map(([label, value]) => ({ label, value }))} format={inr} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Dealer health</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-emerald-50 p-3"><div className="text-2xl font-extrabold text-emerald-700">{count("good")}</div><div className="text-xs text-muted">Healthy</div></div>
            <div className="rounded-xl bg-amber-50 p-3"><div className="text-2xl font-extrabold text-amber-700">{count("watch")}</div><div className="text-xs text-muted">Watch</div></div>
            <div className="rounded-xl bg-red-50 p-3"><div className="text-2xl font-extrabold text-red-700">{count("risk")}</div><div className="text-xs text-muted">At risk</div></div>
          </div>
          <p className="mt-3 text-xs text-muted">{health.filter((x) => x.h.reorder?.due).length} dealer(s) are due to re-order, and {S.dealers.filter((d) => d.creditHold).length} have credit on hold.</p>
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-bold">Money and problems</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between"><span>Invoiced</span><b>{inr(invoicedAmt)}</b></li>
            <li className="flex justify-between"><span>Paid</span><b>{inr(paidAmt)}</b></li>
            <li className="flex justify-between"><span>Late payments</span><b className={lateAmt ? "text-red-600" : ""}>{inr(lateAmt)}</b></li>
            <li className="flex justify-between"><span>Bounced cheques</span><b>{bounced}</b></li>
            <li className="flex justify-between"><span>Open claims</span><b>{claimsOpen}</b></li>
            <li className="flex justify-between"><span>Credit notes given</span><b>{inr(credited)}</b></li>
          </ul>
        </Card>
      </div>
    </>
  );
}
