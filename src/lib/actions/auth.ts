"use server";

import { db, type Role } from "@/lib/db";
import { signIn, signOut } from "@/lib/session";

// Demo sign-in only (no real auth). Returns a result instead of redirecting: a
// server-action redirect loses the Host header on the dealers/admin subdomains.
export async function demoLogin(roles: Role[], formData: FormData): Promise<{ ok: boolean }> {
  const id = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id } });
  if (!user || !roles.includes(user.role)) return { ok: false };
  await signIn(user.id);
  return { ok: true };
}

export async function logout() {
  await signOut();
}
