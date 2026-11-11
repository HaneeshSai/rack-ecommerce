"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/session";
import type { Role } from "@/generated/prisma/client";

export async function demoLogin(role: Role, formData: FormData) {
  const id = String(formData.get("userId") ?? "");
  const user = await db.user.findUnique({ where: { id } });
  if (!user || user.role !== role) redirect("/login");
  await signIn(user.id);
  redirect("/");
}

export async function logout() {
  await signOut();
  redirect("/login");
}
