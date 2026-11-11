import { mock, type Dealer } from "@/lib/db";

// Server-side helpers for the dealer pages (read from the in-memory sample data).
export function dealerState(d: Dealer): string {
  const rule = mock.S().settings.cities.find((c) => c.city === d.city);
  if (rule) return rule.state;
  return d.gstin.startsWith("36") ? "Telangana" : d.gstin.startsWith("37") ? "Andhra Pradesh" : "Other";
}

export const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export function dealerOrders(dealerId: string) {
  return mock.S().orders
    .filter((o) => o.dealerId === dealerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function orderItems(orderId: string) {
  return mock.S().items
    .filter((i) => i.orderId === orderId)
    .map((i) => {
      const v = mock.S().variants.find((x) => x.id === i.variantId)!;
      const p = mock.S().products.find((x) => x.id === v.productId)!;
      return { ...i, name: p.name, label: v.label, sku: v.sku, hsn: p.hsn };
    });
}

export function isOverdue(o: { dueDate: Date | null; paid: boolean; status: string }) {
  return !!o.dueDate && !o.paid && o.dueDate.getTime() < Date.now() && !["CANCELLED", "RETURNED"].includes(o.status);
}
