import { Badge, Card, PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { inr } from "@/lib/money";

export default async function DealerOrders() {
  const user = await requireUser("DEALER");
  const orders = await db.order.findMany({
    where: { dealerId: user.dealerId! },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  return (
    <>
      <PageTitle title="Orders" />
      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id} className="p-4 text-sm">
            <div className="flex items-center justify-between">
              <b>{o.number}</b><Badge tone="blue">{o.status}</Badge><b>{inr(o.total)}</b>
            </div>
            <ul className="mt-2 text-muted">
              {o.items.map((i) => (
                <li key={i.id}>{i.variant.product.name} ({i.variant.label}) x {i.qty}</li>
              ))}
            </ul>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-muted">No orders yet.</p>}
      </div>
    </>
  );
}
