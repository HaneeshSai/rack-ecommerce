import { PageTitle } from "@/components/ui";
import { requireStaff } from "@/lib/session";
import { mock } from "@/lib/db";
import { TicketPanel } from "@/components/admin/ticket-panel";

export default async function AdminTickets() {
  await requireStaff("tickets");
  const S = mock.S();
  const tickets = S.tickets.map((t) => ({
    id: t.id, number: t.number, type: t.type, status: t.status, orderNumber: t.orderNumber, subject: t.subject, message: t.message,
    assignedTo: t.assignedTo, createdAt: t.createdAt.toISOString(),
    dealer: S.dealers.find((d) => d.id === t.dealerId)?.businessName ?? "Retail customer",
  }));
  const staff = S.users.filter((u) => u.role !== "CUSTOMER" && u.role !== "DEALER").map((u) => u.name);
  return (
    <>
      <PageTitle title="Support tickets" sub="Damage, missing or wrong items, installation help and returns, linked to the order and account." />
      <TicketPanel initial={tickets} staff={staff} />
    </>
  );
}
