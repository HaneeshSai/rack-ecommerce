import type { DealerStatus } from "@/lib/db";

export function StatusBanner({ status }: { status: DealerStatus }) {
  if (status === "APPROVED") return null;
  const pending = status === "PENDING";
  return (
    <div className={`border-b px-4 py-3 text-sm ${pending ? "border-amber-200 bg-amber-50 text-amber-900" : "border-red-200 bg-red-50 text-red-900"}`}>
      <div className="mx-auto max-w-6xl">
        {pending ? (
          <>
            <b>Your application is under review: retail prices only until approved.</b>{" "}
            Trade prices, credit and bulk ordering unlock once our team approves your dealer account.
          </>
        ) : (
          <>
            <b>Your dealer application was not approved.</b> Please contact our sales team to discuss next steps.
          </>
        )}
      </div>
    </div>
  );
}
