import Link from "next/link";
import { Badge, Card, LinkButton, PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { TIER_LABEL, fmtDate } from "@/components/admin/format";
import { dealerStats } from "@/components/admin/data";

export default async function AdminDealers() {
  await requireStaff("dealers");
  const dealers = mock.S().dealers;
  return (
    <>
      <PageTitle title="Dealers" sub="Approve applications, set price tier, home warehouse, credit and terms." />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-slate-50 text-left text-xs uppercase text-muted">
            <tr>
              <th className="p-3">Dealer</th><th className="p-3">Status</th><th className="p-3">Tier</th>
              <th className="p-3 text-right">Credit limit</th><th className="p-3 text-right">Outstanding</th>
              <th className="p-3">Last order</th><th className="p-3">Flags</th><th className="p-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {dealers.map((d) => {
              const s = dealerStats(d);
              return (
                <tr key={d.id}>
                  <td className="p-3">
                    <div className="font-semibold">{d.businessName}</div>
                    <div className="text-xs text-muted">{d.city} - {d.assignedRep}</div>
                  </td>
                  <td className="p-3">
                    <Badge tone={d.status === "APPROVED" ? "green" : d.status === "PENDING" ? "amber" : "red"}>{d.status.toLowerCase()}</Badge>
                  </td>
                  <td className="p-3">{d.status === "APPROVED" ? TIER_LABEL[d.tier] : "-"}</td>
                  <td className="p-3 text-right">{inr(d.creditLimit)}</td>
                  <td className="p-3 text-right">{inr(d.creditUsed)}</td>
                  <td className="p-3 text-muted">{fmtDate(s.lastOrder)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {s.inactive && <Badge tone="gray">inactive</Badge>}
                      {s.overdue > 0 && <Badge tone="red">overdue {inr(s.overdue)}</Badge>}
                      {d.status === "PENDING" && <Badge tone="amber">review</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Link href={`/dealers/${d.id}`} className="font-semibold text-accent hover:underline">Open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      <div className="mt-4"><LinkButton href="/leads" variant="ghost">Dealer applications also appear as CRM leads</LinkButton></div>
    </>
  );
}
