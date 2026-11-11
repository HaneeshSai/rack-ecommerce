import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { inr } from "@/lib/money";
import { DealerAccount, type TimelineItem } from "@/components/admin/dealer-account";
import { dealerStats, serializeDealer } from "@/components/admin/data";
import { STATUS_LABEL } from "@/components/admin/format";
import type { StaffRole } from "@/lib/logistics";

export default async function DealerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireStaff("dealers");
  const S = mock.S();
  const d = S.dealers.find((x) => x.id === id);
  if (!d) notFound();

  const timeline: TimelineItem[] = [
    { at: d.appliedAt.toISOString(), kind: "Application", text: "Dealer application submitted", href: null },
    ...S.orders.filter((o) => o.dealerId === d.id).map((o) => ({
      at: o.createdAt.toISOString(), kind: "Order", text: `${o.number} - ${inr(o.total)} - ${STATUS_LABEL[o.status]} (${o.paymentMode.toLowerCase()})`, href: `/orders/${o.number}`,
    })),
    ...S.quotes.filter((q) => q.dealerId === d.id).map((q) => ({
      at: q.createdAt.toISOString(), kind: "Quote", text: `${q.number} v${q.version} - ${q.status.replace("_", " ").toLowerCase()}`, href: "/quotes",
    })),
    ...S.tickets.filter((t) => t.dealerId === d.id).map((t) => ({
      at: t.createdAt.toISOString(), kind: "Ticket", text: `${t.number} - ${t.subject}`, href: "/tickets",
    })),
    ...S.leads.filter((l) => l.dealerId === d.id).map((l) => ({
      at: l.createdAt.toISOString(), kind: "Lead", text: `CRM lead created from ${l.source}`, href: "/leads",
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <DealerAccount
      dealer={serializeDealer(d)}
      stats={dealerStats(d)}
      timeline={timeline}
      warehouses={S.warehouses.map((w) => ({ code: w.code, city: w.city }))}
      role={user.role as StaffRole}
      blockOverdue={S.settings.blockOverdueCredit}
    />
  );
}
