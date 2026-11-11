import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { OrderDetail } from "@/components/admin/order-detail";
import { serializeOrder } from "@/components/admin/data";
import { WAREHOUSES } from "@/lib/logistics";

export default async function AdminOrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const user = await requireStaff("orders");
  const S = mock.S();
  const o = S.orders.find((x) => x.number === number);
  if (!o) notFound();
  if (user.role === "WAREHOUSE" && user.warehouse && !o.warehouses.includes(user.warehouse)) notFound();
  const whCity = WAREHOUSES.find((w) => w.code === o.warehouses[0])?.city ?? "";
  return (
    <OrderDetail
      order={serializeOrder(o)}
      role={user.role}
      staffName={user.name}
      invoiceSeries={S.settings.invoiceSeries}
      nextInvoiceNo={S.invoiceSeq + 1}
      fromCity={whCity}
    />
  );
}
