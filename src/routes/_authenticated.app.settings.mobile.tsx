import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/shared/navigation/page-header";
import {
  NotificationPermissionCard,
  useMobileStore,
  type DownloadQuality,
} from "@/features/mobile";
import { useNotifHistory } from "@/features/mobile/push";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/app/settings/mobile")({
  component: MobileSettingsPage,
});

function MobileSettingsPage() {
  const prefs = useMobileStore();
  const { history, markAllRead, clear } = useNotifHistory();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mobile & Notifications"
        description="Tune your mobile experience, data usage, and push notifications."
      />

      <NotificationPermissionCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(
            [
              ["activity", "Activity — page views, clicks, conversions"],
              ["campaigns", "Campaigns — performance milestones"],
              ["team", "Team — member actions and mentions"],
              ["system", "System — account, billing, security"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <Label htmlFor={`n-${key}`} className="text-sm font-normal">
                {label}
              </Label>
              <Switch
                id={`n-${key}`}
                checked={prefs.notifications[key]}
                onCheckedChange={(v) => prefs.updateNotifications({ [key]: v })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data & Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="data-saver" className="text-sm font-medium">
                Data Saver
              </Label>
              <p className="text-xs text-muted-foreground">
                Load lower-resolution media and defer background syncs on cellular.
              </p>
            </div>
            <Switch
              id="data-saver"
              checked={prefs.dataSaver}
              onCheckedChange={(v) => prefs.update({ dataSaver: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="auto-sync" className="text-sm font-medium">
                Auto Sync
              </Label>
              <p className="text-xs text-muted-foreground">
                Refresh dashboards and pending actions automatically when online.
              </p>
            </div>
            <Switch
              id="auto-sync"
              checked={prefs.autoSync}
              onCheckedChange={(v) => prefs.update({ autoSync: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="haptics" className="text-sm font-medium">
                Haptic Feedback
              </Label>
              <p className="text-xs text-muted-foreground">
                Vibrate on long-press, delete, and confirmation actions.
              </p>
            </div>
            <Switch
              id="haptics"
              checked={prefs.hapticsEnabled}
              onCheckedChange={(v) => prefs.update({ hapticsEnabled: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="quality" className="text-sm font-medium">
                Download Quality
              </Label>
              <p className="text-xs text-muted-foreground">
                Media resolution for previews and exports.
              </p>
            </div>
            <Select
              value={prefs.downloadQuality}
              onValueChange={(v) => prefs.update({ downloadQuality: v as DownloadQuality })}
            >
              <SelectTrigger id="quality" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Notification History</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={markAllRead}>
              <CheckCheck className="mr-1 h-4 w-4" /> Mark read
            </Button>
            <Button size="sm" variant="ghost" onClick={clear}>
              <Trash2 className="mr-1 h-4 w-4" /> Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No notifications yet. New activity will appear here.
            </p>
          ) : (
            <ul className="divide-y">
              {history.map((n) => (
                <li key={n.id} className="flex items-start gap-3 py-3">
                  <div
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? "bg-muted" : "bg-primary"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{n.title}</p>
                    {n.body && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    )}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {n.category} · {formatDistanceToNow(n.at, { addSuffix: true })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
