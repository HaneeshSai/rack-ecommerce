import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { SupportClient, type TicketView } from "@/components/dealer/support-client";
import { dealerOrders } from "@/components/dealer/server";

export default async function DealerSupport() {
  const user = await requireUser("DEALER");
  const tickets: TicketView[] = mock.S().tickets
    .filter((t) => t.dealerId === user.dealerId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((t) => ({
      number: t.number, type: t.type, status: t.status, orderNumber: t.orderNumber, subject: t.subject,
      message: t.message, createdAt: t.createdAt.toISOString(),
    }));
  return (
    <>
      <PageTitle title="Support" sub="Damage, missing or wrong items, installation help and returns." />
      <SupportClient tickets={tickets} orders={dealerOrders(user.dealerId!).map((o) => o.number)} />
    </>
  );
}
