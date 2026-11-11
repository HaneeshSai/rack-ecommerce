import { Card, PageTitle } from "@/components/ui";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { setStock } from "@/lib/actions/admin";

export default async function AdminStock() {
  await requireUser("ADMIN");
  const [warehouses, variants] = await Promise.all([
    db.warehouse.findMany({ orderBy: { code: "asc" } }),
    db.variant.findMany({
      orderBy: [{ product: { name: "asc" } }, { depthMm: "asc" }],
      include: { product: true, stock: true },
    }),
  ]);
  return (
    <>
      <PageTitle title="Stock by warehouse" sub="Edit a quantity and press Enter." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Product</th><th className="p-3">SKU</th>
              {warehouses.map((w) => <th key={w.id} className="p-3">{w.city}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {variants.map((v) => (
              <tr key={v.id}>
                <td className="p-3">{v.product.name} <span className="text-muted">{v.label}</span></td>
                <td className="p-3 text-muted">{v.sku}</td>
                {warehouses.map((w) => {
                  const qty = v.stock.find((s) => s.warehouseId === w.id)?.qty ?? 0;
                  return (
                    <td key={w.id} className="p-3">
                      <form action={setStock.bind(null, v.id, w.id)}>
                        <input name="qty" type="number" min={0} defaultValue={qty}
                          className={"w-20 rounded-lg border px-2 py-1 " + (qty < 5 ? "border-red-300 bg-red-50" : "border-line")} />
                        <button className="sr-only">Save</button>
                      </form>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
