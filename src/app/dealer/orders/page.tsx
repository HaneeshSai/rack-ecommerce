import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { OrderCard, type OrderView } from "@/components/dealer/order-card";
import { dealerOrders, isOverdue, iso, orderItems } from "@/components/dealer/server";
import { CrmOrderCard } from "@/components/dealer/crm-order-card";
import { serializeCrm } from "@/lib/crm-data";

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
  const viaRep = mock.S().crmOrders.filter((o) => o.dealerId === user.dealerId).map(serializeCrm).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageTitle title="Orders" sub="Track status, dispatch details and reorder in one click." />
      {viaRep.length > 0 && (
        <>
          <h2 className="mb-3 font-bold">Placed through your sales rep</h2>
          <div className="mb-8 space-y-4">{viaRep.map((o) => <CrmOrderCard key={o.id} o={o} />)}</div>
          <h2 className="mb-3 font-bold">Website orders</h2>
        </>
      )}
      <div className="space-y-4">
        {orders.map((o) => <OrderCard key={o.number} o={o} bank={bank} />)}
        {orders.length === 0 && <p className="text-muted">No orders yet.</p>}
      </div>
    </>
  );
}
