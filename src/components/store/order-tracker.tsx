import clsx from "clsx";

const STEPS = ["Placed", "Confirmed", "Packed", "Dispatched", "Delivered"] as const;

// Maps an order status (including legacy "PAID") to the step it has reached.
const REACHED: Record<string, number> = {
  PLACED: 0, PAYMENT_PENDING: 0, PENDING: 0, CONFIRMED: 1, PAID: 1, PACKED: 2, DISPATCHED: 3, DELIVERED: 4,
};

export function OrderTracker({ status }: { status: string }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-center text-sm font-semibold text-red-800">
        This order was {status === "CANCELLED" ? "cancelled" : "returned"}.
      </div>
    );
  }
  const at = REACHED[status] ?? 0;
  return (
    <ol className="flex items-start justify-between text-xs">
      {STEPS.map((s, i) => (
        <li key={s} className="relative flex flex-1 flex-col items-center gap-1 text-center">
          {i > 0 && <span className={clsx("absolute right-1/2 top-3.5 -z-0 h-0.5 w-full", i <= at ? "bg-accent" : "bg-slate-200")} />}
          <span
            className={clsx(
              "relative z-10 flex h-7 w-7 items-center justify-center rounded-full font-bold",
              i <= at ? "bg-accent text-white" : "bg-slate-100 text-slate-400",
            )}
          >
            {i < at ? "✓" : i + 1}
          </span>
          <span className={i <= at ? "font-semibold" : "text-muted"}>
            {i === 1 && status === "PAYMENT_PENDING" ? "Payment pending" : s}
          </span>
        </li>
      ))}
    </ol>
  );
}
