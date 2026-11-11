// Pure formatting helpers (safe to import from client components).
export const TIER_LABEL = { SILVER: "Silver", GOLD: "Gold", PLATINUM: "Platinum" } as const;

export const dateStr = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

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

export const statusTone = (s: string): "gray" | "green" | "amber" | "blue" | "red" =>
  s === "DELIVERED" ? "green" : s === "CANCELLED" || s === "RETURNED" ? "red" : s === "PAYMENT_PENDING" ? "amber" : s === "PLACED" ? "gray" : "blue";
