import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { OrderCard, type OrderView } from "@/components/dealer/order-card";
import { dealerOrders, isOverdue, iso, orderItems } from "@/components/dealer/server";

export default async function DealerOrders() {
  const user = await requireUser("DEALER");
  const { bank } = mock.S().settings;
  const orders: OrderView[] = dealerOrders(user.dealerId!).map((o) => ({
    number: o.number, status: o.status, createdAt: o.createdAt.toISOString(), total: o.total, paymentMode: o.paymentMode,
    delivery: o.delivery, warehouses: o.warehouses, ewayRequired: o.ewayRequired, ewayBill: o.ewayBill,
    invoiceNo: o.invoiceNo, proformaNo: o.proformaNo,
    holdDaysLeft: o.holdUntil ? Math.max(0, Math.ceil((o.holdUntil.getTime() - Date.now()) / 864e5)) : null,
    overdue: isOverdue(o), dueDate: iso(o.dueDate), dispatch: o.dispatch,
    items: orderItems(o.id).map((i) => ({ id: i.id, name: i.name, label: i.label, qty: i.qty })),
  }));
  return (
    <>
      <PageTitle title="Orders" sub="Track status, dispatch details and reorder in one click." />
      <div className="space-y-4">
        {orders.map((o) => <OrderCard key={o.number} o={o} bank={bank} />)}
        {orders.length === 0 && <p className="text-muted">No orders yet.</p>}
      </div>
    </>
  );
}
