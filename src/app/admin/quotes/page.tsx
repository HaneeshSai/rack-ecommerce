import Link from "next/link";
import { Badge, Card, LinkButton, PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { fmtDate, type Tone } from "@/components/admin/format";

const TONE: Record<string, Tone> = { DRAFT: "gray", PENDING_APPROVAL: "amber", SENT: "blue", ACCEPTED: "green", EXPIRED: "red" };

export default async function AdminQuotes() {
  await requireStaff("quotes");
  const S = mock.S();
  return (
    <>
      <PageTitle
        title="Quotes"
        sub="Quotes above the discount limit need manager approval. An accepted quote becomes an order at the quoted prices."
        action={<LinkButton href="/quotes/new">New quote</LinkButton>}
      />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Quote</th><th className="p-3">For</th><th className="p-3">Items</th>
              <th className="p-3 text-right">Discount</th><th className="p-3 text-right">Total (ex GST)</th>
              <th className="p-3">Valid until</th><th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {S.quotes.map((q) => {
              const party = S.dealers.find((d) => d.id === q.dealerId)?.businessName ?? S.leads.find((l) => l.id === q.leadId)?.name ?? "-";
              const total = q.items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
              return (
                <tr key={q.id}>
                  <td className="p-3 font-medium">{q.number} <span className="text-xs text-muted">v{q.version}</span></td>
                  <td className="p-3">{party}<div className="text-xs text-muted">by {q.createdBy}</div></td>
                  <td className="p-3 text-muted">{q.items.map((i) => `${i.qty} x ${mock.variantName(i.variantId)}`).join(", ")}</td>
                  <td className="p-3 text-right">
                    {q.discountPct}% {q.discountPct > S.settings.discountApprovalPct && <Badge tone="amber">approval</Badge>}
                  </td>
                  <td className="p-3 text-right">{inr(total)}</td>
                  <td className="p-3 text-muted">{fmtDate(q.validUntil.toISOString())}</td>
                  <td className="p-3">
                    <Badge tone={TONE[q.status]}>{q.status.replace("_", " ").toLowerCase()}</Badge>
                    {q.orderNumber && <Link href={`/orders/${q.orderNumber}`} className="ml-2 text-accent hover:underline">{q.orderNumber}</Link>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
