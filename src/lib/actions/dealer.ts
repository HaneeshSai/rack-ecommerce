"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { gstBreakup, WAREHOUSE_STATE } from "@/lib/gst";

export type DealerOrderResult = { error: string } | undefined;

// Dealer identity comes from the session, never from the form.
export async function placeDealerOrder(
  _prev: DealerOrderResult,
  formData: FormData,
): Promise<DealerOrderResult> {
  const user = await requireUser("DEALER");
  const dealerId = user.dealerId!;

  const wanted: { id: string; qty: number }[] = [];
  for (const [k, v] of formData.entries()) {
    if (!k.startsWith("qty_")) continue;
    const qty = Math.floor(Number(v));
    if (qty > 0 && qty <= 1000) wanted.push({ id: k.slice(4), qty });
  }
  if (wanted.length === 0) return { error: "Enter a quantity for at least one item." };

  const variants = await db.variant.findMany({
    where: { id: { in: wanted.map((w) => w.id) } },
    include: { product: true, stock: true },
  });
  if (variants.length !== wanted.length) return { error: "Some items are no longer available." };

  for (const w of wanted) {
    const v = variants.find((x) => x.id === w.id)!;
    const avail = v.stock.reduce((n, s) => n + s.qty, 0);
    if (avail < w.qty) return { error: `Only ${avail} in stock for ${v.product.name} (${v.label}).` };
  }

  const dealer = await db.dealer.findUniqueOrThrow({ where: { id: dealerId } });
  // Dealers are in Andhra Pradesh/Telangana in the demo data; ship from Hyderabad.
  const g = gstBreakup(
    wanted.map((w) => {
      const v = variants.find((x) => x.id === w.id)!;
      return { amount: v.dealerPrice * w.qty, rate: v.product.gstRate };
    }),
    WAREHOUSE_STATE.HYD,
    "Telangana",
  );

  if (dealer.creditUsed + g.total > dealer.creditLimit) {
    return { error: "This order is over your available credit. Please contact us." };
  }

  const number = `RK-${10001 + (await db.order.count())}`;
  await db.$transaction([
    db.order.create({
      data: {
        number,
        status: "PENDING",
        userId: user.id,
        dealerId,
        customerName: dealer.businessName,
        customerPhone: dealer.phone,
        customerGstin: dealer.gstin,
        shipState: "Telangana",
        subtotal: g.subtotal,
        gstAmount: g.gstTotal,
        total: g.total,
        paymentMode: "DEALER CREDIT",
        items: {
          create: wanted.map((w) => {
            const v = variants.find((x) => x.id === w.id)!;
            return { variantId: v.id, qty: w.qty, unitPrice: v.dealerPrice, gstRate: v.product.gstRate };
          }),
        },
      },
    }),
    db.dealer.update({ where: { id: dealerId }, data: { creditUsed: { increment: g.total } } }),
  ]);

  redirect("/orders");
}
