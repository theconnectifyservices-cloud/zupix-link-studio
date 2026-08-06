import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, GitBranch, Terminal, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/updates")({
  component: AdminUpdates,
});

function AdminUpdates() {
  const versions = [
    { version: "1.2.4-RC", type: "Stable", date: "2026-08-01", status: "Deployed" },
    { version: "1.2.3", type: "Stable", date: "2026-07-15", status: "Legacy" },
    { version: "1.2.0", type: "Major", date: "2026-06-30", status: "Legacy" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Version Manager</h1>
          <p className="text-muted-foreground mt-1">Manage platform deployments, changelogs, and release cycles.</p>
        </div>
        <Button className="bg-indigo-600">
          <Plus className="h-4 w-4 mr-2" /> New Release
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Release History</CardTitle>
            <CardDescription>All previous platform versions and their status.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
               {versions.map((v) => (
                 <div key={v.version} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                       <GitBranch className="h-5 w-5 text-indigo-600" />
                     </div>
                     <div>
                       <div className="font-bold flex items-center gap-2">
                         {v.version}
                         <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded uppercase">{v.type}</span>
                       </div>
                       <div className="text-xs text-muted-foreground">{v.date}</div>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <span className={`text-xs font-medium px-2 py-1 rounded-full ${v.status === 'Deployed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                       {v.status}
                     </span>
                     <Button variant="ghost" size="sm">Details</Button>
                   </div>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-2">
              <div className="flex items-center gap-2">
                <Terminal className="h-3 w-3 text-green-400" />
                <span>ENVIRONMENT: production</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="h-3 w-3 text-green-400" />
                <span>VERSION: 1.2.4-stable</span>
              </div>
              <div className="flex items-center gap-2">
                <Terminal className="h-3 w-3 text-green-400" />
                <span>UPTIME: 14d 05h 22m</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" /> Hot Reload System
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
