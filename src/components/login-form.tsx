"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { demoLogin } from "@/lib/actions/auth";
import type { Role } from "@/generated/prisma/client";

type U = { id: string; name: string; business?: string };

export function LoginForm({ role, users }: { role: Role; users: U[] }) {
  const router = useRouter();
  async function action(fd: FormData) {
    const res = await demoLogin(role, fd);
    if (res.ok) {
      router.push("/");
      router.refresh();
    }
  }
  return (
    <form action={action} className="space-y-3">
      {users.map((u, i) => (
        <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-line p-3 text-sm has-[:checked]:border-accent">
          <input type="radio" name="userId" value={u.id} defaultChecked={i === 0} />
          <span>
            <b>{u.name}</b>
            {u.business && <span className="block text-muted">{u.business}</span>}
          </span>
        </label>
      ))}
      <Button type="submit" className="w-full">Sign in</Button>
    </form>
  );
}
