import { createFileRoute } from "@tanstack/react-router";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/app/settings/notifications")({
  component: NotificationsSettings,
});

function NotificationsSettings() {
  return (
    <div className="space-y-3">
      {[
        { id: "email-updates", label: "Product updates by email" },
        { id: "email-security", label: "Security alerts by email" },
        { id: "email-marketing", label: "Marketing & tips" },
      ].map((n) => (
        <div key={n.id} className="flex items-center justify-between rounded-lg border bg-card p-4">
          <Label htmlFor={n.id} className="font-normal">
            {n.label}
          </Label>
          <Switch id={n.id} />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Notification preferences will sync in a later phase.
      </p>
    </div>
  );
}
