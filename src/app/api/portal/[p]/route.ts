import { NextResponse, type NextRequest } from "next/server";

// Hosted preview links (like name.netlify.app) have no subdomains, so the portal
// switcher lands here: remember the chosen portal in a cookie and go to "/".
// src/proxy.ts reads the cookie and serves that portal at the root.
const PORTALS: Record<string, "store" | "dealer" | "admin"> = {
  store: "store",
  dealers: "dealer",
  dealer: "dealer",
  admin: "admin",
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ p: string }> }) {
  const { p } = await ctx.params;
  const portal = PORTALS[p] ?? "store";
  // Relative redirect so it never depends on the host the platform reports internally.
  const res = new NextResponse(null, { status: 307, headers: { location: "/" } });
  // Readable by the switcher (to highlight the current portal); holds no secrets.
  res.cookies.set("rack_portal", portal, { path: "/", sameSite: "lax", httpOnly: false });
  return res;
}
