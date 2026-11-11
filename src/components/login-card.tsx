import { Button, Card } from "@/components/ui";
import { db } from "@/lib/db";
import { demoLogin } from "@/lib/actions/auth";
import type { Role } from "@/generated/prisma/client";

export async function LoginCard({ role, title }: { role: Role; title: string }) {
  const users = await db.user.findMany({ where: { role }, include: { dealer: true } });
  const action = demoLogin.bind(null, role);
  return (
    <Card className="mx-auto mt-16 max-w-sm space-y-4 p-6">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="text-sm text-muted">Prototype login. Pick a demo account.</p>
      <form action={action} className="space-y-3">
        {users.map((u) => (
          <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3 text-sm has-[:checked]:border-accent">
            <input type="radio" name="userId" value={u.id} defaultChecked />
            <span>
              <b>{u.name}</b>
              {u.dealer && <span className="block text-muted">{u.dealer.businessName}</span>}
            </span>
          </label>
        ))}
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </Card>
  );
}
