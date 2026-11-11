// Server-side helpers that turn the in-memory mock data into plain serializable
// props for the admin client components. Read-only: no mutations here.
import { mock, type Dealer, type Order } from "@/lib/db";

export const DAY = 864e5;
export const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export type ItemDTO = { name: string; label: string; sku: string; hsn: string; qty: number; unitPrice: number; gstRate: number };
export type OrderDTO = {
  id: string; number: string; status: string; buyerType: "RETAIL" | "DEALER"; dealerId: string | null;
  customerName: string; customerPhone: string; customerGstin: string | null; city: string; shipState: string;
  subtotal: number; gstAmount: number; cgst: number; sgst: number; igst: number; shipping: number; total: number;
  paymentMode: string; delivery: string; warehouses: string[]; split: boolean;
  invoiceNo: string | null; proformaNo: string | null; utr: string | null; paid: boolean;
  holdUntil: string | null; dueDate: string | null;
  dispatch: { vehicleType: string; vehicleNo: string; driverPhone: string; bookingId: string } | null;
  ewayRequired: boolean; ewayBill: string | null; pod: boolean;
  timeline: { status: string; at: string; by: string; note?: string }[];
  createdAt: string; items: ItemDTO[];
};

export function orderItems(o: Order): ItemDTO[] {
  const S = mock.S();
  return S.items
    .filter((i) => i.orderId === o.id)
    .map((i) => {
      const v = S.variants.find((x) => x.id === i.variantId)!;
      const p = S.products.find((x) => x.id === v.productId)!;
      return { name: p.name, label: v.label, sku: v.sku, hsn: p.hsn, qty: i.qty, unitPrice: i.unitPrice, gstRate: i.gstRate };
    });
}

export function serializeOrder(o: Order): OrderDTO {
  return {
    id: o.id, number: o.number, status: o.status, buyerType: o.buyerType, dealerId: o.dealerId,
    customerName: o.customerName, customerPhone: o.customerPhone, customerGstin: o.customerGstin, city: o.city, shipState: o.shipState,
    subtotal: o.subtotal, gstAmount: o.gstAmount, cgst: o.cgst, sgst: o.sgst, igst: o.igst, shipping: o.shipping, total: o.total,
    paymentMode: o.paymentMode, delivery: o.delivery, warehouses: o.warehouses, split: o.split,
    invoiceNo: o.invoiceNo, proformaNo: o.proformaNo, utr: o.utr, paid: o.paid,
    holdUntil: iso(o.holdUntil), dueDate: iso(o.dueDate), dispatch: o.dispatch,
    ewayRequired: o.ewayRequired, ewayBill: o.ewayBill, pod: o.pod,
    timeline: o.timeline.map((t) => ({ status: t.status, at: t.at.toISOString(), by: t.by, note: t.note })),
    createdAt: o.createdAt.toISOString(), items: orderItems(o),
  };
}

// Warehouse staff only see orders routed to their own hub.
export function visibleOrders(user: { role: string; warehouse: string | null }) {
  const all = mock.S().orders;
  return user.role === "WAREHOUSE" && user.warehouse ? all.filter((o) => o.warehouses.includes(user.warehouse!)) : all;
}

const LIVE = ["CONFIRMED", "PACKED", "DISPATCHED", "DELIVERED"];

// Unpaid invoices on credit for one dealer, with ageing buckets (days since invoice).
export function dealerStats(d: Dealer, now = Date.now()) {
  const S = mock.S();
  const orders = S.orders.filter((o) => o.dealerId === d.id);
  const live = orders.filter((o) => o.status !== "CANCELLED");
  const spend = live.reduce((n, o) => n + o.total, 0);
  const last = orders.reduce<Date | null>((m, o) => (!m || o.createdAt > m ? o.createdAt : m), null);
  const unpaid = orders.filter((o) => LIVE.includes(o.status) && !o.paid && o.paymentMode === "CREDIT");
  const buckets = [0, 0, 0, 0];
  let outstanding = 0;
  let overdue = 0;
  for (const o of unpaid) {
    outstanding += o.total;
    if (o.dueDate && o.dueDate.getTime() < now) overdue += o.total;
    const age = Math.floor((now - o.createdAt.getTime()) / DAY);
    buckets[age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3] += o.total;
  }
  const inactive = !!last && (now - last.getTime()) / DAY > S.settings.inactiveDays;
  return {
    spend, orderCount: live.length, lastOrder: iso(last), outstanding, overdue, buckets, inactive,
    unpaid: unpaid.map((o) => ({ number: o.number, total: o.total, createdAt: o.createdAt.toISOString(), dueDate: iso(o.dueDate) })),
  };
}

export function serializeDealer(d: Dealer) {
  return { ...d, appliedAt: d.appliedAt.toISOString() };
}
export type DealerDTO = ReturnType<typeof serializeDealer>;
