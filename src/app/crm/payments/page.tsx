import Link from "next/link";
import { Badge, Card, PageTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { serializeCrm } from "@/lib/crm-data";
import { inr } from "@/lib/money";
import { fmtDate } from "@/components/admin/format";
import { QuickFollowup } from "@/components/crm/quick-followup";

export default async function CrmPayments() {
  await requireUser("CRM");
  const all = mock.S().crmOrders.map(serializeCrm);
  const chase = all.filter((o) => o.stage === "DOCS_SENT").sort((a, b) => b.overdueDays - a.overdueDays);
  const proforma = all.filter((o) => o.terms.startsWith("Advance") && ["WITH_ACCOUNTS", "INVOICED"].includes(o.stage));
  const outstanding = chase.reduce((n, o) => n + o.total, 0);
  const overdueAmt = chase.filter((o) => o.overdueDays > 0).reduce((n, o) => n + o.total, 0);

  return (
    <>
      <PageTitle title="Payments" sub="Chase dealers for payment with the sales team, issue proformas for NEFT/RTGS, and report received payments to accounts." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={inr(outstanding)} />
        <StatCard label="Overdue" value={inr(overdueAmt)} tone={overdueAmt ? "warn" : "good"} />
        <StatCard label="Orders to chase" value={String(chase.length)} />
      </div>

      <h2 className="mb-3 font-bold">Follow up for payment</h2>
      <Card className="mb-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-line text-left text-xs uppercase text-muted">
            <th className="p-3">Order</th><th className="p-3">Dealer</th><th className="p-3 text-right">Amount</th><th className="p-3">Due</th><th className="p-3">Last follow-up</th><th className="p-3">Log a follow-up</th>
          </tr></thead>
          <tbody>
            {chase.map((o) => (
              <tr key={o.id} className="border-b border-line align-top last:border-0">
                <td className="p-3 font-semibold"><Link href={`/orders/${o.id}`} className="text-accent hover:underline">{o.number}</Link><div className="text-xs font-normal text-muted">{o.fieldRep}</div></td>
                <td className="p-3">{o.dealerName}<div className="text-xs text-muted">{o.dealerPhone}</div></td>
                <td className="p-3 text-right">{inr(o.total)}</td>
                <td className="p-3">{fmtDate(o.dueDate)} {o.overdueDays > 0 ? <Badge tone="red">{o.overdueDays}d overdue</Badge> : <Badge tone="gray">on time</Badge>}</td>
                <td className="max-w-56 p-3 text-xs">{o.followups[0] ? <>{o.followups[0].note}{o.followups[0].promiseDate && <b> · promised {fmtDate(o.followups[0].promiseDate)}</b>}</> : <span className="text-muted">None yet</span>}</td>
                <td className="p-3">{o.payment ? <Link href={`/orders/${o.id}`} className="text-xs font-semibold text-emerald-700">Paid, report to accounts &rarr;</Link> : <QuickFollowup orderId={o.id} />}</td>
              </tr>
            ))}
            {chase.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted">Nothing outstanding.</td></tr>}
          </tbody>
        </table>
      </Card>

      <h2 className="mb-3 font-bold">Proformas awaiting NEFT/RTGS</h2>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {proforma.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0">
                <td className="p-3 font-semibold"><Link href={`/orders/${o.id}`} className="text-accent hover:underline">{o.number}</Link></td>
                <td className="p-3">{o.dealerName}</td><td className="p-3">{o.proformaNo ?? "Proforma not issued"}</td>
                <td className="p-3 text-right">{inr(o.total)}</td>
                <td className="p-3 text-right"><Link href={`/orders/${o.id}`} className="text-xs font-semibold text-accent">Open &rarr;</Link></td>
              </tr>
            ))}
            {proforma.length === 0 && <tr><td className="p-6 text-center text-muted">No advance-payment orders waiting.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
