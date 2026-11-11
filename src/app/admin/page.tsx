import { Card, PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { inr } from "@/lib/money";

export default async function AdminHome() {
  await requireUser("ADMIN");
  const [orders, revenue, newLeads, lowStock] = await Promise.all([
    db.order.count(),
    db.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    db.lead.count({ where: { status: "NEW" } }),
    db.stock.count({ where: { qty: { lt: 5 } } }),
  ]);
  const stats = [
    ["Orders", String(orders)],
    ["Revenue", inr(revenue._sum.total ?? 0)],
    ["New leads", String(newLeads)],
    ["Low-stock lines (<5)", String(lowStock)],
  ];
  return (
    <>
      <PageTitle title="Overview" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <Card key={k} className="p-5">
            <div className="text-sm text-muted">{k}</div>
            <div className="text-2xl font-bold">{v}</div>
          </Card>
        ))}
      </div>
    </>
  );
}
