// Placeholder brand. Replace once the client confirms name and logo.
export const BRAND = {
  name: "RackHub",
  tagline: "Racks, enclosures & CCTV accessories",
  supportPhone: "+91 90000 00000",
};

// Host (first label) -> internal route folder. Everything else is the store.
export const PORTAL_BY_SUBDOMAIN: Record<string, "dealer" | "admin"> = {
  dealers: "dealer",
  admin: "admin",
};
