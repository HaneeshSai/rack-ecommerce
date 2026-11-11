import clsx from "clsx";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "ghost" | "dark" }) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50",
        variant === "primary" && "bg-accent text-white hover:brightness-95",
        variant === "dark" && "bg-brand text-white hover:brightness-125",
        variant === "ghost" && "border border-line bg-white hover:bg-slate-50",
        className,
      )}
    />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "ghost" | "dark";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition",
        variant === "primary" && "bg-accent text-white hover:brightness-95",
        variant === "dark" && "bg-brand text-white hover:brightness-125",
        variant === "ghost" && "border border-line bg-white hover:bg-slate-50",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={clsx("rounded-xl border border-line bg-white", className)} />;
}

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: "gray" | "green" | "amber" | "blue" | "red";
  children: ReactNode;
}) {
  const tones = {
    gray: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
  };
  return (
    <span className={clsx("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent";
