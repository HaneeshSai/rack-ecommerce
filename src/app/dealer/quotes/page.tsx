import { PageTitle } from "@/components/ui";
import { requireUser } from "@/lib/session";
import { mock } from "@/lib/db";
import { QuotesClient, type QuoteView } from "@/components/dealer/quotes-client";

export default async function DealerQuotes() {
  const user = await requireUser("DEALER");
  // Dealers only see quotes that sales has sent (drafts and approvals stay internal).
  const quotes: QuoteView[] = mock.S().quotes
    .filter((q) => q.dealerId === user.dealerId && ["SENT", "ACCEPTED", "EXPIRED"].includes(q.status))
    .map((q) => ({
      number: q.number, status: q.status, validUntil: q.validUntil.toISOString(), createdAt: q.createdAt.toISOString(),
      version: q.version, note: q.note, discountPct: q.discountPct,
      items: q.items.map((i) => ({ name: mock.variantName(i.variantId), qty: i.qty, unitPrice: i.unitPrice, listPrice: i.listPrice })),
    }));
  return (
    <>
      <PageTitle title="Quotes" sub="Review quotes from our sales team and accept them online to turn them into orders." />
      <QuotesClient quotes={quotes} />
    </>
  );
}
