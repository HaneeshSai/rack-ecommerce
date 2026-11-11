import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, type Role } from "@/lib/db";
import { PERMS, STAFF_ROLES, type Area, type StaffRole } from "@/lib/logistics";

// PROTOTYPE AUTH: a plain demo cookie holding a user id picked from a list.
// No real accounts. Cookies are host-only, so a dealer session never reaches admin.
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
  const user = await db.user.findUnique({ where: { id } });
  return user && user.role === role ? user : null;
}

export async function requireUser(role: Role) {
  const user = await currentUser(role);
  if (!user) redirect("/login");
  return user;
}

// Any internal staff role (Admin, Sales, Warehouse, Accounts).
export async function currentStaff() {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id } });
  return user && STAFF_ROLES.includes(user.role as StaffRole) ? user : null;
}

// Redirects to login if signed out, or to the overview if the role can't open `area`.
export async function requireStaff(area: Area) {
  const user = await currentStaff();
  if (!user) redirect("/login");
  if (!PERMS[user.role as StaffRole].includes(area)) redirect("/");
  return user;
}
