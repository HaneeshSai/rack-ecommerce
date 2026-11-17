import { Badge } from "@/components/ui";
import { STAGE_LABEL, STAGE_TONE } from "@/lib/crm";
import type { CrmStage } from "@/lib/db";

export const StageBadge = ({ stage }: { stage: CrmStage }) => <Badge tone={STAGE_TONE[stage]}>{STAGE_LABEL[stage]}</Badge>;

export const ageDays = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 864e5));
export const ageText = (iso: string) => {
  const d = ageDays(iso);
  return d === 0 ? "today" : d === 1 ? "1 day ago" : `${d} days ago`;
};

export const HealthBadge = ({ h }: { h: { score: number; level: "good" | "watch" | "risk" } }) => (
  <Badge tone={h.level === "good" ? "green" : h.level === "watch" ? "amber" : "red"}>
    {h.level === "good" ? "Healthy" : h.level === "watch" ? "Watch" : "At risk"} · {h.score}
  </Badge>
);
