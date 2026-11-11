import Link from "next/link";
import { Badge, Card, LinkButton, PageTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { dealerOrders, isOverdue } from "@/components/dealer/server";
import { STATUS_LABEL, TIER_LABEL, dateStr, statusTone } from "@/components/dealer/format";

export default async function DealerHome() {
  const user = await requireUser("DEALER");
  const dealer = user.dealer!;
  const orders = dealerOrders(dealer.id);
  const recent = orders.slice(0, 5);
  const overdue = orders.filter(isOverdue);
  const overdueTotal = overdue.reduce((n, o) => n + o.total, 0);
  const openQuotes = mock.S().quotes.filter((q) => q.dealerId === dealer.id && q.status === "SENT").length;
  const available = Math.max(0, dealer.creditLimit - dealer.creditUsed);
  const usedPct = dealer.creditLimit > 0 ? Math.min(100, Math.round((dealer.creditUsed / dealer.creditLimit) * 100)) : 0;
  const approved = dealer.status === "APPROVED";
  const wh = mock.S().warehouses.find((w) => w.code === dealer.homeWarehouse);

  return (
    <>
      <PageTitle
        title={`Welcome, ${dealer.businessName}`}
        sub={`GSTIN ${dealer.gstin}`}
        action={approved ? <LinkButton href="/catalog">Place bulk order</LinkButton> : undefined}
      />

      {overdue.length > 0 && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <b>Payment overdue:</b> {overdue.length} invoice{overdue.length > 1 ? "s" : ""} worth {inr(overdueTotal)} past due.
          Credit orders are blocked until this is cleared.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <Badge tone={dealer.tier === "PLATINUM" ? "blue" : dealer.tier === "GOLD" ? "amber" : "gray"}>{TIER_LABEL[dealer.tier]} tier</Badge>
        <Badge tone="gray">Home warehouse: {wh?.city ?? dealer.homeWarehouse}</Badge>
        <Badge tone="gray">Terms: {dealer.termsDays} days</Badge>
        <Badge tone={approved ? "green" : dealer.status === "PENDING" ? "amber" : "red"}>{dealer.status.toLowerCase()}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Credit limit" value={inr(dealer.creditLimit)} />
        <StatCard label="Outstanding balance" value={inr(dealer.creditUsed)} tone={overdue.length ? "warn" : undefined} />
        <StatCard label="Available credit" value={inr(available)} tone="good" />
        <StatCard label="Open quotes" value={String(openQuotes)} />
      </div>

      <Card className="mt-4 p-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold">Credit used</span>
          <span className="text-muted">{usedPct}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${usedPct > 85 ? "bg-red-500" : "bg-accent"}`} style={{ width: `${usedPct}%` }} />
        </div>
      </Card>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          ["/catalog", "Price list & bulk order"],
          ["/quotes", "Request a quote"],
          ["/invoices", "Download invoices"],
          ["/support", "Raise a ticket"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="rounded-xl border border-line bg-white p-4 text-sm font-semibold shadow-[var(--shadow)] transition hover:border-accent">
            {label} &rarr;
          </Link>
        ))}
      </div>

      <div className="mb-3 mt-10 flex items-end justify-between">
        <h2 className="font-semibold">Recent orders</h2>
        <Link href="/orders" className="text-sm font-semibold text-accent hover:underline">All orders &rarr;</Link>
      </div>
      <Card className="divide-y divide-line">
        {recent.length === 0 && <p className="p-4 text-sm text-muted">No orders yet.</p>}
        {recent.map((o) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="font-medium">{o.number}</span>
            <span className="text-muted">{dateStr(o.createdAt.toISOString())}</span>
            <Badge tone={statusTone(o.status)}>{STATUS_LABEL[o.status]}</Badge>
            <span className="font-semibold">{inr(o.total)}</span>
          </div>
        ))}
      </Card>
    </>
  );
}
