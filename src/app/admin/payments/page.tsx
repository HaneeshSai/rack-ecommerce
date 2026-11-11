import { PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { PaymentsPanel } from "@/components/admin/payments-panel";
import { dealerStats } from "@/components/admin/data";

export default async function AdminPayments() {
  await requireStaff("payments");
  const S = mock.S();
  const now = new Date();
  const queue = S.orders
    .filter((o) => o.status === "PAYMENT_PENDING")
    .map((o) => ({
      number: o.number, customer: o.customerName, total: o.total, proformaNo: o.proformaNo, utr: o.utr,
      holdUntil: o.holdUntil ? o.holdUntil.toISOString() : null,
    }));
  const dealers = S.dealers
    .filter((d) => d.status === "APPROVED")
    .map((d) => {
      const s = dealerStats(d);
      return {
        id: d.id, name: d.businessName, creditLimit: d.creditLimit, creditUsed: d.creditUsed, termsDays: d.termsDays,
        outstanding: s.outstanding, overdue: s.overdue, buckets: s.buckets, unpaid: s.unpaid,
      };
    });
  const collected = S.orders
    .filter((o) => o.paid && o.createdAt.getMonth() === now.getMonth() && o.createdAt.getFullYear() === now.getFullYear())
    .reduce((n, o) => n + o.total, 0);
  return (
    <>
      <PageTitle title="Payments and credit" sub="Match bank transfers, watch outstanding balances and ageing, send reminders." />
      <PaymentsPanel queue={queue} dealers={dealers} collected={collected} />
    </>
  );
}
