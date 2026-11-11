import Link from "next/link";
import { PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { QuoteBuilder } from "@/components/admin/quote-builder";

export default async function NewQuote() {
  const user = await requireStaff("quotes");
  const S = mock.S();
  const catalogue = S.variants.map((v) => {
    const p = S.products.find((x) => x.id === v.productId)!;
    return { id: v.id, name: `${p.name} - ${v.label}`, sku: v.sku, price: v.dealerPrice, gstRate: p.gstRate };
  });
  const validUntil = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  return (
    <>
      <Link href="/quotes" className="text-sm text-muted hover:text-foreground">&larr; Quotes</Link>
      <div className="mt-2"><PageTitle title="New quote" sub="Build from the catalogue with custom prices or a discount." /></div>
      <QuoteBuilder
        dealers={S.dealers.filter((d) => d.status === "APPROVED").map((d) => ({ id: d.id, name: d.businessName }))}
        leads={S.leads.filter((l) => l.status !== "LOST" && l.status !== "WON").map((l) => ({ id: l.id, name: l.company ? `${l.name} - ${l.company}` : l.name }))}
        catalogue={catalogue}
        threshold={S.settings.discountApprovalPct}
        role={user.role}
        defaultValidUntil={validUntil}
        quoteNumber={`QT-${2001 + S.quotes.length}`}
      />
    </>
  );
}
