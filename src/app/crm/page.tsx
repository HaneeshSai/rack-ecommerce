import Link from "next/link";
import { Card, PageTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { CRM_STAGES } from "@/lib/crm";
import { serializeCrm } from "@/lib/crm-data";
import { inr } from "@/lib/money";
import { StageBadge } from "@/components/crm/bits";

const FLOW = [
  "Field sales sends a sales order: dealer, variants, quantity, price and payment terms",
  "CRM screens it and sends it to accounts with the same details",
  "Accounts sends the invoice and DC back to CRM",
  "CRM arranges the vehicle (Porter or another vehicle)",
  "Dispatch happens and the sales guy is informed",
  "CRM sends the invoice, DC and driver details to the dealer",
  "CRM follows up for payment with the sales guy",
  "CRM reports the payment to accounts",
];

export default async function CrmHome() {
  const user = await requireUser("CRM");
  const S = mock.S();
  const orders = S.crmOrders.map(serializeCrm);
  const by = (st: string) => orders.filter((o) => o.stage === st);
  const overdue = orders.filter((o) => o.overdueDays > 0);
  const pendingDealers = S.dealers.filter((d) => d.status === "PENDING");
  const unreported = orders.filter((o) => o.stage === "DOCS_SENT" && o.payment && !o.payment.reported);
  const outstanding = by("DOCS_SENT").reduce((n, o) => n + o.total, 0);

  const work: { label: string; href: string; n: number }[] = [
    { label: "Orders waiting 2+ days (check these first)", href: "/orders?waiting=1", n: orders.filter((o) => o.urgency === "late" || o.urgency === "warn").length },
    { label: "Dealer applications to review", href: "/onboarding", n: pendingDealers.length },
    { label: "Sales orders to screen", href: "/orders?stage=NEW", n: by("NEW").length },
    { label: "Invoices ready: book a vehicle", href: "/orders?stage=INVOICED", n: by("INVOICED").length },
    { label: "Vehicles booked: dispatch", href: "/orders?stage=LOGISTICS", n: by("LOGISTICS").length },
    { label: "Dispatched: send documents to dealer", href: "/orders?stage=DISPATCHED", n: by("DISPATCHED").length },
    { label: "Overdue payments to chase", href: "/payments", n: overdue.length },
    { label: "Payments received: report to accounts", href: "/payments", n: unreported.length },
  ];

  return (
    <>
      <PageTitle title={`Good day, ${user.name.split(" ")[0]}`} sub="Your worklist across onboarding, orders, logistics and payments." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open sales orders" value={String(orders.filter((o) => o.stage !== "PAID").length)} />
        <StatCard label="In transit" value={String(by("LOGISTICS").length + by("DISPATCHED").length)} />
        <StatCard label="Payment outstanding" value={inr(outstanding)} />
        <StatCard label="Overdue orders" value={String(overdue.length)} tone={overdue.length ? "warn" : "good"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Today&apos;s worklist</h2>
          {work.every((w) => w.n === 0) && <p className="py-6 text-center text-sm text-muted">All caught up. Nothing needs action today.</p>}
          <ul className="divide-y divide-line">
            {work.filter((w) => w.n > 0).map((w) => (
              <li key={w.label}>
                <Link href={w.href} className="flex items-center justify-between py-2.5 text-sm hover:text-accent">
                  <span>{w.label}</span>
                  <span className={`min-w-8 rounded-full px-2.5 py-0.5 text-center text-xs font-bold ${w.n ? "bg-accent text-white" : "bg-slate-100 text-slate-500"}`}>{w.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-bold">How an order moves</h2>
          <ol className="space-y-2 text-sm">
            {FLOW.map((f, i) => (
              <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>{f}</li>
            ))}
          </ol>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 font-bold">Pipeline</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {CRM_STAGES.map((s) => (
          <Link key={s.key} href={`/orders?stage=${s.key}`}>
            <Card className="h-full p-4 transition hover:-translate-y-0.5 hover:border-accent">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Step {s.step}</div>
              <div className="mt-1 text-sm font-bold">{s.label}</div>
              <div className="mt-2 text-3xl font-extrabold">{by(s.key).length}</div>
              <div className="text-xs text-muted">{s.owner}</div>
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 mt-8 font-bold">Latest orders</h2>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {orders.slice(0, 5).map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-slate-50">
                <td className="p-3 font-semibold"><span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${o.urgency === "late" ? "bg-red-500" : o.urgency === "warn" ? "bg-amber-400" : o.urgency === "none" ? "bg-emerald-500" : "bg-slate-300"}`} /><Link href={`/orders/${o.id}`} className="hover:text-accent">{o.number}</Link></td>
                <td className="p-3">{o.dealerName}</td>
                <td className="p-3 text-muted">{o.fieldRep}</td>
                <td className="p-3 text-right">{inr(o.total)}</td>
                <td className="p-3"><StageBadge stage={o.stage} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
