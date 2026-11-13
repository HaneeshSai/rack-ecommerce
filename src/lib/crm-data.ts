// Server-side helpers: turn CRM orders into plain props for client components.
import { mock, type CrmOrder, type Dealer } from "@/lib/db";
import { gstinFormatOk } from "@/lib/crm";

export const DAY = 864e5;
export const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export function crmTotals(o: CrmOrder) {
  const S = mock.S();
  let sub = 0, gst = 0;
  for (const l of o.lines) {
    const v = S.variants.find((x) => x.id === l.variantId);
    const rate = (v && S.products.find((p) => p.id === v.productId)?.gstRate) ?? 18;
    const amt = l.qty * l.price;
    sub += amt;
    gst += Math.round((amt * rate) / 100);
  }
  return { sub, gst, total: sub + gst };
}

export type CrmDTO = {
  id: string; number: string; dealerId: string; dealerName: string; dealerCity: string; dealerPhone: string; fieldRep: string;
  terms: string; hub: string; stage: CrmOrder["stage"]; notes: string; proformaNo: string | null;
  invoiceNo: string | null; dcNo: string | null; vehicle: CrmOrder["vehicle"];
  dueDate: string | null; overdueDays: number; delivered: boolean; stageDays: number; urgency: "ok" | "warn" | "late" | "none";
  payment: { utr: string; amount: number; mode: string; at: string; reported: boolean } | null;
  followups: { at: string; by: string; note: string; promiseDate: string | null }[];
  timeline: { at: string; by: string; text: string }[];
  lines: { name: string; label: string; sku: string; qty: number; price: number }[];
  sub: number; gst: number; total: number; createdAt: string;
};

export function serializeCrm(o: CrmOrder): CrmDTO {
  const S = mock.S();
  const d = S.dealers.find((x) => x.id === o.dealerId);
  const t = crmTotals(o);
  const lastAt = o.timeline.length ? o.timeline[o.timeline.length - 1].at.getTime() : o.createdAt.getTime();
  const stageDays = Math.max(0, Math.floor((Date.now() - lastAt) / DAY));
  const overdueDays = o.stage === "DOCS_SENT" && o.dueDate ? Math.max(0, Math.floor((Date.now() - o.dueDate.getTime()) / DAY)) : 0;
  return {
    id: o.id, number: o.number, dealerId: o.dealerId, dealerName: d?.businessName ?? "Unknown dealer", dealerCity: d?.city ?? "",
    dealerPhone: d?.phone ?? "", fieldRep: o.fieldRep, terms: o.terms, hub: o.hub, stage: o.stage, notes: o.notes,
    proformaNo: o.proformaNo, invoiceNo: o.invoiceNo, dcNo: o.dcNo, vehicle: o.vehicle, dueDate: iso(o.dueDate), overdueDays, delivered: o.delivered, stageDays,
    urgency: o.stage === "PAID" ? "none" : overdueDays > 0 || stageDays >= 4 ? "late" : stageDays >= 2 ? "warn" : "ok",
    payment: o.payment ? { ...o.payment, at: o.payment.at.toISOString() } : null,
    followups: o.followups.map((f) => ({ ...f, at: f.at.toISOString() })),
    timeline: o.timeline.map((x) => ({ ...x, at: x.at.toISOString() })),
    lines: o.lines.map((l) => {
      const v = S.variants.find((x) => x.id === l.variantId)!;
      const p = S.products.find((x) => x.id === v.productId)!;
      return { name: p.name, label: v.label, sku: v.sku, qty: l.qty, price: l.price };
    }),
    ...t, createdAt: o.createdAt.toISOString(),
  };
}

export type Check = { ok: boolean; blocking: boolean; label: string; detail: string };

// Pre-checks the coordinator does before sending an order to accounts (step 2).
export function screenOrder(o: CrmOrder): Check[] {
  const S = mock.S();
  const d = S.dealers.find((x) => x.id === o.dealerId);
  const { total } = crmTotals(o);
  const checks: Check[] = [];
  const hubId = S.warehouses.find((w) => w.code === o.hub)?.id;

  checks.push({ ok: d?.status === "APPROVED", blocking: true, label: "Dealer is approved", detail: d ? `Status: ${d.status.toLowerCase()}` : "Dealer not found" });
  checks.push({ ok: !!d?.gstVerified, blocking: false, label: "GSTIN verified", detail: d ? d.gstin : "-" });

  if (o.terms.startsWith("Credit") && d) {
    const free = d.creditLimit - d.creditUsed;
    checks.push({ ok: total <= free, blocking: true, label: "Order is within credit limit", detail: `Order Rs ${Math.round(total / 100).toLocaleString("en-IN")} vs available Rs ${Math.round(Math.max(0, free) / 100).toLocaleString("en-IN")}` });
    const overdue = overdueFor(d);
    checks.push({ ok: overdue === 0, blocking: S.settings.blockOverdueCredit, label: "No overdue invoices", detail: overdue ? `${overdue} overdue invoice(s) not yet paid` : "All clear" });
  }

  const short = o.lines.filter((l) => {
    const row = S.stock.find((x) => x.variantId === l.variantId && x.warehouseId === hubId);
    return !row || row.qty < l.qty;
  });
  checks.push({
    ok: short.length === 0, blocking: false, label: `Stock available at ${o.hub} hub`,
    detail: short.length ? short.map((l) => mock.variantName(l.variantId)).join(", ") + " short at this hub" : "All items in stock",
  });
  return checks;
}

export function overdueFor(d: Dealer): number {
  const S = mock.S();
  const now = Date.now();
  const a = S.orders.filter((o) => o.dealerId === d.id && !o.paid && o.paymentMode === "CREDIT" && o.dueDate && o.dueDate.getTime() < now && !["CANCELLED", "PLACED", "PAYMENT_PENDING"].includes(o.status)).length;
  const b = S.crmOrders.filter((o) => o.dealerId === d.id && o.stage === "DOCS_SENT" && o.dueDate && o.dueDate.getTime() < now).length;
  return a + b;
}

export { gstinFormatOk };
