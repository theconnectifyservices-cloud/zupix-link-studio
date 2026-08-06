import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Send, Bell, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/communications")({
  component: AdminCommunications,
});

function AdminCommunications() {
  const handleBroadcast = () => {
    toast.success("Broadcast notification queued for delivery");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
        <p className="text-muted-foreground mt-1">Broadcast messages, feature announcements, and system alerts.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-indigo-500" />
              In-App Broadcast
            </CardTitle>
            <CardDescription>Send a real-time notification to active platform users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Target Audience</Label>
              <Select defaultValue="all">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="shikhar">Shikhar Plan Only</SelectItem>
                  <SelectItem value="tejas">Tejas Plan Only</SelectItem>
                  <SelectItem value="udaan">Udaan Plan Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Notification Title</Label>
              <Input placeholder="e.g. Scheduled Maintenance" />
            </div>
            <div className="grid gap-2">
              <Label>Message Content</Label>
              <Textarea placeholder="Type your message here..." className="min-h-[100px]" />
            </div>
            <Button className="w-full bg-indigo-600" onClick={handleBroadcast}>
              <Send className="h-4 w-4 mr-2" /> Send Broadcast
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-500" />
              Email Campaign
            </CardTitle>
            <CardDescription>Send a transactional or marketing email to selected users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-8 border border-dashed rounded-lg flex flex-col items-center justify-center text-center">
               <Mail className="h-10 w-10 text-muted-foreground mb-2" />
               <p className="text-sm font-medium">Email Integration Pending</p>
               <p className="text-xs text-muted-foreground mt-1">Configure SMTP settings to enable email campaigns.</p>
               <Button variant="outline" className="mt-4" size="sm">Configure SMTP</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
