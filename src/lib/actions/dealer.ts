"use server";

import { db, mock } from "@/lib/db";
import { crmTotals } from "@/lib/crm-data";
import { requireUser } from "@/lib/session";
import { gstBreakup, WAREHOUSE_STATE } from "@/lib/gst";

export type DealerOrderResult = { error: string } | { ok: true } | undefined;

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

  return { ok: true };
}

// Prototype online payment against an invoice. No real gateway: it records the payment.
export async function payInvoice(kind: "order" | "crm", id: string, method: string): Promise<{ ok: boolean; msg: string }> {
  const user = await requireUser("DEALER");
  const S = mock.S();
  const ref = `ONLINE-${method.toUpperCase().replace(/\W/g, "")}-${String(Date.now()).slice(-6)}`;

  if (kind === "order") {
    const o = S.orders.find((x) => x.id === id && x.dealerId === user.dealerId);
    if (!o || o.paid || !o.invoiceNo) return { ok: false, msg: "This invoice cannot be paid." };
    o.paid = true;
    o.utr = ref;
    o.timeline.push({ status: o.status, at: new Date(), by: o.customerName, note: `Paid online (${method})` });
    const d = S.dealers.find((x) => x.id === user.dealerId);
    if (d && o.paymentMode === "CREDIT") d.creditUsed = Math.max(0, d.creditUsed - o.total);
    mock.notify("Online payment received", "Accounts", ["Email", "In-app"], `${o.number}: ${method} ${ref}`, o.number);
    return { ok: true, msg: `Payment received for ${o.invoiceNo}` };
  }

  const c = S.crmOrders.find((x) => x.id === id && x.dealerId === user.dealerId);
  if (!c || c.stage !== "DOCS_SENT" || c.payment) return { ok: false, msg: "This invoice cannot be paid." };
  const total = crmTotals(c).total;
  c.payment = { utr: ref, amount: total, mode: method, at: new Date(), reported: false };
  c.timeline.push({ at: new Date(), by: "Dealer", text: `Paid online (${method}), reference ${ref}` });
  mock.notify("Online payment received", "CRM, Accounts", ["In-app"], `${c.number}: ${method} ${ref}. Report it to accounts.`, c.number);
  return { ok: true, msg: `Payment received for ${c.invoiceNo}` };
}
