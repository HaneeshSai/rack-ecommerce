import { AdminNav } from "@/components/admin/admin-nav";
import { ToastProvider } from "@/components/admin/toast";
import { currentUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { serializeCrm } from "@/lib/crm-data";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser("CRM");
  let counts = { dealers: 0, orders: 0, shipping: 0, payments: 0 };
  if (user) {
    const S = mock.S();
    const orders = S.crmOrders.map(serializeCrm);
    counts = {
      dealers: S.dealers.filter((d) => d.status === "PENDING").length,
      orders: orders.filter((o) => o.stage === "NEW" || o.stage === "WITH_ACCOUNTS").length,
      shipping: orders.filter((o) => ["INVOICED", "LOGISTICS", "DISPATCHED"].includes(o.stage)).length,
      payments: orders.filter((o) => o.stage === "DOCS_SENT").length,
    };
  }
  const S0 = mock.S();
  // Plain names, in the order the work happens. Numbers show how many need attention.
  const MENU = [
    { href: "/", label: "Home" },
    { href: "/onboarding", label: "New dealers", badge: counts.dealers },
    { href: "/orders", label: "Orders", badge: counts.orders },
    { href: "/logistics", label: "Shipping", badge: counts.shipping },
    { href: "/payments", label: "Payments", badge: counts.payments },
    { href: "/collections", label: "Collections", badge: S0.cheques.filter((c) => c.status === "BOUNCED").length },
    { href: "/claims", label: "Claims", badge: S0.claims.filter((c) => c.status === "OPEN").length },
    { href: "/dealers", label: "My dealers" },
    { href: "/follow-ups", label: "Follow-ups" },
    { href: "/insights", label: "Insights" },
  ];
  return (
    <ToastProvider>
      <AdminNav links={user ? MENU : []} who={user?.name} role="CRM" title="CRM" cta={user ? { href: "/orders/new", label: "+ New order" } : undefined} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </ToastProvider>
  );
}
