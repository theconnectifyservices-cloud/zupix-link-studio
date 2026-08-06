import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Database, Image, Video, FileText, HardDrive } from "lucide-react";
import { useStorageAnalytics } from "../hooks/use-monitoring";

export function StorageAnalytics() {
  const { data: analytics, isLoading } = useStorageAnalytics();

  if (isLoading || !analytics) return null;

  const usedPercentage = (analytics.used / analytics.total) * 100;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="border-border/50 bg-background/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-primary" />
          Storage Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Capacity: {formatBytes(analytics.total)}</span>
            <span className="font-medium">{formatBytes(analytics.used)} used ({usedPercentage.toFixed(1)}%)</span>
          </div>
          <Progress value={usedPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <Image className="h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Images</span>
              <span className="text-sm font-semibold">{formatBytes(analytics.categories.images || 0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <Video className="h-4 w-4 text-purple-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Videos</span>
              <span className="text-sm font-semibold">{formatBytes(analytics.categories.videos || 0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <FileText className="h-4 w-4 text-orange-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Files</span>
              <span className="text-sm font-semibold">{formatBytes(analytics.categories.files || 0)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
            <Database className="h-4 w-4 text-green-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Products</span>
              <span className="text-sm font-semibold">{formatBytes(analytics.categories.digital_products || 0)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
