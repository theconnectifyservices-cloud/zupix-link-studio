import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useErrorsStore } from "../errors.store";

const SOURCE_COLOR: Record<string, string> = {
  window: "bg-red-500/15 text-red-600 border-red-500/30",
  promise: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  boundary: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  manual: "bg-muted text-muted-foreground border-border",
};

export function ErrorMonitor() {
  const entries = useErrorsStore((s) => s.entries);
  const clear = useErrorsStore((s) => s.clear);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Error & Crash Monitoring</h2>
          <p className="text-sm text-muted-foreground">Captured window errors, unhandled rejections and boundary crashes.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No errors captured. Everything is running smoothly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <Card key={e.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="truncate pr-4">{e.message}</span>
                  <Badge variant="outline" className={SOURCE_COLOR[e.source]}>{e.source}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{new Date(e.ts).toLocaleString()} · {e.url}</p>
                {e.stack && (
                  <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-2 text-[11px] leading-relaxed">
                    {e.stack}
                  </pre>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
