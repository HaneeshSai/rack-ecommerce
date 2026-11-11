import { PortalNav } from "@/components/portal-nav";
import { StatusBanner } from "@/components/dealer/status-banner";
import { currentUser } from "@/lib/session";

export default async function DealerLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser("DEALER");
  return (
    <>
      <PortalNav
        title="Dealer Portal"
        who={user?.dealer?.businessName}
        links={[
          { href: "/", label: "Dashboard" },
          { href: "/catalog", label: "Price list & bulk order" },
          { href: "/orders", label: "Orders" },
          { href: "/invoices", label: "Invoices" },
          { href: "/quotes", label: "Quotes" },
          { href: "/support", label: "Support" },
          { href: "/account", label: "Account" },
        ]}
      />
      {user?.dealer && <StatusBanner status={user.dealer.status} />}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
