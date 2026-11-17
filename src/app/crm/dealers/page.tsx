import Link from "next/link";
import clsx from "clsx";
import { Badge, Card, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { fmtDate } from "@/components/admin/format";
import { overdueFor, dealerHealth } from "@/lib/crm-data";
import { HealthBadge } from "@/components/crm/bits";
import { CallLogger } from "@/components/crm/call-logger";

export default async function DealerNetwork({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireUser("CRM");
  const { show } = await searchParams;
  const S = mock.S();
  const now = Date.now();

  const rows = S.dealers.filter((d) => d.status === "APPROVED").map((d) => {
    const dates = [
      ...S.orders.filter((o) => o.dealerId === d.id).map((o) => o.createdAt.getTime()),
      ...S.crmOrders.filter((o) => o.dealerId === d.id).map((o) => o.createdAt.getTime()),
    ];
    const last = dates.length ? Math.max(...dates) : null;
    const quiet = last ? Math.floor((now - last) / 864e5) : null;
    return { d, count: dates.length, last, quiet, inactive: quiet === null || quiet >= 30, overdue: overdueFor(d), h: dealerHealth(d) };
  });
  const list = (show === "inactive" ? rows.filter((r) => r.inactive) : show === "reorder" ? rows.filter((r) => r.h.reorder?.due) : show === "risk" ? rows.filter((r) => r.h.level === "risk" || r.d.creditHold) : rows).sort((a, b) => a.h.score - b.h.score);

  return (
    <>
      <PageTitle title="My dealers" sub="Every dealer gets a health score from payments, orders and credit use. Lowest scores come first." />
      <div className="mb-4 flex gap-2 text-sm">
        <Link href="/dealers" className={clsx("rounded-full border px-3 py-1.5", !show ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white")}>All ({rows.length})</Link>
        <Link href="/dealers?show=inactive" className={clsx("rounded-full border px-3 py-1.5", show === "inactive" ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white")}>Needs a call ({rows.filter((r) => r.inactive).length})</Link>
        <Link href="/dealers?show=reorder" className={clsx("rounded-full border px-3 py-1.5", show === "reorder" ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white")}>Due to re-order ({rows.filter((r) => r.h.reorder?.due).length})</Link>
        <Link href="/dealers?show=risk" className={clsx("rounded-full border px-3 py-1.5", show === "risk" ? "border-accent bg-accent-soft font-semibold" : "border-line bg-white")}>At risk ({rows.filter((r) => r.h.level === "risk" || r.d.creditHold).length})</Link>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase text-muted">
            <th className="p-3">Dealer</th><th className="p-3">Health</th><th className="p-3">Hub / tier</th><th className="p-3">Orders</th><th className="p-3">Last order</th>
            <th className="p-3 text-right">Credit used</th><th className="p-3">Status</th><th className="p-3">Actions</th>
          </tr></thead>
          <tbody>
            {list.map(({ d, count, last, quiet, inactive, overdue, h }) => (
              <tr key={d.id} className="border-b border-line align-top last:border-0">
                <td className="p-3 font-semibold"><Link href={`/dealers/${d.id}`} className="hover:text-accent">{d.businessName}</Link><div className="text-xs font-normal text-muted">{d.contactName} · {d.phone}</div></td>
                <td className="p-3"><HealthBadge h={h} /></td>
                <td className="p-3">{d.homeWarehouse} · {d.tier.toLowerCase()}</td>
                <td className="p-3">{count}</td>
                <td className="p-3">{last ? fmtDate(new Date(last).toISOString()) : "Never"}{quiet !== null && <div className="text-xs text-muted">{quiet} days ago</div>}</td>
                <td className="p-3 text-right">{inr(d.creditUsed)}<div className="text-xs text-muted">of {inr(d.creditLimit)}</div></td>
                <td className="p-3 space-y-1">{inactive ? <Badge tone="amber">Needs a call</Badge> : <Badge tone="green">Active</Badge>}{overdue > 0 && <div><Badge tone="red">{overdue} overdue</Badge></div>}{d.creditHold && <div><Badge tone="red">Credit on hold</Badge></div>}{h.reorder?.due && <div><Badge tone="blue">Due to re-order</Badge></div>}</td>
                <td className="p-3"><CallLogger dealerId={d.id} /><Link href={`/orders/new?dealer=${d.id}`} className="mt-1 inline-block text-xs font-semibold text-accent">+ New order</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
