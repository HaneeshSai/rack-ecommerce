import { PortalNav } from "@/components/portal-nav";
import { currentUser } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser("ADMIN");
  return (
    <>
      <PortalNav
        title="Back Office"
        who={user?.name}
        links={[
          { href: "/", label: "Overview" },
          { href: "/orders", label: "Orders" },
          { href: "/stock", label: "Stock" },
          { href: "/leads", label: "CRM leads" },
        ]}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}
