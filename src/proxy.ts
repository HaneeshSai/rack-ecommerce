import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PORTAL_BY_SUBDOMAIN } from "@/lib/brand";

// One Next.js app, three portals. The Host header decides which route folder
// serves the request:
//   example.com          -> /store/*
//   dealers.example.com  -> /dealer/*
//   admin.example.com    -> /admin/*
// Local dev: store.localhost:3000, dealers.localhost:3000, admin.localhost:3000
export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const first = host.split(".")[0];
  const portal = PORTAL_BY_SUBDOMAIN[first] ?? "store";

  const url = req.nextUrl.clone();
  url.pathname = `/${portal}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\..*).*)"],
};
