import { Card } from "@/components/ui";
import { LoginForm } from "@/components/login-form";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export async function LoginCard({ role, title }: { role: Role; title: string }) {
  const users = await db.user.findMany({ where: { role }, include: { dealer: true } });
  return (
    <Card className="mx-auto mt-16 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted">Prototype login. Pick a demo account.</p>
      <LoginForm
        role={role}
        users={users.map((u) => ({ id: u.id, name: u.name, business: u.dealer?.businessName }))}
      />
    </Card>
  );
}
