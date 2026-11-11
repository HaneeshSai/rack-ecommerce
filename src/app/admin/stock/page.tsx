import { PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { StockManager } from "@/components/admin/stock-manager";

export default async function AdminStock() {
  const user = await requireStaff("stock");
  const S = mock.S();
  const own = user.role === "WAREHOUSE" ? user.warehouse : null;
  const whs = S.warehouses.filter((w) => !own || w.code === own);
  const code = (id: string) => S.warehouses.find((w) => w.id === id)?.code ?? "";

  const rows = S.variants.map((v) => {
    const p = S.products.find((x) => x.id === v.productId)!;
    const qty: Record<string, number> = {};
    for (const w of S.warehouses) qty[w.code] = S.stock.find((x) => x.variantId === v.id && x.warehouseId === w.id)?.qty ?? 0;
    return { id: v.id, name: `${p.name} - ${v.label}`, sku: v.sku, manufactured: p.sourcing === "MANUFACTURED", cost: v.dealerPrice, qty };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const movements = S.movements
    .filter((m) => !own || code(m.warehouseId) === own)
    .map((m) => ({ id: m.id, item: mock.variantName(m.variantId), wh: code(m.warehouseId), delta: m.delta, type: m.type, reason: m.reason, by: m.by, at: m.at.toISOString() }));
  const transfers = S.transfers.map((t) => ({ id: t.id, item: mock.variantName(t.variantId), variantId: t.variantId, from: t.from, to: t.to, qty: t.qty, status: t.status, at: t.at.toISOString() }));

  return (
    <>
      <PageTitle
        title="Stock by warehouse"
        sub={own ? `You manage the ${own} hub. Every change is logged with a reason.` : "Levels, movements, transfers between hubs and production entries. Every change is logged."}
      />
      <StockManager
        warehouses={whs.map((w) => ({ code: w.code, city: w.city }))}
        allWarehouses={S.warehouses.map((w) => w.code)}
        rows={rows}
        movements={movements}
        transfers={transfers}
        lowStock={S.settings.lowStock}
        staffName={user.name}
        ownHub={own}
      />
    </>
  );
}
