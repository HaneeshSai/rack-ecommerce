import Link from "next/link";
import { Badge, Card, PageTitle, StatCard } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { PERMS, type Area, type StaffRole } from "@/lib/logistics";
import { fmtDate, fmtDateTime } from "@/components/admin/format";
import { visibleOrders } from "@/components/admin/data";

export default async function AdminHome() {
  const user = await requireStaff("overview");
  const S = mock.S();
  const role = user.role as StaffRole;
  const can = (a: Area) => PERMS[role].includes(a);
  const now = Date.now();

  const orders = visibleOrders(user);
  const revenue = orders.filter((o) => o.status !== "CANCELLED").reduce((n, o) => n + o.total, 0);
  const lowStock = S.stock.filter((x) => {
    if (x.qty >= S.settings.lowStock) return false;
    if (role !== "WAREHOUSE" || !user.warehouse) return true;
    return S.warehouses.find((w) => w.id === x.warehouseId)?.code === user.warehouse;
  }).length;
  const pending = S.dealers.filter((d) => d.status === "PENDING");
  const overdue = S.orders
    .filter((o) => o.dealerId && !o.paid && o.paymentMode === "CREDIT" && !["CANCELLED", "PLACED", "PAYMENT_PENDING"].includes(o.status) && o.dueDate && o.dueDate.getTime() < now)
    .reduce((n, o) => n + o.total, 0);
  const newLeads = S.leads.filter((l) => l.status === "NEW").length;
  const tasks = S.tasks.filter((t) => !t.done && t.due.getTime() < now + 864e5).sort((a, b) => a.due.getTime() - b.due.getTime());

  const stats: [string, string, ("good" | "warn")?][] = [["Orders", String(orders.length)]];
  if (can("reports") || role === "ADMIN") stats.push(["Revenue", inr(revenue)]);
  if (can("crm")) stats.push(["New leads", String(newLeads)]);
  stats.push(["Low-stock lines", String(lowStock), lowStock > 0 ? "warn" : undefined]);
  if (can("dealers")) stats.push(["Pending approvals", String(pending.length), pending.length ? "warn" : undefined]);
  if (can("payments") || role === "SALES") stats.push(["Overdue amount", inr(overdue), overdue > 0 ? "warn" : undefined]);

  return (
    <>
      <PageTitle title="Overview" sub={`Signed in as ${user.name}. You see only the areas your role allows.`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map(([k, v, tone]) => <StatCard key={k} label={k} value={v} tone={tone} />)}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {can("dealers") && (
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Pending dealer approvals</h2>
            {pending.length === 0 && <p className="text-sm text-muted">Nothing waiting.</p>}
            <ul className="divide-y divide-line text-sm">
              {pending.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <b>{d.businessName}</b>
                    <span className="block text-xs text-muted">{d.city} - applied {fmtDate(d.appliedAt.toISOString())}</span>
                  </span>
                  <Link href={`/dealers/${d.id}`} className="font-semibold text-accent hover:underline">Review</Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {can("tasks") && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Due today and overdue</h2>
              <Link href="/tasks" className="text-sm font-semibold text-accent hover:underline">All tasks</Link>
            </div>
            {tasks.length === 0 && <p className="text-sm text-muted">No tasks due.</p>}
            <ul className="divide-y divide-line text-sm">
              {tasks.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <span>{t.title}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {t.auto && <Badge tone="blue">auto</Badge>}
                    <Badge tone={t.due.getTime() < now ? "red" : "amber"}>{t.due.getTime() < now ? "overdue" : "today"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {role === "ADMIN" && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Recent activity</h2>
              <Link href="/activity" className="text-sm font-semibold text-accent hover:underline">Full log</Link>
            </div>
            <ul className="divide-y divide-line text-sm">
              {S.activity.slice(0, 5).map((a) => (
                <li key={a.id} className="py-2">
                  {a.action}
                  <span className="block text-xs text-muted">{a.who} - {fmtDateTime(a.at.toISOString())}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="p-5">
          <h2 className="mb-3 font-bold">Notification outbox <span className="text-xs font-normal text-muted">(mock messages)</span></h2>
          <ul className="divide-y divide-line text-sm">
            {S.notifications.slice(0, 6).map((n) => (
              <li key={n.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{n.event}</b>
                  {n.channels.map((c) => <Badge key={c} tone="gray">{c}</Badge>)}
                </div>
                <div className="text-muted">{n.text}</div>
                <div className="text-xs text-muted">To {n.to} - {fmtDateTime(n.at.toISOString())}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
