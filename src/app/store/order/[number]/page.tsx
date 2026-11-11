import { notFound } from "next/navigation";
import { Badge, Card, LinkButton } from "@/components/ui";
import { OrderTracker } from "@/components/store/order-tracker";
import { db } from "@/lib/db";
import { inr2 } from "@/lib/money";
import { BRAND } from "@/lib/brand";

const DELIVERY_LABEL = { FREIGHT: "Delivery by vehicle", SELF: "Self-booked freight", PICKUP: "Store pickup" } as const;

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await db.order.findUnique({ where: { number } });
  if (!order) notFound();

  const pending = order.status === "PAYMENT_PENDING";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <div className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
          {pending ? "Order placed - awaiting payment" : "Order placed"}
        </div>
        <h1 className="mt-1 text-3xl font-bold">Thank you, {order.customerName}</h1>
        <p className="mt-1 text-muted">Order {order.number}</p>
      </div>

      <Card className="p-5">
        <OrderTracker status={order.status} />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-2 p-5 text-sm">
          <h2 className="mb-1 font-semibold">Summary</h2>
          {order.items.map((i) => (
            <div key={i.id} className="flex justify-between gap-3">
              <span>{i.variant.product.name} <span className="text-muted">({i.variant.label}) x {i.qty}</span></span>
              <span>{inr2(i.unitPrice * i.qty)}</span>
            </div>
          ))}
          <hr className="border-line" />
          <div className="flex justify-between"><span className="text-muted">Taxable value</span><span>{inr2(order.subtotal)}</span></div>
          {order.shipping > 0 && <div className="flex justify-between"><span className="text-muted">Freight</span><span>{inr2(order.shipping)}</span></div>}
          {order.igst > 0 ? (
            <div className="flex justify-between"><span className="text-muted">IGST</span><span>{inr2(order.igst)}</span></div>
          ) : order.cgst > 0 || order.sgst > 0 ? (
            <>
              <div className="flex justify-between"><span className="text-muted">CGST</span><span>{inr2(order.cgst)}</span></div>
              <div className="flex justify-between"><span className="text-muted">SGST</span><span>{inr2(order.sgst)}</span></div>
            </>
          ) : (
            <div className="flex justify-between"><span className="text-muted">GST</span><span>{inr2(order.gstAmount)}</span></div>
          )}
          <div className="flex justify-between text-base font-bold"><span>Total</span><span>{inr2(order.total)}</span></div>
        </Card>

        <Card className="space-y-2 p-5 text-sm">
          <h2 className="mb-1 font-semibold">Delivery &amp; invoice</h2>
          <Line k="Payment" v={order.paymentMode} />
          <Line k="Deliver to" v={`${order.city || "-"}${order.shipState ? `, ${order.shipState}` : ""}`} />
          <Line k="Method" v={DELIVERY_LABEL[order.delivery as keyof typeof DELIVERY_LABEL] ?? "Delivery by vehicle"} />
          {order.warehouses.length > 0 && <Line k="Dispatching from" v={order.warehouses.join(", ")} />}
          {order.invoiceNo && <Line k="Tax invoice" v={order.invoiceNo} />}
          {order.proformaNo && <Line k="Proforma invoice" v={order.proformaNo} />}
          {order.ewayRequired && <Line k="E-way bill" v={order.ewayBill ?? "Required (over Rs 50,000) - being generated"} />}
          {order.dispatch ? (
            <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-emerald-900">
              <div className="mb-1 flex items-center gap-2 font-semibold">Dispatch details <Badge tone="green">on the way</Badge></div>
              <Line k="Vehicle" v={`${order.dispatch.vehicleType} - ${order.dispatch.vehicleNo}`} />
              <Line k="Driver phone" v={order.dispatch.driverPhone} />
              <Line k="Booking ID" v={order.dispatch.bookingId} />
              {order.pod && <p className="mt-1 text-xs">Proof of delivery recorded.</p>}
            </div>
          ) : (
            <p className="pt-2 text-muted">Dispatch details (vehicle, driver, booking ID) appear here once the order ships.</p>
          )}
        </Card>
      </div>

      <div>
        <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">WhatsApp preview (mock)</div>
        <div className="max-w-md rounded-2xl bg-[#e7f5df] p-4 text-sm shadow-sm">
          <div className="mb-1 font-semibold">{BRAND.name}</div>
          <p>Hi {order.customerName}, your order <b>{order.number}</b> is {pending ? "placed and awaiting payment" : "confirmed"}.</p>
          <p className="mt-1">Total: <b>{inr2(order.total)}</b></p>
          <p className="mt-1">Your GST invoice has been emailed. We will message you when it is dispatched.</p>
        </div>
      </div>

      <div className="text-center"><LinkButton href="/" variant="ghost">Back to store</LinkButton></div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted">{k}</span><span className="text-right font-medium">{v}</span></div>;
}
