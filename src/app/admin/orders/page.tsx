import { PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { OrderTable } from "@/components/admin/order-table";
import { visibleOrders } from "@/components/admin/data";

export default async function AdminOrders() {
  const user = await requireStaff("orders");
  const S = mock.S();
  const own = user.role === "WAREHOUSE" ? user.warehouse : null;
  const rows = [...visibleOrders(user)]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((o) => ({
      number: o.number, createdAt: o.createdAt.toISOString(), customer: o.customerName, phone: o.customerPhone,
      buyerType: o.buyerType, dealerId: o.dealerId, city: o.city, warehouses: o.warehouses, paymentMode: o.paymentMode,
      status: o.status, total: o.total,
    }));
  return (
    <>
      <PageTitle
        title="Orders"
        sub={own ? `Showing orders routed to your hub (${own}) only.` : "Every order across all hubs. Open one to pack, dispatch and invoice."}
      />
      <OrderTable
        rows={rows}
        dealers={S.dealers.map((d) => ({ id: d.id, name: d.businessName }))}
        warehouses={S.warehouses.map((w) => w.code)}
        fixedWarehouse={own}
      />
    </>
  );
}
