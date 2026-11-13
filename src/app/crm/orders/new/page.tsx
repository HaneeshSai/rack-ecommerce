import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { NewOrderForm } from "@/components/crm/new-order-form";

export default async function NewSalesOrder({ searchParams }: { searchParams: Promise<{ dealer?: string; copy?: string }> }) {
  await requireUser("CRM");
  const { dealer, copy } = await searchParams;
  const S = mock.S();
  const src = copy ? S.crmOrders.find((o) => o.id === copy) : undefined;
  const dealers = S.dealers.filter((d) => d.status === "APPROVED").map((d) => ({ id: d.id, name: d.businessName, tier: d.tier, hub: d.homeWarehouse, termsDays: d.termsDays }));
  const variants = S.variants.map((v) => ({ id: v.id, name: mock.variantName(v.id), dealerPrice: v.dealerPrice, moq: v.moq }));
  const hubs = S.warehouses.map((w) => ({ code: w.code, city: w.city }));
  return (
    <>
      <PageTitle title="New sales order" sub="Enter the order the field sales person sent: dealer, variants, quantity, price and payment terms." />
      <NewOrderForm dealers={dealers} variants={variants} hubs={hubs} initialDealer={src?.dealerId ?? dealer} initialLines={src?.lines.map((l) => ({ variantId: l.variantId, qty: l.qty, price: l.price / 100 }))} initialTerms={src?.terms} />
    </>
  );
}
