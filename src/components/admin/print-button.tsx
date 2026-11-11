"use client";

import { Button } from "@/components/ui";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return <Button onClick={() => window.print()}>{label}</Button>;
}
