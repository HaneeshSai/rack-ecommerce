// Warehouse -> state it ships from (decides CGST+SGST vs IGST).
export const WAREHOUSE_STATE: Record<string, string> = {
  HYD: "Telangana",
  VJA: "Andhra Pradesh",
  TPT: "Andhra Pradesh",
};

export const STATES = [
  "Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra",
  "Kerala", "Odisha", "Gujarat", "Delhi", "West Bengal", "Other",
];

export type GstLine = { amount: number; rate: number }; // amount in paise, tax-exclusive

export type GstBreakup = {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstTotal: number;
  total: number;
  intraState: boolean;
};

// Prices are treated as tax-exclusive. (Open question for the client.)
export function gstBreakup(lines: GstLine[], sellerState: string, buyerState: string): GstBreakup {
  const intraState = sellerState === buyerState;
  let subtotal = 0, cgst = 0, sgst = 0, igst = 0;
  for (const l of lines) {
    subtotal += l.amount;
    const tax = Math.round((l.amount * l.rate) / 100);
    if (intraState) {
      const half = Math.round(tax / 2);
      cgst += half;
      sgst += tax - half;
    } else {
      igst += tax;
    }
  }
  const gstTotal = cgst + sgst + igst;
  return { subtotal, cgst, sgst, igst, gstTotal, total: subtotal + gstTotal, intraState };
}
