import { Card } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { db, type Role } from "@/lib/db";

export async function LoginCard({ roles, title }: { roles: Role[]; title: string }) {
  const users = await db.user.findMany({ where: { role: { in: roles } } });
  return (
    <Card className="mx-auto mt-16 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted">Prototype login. Pick a demo account.</p>
      <LoginForm
        roles={roles}
        users={users.map((u) => ({ id: u.id, name: u.name, business: u.dealer?.businessName, role: u.role, pending: u.dealer?.status === "PENDING" }))}
      />
    </Card>
  );
}
