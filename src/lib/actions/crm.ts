"use server";

import { mock, type CrmOrder } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { crmTotals, DAY } from "@/lib/crm-data";
import { gstinFormatOk, LOGISTICS_PROVIDERS } from "@/lib/crm";
import type { Tier } from "@/lib/logistics";

// Prototype actions: they change the in-memory demo data only.
type R = { ok: boolean; msg: string; id?: string };
const fail = (msg: string): R => ({ ok: false, msg });
const find = (id: string) => mock.S().crmOrders.find((o) => o.id === id);
const step = (o: CrmOrder, by: string, text: string) => o.timeline.push({ at: new Date(), by, text });

export async function createSalesOrder(input: {
  dealerId: string; rep: string; terms: string; hub: string; notes: string; lines: { variantId: string; qty: number; price: number }[];
}): Promise<R> {
  const u = await requireUser("CRM");
  const S = mock.S();
  const lines = input.lines.filter((l) => l.variantId && l.qty > 0 && l.price > 0);
  if (!S.dealers.some((d) => d.id === input.dealerId)) return fail("Pick a dealer.");
  if (!lines.length) return fail("Add at least one item with a quantity and price.");
  const n = 5000 + S.crmOrders.length + 1;
  const o: CrmOrder = {
    id: mock.id("so"), number: `SO-${n}`, dealerId: input.dealerId, fieldRep: input.rep, lines, terms: input.terms, hub: input.hub,
    stage: "NEW", notes: input.notes, proformaNo: null, invoiceNo: null, dcNo: null, vehicle: null, dueDate: null, payment: null,
    followups: [], timeline: [], createdAt: new Date(), delivered: false,
  };
  step(o, input.rep, `Sales order received from ${input.rep}`);
  step(o, u.name, "Order entered into CRM");
  S.crmOrders.unshift(o);
  mock.log(u.name, `Created sales order ${o.number}`);
  return { ok: true, msg: `Sales order ${o.number} created`, id: o.id };
}

// Step 2: screen and send to accounts with variants, qty, price, terms.
export async function sendToAccounts(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "NEW") return fail("Order is not waiting for screening.");
  o.stage = "WITH_ACCOUNTS";
  if (o.terms.startsWith("Advance") && !o.proformaNo) o.proformaNo = `PF/${o.number}`;
  step(o, u.name, "Screened and sent to accounts");
  mock.notify("Order sent to accounts", "Accounts", ["Email", "In-app"], `${o.number}: items, quantities, prices and ${o.terms} terms attached.`, o.number);
  return { ok: true, msg: `${o.number} sent to accounts` };
}

// Billing support: proforma for bank-transfer customers.
export async function issueProforma(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o) return fail("Order not found.");
  o.proformaNo = o.proformaNo ?? `PF/${o.number}`;
  step(o, u.name, `Proforma ${o.proformaNo} issued for NEFT/RTGS`);
  mock.notify("Proforma issued", o.dealerId, ["WhatsApp", "Email"], `Proforma ${o.proformaNo} sent for payment by NEFT/RTGS.`, o.number);
  return { ok: true, msg: `Proforma ${o.proformaNo} issued` };
}

// Step 3: accounts sends invoice and DC.
export async function recordInvoice(id: string, input: { invoiceNo: string; dcNo: string }): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "WITH_ACCOUNTS") return fail("Order is not with accounts.");
  if (!input.invoiceNo.trim() || !input.dcNo.trim()) return fail("Enter both the invoice number and the DC number.");
  o.invoiceNo = input.invoiceNo.trim();
  o.dcNo = input.dcNo.trim();
  o.stage = "INVOICED";
  const d = mock.S().dealers.find((x) => x.id === o.dealerId);
  if (d && o.terms.startsWith("Credit")) d.creditUsed += crmTotals(o).total;
  step(o, u.name, `Invoice ${o.invoiceNo} and DC ${o.dcNo} received from accounts`);
  return { ok: true, msg: "Invoice and DC recorded" };
}

// Step 4: arrange the vehicle (Porter or other).
export async function bookVehicle(id: string, v: NonNullable<CrmOrder["vehicle"]>): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "INVOICED") return fail("Invoice and DC must be recorded first.");
  if (!LOGISTICS_PROVIDERS.includes(v.provider)) return fail("Pick a logistics provider.");
  if (!v.vehicleNo.trim() && v.provider !== "Transport / courier") return fail("Enter the vehicle number.");
  o.vehicle = { ...v, vehicleNo: v.vehicleNo.trim().toUpperCase() };
  o.stage = "LOGISTICS";
  step(o, u.name, `Vehicle booked on ${v.provider}${v.bookingId ? ` (${v.bookingId})` : ""}`);
  return { ok: true, msg: "Vehicle booked" };
}

// Step 5: dispatch and inform the field sales person.
export async function dispatchOrder(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "LOGISTICS") return fail("Book a vehicle first.");
  o.stage = "DISPATCHED";
  step(o, u.name, `Dispatched from ${o.hub}; ${o.fieldRep} informed`);
  mock.notify("Order dispatched", o.fieldRep, ["WhatsApp"], `${o.number} dispatched from ${o.hub} on ${o.vehicle?.vehicleNo}. Driver ${o.vehicle?.driverName} ${o.vehicle?.driverPhone}.`, o.number);
  return { ok: true, msg: `Dispatched. ${o.fieldRep} informed` };
}

// Step 6: send invoice, DC and driver details to the dealer. Starts the payment clock.
export async function sendDocsToDealer(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "DISPATCHED") return fail("Dispatch the order first.");
  o.stage = "DOCS_SENT";
  const days = Number(o.terms.match(/(\d+) days/)?.[1] ?? 0);
  o.dueDate = days ? new Date(Date.now() + days * DAY) : new Date();
  step(o, u.name, "Invoice, DC and driver details sent to dealer");
  mock.notify("Dispatch documents sent", o.dealerId, ["WhatsApp", "Email"], `Invoice ${o.invoiceNo}, DC ${o.dcNo}, vehicle ${o.vehicle?.vehicleNo}, driver ${o.vehicle?.driverPhone}.`, o.number);
  return { ok: true, msg: "Documents sent to dealer" };
}

// Step 7: payment follow-up, in coordination with the sales guy.
export async function logFollowup(id: string, input: { note: string; promiseDate: string }): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o) return fail("Order not found.");
  if (!input.note.trim()) return fail("Write what was said.");
  o.followups.unshift({ at: new Date(), by: u.name, note: input.note.trim(), promiseDate: input.promiseDate || null });
  step(o, u.name, `Payment follow-up: ${input.note.trim()}`);
  return { ok: true, msg: "Follow-up saved" };
}

export async function recordPayment(id: string, input: { utr: string; amount: number; mode: string }): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o || o.stage !== "DOCS_SENT") return fail("Order is not waiting for payment.");
  if (!input.utr.trim()) return fail("Enter the UTR or reference number.");
  o.payment = { utr: input.utr.trim(), amount: Math.round(input.amount * 100), mode: input.mode, at: new Date(), reported: false };
  step(o, u.name, `Payment received (${input.mode}, ${input.utr.trim()})`);
  return { ok: true, msg: "Payment recorded. Report it to accounts." };
}

// Step 8: report the payment to accounts and close the order.
export async function reportPayment(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o?.payment) return fail("Record the payment first.");
  o.payment.reported = true;
  o.stage = "PAID";
  const d = mock.S().dealers.find((x) => x.id === o.dealerId);
  if (d && o.terms.startsWith("Credit")) d.creditUsed = Math.max(0, d.creditUsed - crmTotals(o).total);
  step(o, u.name, "Payment reported to accounts");
  mock.notify("Payment reported", "Accounts", ["Email", "In-app"], `${o.number}: ${o.payment.mode} ${o.payment.utr} received.`, o.number);
  return { ok: true, msg: "Payment reported to accounts" };
}

// Dealer onboarding.
export async function verifyGstin(dealerId: string): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  if (!gstinFormatOk(d.gstin)) return fail("GSTIN format is not valid. Ask the dealer to correct it.");
  d.gstVerified = true;
  mock.log(u.name, `Verified GSTIN for ${d.businessName}`);
  return { ok: true, msg: "GSTIN verified (format check in this demo)" };
}

export async function approveDealer(dealerId: string, input: { tier: Tier; hub: string; creditLimit: number; termsDays: number }): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  if (!d.gstVerified) return fail("Verify the GSTIN before approving.");
  d.status = "APPROVED";
  d.tier = input.tier;
  d.homeWarehouse = input.hub;
  d.creditLimit = Math.round(input.creditLimit * 100);
  d.termsDays = input.termsDays;
  mock.log(u.name, `Approved dealer ${d.businessName} (${input.tier.toLowerCase()}, ${input.hub})`);
  mock.notify("Dealer approved", d.businessName, ["Email", "WhatsApp"], "Your dealer account is approved. You can sign in and order.", d.id);
  return { ok: true, msg: `${d.businessName} approved` };
}

export async function rejectDealer(dealerId: string): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  d.status = "REJECTED";
  mock.log(u.name, `Rejected dealer application ${d.businessName}`);
  return { ok: true, msg: `${d.businessName} rejected` };
}

export async function updateDealerProfile(dealerId: string, input: { contactName: string; phone: string; email: string; address: string }): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  Object.assign(d, input);
  mock.log(u.name, `Updated profile of ${d.businessName}`);
  return { ok: true, msg: "Profile updated" };
}

// Relationship management and enquiry follow-ups.
export async function logDealerCall(dealerId: string, note: string): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  mock.log(u.name, `Called ${d.businessName}: ${note.trim() || "checked in"}`);
  return { ok: true, msg: `Call logged for ${d.businessName}` };
}

export async function addFollowupTask(title: string, ref: string | null): Promise<R> {
  const u = await requireUser("CRM");
  const S = mock.S();
  S.tasks.unshift({ id: mock.id("k"), title, due: new Date(Date.now() + DAY), done: false, ref, owner: u.name, auto: false });
  return { ok: true, msg: "Follow-up task created for tomorrow" };
}

export async function markDelivered(id: string): Promise<R> {
  const u = await requireUser("CRM");
  const o = find(id);
  if (!o) return fail("Order not found.");
  o.delivered = true;
  step(o, u.name, "Goods delivered to dealer");
  return { ok: true, msg: "Marked as delivered" };
}

// ---- Cheque register -------------------------------------------------------
export async function addCheque(input: { dealerId: string; orderId: string; chequeNo: string; bank: string; amount: number; chequeDate: string }): Promise<R> {
  const u = await requireUser("CRM");
  const S = mock.S();
  const d = S.dealers.find((x) => x.id === input.dealerId);
  if (!d) return fail("Pick a dealer.");
  if (!input.chequeNo.trim()) return fail("Enter the cheque number.");
  if (!(input.amount > 0)) return fail("Enter the cheque amount.");
  if (!input.chequeDate) return fail("Enter the date written on the cheque.");
  if (S.cheques.some((c) => c.chequeNo === input.chequeNo.trim() && c.bank === input.bank.trim())) return fail("This cheque is already in the register.");
  const post = input.chequeDate > new Date().toISOString().slice(0, 10);
  S.cheques.unshift({
    id: mock.id("q"), dealerId: d.id, orderId: input.orderId || null, chequeNo: input.chequeNo.trim(), bank: input.bank.trim() || "Bank not noted",
    amount: Math.round(input.amount * 100), chequeDate: input.chequeDate, status: "RECEIVED", receivedAt: new Date(),
    log: [{ at: new Date(), by: u.name, text: post ? "Post-dated cheque received from dealer" : "Cheque received from dealer" }],
  });
  return { ok: true, msg: post ? "Post-dated cheque added" : "Cheque added" };
}

export async function setChequeStatus(id: string, status: "DEPOSITED" | "CLEARED" | "BOUNCED", reason = ""): Promise<R> {
  const u = await requireUser("CRM");
  const S = mock.S();
  const c = S.cheques.find((x) => x.id === id);
  if (!c) return fail("Cheque not found.");
  const ok = (c.status === "RECEIVED" && status === "DEPOSITED") || (c.status === "DEPOSITED" && (status === "CLEARED" || status === "BOUNCED"));
  if (!ok) return fail("That step is not allowed for this cheque.");
  if (status === "BOUNCED" && !reason.trim()) return fail("Write the bounce reason.");
  c.status = status;
  c.log.push({ at: new Date(), by: u.name, text: status === "DEPOSITED" ? "Deposited at bank" : status === "CLEARED" ? "Cleared" : `Bounced: ${reason.trim()}` });
  const o = c.orderId ? find(c.orderId) : undefined;
  if (o && status === "CLEARED" && o.stage === "DOCS_SENT" && !o.payment) {
    o.payment = { utr: `CHQ ${c.chequeNo}`, amount: c.amount, mode: "Cheque", at: new Date(), reported: false };
    step(o, u.name, `Cheque ${c.chequeNo} cleared. Report the payment to accounts`);
    return { ok: true, msg: `Cleared. ${o.number} is ready to report to accounts` };
  }
  if (o && status === "BOUNCED") step(o, u.name, `Cheque ${c.chequeNo} bounced: ${reason.trim()}`);
  if (status === "BOUNCED") S.tasks.unshift({ id: mock.id("k"), title: `Cheque ${c.chequeNo} bounced: ask the dealer for a new payment`, due: new Date(Date.now() + DAY), done: false, ref: c.orderId ? o?.number ?? null : null, owner: u.name, auto: false });
  return { ok: true, msg: status === "BOUNCED" ? "Marked bounced. A follow-up task was created" : `Cheque ${status.toLowerCase()}` };
}

// ---- Claims: damaged, missing or wrong items ---------------------------------
export async function raiseClaim(input: { orderId: string; kind: "DAMAGED" | "MISSING" | "WRONG_ITEM"; item: string; qty: number; note: string; hoursAfterDelivery: number; photos: number }): Promise<R> {
  const u = await requireUser("CRM");
  const S = mock.S();
  const o = find(input.orderId);
  if (!o) return fail("Pick the order.");
  if (!input.item.trim()) return fail("Say which item.");
  if (!(input.qty > 0)) return fail("Enter how many pieces.");
  const n = 700 + S.claims.length + 1;
  const late = input.hoursAfterDelivery > 48;
  S.claims.unshift({
    id: mock.id("cl"), number: `CL-${n}`, dealerId: o.dealerId, orderId: o.id, kind: input.kind, item: input.item.trim(), qty: Math.round(input.qty),
    note: input.note.trim(), hoursAfterDelivery: Math.max(0, input.hoursAfterDelivery || 0), photos: Math.max(0, input.photos || 0),
    status: "OPEN", outcome: null, creditAmount: 0, creditNoteNo: null, raisedAt: new Date(),
    log: [{ at: new Date(), by: u.name, text: `Claim raised${late ? " (after the 48-hour window)" : ""}` }],
  });
  step(o, u.name, `Claim CL-${n} raised: ${input.item.trim()}`);
  return { ok: true, msg: `Claim CL-${n} raised` };
}

export async function decideClaim(id: string, input: { approve: boolean; outcome: "CREDIT_NOTE" | "REPLACEMENT"; amount: number; note: string }): Promise<R> {
  const u = await requireUser("CRM");
  const c = mock.S().claims.find((x) => x.id === id);
  if (!c || c.status !== "OPEN") return fail("This claim is already decided.");
  if (!input.approve) {
    if (!input.note.trim()) return fail("Write why it is rejected.");
    c.status = "REJECTED";
    c.log.push({ at: new Date(), by: u.name, text: `Rejected: ${input.note.trim()}` });
    return { ok: true, msg: "Claim rejected" };
  }
  if (input.outcome === "CREDIT_NOTE" && !(input.amount > 0)) return fail("Enter the credit note amount.");
  c.status = "APPROVED";
  c.outcome = input.outcome;
  c.creditAmount = input.outcome === "CREDIT_NOTE" ? Math.round(input.amount * 100) : 0;
  c.log.push({ at: new Date(), by: u.name, text: input.outcome === "CREDIT_NOTE" ? "Approved: credit note to be issued" : "Approved: replacement to be sent" });
  mock.notify("Claim approved", c.dealerId, ["WhatsApp"], `Claim ${c.number} approved (${input.outcome === "CREDIT_NOTE" ? "credit note" : "replacement"}).`, c.number);
  return { ok: true, msg: "Claim approved" };
}

export async function closeClaim(id: string, creditNoteNo: string): Promise<R> {
  const u = await requireUser("CRM");
  const c = mock.S().claims.find((x) => x.id === id);
  if (!c || c.status !== "APPROVED") return fail("Approve the claim first.");
  if (c.outcome === "CREDIT_NOTE") {
    if (!creditNoteNo.trim()) return fail("Enter the credit note number from Accounts.");
    c.creditNoteNo = creditNoteNo.trim();
    const d = mock.S().dealers.find((x) => x.id === c.dealerId);
    if (d) d.creditUsed = Math.max(0, d.creditUsed - c.creditAmount);
  }
  c.status = "CLOSED";
  c.log.push({ at: new Date(), by: u.name, text: c.outcome === "CREDIT_NOTE" ? `Credit note ${c.creditNoteNo} issued` : "Replacement sent" });
  return { ok: true, msg: "Claim closed" };
}

// ---- Stop-credit hold ------------------------------------------------------
export async function setCreditHold(dealerId: string, reason: string): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d) return fail("Dealer not found.");
  if (!reason.trim()) return fail("Write the reason for the hold.");
  d.creditHold = { reason: reason.trim(), by: u.name, at: new Date() };
  mock.log(u.name, `Put credit on hold for ${d.businessName}: ${reason.trim()}`);
  return { ok: true, msg: "Credit put on hold. New credit orders will be blocked." };
}

export async function releaseCreditHold(dealerId: string, note: string): Promise<R> {
  const u = await requireUser("CRM");
  const d = mock.S().dealers.find((x) => x.id === dealerId);
  if (!d?.creditHold) return fail("This dealer has no hold.");
  if (!note.trim()) return fail("Write why you are releasing it.");
  d.creditHold = null;
  mock.log(u.name, `Released credit hold for ${d.businessName}: ${note.trim()}`);
  return { ok: true, msg: "Hold released" };
}
