import clsx from "clsx";
import { STATUS_LABEL } from "./format";

const FLOW = ["PLACED", "PAYMENT_PENDING", "CONFIRMED", "PACKED", "DISPATCHED", "DELIVERED"];

export function StatusTracker({ status, withPayment }: { status: string; withPayment: boolean }) {
  if (status === "CANCELLED" || status === "RETURNED") {
    return <p className="text-sm font-semibold text-red-600">{STATUS_LABEL[status]}</p>;
  }
  const steps = FLOW.filter((s) => withPayment || s !== "PAYMENT_PENDING");
  const cur = steps.indexOf(status);
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = i < cur, active = i === cur;
        return (
          <li key={s} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={clsx("h-0.5 flex-1", i === 0 ? "bg-transparent" : i <= cur ? "bg-accent" : "bg-line")} />
              <div
                className={clsx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2",
                  done && "bg-accent text-white ring-accent",
                  active && "bg-white text-accent ring-accent",
                  !done && !active && "bg-white text-muted ring-line",
                )}
              >
                {done ? "✓" : i + 1}
              </div>
              <div className={clsx("h-0.5 flex-1", i === steps.length - 1 ? "bg-transparent" : i < cur ? "bg-accent" : "bg-line")} />
            </div>
            <span className={clsx("mt-1 text-[11px] leading-tight", active ? "font-semibold text-foreground" : "text-muted")}>
              {STATUS_LABEL[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
