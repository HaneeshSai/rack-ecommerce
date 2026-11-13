import { DEFAULT_CITIES, DEFAULT_FREIGHT, WAREHOUSES, type ShippingClass } from "@/lib/logistics";

// Prototype only: maps the first 3 digits of a pincode to a delivery city we already serve.
// A real build would use a full pincode table or a logistics API.
const PREFIX_CITY: Record<string, string> = {
  "500": "Hyderabad", "501": "Hyderabad", "502": "Hyderabad", "503": "Hyderabad", "506": "Warangal", "518": "Kurnool",
  "520": "Vijayawada", "521": "Vijayawada", "522": "Guntur", "530": "Visakhapatnam", "531": "Visakhapatnam",
  "517": "Tirupati", "524": "Nellore", "560": "Bengaluru", "561": "Bengaluru", "600": "Chennai", "601": "Chennai",
  "400": "Mumbai", "401": "Mumbai", "110": "Delhi",
};

export type DeliveryEstimate =
  | { ok: false; reason: string }
  | { ok: true; city: string; state: string; hub: string; hubCity: string; band: "local" | "state" | "inter"; freight: number; minDays: number; maxDays: number };

const DAYS = { local: [1, 2], state: [2, 3], inter: [4, 6] } as const;

export function estimateDelivery(pin: string, cls: ShippingClass): DeliveryEstimate {
  if (!/^\d{6}$/.test(pin)) return { ok: false, reason: "Enter a valid 6-digit pincode." };
  const city = PREFIX_CITY[pin.slice(0, 3)];
  const rule = DEFAULT_CITIES.find((c) => c.city === city);
  if (!rule) return { ok: false, reason: "We do not have an instant estimate for this pincode. Call us or request a quote and we will confirm delivery." };
  const hub = WAREHOUSES.find((w) => w.code === rule.near[0])!;
  const band = hub.city === rule.city ? "local" : hub.state === rule.state ? "state" : "inter";
  return { ok: true, city: rule.city, state: rule.state, hub: hub.code, hubCity: hub.city, band, freight: DEFAULT_FREIGHT[cls][band], minDays: DAYS[band][0], maxDays: DAYS[band][1] };
}
