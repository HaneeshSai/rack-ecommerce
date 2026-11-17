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
    checks.push({ ok: !d.creditHold, blocking: true, label: "Credit is not on hold", detail: d.creditHold ? `On hold: ${d.creditHold.reason} Change the terms to advance, or release the hold on the dealer page.` : "All clear" });
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

// ---- Dealer health: one score and plain reasons, plus a re-order reminder ----
export type Health = {
  score: number; level: "good" | "watch" | "risk"; reasons: { text: string; bad: boolean }[];
  lastOrder: number | null; quietDays: number | null;
  reorder: { everyDays: number; daysSince: number; due: boolean } | null;
};

export function dealerHealth(d: Dealer): Health {
  const S = mock.S();
  const now = Date.now();
  const reasons: Health["reasons"] = [];
  let score = 100;

  const overdue = overdueFor(d);
  if (overdue) { score -= 25 * Math.min(overdue, 2); reasons.push({ text: `${overdue} invoice(s) overdue`, bad: true }); }
  else reasons.push({ text: "Pays on time", bad: false });

  const bounced = S.cheques.filter((c) => c.dealerId === d.id && c.status === "BOUNCED").length;
  if (bounced) { score -= 20; reasons.push({ text: `${bounced} bounced cheque(s)`, bad: true }); }

  const util = d.creditLimit > 0 ? d.creditUsed / d.creditLimit : 0;
  if (util > 0.85) { score -= 10; reasons.push({ text: `Using ${Math.round(util * 100)}% of the credit limit`, bad: true }); }

  const claims = S.claims.filter((c) => c.dealerId === d.id && (c.status === "OPEN" || c.status === "APPROVED")).length;
  if (claims) { score -= 5; reasons.push({ text: `${claims} claim(s) still open`, bad: true }); }

  if (d.creditHold) { score -= 15; reasons.push({ text: "Credit is on hold", bad: true }); }

  const times = [
    ...S.orders.filter((o) => o.dealerId === d.id && o.status !== "CANCELLED").map((o) => o.createdAt.getTime()),
    ...S.crmOrders.filter((o) => o.dealerId === d.id).map((o) => o.createdAt.getTime()),
  ].sort((a, b) => a - b);
  const last = times.length ? times[times.length - 1] : null;
  const quietDays = last ? Math.floor((now - last) / DAY) : null;
  if (quietDays === null || quietDays >= 60) { score -= 30; reasons.push({ text: quietDays === null ? "Has never ordered" : `No order for ${quietDays} days`, bad: true }); }
  else if (quietDays >= 30) { score -= 15; reasons.push({ text: `No order for ${quietDays} days`, bad: true }); }
  else reasons.push({ text: "Ordered recently", bad: false });

  // Re-order rhythm: needs 3+ orders on different days to be meaningful.
  const days = [...new Set(times.map((t) => Math.floor(t / DAY)))];
  let reorder: Health["reorder"] = null;
  if (days.length >= 3 && last) {
    const every = Math.max(1, Math.round((days[days.length - 1] - days[0]) / (days.length - 1)));
    reorder = { everyDays: every, daysSince: quietDays ?? 0, due: (quietDays ?? 0) >= every };
  }

  score = Math.max(0, Math.min(100, score));
  return { score, level: score >= 75 ? "good" : score >= 45 ? "watch" : "risk", reasons, lastOrder: last, quietDays, reorder };
}
