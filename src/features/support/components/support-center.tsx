import { BookOpen, Clock, Mail, MessageCircle, MessageSquare, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SupportCard } from "./support-card";
import {
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_WHATSAPP_DISPLAY,
  supportMailtoUrl,
  supportWhatsAppUrl,
} from "../config";

/**
 * SupportCenter — MVP Help Center. Channels are composed from `SupportCard`
 * so new ones (tickets, live chat, AI support) drop in without a redesign.
 */
export function SupportCenter() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SupportCard
          icon={BookOpen}
          title="Documentation"
          description="Learn how to use ZUPIX Link Studio with step-by-step guides."
          badge="Documentation is being prepared."
        >
          <Button variant="secondary" className="w-full" disabled>
            Coming Soon
          </Button>
        </SupportCard>

        <SupportCard
          icon={MessageCircle}
          title="Community"
          description="Our official community will be available soon."
        >
          <Button variant="secondary" className="w-full" disabled>
            Coming Soon
          </Button>
        </SupportCard>

        <SupportCard
          icon={Mail}
          title="Contact Admin"
          description="Need help? Contact our support team."
        >
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="break-all">{SUPPORT_EMAIL}</span>
            </p>
            <p className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
              <span>{SUPPORT_WHATSAPP_DISPLAY}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button asChild className="w-full">
              <a href={supportMailtoUrl()}>
                <Mail className="h-4 w-4" />
                Email Support
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href={supportWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4" />
                WhatsApp Support
              </a>
            </Button>
          </div>
        </SupportCard>
      </div>

      <Card className="border-border/70 bg-muted/30">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Support Hours</p>
              <p className="text-sm text-muted-foreground">{SUPPORT_HOURS.days}</p>
              <p className="text-sm text-muted-foreground">{SUPPORT_HOURS.time}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Timer className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Average Response Time</p>
              <p className="text-sm text-muted-foreground">{SUPPORT_HOURS.responseTime}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
