import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function AdminComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">This administrative module is under active development.</p>
      </div>
      
      <Card className="border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Construction className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          We're building a powerful {title.toLowerCase()} suite for ZUPIX Link Studio.
          Check back in the next update.
        </CardContent>
      </Card>
    </div>
  );
}
