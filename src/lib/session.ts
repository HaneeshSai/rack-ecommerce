import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

// PROTOTYPE AUTH: a plain cookie holding a user id, picked from a demo list.
// Cookies are host-only, so a dealer session never reaches the admin domain.
// Replace with Auth.js (credentials + OTP) before launch. Role is re-checked
// from the database on every request, never trusted from the cookie alone.
const COOKIE = "rack_uid";

export async function signIn(userId: string) {
  (await cookies()).set(COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser(role: Role) {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id }, include: { dealer: true } });
  return user && user.role === role ? user : null;
}

export async function requireUser(role: Role) {
  const user = await currentUser(role);
  if (!user) redirect("/login");
  return user;
}
