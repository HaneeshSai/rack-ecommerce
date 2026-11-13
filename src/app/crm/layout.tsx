import { AdminNav } from "@/components/admin/admin-nav";
import { ToastProvider } from "@/components/admin/toast";
import { currentUser } from "@/lib/session";

const MENU = [
  { href: "/", label: "Overview" },
  { href: "/onboarding", label: "Dealer onboarding" },
  { href: "/orders", label: "Sales orders" },
  { href: "/logistics", label: "Logistics" },
  { href: "/payments", label: "Payments" },
  { href: "/dealers", label: "Dealer network" },
  { href: "/follow-ups", label: "Follow-ups" },
];

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser("CRM");
  return (
    <ToastProvider>
      <AdminNav links={user ? MENU : []} who={user?.name} role="CRM" title="CRM" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </ToastProvider>
  );
}
