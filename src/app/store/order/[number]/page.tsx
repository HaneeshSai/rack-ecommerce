import { notFound } from "next/navigation";
import { Card, LinkButton } from "@/components/ui";
import { db } from "@/lib/db";
import { inr2 } from "@/lib/money";
import { BRAND } from "@/lib/brand";

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await db.order.findUnique({
    where: { number },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <div className="text-sm font-semibold uppercase tracking-widest text-emerald-600">Order placed</div>
        <h1 className="mt-1 text-3xl font-bold">Thank you, {order.customerName}</h1>
        <p className="mt-1 text-muted">Order {order.number}</p>
      </div>

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
          <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{inr2(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted">GST</span><span>{inr2(order.gstAmount)}</span></div>
          <div className="flex justify-between text-base font-bold"><span>Total</span><span>{inr2(order.total)}</span></div>
        </Card>

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">WhatsApp preview (mock)</div>
          <div className="rounded-2xl bg-[#e7f5df] p-4 text-sm shadow-sm">
            <div className="mb-1 font-semibold">{BRAND.name}</div>
            <p>Hi {order.customerName}, your order <b>{order.number}</b> is confirmed.</p>
            <p className="mt-1">Total paid: <b>{inr2(order.total)}</b></p>
            <p className="mt-1">Your GST invoice has been emailed. We will message you when it is dispatched.</p>
          </div>
        </div>
      </div>

      <div className="text-center"><LinkButton href="/" variant="ghost">Back to store</LinkButton></div>
    </div>
  );
}
