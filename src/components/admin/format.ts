// Small formatting helpers shared by admin server and client components.
export const STATUS_LABEL: Record<string, string> = {
  PLACED: "Placed",
  PAYMENT_PENDING: "Payment pending",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export type Tone = "gray" | "green" | "amber" | "blue" | "red";
export const STATUS_TONE: Record<string, Tone> = {
  PLACED: "gray",
  PAYMENT_PENDING: "amber",
  CONFIRMED: "blue",
  PACKED: "blue",
  DISPATCHED: "blue",
  DELIVERED: "green",
  CANCELLED: "red",
  RETURNED: "red",
};

const TZ = "Asia/Kolkata";
export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ }) : "-";
export const fmtDateTime = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ })
    : "-";

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  SALES: "Sales",
  WAREHOUSE: "Warehouse",
  ACCOUNTS: "Accounts",
};

export const TIER_LABEL: Record<string, string> = { SILVER: "Silver", GOLD: "Gold", PLATINUM: "Platinum" };
