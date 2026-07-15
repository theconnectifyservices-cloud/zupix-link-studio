import { Bell, BellOff } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { getPermission, requestPermission, type PermissionState } from "../push";

export function NotificationPermissionCard() {
  const [state, setState] = useState<PermissionState>("default");

  useEffect(() => {
    setState(getPermission());
  }, []);

  const onEnable = async () => {
    const next = await requestPermission();
    setState(next);
    if (next === "granted") toast.success("Notifications enabled");
    else if (next === "denied")
      toast.error("Notifications are blocked. Enable them in your browser settings.");
    else if (next === "unsupported")
      toast.error("This browser doesn't support notifications.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {state === "granted" ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          Push Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {state === "granted"
            ? "You'll receive activity, campaign, and system alerts on this device."
            : state === "denied"
              ? "Notifications are blocked. Update your browser's site settings to re-enable."
              : state === "unsupported"
                ? "Your browser doesn't support notifications."
                : "Get real-time updates about your pages, campaigns, and team activity."}
        </p>
        {state !== "granted" && state !== "unsupported" && (
          <Button className="min-h-11" onClick={onEnable}>
            <Bell className="mr-2 h-4 w-4" /> Enable notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
