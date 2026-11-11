import { Card, PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { BarList } from "@/components/admin/bar-list";
import { ExportButtons } from "@/components/admin/export-buttons";

export default async function AdminReports() {
  await requireStaff("reports");
  const S = mock.S();
  const live = S.orders.filter((o) => o.status !== "CANCELLED");

  // Taxable value per order line (retail unit prices include GST).
  type Line = { cat: string; wh: string; dealer: string; buyer: string; sourcing: string; hsn: string; taxable: number; tax: number; b2b: boolean };
  const lines: Line[] = [];
  for (const o of live) {
    for (const it of S.items.filter((i) => i.orderId === o.id)) {
      const v = S.variants.find((x) => x.id === it.variantId)!;
      const p = S.products.find((x) => x.id === v.productId)!;
      const gross = it.unitPrice * it.qty;
      const taxable = o.buyerType === "RETAIL" ? Math.round((gross * 100) / (100 + it.gstRate)) : gross;
      lines.push({
        cat: S.categories.find((c) => c.id === p.categoryId)?.name ?? "-", wh: o.warehouses[0] ?? "-",
        dealer: S.dealers.find((d) => d.id === o.dealerId)?.businessName ?? "Retail customers", buyer: o.buyerType,
        sourcing: p.sourcing, hsn: p.hsn, taxable, tax: (o.buyerType === "RETAIL" ? gross : Math.round(gross * (1 + it.gstRate / 100))) - taxable, b2b: !!o.dealerId,
      });
    }
  }
  const group = (key: (l: Line) => string) => {
    const m = new Map<string, number>();
    for (const l of lines) m.set(key(l), (m.get(key(l)) ?? 0) + l.taxable);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  };

  const stockValue = S.warehouses.map((w) => ({
    label: `${w.city} (${w.code})`,
    value: S.stock.filter((x) => x.warehouseId === w.id).reduce((n, x) => n + x.qty * (S.variants.find((v) => v.id === x.variantId)?.dealerPrice ?? 0), 0),
  }));

  const sources = [...new Set(S.leads.map((l) => l.source))];
  const conversion = sources.map((s) => {
    const all = S.leads.filter((l) => l.source === s);
    const won = all.filter((l) => l.status === "WON").length;
    return { label: s, value: Math.round((won / all.length) * 100), hint: `${won}/${all.length} won` };
  });

  const hsn = new Map<string, { taxable: number; tax: number }>();
  for (const l of lines) {
    const cur = hsn.get(l.hsn) ?? { taxable: 0, tax: 0 };
    hsn.set(l.hsn, { taxable: cur.taxable + l.taxable, tax: cur.tax + l.tax });
  }
  const b2b = lines.filter((l) => l.b2b);
  const b2c = lines.filter((l) => !l.b2b);
  const sum = (a: Line[], k: "taxable" | "tax") => a.reduce((n, l) => n + l[k], 0);
  const quotes = S.quotes;
  const winRate = quotes.length ? Math.round((quotes.filter((q) => q.status === "ACCEPTED").length / quotes.length) * 100) : 0;

  return (
    <>
      <PageTitle title="Reports" sub="Computed from the sample data. Values are taxable (ex-GST) unless noted." action={<ExportButtons />} />
      <div className="grid gap-5 lg:grid-cols-2">
        <BarList title="Sales by category" items={group((l) => l.cat)} format={inr} />
        <BarList title="Sales by warehouse" items={group((l) => l.wh)} format={inr} />
        <BarList title="Sales by dealer" items={group((l) => l.dealer)} format={inr} />
        <BarList title="Retail vs dealer" items={group((l) => (l.buyer === "RETAIL" ? "Retail" : "Dealer"))} format={inr} />
        <BarList title="Sourced vs manufactured" items={group((l) => (l.sourcing === "SOURCED" ? "Sourced (bought in)" : "Manufactured (in-house)"))} format={inr} note="Split is stored on each product so margin and stock planning can be reported separately." />
        <BarList title="Stock value per warehouse" items={stockValue} format={inr} note="Valued at dealer price as a cost proxy." />
        <BarList title="Lead conversion by source" items={conversion} format={(n) => `${n}%`} note={`Quote win rate: ${winRate}% (${quotes.filter((q) => q.status === "ACCEPTED").length} of ${quotes.length} quotes accepted).`} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="overflow-x-auto p-5 text-sm">
          <h3 className="mb-3 font-bold">GST: HSN summary</h3>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="py-2">HSN</th><th className="py-2 text-right">Taxable</th><th className="py-2 text-right">Tax</th></tr></thead>
            <tbody className="divide-y divide-line">
              {[...hsn.entries()].map(([k, v]) => <tr key={k}><td className="py-2">{k}</td><td className="py-2 text-right">{inr(v.taxable)}</td><td className="py-2 text-right">{inr(v.tax)}</td></tr>)}
            </tbody>
          </table>
        </Card>
        <Card className="overflow-x-auto p-5 text-sm">
          <h3 className="mb-3 font-bold">GST: B2B and B2C split</h3>
          <table className="w-full">
            <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="py-2">Type</th><th className="py-2 text-right">Taxable</th><th className="py-2 text-right">Tax</th></tr></thead>
            <tbody className="divide-y divide-line">
              <tr><td className="py-2">B2B (dealers with GSTIN)</td><td className="py-2 text-right">{inr(sum(b2b, "taxable"))}</td><td className="py-2 text-right">{inr(sum(b2b, "tax"))}</td></tr>
              <tr><td className="py-2">B2C (retail)</td><td className="py-2 text-right">{inr(sum(b2c, "taxable"))}</td><td className="py-2 text-right">{inr(sum(b2c, "tax"))}</td></tr>
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">Reports for filing: sales by tax rate, HSN summary and the B2B / B2C split, plus accounting exports.</p>
        </Card>
      </div>
    </>
  );
}
