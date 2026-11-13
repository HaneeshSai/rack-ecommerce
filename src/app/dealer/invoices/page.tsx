import Link from "next/link";
import { Badge, Card, PageTitle, StatCard } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr, inr2 } from "@/lib/money";
import { dealerOrders, isOverdue } from "@/components/dealer/server";
import { dateStr } from "@/components/dealer/format";
import { serializeCrm } from "@/lib/crm-data";
import { PayInvoice } from "@/components/dealer/pay-invoice";

type Row = {
  key: string; doc: string; order: string; at: string; amount: number; type: "Tax invoice" | "Proforma";
  state: "paid" | "due" | "overdue" | "transfer"; due: string | null; href: string | null; pay: { kind: "order" | "crm"; id: string } | null;
};

export default async function DealerInvoices() {
  const user = await requireUser("DEALER");
  const S = mock.S();
  const dealer = S.dealers.find((d) => d.id === user.dealerId)!;

  const store: Row[] = dealerOrders(dealer.id).filter((o) => o.invoiceNo || o.proformaNo).map((o) => {
    const credit = o.paymentMode === "CREDIT";
    const state: Row["state"] = o.paid ? "paid" : !o.invoiceNo ? "transfer" : isOverdue(o) ? "overdue" : "due";
    return {
      key: o.id, doc: (o.invoiceNo ?? o.proformaNo)!, order: o.number, at: o.createdAt.toISOString(), amount: o.total,
      type: o.invoiceNo ? "Tax invoice" : "Proforma", state, due: o.dueDate?.toISOString() ?? null, href: `/invoices/${o.number}`,
      pay: o.invoiceNo && !o.paid && credit ? { kind: "order", id: o.id } : null,
    };
  });
  const crm: Row[] = S.crmOrders.filter((o) => o.dealerId === dealer.id && o.invoiceNo).map(serializeCrm).map((o) => ({
    key: o.id, doc: o.invoiceNo!, order: o.number, at: o.createdAt, amount: o.total, type: "Tax invoice",
    state: o.stage === "PAID" || o.payment ? "paid" : o.overdueDays > 0 ? "overdue" : o.terms.startsWith("Advance") ? "transfer" : "due",
    due: o.dueDate, href: null, pay: o.stage === "DOCS_SENT" && !o.payment && o.terms.startsWith("Credit") ? { kind: "crm", id: o.id } : null,
  }));
  const rows = [...crm, ...store].sort((a, b) => b.at.localeCompare(a.at));

  const unpaid = rows.filter((r) => r.state === "due" || r.state === "overdue");
  const outstanding = unpaid.reduce((n, r) => n + r.amount, 0);
  const overdue = rows.filter((r) => r.state === "overdue").length;
  const tone = { paid: "green", due: "blue", overdue: "red", transfer: "amber" } as const;
  const label = { paid: "Paid", due: "Due", overdue: "Overdue", transfer: "Awaiting transfer" } as const;

  return (
    <>
      <PageTitle title="Invoices & payments" sub="Pay unpaid invoices online, or download tax invoices and proformas." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="To pay" value={inr(outstanding)} />
        <StatCard label="Overdue invoices" value={String(overdue)} tone={overdue ? "warn" : "good"} />
        <StatCard label="Credit available" value={inr(Math.max(0, dealer.creditLimit - dealer.creditUsed))} tone="good" />
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr><th className="p-3">Document</th><th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3 text-right">Amount</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="p-3 font-medium">{r.doc}<div className="text-xs font-normal text-muted">{r.type}</div></td>
                <td className="p-3">{r.order}</td>
                <td className="p-3 text-muted">{dateStr(r.at)}</td>
                <td className="p-3 text-right">{inr2(r.amount)}</td>
                <td className="p-3"><Badge tone={tone[r.state]}>{label[r.state]}</Badge>{r.due && r.state !== "paid" && <div className="mt-0.5 text-xs text-muted">Due {dateStr(r.due)}</div>}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {r.href && <Link href={r.href} className="font-semibold text-accent hover:underline">View / PDF</Link>}
                    {r.pay && <PayInvoice kind={r.pay.kind} id={r.pay.id} amount={r.amount} />}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </>
  );
}
