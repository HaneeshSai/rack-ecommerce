import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

const btn =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50";
const variants = {
  primary: "bg-accent text-white shadow-sm hover:brightness-110",
  dark: "bg-brand text-white hover:bg-brand-2",
  ghost: "border border-line bg-white text-foreground hover:border-slate-300 hover:bg-slate-50",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof variants }) {
  return <button {...props} className={clsx(btn, variants[variant], className)} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof variants;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={clsx(btn, variants[variant], className)}>
      {children}
    </Link>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={clsx("rounded-2xl border border-line bg-white shadow-[var(--shadow)]", className)} />;
}

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: "gray" | "green" | "amber" | "blue" | "red";
  children: ReactNode;
}) {
  const tones = {
    gray: "bg-slate-100 text-slate-700 ring-slate-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    red: "bg-red-50 text-red-700 ring-red-200",
  };
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone])}>
      {children}
    </span>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-accent to-amber-300" />
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div
        className={clsx(
          "mt-1 text-3xl font-extrabold tracking-tight",
          tone === "good" && "text-emerald-600",
          tone === "warn" && "text-red-600",
        )}
      >
        {value}
      </div>
    </Card>
  );
}

export const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";
