import { PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { LeadBoard } from "@/components/admin/lead-board";

export default async function AdminLeads() {
  await requireStaff("crm");
  const S = mock.S();
  const leads = [...S.leads]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((l) => ({
      id: l.id, name: l.name, company: l.company, phone: l.phone, city: l.city, interest: l.interest,
      status: l.status, source: l.source, assignedTo: l.assignedTo, lostReason: l.lostReason, createdAt: l.createdAt.toISOString(),
    }));
  const reps = [...new Set([...S.users.filter((u) => u.role === "SALES" || u.role === "ADMIN").map((u) => u.name), ...leads.map((l) => l.assignedTo)])];
  return (
    <>
      <PageTitle title="CRM leads" sub="Drag cards between stages, or use the arrows. Dealer applications, quote requests and contact forms land here automatically." />
      <LeadBoard initial={leads} reps={reps} />
    </>
  );
}
