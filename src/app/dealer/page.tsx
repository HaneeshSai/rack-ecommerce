import { Badge, Card, LinkButton, PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { inr } from "@/lib/money";

export default async function DealerHome() {
  const user = await requireUser("DEALER");
  const dealer = user.dealer!;
  const orders = await db.order.findMany({
    where: { dealerId: dealer.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const available = dealer.creditLimit - dealer.creditUsed;

  return (
    <>
      <PageTitle
        title={`Welcome, ${dealer.businessName}`}
        sub={`GSTIN ${dealer.gstin}`}
        action={<LinkButton href="/catalog">Place bulk order</LinkButton>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted">Credit limit</div>
          <div className="text-2xl font-bold">{inr(dealer.creditLimit)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Used</div>
          <div className="text-2xl font-bold">{inr(dealer.creditUsed)}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted">Available</div>
          <div className="text-2xl font-bold text-emerald-600">{inr(available)}</div>
        </Card>
      </div>
      <h2 className="mb-3 mt-10 font-semibold">Recent orders</h2>
      <Card className="divide-y divide-line">
        {orders.length === 0 && <p className="p-4 text-sm text-muted">No orders yet.</p>}
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between p-4 text-sm">
            <span className="font-medium">{o.number}</span>
            <Badge tone="blue">{o.status}</Badge>
            <span>{inr(o.total)}</span>
          </div>
        ))}
      </Card>
    </>
  );
}
