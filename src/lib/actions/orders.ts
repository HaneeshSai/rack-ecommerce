"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { gstBreakup, WAREHOUSE_STATE } from "@/lib/gst";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  gstin: z.string().trim().toUpperCase().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/, "Invalid GSTIN").optional().or(z.literal("")),
  state: z.string().min(2),
  items: z.array(z.object({ variantId: z.string(), qty: z.number().int().min(1).max(500) })).min(1),
});

export type PlaceOrderResult = { error: string } | { orderNumber: string };

// Never trusts prices from the client: re-reads them from the database.
export async function placeOrder(input: unknown): Promise<PlaceOrderResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, phone, gstin, state, items } = parsed.data;

  const variants = await db.variant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
    include: { product: true, stock: { include: { warehouse: true } } },
  });
  if (variants.length !== items.length) return { error: "Some items are no longer available." };

  for (const it of items) {
    const v = variants.find((x) => x.id === it.variantId)!;
    const avail = v.stock.reduce((n, s) => n + s.qty, 0);
    if (avail < it.qty) return { error: `Only ${avail} left of ${v.product.name} (${v.label}).` };
  }

  // Ship from Hyderabad by default (decides CGST+SGST vs IGST).
  const sellerState = WAREHOUSE_STATE.HYD;
  const lines = items.map((it) => {
    const v = variants.find((x) => x.id === it.variantId)!;
    return { amount: v.retailPrice * it.qty, rate: v.product.gstRate };
  });
  const g = gstBreakup(lines, sellerState, state);

  const count = await db.order.count();
  const number = `RK-${10001 + count}`;

  await db.order.create({
    data: {
      number,
      status: "PAID", // mock payment
      customerName: name,
      customerPhone: phone,
      customerGstin: gstin || null,
      shipState: state,
      subtotal: g.subtotal,
      gstAmount: g.gstTotal,
      total: g.total,
      paymentMode: "ONLINE (mock)",
      items: {
        create: items.map((it) => {
          const v = variants.find((x) => x.id === it.variantId)!;
          return { variantId: v.id, qty: it.qty, unitPrice: v.retailPrice, gstRate: v.product.gstRate };
        }),
      },
    },
  });

  return { orderNumber: number };
}
