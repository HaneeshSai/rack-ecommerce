import { AdminNav } from "@/components/admin/admin-nav";
import { ToastProvider } from "@/components/admin/toast";
import { ROLE_LABEL } from "@/components/admin/format";
import { currentStaff } from "@/lib/session";
import { PERMS, type Area, type StaffRole } from "@/lib/logistics";

const MENU: { href: string; label: string; area: Area }[] = [
  { href: "/", label: "Overview", area: "overview" },
  { href: "/orders", label: "Orders", area: "orders" },
  { href: "/stock", label: "Stock", area: "stock" },
  { href: "/dealers", label: "Dealers", area: "dealers" },
  { href: "/leads", label: "CRM leads", area: "crm" },
  { href: "/quotes", label: "Quotes", area: "quotes" },
  { href: "/tasks", label: "Tasks", area: "tasks" },
  { href: "/tickets", label: "Tickets", area: "tickets" },
  { href: "/payments", label: "Payments", area: "payments" },
  { href: "/reports", label: "Reports", area: "reports" },
  { href: "/settings", label: "Settings", area: "settings" },
  { href: "/activity", label: "Activity", area: "activity" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentStaff();
  const role = user?.role as StaffRole | undefined;
  const links = role ? MENU.filter((m) => PERMS[role].includes(m.area)).map(({ href, label }) => ({ href, label })) : [];
  return (
    <ToastProvider>
      <AdminNav links={links} who={user?.name} role={role ? ROLE_LABEL[role] : undefined} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </ToastProvider>
  );
}
