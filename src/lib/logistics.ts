// Shared business rules from the Rack Distribution Platform Specification.
// Prototype defaults; the admin Settings page edits a live copy in lib/db.ts.

export const WAREHOUSES = [
  { code: "HYD", city: "Hyderabad", state: "Telangana" },
  { code: "VJA", city: "Vijayawada", state: "Andhra Pradesh" },
  { code: "TPT", city: "Tirupati", state: "Andhra Pradesh" },
] as const;

// Delivery city -> state and warehouses in order of nearness (admin-editable table).
export type CityRule = { city: string; state: string; near: string[] };
export const DEFAULT_CITIES: CityRule[] = [
  { city: "Hyderabad", state: "Telangana", near: ["HYD", "VJA", "TPT"] },
  { city: "Secunderabad", state: "Telangana", near: ["HYD", "VJA", "TPT"] },
  { city: "Warangal", state: "Telangana", near: ["HYD", "VJA", "TPT"] },
  { city: "Vijayawada", state: "Andhra Pradesh", near: ["VJA", "HYD", "TPT"] },
  { city: "Guntur", state: "Andhra Pradesh", near: ["VJA", "HYD", "TPT"] },
  { city: "Visakhapatnam", state: "Andhra Pradesh", near: ["VJA", "HYD", "TPT"] },
  { city: "Tirupati", state: "Andhra Pradesh", near: ["TPT", "VJA", "HYD"] },
  { city: "Nellore", state: "Andhra Pradesh", near: ["TPT", "VJA", "HYD"] },
  { city: "Kurnool", state: "Andhra Pradesh", near: ["HYD", "TPT", "VJA"] },
  { city: "Bengaluru", state: "Karnataka", near: ["TPT", "HYD", "VJA"] },
  { city: "Chennai", state: "Tamil Nadu", near: ["TPT", "VJA", "HYD"] },
  { city: "Mumbai", state: "Maharashtra", near: ["HYD", "VJA", "TPT"] },
  { city: "Delhi", state: "Delhi", near: ["HYD", "VJA", "TPT"] },
];

export type ShippingClass = "THREE_WHEELER" | "TATA_ACE";
export const SHIPPING_CLASS_LABEL: Record<ShippingClass, string> = {
  THREE_WHEELER: "Three-wheeler",
  TATA_ACE: "Tata Ace",
};
// Freight in paise by shipping class and distance band from the dispatching warehouse.
export type FreightTable = Record<ShippingClass, { local: number; state: number; inter: number }>;
export const DEFAULT_FREIGHT: FreightTable = {
  THREE_WHEELER: { local: 120000, state: 350000, inter: 700000 },
  TATA_ACE: { local: 180000, state: 480000, inter: 950000 },
};

export type Tier = "SILVER" | "GOLD" | "PLATINUM";
// Percent off the base dealer price, per tier.
export const TIER_DISCOUNT: Record<Tier, number> = { SILVER: 0, GOLD: 3, PLATINUM: 6 };
export const tierPrice = (dealerPrice: number, tier: Tier) =>
  Math.round((dealerPrice * (100 - TIER_DISCOUNT[tier])) / 10000) * 100;

export const EWAY_THRESHOLD = 5000000; // Rs 50,000 in paise

// Who can open which admin area (spec: each role sees only its own menus).
export type StaffRole = "ADMIN" | "SALES" | "WAREHOUSE" | "ACCOUNTS";
export type Area =
  | "overview" | "orders" | "stock" | "dealers" | "crm" | "quotes" | "tasks" | "tickets"
  | "payments" | "reports" | "settings" | "activity";
export const PERMS: Record<StaffRole, Area[]> = {
  ADMIN: ["overview", "orders", "stock", "dealers", "crm", "quotes", "tasks", "tickets", "payments", "reports", "settings", "activity"],
  SALES: ["overview", "orders", "dealers", "crm", "quotes", "tasks", "tickets"],
  WAREHOUSE: ["overview", "orders", "stock", "tickets"],
  ACCOUNTS: ["overview", "orders", "dealers", "payments", "reports", "tickets"],
};
export const STAFF_ROLES: StaffRole[] = ["ADMIN", "SALES", "WAREHOUSE", "ACCOUNTS"];
