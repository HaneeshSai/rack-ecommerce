import { buildPriceMap } from "@/components/store/price-map";
import { mock } from "@/lib/db";
import { CheckoutView, type DealerInfo } from "./checkout-view";

export default function CheckoutPage() {
  const S = mock.S();
  // Demo "approved dealer" shown when the viewer switcher is set to Approved dealer.
  const d = S.dealers[0];
  const now = Date.now();
  const overdue = S.orders
    .filter((o) => o.dealerId === d.id && o.paymentMode === "CREDIT" && !o.paid && o.dueDate && o.dueDate.getTime() < now && !["CANCELLED", "PLACED", "PAYMENT_PENDING"].includes(o.status))
    .reduce((n, o) => n + o.total, 0);
  const dealer: DealerInfo = {
    name: d.businessName,
    contact: d.contactName,
    phone: d.phone,
    gstin: d.gstin,
    city: d.city === "Guntur" ? "Guntur" : "Hyderabad",
    home: d.homeWarehouse,
    creditLimit: d.creditLimit,
    creditUsed: d.creditUsed,
    termsDays: d.termsDays,
    overdue,
  };
  return <CheckoutView priceMap={buildPriceMap()} dealer={dealer} bank={S.settings.bank} holdDays={S.settings.holdDays} />;
}
