import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BreadcrumbNav, type Crumb } from "@/shared/navigation/breadcrumb-nav";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <BreadcrumbNav items={breadcrumbs} />}
      <div className="flex w-full min-w-0 flex-col items-stretch gap-3 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
        <div className="w-full min-w-0 flex-1 basis-auto">
          <h1 className="text-xl font-semibold tracking-tight [overflow-wrap:break-word] min-[768px]:truncate min-[768px]:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground [overflow-wrap:break-word]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex w-full min-w-0 flex-wrap items-center gap-2 min-[768px]:w-auto min-[768px]:max-w-full min-[768px]:shrink-0 min-[768px]:flex-nowrap min-[768px]:justify-end [&_button]:whitespace-nowrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
