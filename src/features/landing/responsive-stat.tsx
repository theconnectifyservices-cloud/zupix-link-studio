import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type ClassValue = string | false | null | undefined;

const cx = (...values: ClassValue[]) => values.filter(Boolean).join(" ");

export function ResponsiveStatsGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("landing-stats-grid", className)}>{children}</div>;
}

export function ResponsiveStatCard({
  icon: Icon,
  label,
  value,
  className,
  iconClassName,
  valueClassName,
  labelClassName,
}: {
  icon?: LucideIcon;
  label: ReactNode;
  value: ReactNode;
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <div className={cx("landing-stat-card group", className)}>
      {Icon ? (
        <span className={cx("landing-stat-icon", iconClassName)}>
          <Icon className="landing-stat-icon-svg" />
        </span>
      ) : null}
      <span className={cx("landing-stat-number", valueClassName)}>{value}</span>
      <span className={cx("landing-stat-label", labelClassName)}>{label}</span>
    </div>
  );
}