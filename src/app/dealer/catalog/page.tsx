import Link from "next/link";
import clsx from "clsx";
import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { getCategories } from "@/lib/data/catalog";
import { tierPrice } from "@/lib/logistics";
import { WAREHOUSE_STATE } from "@/lib/gst";
import { BulkOrderForm, type BulkRow } from "@/components/dealer/bulk-order";
import { dealerState, isOverdue } from "@/components/dealer/server";

export default async function DealerCatalog({ searchParams }: { searchParams: Promise<{ cat?: string; reorder?: string }> }) {
  const user = await requireUser("DEALER");
  const dealer = user.dealer!;
  const { cat = "network", reorder } = await searchParams;
  const categories = await getCategories();
  const S = mock.S();
  const approved = dealer.status === "APPROVED";

  const toRow = (v: (typeof S.variants)[number], extra = false): BulkRow => {
    const p = S.products.find((x) => x.id === v.productId)!;
    return {
      id: v.id, name: p.name, label: v.label, sku: v.sku, retail: v.retailPrice, price: tierPrice(v.dealerPrice, dealer.tier),
      moq: v.moq, stock: mock.stockTotal(v.id), klass: v.shippingClass, gstRate: p.gstRate, extra,
    };
  };

  const catId = S.categories.find((c) => c.slug === cat)?.id;
  const rows = S.variants
    .filter((v) => S.products.find((p) => p.id === v.productId)?.categoryId === catId)
    .sort((a, b) => {
      const pa = S.products.find((p) => p.id === a.productId)!, pb = S.products.find((p) => p.id === b.productId)!;
      return (pa.uHeight ?? 1e9) - (pb.uHeight ?? 1e9) || (a.depthMm ?? 0) - (b.depthMm ?? 0);
    })
    .map((v) => toRow(v));

  // Reorder: prefill quantities from a previous order (lines from other categories are appended).
  const initialQty: Record<string, number> = {};
  const source = reorder ? S.orders.find((o) => o.number === reorder && o.dealerId === dealer.id) : undefined;
  if (source) {
    for (const it of S.items.filter((i) => i.orderId === source.id)) {
      initialQty[it.variantId] = it.qty;
      if (!rows.some((r) => r.id === it.variantId)) {
        const v = S.variants.find((x) => x.id === it.variantId);
        if (v) rows.unshift(toRow(v, true));
      }
    }
  }

  const home = S.warehouses.find((w) => w.code === dealer.homeWarehouse);
  const state = dealerState(dealer);
  const sellerState = WAREHOUSE_STATE[dealer.homeWarehouse] ?? "Telangana";
  const band = home?.city === dealer.city ? "local" : sellerState === state ? "state" : "inter";
  const overdue = S.orders.some((o) => o.dealerId === dealer.id && isOverdue(o));

  return (
    <>
      <PageTitle
        title="Dealer price list & bulk order"
        sub={source ? `Reordering ${source.number}: quantities prefilled.` : "Enter quantities, pick freight and payment, and place the order."}
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/catalog?cat=${c.slug}`}
            className={clsx(
              "rounded-full border px-3 py-1 text-sm",
              c.slug === cat ? "border-accent bg-accent text-white" : "border-line bg-white hover:border-accent",
            )}
          >
            {c.name}
          </Link>
        ))}
      </div>
      <BulkOrderForm
        key={`${cat}-${reorder ?? ""}`}
        rows={rows}
        initialQty={initialQty}
        freight={S.settings.freight}
        bank={S.settings.bank}
        dealer={{
          approved, pending: dealer.status === "PENDING", tier: dealer.tier,
          available: Math.max(0, dealer.creditLimit - dealer.creditUsed), overdue,
          sellerState, buyerState: state, band,
        }}
      />
    </>
  );
}
