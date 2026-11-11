import Link from "next/link";
import { Badge, Card, PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { inr2 } from "@/lib/money";
import { dealerOrders } from "@/components/dealer/server";
import { dateStr } from "@/components/dealer/format";

export default async function DealerInvoices() {
  const user = await requireUser("DEALER");
  const docs = dealerOrders(user.dealerId!).filter((o) => o.invoiceNo || o.proformaNo);
  return (
    <>
      <PageTitle title="Invoices" sub="Tax invoices for confirmed orders and proforma invoices for bank transfers." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Document</th><th className="p-3">Order</th><th className="p-3">Date</th>
              <th className="p-3 text-right">Amount</th><th className="p-3">Type</th><th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.map((o) => (
              <tr key={o.id}>
                <td className="p-3 font-medium">{o.invoiceNo ?? o.proformaNo}</td>
                <td className="p-3">{o.number}</td>
                <td className="p-3 text-muted">{dateStr(o.createdAt.toISOString())}</td>
                <td className="p-3 text-right">{inr2(o.total)}</td>
                <td className="p-3"><Badge tone={o.invoiceNo ? "green" : "amber"}>{o.invoiceNo ? "Tax invoice" : "Proforma"}</Badge></td>
                <td className="p-3 text-right">
                  <Link href={`/invoices/${o.number}`} className="font-semibold text-accent hover:underline">View / PDF</Link>
                </td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
