
import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle2, ShoppingBag, Calendar, MessageSquare, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { getCustomerTimeline } from "../lib/customer-api";

export function CustomerTimeline({ customerId }: { customerId: string }) {
  const { data: timeline = [], isLoading } = useQuery({
    queryKey: ["customer-timeline", customerId],
    queryFn: () => getCustomerTimeline(customerId),
  });

  if (isLoading) return <div className="py-8 text-center text-sm text-muted-foreground">Loading timeline...</div>;

  if (timeline.length === 0) {
    return (
      <div className="py-8 text-center">
        <Clock className="h-8 w-8 text-muted-foreground opacity-20 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity recorded for this customer.</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'form_submit': return <MessageSquare className="h-3 w-3" />;
      case 'booking_created': return <Calendar className="h-3 w-3" />;
      case 'order_created': return <ShoppingBag className="h-3 w-3" />;
      case 'payment_completed': return <CreditCard className="h-3 w-3" />;
      default: return <CheckCircle2 className="h-3 w-3" />;
    }
  };

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-4 before:h-full before:w-0.5 before:bg-muted">
      {timeline.map((item) => (
        <div key={item.id} className="relative flex items-start gap-6 pl-1">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-muted z-10">
            {getIcon(item.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <h4 className="text-sm font-semibold">{item.title}</h4>
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(item.created_at), "MMM d, HH:mm")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
