import { cn } from "@/lib/utils";
import { PLANS, type PlanCode } from "../plans";

interface Props {
  plan: PlanCode;
  size?: "xs" | "sm";
  className?: string;
}

/** Small pill badge used in palette tiles and comparison lists. */
export function PlanBadge({ plan, size = "xs", className }: Props) {
  const def = PLANS[plan];
  const label = plan === "udaan" ? "FREE" : plan === "tejas" ? "TEJAS" : "COMING SOON";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wider",
        size === "xs" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        plan === "udaan" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        plan === "tejas" && "border-primary/30 bg-primary/10 text-primary",
        plan === "shikhar" && "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        className,
      )}
      title={`${def.emoji} ${def.name}`}
    >
      {label}
    </span>
  );
}
