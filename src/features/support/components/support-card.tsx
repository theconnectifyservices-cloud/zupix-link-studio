import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * SupportCard — shared premium shell for every Help Center channel.
 * Future channels (tickets, live chat, AI support) reuse this component.
 */
export function SupportCard({
  icon: Icon,
  title,
  description,
  badge,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "group h-full overflow-hidden border-border/70 transition-all duration-300",
        "hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10",
        className,
      )}
    >
      <CardHeader className="gap-2">
        <div className="mb-1 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary transition-transform duration-300 group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {badge ? (
            <Badge variant="secondary" className="text-[10px] font-medium">
              {badge}
            </Badge>
          ) : null}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  );
}
