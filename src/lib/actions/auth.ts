"use server";

import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

// These return a result instead of calling redirect(): a server-action
// redirect is re-rendered without the original Host header, so on the
// dealers/admin domains it lands on the store. The client navigates instead.
export async function demoLogin(role: Role, formData: FormData): Promise<{ ok: boolean }> {
  const id = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id } });
  if (!user || user.role !== role) return { ok: false };
  await signIn(user.id);
  return { ok: true };
}

export async function logout() {
  await signOut();
}
