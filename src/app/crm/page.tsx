import Link from "next/link";
import { Card, LinkButton, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { CRM_STAGES, nextAction } from "@/lib/crm";
import { serializeCrm } from "@/lib/crm-data";
import { inr } from "@/lib/money";
import { StageBadge } from "@/components/crm/bits";

const FLOW = [
  "A field sales person sends an order: dealer, items, quantity, price and payment terms.",
  "You check it and send it to Accounts.",
  "Accounts sends back the invoice and delivery challan (DC, the delivery paper).",
  "You book a vehicle (Porter or another).",
  "The order is dispatched and the sales person is told.",
  "You send the invoice, DC and driver details to the dealer.",
  "You follow up with the dealer until they pay.",
  "You report the payment to Accounts. Done.",
];

export default async function CrmHome() {
  const user = await requireUser("CRM");
  const S = mock.S();
  const orders = S.crmOrders.map(serializeCrm);
  const by = (st: string) => orders.filter((o) => o.stage === st);
  const open = orders.filter((o) => o.stage !== "PAID");
  const overdue = orders.filter((o) => o.overdueDays > 0);
  const pendingDealers = S.dealers.filter((d) => d.status === "PENDING");
  const unreported = orders.filter((o) => o.stage === "DOCS_SENT" && o.payment && !o.payment.reported);
  const outstanding = by("DOCS_SENT").reduce((n, o) => n + o.total, 0);

  // The order that has waited longest on you (late first, then oldest in its stage).
  const rank = { late: 0, warn: 1, ok: 2, none: 3 } as const;
  const first = [...open].sort((a, b) => rank[a.urgency] - rank[b.urgency] || b.stageDays - a.stageDays)[0];

  const work: { label: string; href: string; n: number }[] = [
    { label: "Orders waiting 2 days or more", href: "/orders?waiting=1", n: open.filter((o) => o.urgency === "late" || o.urgency === "warn").length },
    { label: "New dealers to approve", href: "/onboarding", n: pendingDealers.length },
    { label: "New orders to check", href: "/orders?stage=NEW", n: by("NEW").length },
    { label: "Orders ready for a vehicle", href: "/orders?stage=INVOICED", n: by("INVOICED").length },
    { label: "Vehicles booked, ready to send off", href: "/orders?stage=LOGISTICS", n: by("LOGISTICS").length },
    { label: "Orders on the road: send papers to dealer", href: "/orders?stage=DISPATCHED", n: by("DISPATCHED").length },
    { label: "Dealers who are late paying", href: "/payments", n: overdue.length },
    { label: "Payments received: tell Accounts", href: "/payments", n: unreported.length },
  ].filter((w) => w.n > 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Hello, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-muted">{work.length ? "Here is what needs you today. Start at the top." : "You are all caught up. Nothing needs action right now."}</p>
      </div>

      {first && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 border-accent/40 bg-accent-soft p-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Do this first</div>
            <div className="mt-1 text-lg font-bold">{first.number}: {nextAction(first)}</div>
            <div className="text-sm text-muted">
              {first.dealerName}
              {first.urgency === "late" ? (first.overdueDays > 0 ? " · payment is overdue" : ` · waiting ${first.stageDays} days`) : ""}
            </div>
          </div>
          <LinkButton href={`/orders/${first.id}`}>Open order</LinkButton>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-5">
          <h2 className="mb-3 font-bold">Needs you today</h2>
          {work.length === 0 && <p className="py-6 text-center text-sm text-muted">All caught up.</p>}
          <ul className="divide-y divide-line">
            {work.map((w) => (
              <li key={w.label}>
                <Link href={w.href} className="flex items-center justify-between gap-3 py-3 text-sm hover:text-accent">
                  <span>{w.label}</span>
                  <span className="flex items-center gap-2">
                    <span className="min-w-8 rounded-full bg-accent px-2.5 py-0.5 text-center text-xs font-bold text-white">{w.n}</span>
                    <span aria-hidden>&rarr;</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <div className="grid grid-cols-2 content-start gap-4">
          <StatCard label="Open orders" value={String(open.length)} />
          <StatCard label="On the road" value={String(by("LOGISTICS").length + by("DISPATCHED").length)} />
          <StatCard label="Money to collect" value={inr(outstanding)} />
          <StatCard label="Late payments" value={String(overdue.length)} tone={overdue.length ? "warn" : "good"} />
        </div>
      </div>

      <h2 className="mb-3 mt-8 font-bold">All orders by stage</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {CRM_STAGES.map((s) => (
          <Link key={s.key} href={`/orders?stage=${s.key}`}>
            <Card className="h-full p-4 transition hover:-translate-y-0.5 hover:border-accent">
              <div className="text-sm font-bold">{s.label}</div>
              <div className="mt-1 text-3xl font-extrabold">{by(s.key).length}</div>
              <div className="text-xs text-muted">{s.owner}</div>
            </Card>
          </Link>
        ))}
      </div>

      <details className="mt-8 rounded-2xl border border-line bg-white p-5 text-sm">
        <summary className="cursor-pointer font-bold">New here? See how an order moves</summary>
        <ol className="mt-3 space-y-2">
          {FLOW.map((f, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
              {f}
            </li>
          ))}
        </ol>
      </details>

      <h2 className="mb-3 mt-8 font-bold">Latest orders</h2>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {orders.slice(0, 5).map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-slate-50">
                <td className="p-3 font-semibold">
                  <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${o.urgency === "late" ? "bg-red-500" : o.urgency === "warn" ? "bg-amber-400" : o.urgency === "none" ? "bg-emerald-500" : "bg-slate-300"}`} />
                  <Link href={`/orders/${o.id}`} className="hover:text-accent">{o.number}</Link>
                </td>
                <td className="p-3">{o.dealerName}</td>
                <td className="hidden p-3 text-muted sm:table-cell">{nextAction(o)}</td>
                <td className="hidden p-3 text-right md:table-cell">{inr(o.total)}</td>
                <td className="p-3"><StageBadge stage={o.stage} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
