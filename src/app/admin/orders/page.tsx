import { Button, Card, PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { setOrderStatus } from "@/lib/actions/admin";
import { inr } from "@/lib/money";

const STATUSES = ["PENDING", "PAID", "PACKED", "DISPATCHED", "DELIVERED", "CANCELLED"];

export default async function AdminOrders() {
  await requireUser("ADMIN");
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <>
      <PageTitle title="Orders" sub="Dispatch status drives the WhatsApp updates (later phase)." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Payment</th><th className="p-3 text-right">Total</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="p-3 font-medium">{o.number}</td>
                <td className="p-3">{o.customerName}<div className="text-xs text-muted">{o.customerPhone}</div></td>
                <td className="p-3 text-muted">{o.paymentMode}</td>
                <td className="p-3 text-right">{inr(o.total)}</td>
                <td className="p-3">
                  <form action={setOrderStatus.bind(null, o.id)} className="flex gap-2">
                    <select name="status" defaultValue={o.status} className="rounded-lg border border-line px-2 py-1">
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <Button variant="ghost" className="!py-1">Save</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
