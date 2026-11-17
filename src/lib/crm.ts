// Shared CRM rules and helpers (safe for server and client: no db imports).
import type { CrmStage } from "@/lib/db";

// The coordinator's 8-step flow, grouped into the stages an order moves through.
export const CRM_STAGES: { key: CrmStage; label: string; step: string; owner: string }[] = [
  { key: "NEW", label: "New orders", step: "1-2", owner: "You check them" },
  { key: "WITH_ACCOUNTS", label: "With Accounts", step: "2-3", owner: "Waiting for the invoice" },
  { key: "INVOICED", label: "Ready to ship", step: "3-4", owner: "Book a vehicle" },
  { key: "LOGISTICS", label: "Vehicle booked", step: "4-5", owner: "Send it off" },
  { key: "DISPATCHED", label: "On the road", step: "5-6", owner: "Send papers to dealer" },
  { key: "DOCS_SENT", label: "Collect payment", step: "6-7", owner: "Follow up with dealer" },
  { key: "PAID", label: "Finished", step: "8", owner: "Paid and reported" },
];

export const STAGE_LABEL = Object.fromEntries(CRM_STAGES.map((s) => [s.key, s.label])) as Record<CrmStage, string>;
export const STAGE_TONE: Record<CrmStage, "gray" | "green" | "amber" | "blue" | "red"> = {
  NEW: "gray", WITH_ACCOUNTS: "amber", INVOICED: "blue", LOGISTICS: "blue", DISPATCHED: "blue", DOCS_SENT: "amber", PAID: "green",
};

export const PAYMENT_TERMS = ["Credit 15 days", "Credit 30 days", "Advance (NEFT/RTGS)", "Cash on delivery"];
export const LOGISTICS_PROVIDERS = ["Porter", "Other on-demand vehicle", "Own vehicle", "Transport / courier"];
export const VEHICLE_TYPES = ["Three-wheeler", "Tata Ace", "Mini truck", "Courier"];
export const FIELD_REPS = ["Suresh (Field Sales)", "Imran (Field Sales)", "Anand (Field Sales)"];

// GSTIN: 2-digit state code, 10-char PAN, entity digit, Z, checksum char.
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const gstinFormatOk = (g: string) => GSTIN_RE.test(g.trim().toUpperCase());

// One plain sentence for what the coordinator should do next on an order.
export const nextAction = (o: { stage: CrmStage; payment: unknown; terms: string }) => {
  switch (o.stage) {
    case "NEW": return "Screen and send to accounts";
    case "WITH_ACCOUNTS": return "Enter invoice and DC from accounts";
    case "INVOICED": return "Book a vehicle";
    case "LOGISTICS": return "Dispatch";
    case "DISPATCHED": return "Send documents to dealer";
    case "DOCS_SENT": return o.payment ? "Report payment to accounts" : "Follow up for payment";
    default: return "Done";
  }
};

export const waLink = (phone: string, text: string) => {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits.length === 10 ? "91" + digits : digits}?text=${encodeURIComponent(text)}`;
};
