import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PORTAL_BY_SUBDOMAIN } from "@/lib/brand";

// One Next.js app, three portals. Which route folder serves a request:
//   1. the Host header's first label (real domains and local dev):
//        example.com          -> /store/*
//        dealers.example.com  -> /dealer/*
//        admin.example.com    -> /admin/*
//        local dev: store.localhost:3000, dealers.localhost:3000, admin.localhost:3000
//   2. otherwise the `rack_portal` cookie, set by /api/portal/<name>. This is what
//      makes hosted preview links without subdomains (name.netlify.app) work.
//   3. otherwise the store.
export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0];
  const first = host.split(".")[0];

  let portal: "store" | "dealer" | "admin" = "store";
  if (PORTAL_BY_SUBDOMAIN[first]) {
    portal = PORTAL_BY_SUBDOMAIN[first];
  } else if (first !== "store") {
    const saved = req.cookies.get("rack_portal")?.value;
    if (saved === "dealer" || saved === "admin") portal = saved;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${portal}${url.pathname === "/" ? "" : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\..*).*)"],
};
