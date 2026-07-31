import { Bell, Megaphone, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsAdmin } from "./notifications-admin";
import { AnnouncementBarAdmin } from "./announcement-bar-admin";
import { ReleaseNotesAdmin } from "./release-notes-admin";

export function CommunicationCenter() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Communication Center</h1>
        <p className="text-sm text-muted-foreground">
          In-app notifications, the site announcement bar and release notes.
        </p>
      </header>

      <Tabs defaultValue="notifications">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="announcement" className="gap-2">
            <Megaphone className="h-4 w-4" /> Announcement Bar
          </TabsTrigger>
          <TabsTrigger value="releases" className="gap-2">
            <Sparkles className="h-4 w-4" /> Release Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-6 animate-fade-in">
          <NotificationsAdmin />
        </TabsContent>
        <TabsContent value="announcement" className="mt-6 animate-fade-in">
          <AnnouncementBarAdmin />
        </TabsContent>
        <TabsContent value="releases" className="mt-6 animate-fade-in">
          <ReleaseNotesAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}
