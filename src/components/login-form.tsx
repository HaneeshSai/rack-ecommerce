"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { demoLogin } from "@/lib/actions/auth";
import type { Role } from "@/lib/db";

type U = { id: string; name: string; business?: string; role: Role; pending?: boolean };

export function LoginForm({ roles, users }: { roles: Role[]; users: U[] }) {
  const router = useRouter();
  async function action(fd: FormData) {
    const res = await demoLogin(roles, fd);
    if (res.ok) {
      router.push("/");
      router.refresh();
    }
  }
  return (
    <form action={action} className="space-y-3">
      {users.map((u, i) => (
        <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
          <input type="radio" name="userId" value={u.id} defaultChecked={i === 0} />
          <span className="flex-1">
            <b>{u.name}</b>
            {u.business && <span className="block text-muted">{u.business}</span>}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {u.pending ? "Pending dealer" : u.role.toLowerCase()}
          </span>
        </label>
      ))}
      <Button type="submit" className="w-full">Sign in</Button>
    </form>
  );
}
