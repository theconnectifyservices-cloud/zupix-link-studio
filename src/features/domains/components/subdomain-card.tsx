import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Globe2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  checkSubdomainAvailable,
  fetchWorkspaceBranding,
  updateWorkspaceBranding,
} from "../api";
import { validateSubdomain } from "../validation";
import { ZUPIX_SUBDOMAIN_SUFFIX } from "../types";

export function SubdomainCard({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["ws-branding", workspaceId],
    queryFn: () => fetchWorkspaceBranding(workspaceId),
  });

  const [sub, setSub] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (data?.subdomain) setSub(data.subdomain);
  }, [data?.subdomain]);

  useEffect(() => {
    if (!sub) return setStatus("idle");
    const v = validateSubdomain(sub);
    if (!v.ok) {
      setStatus("invalid");
      setMsg(v.error);
      return;
    }
    if (data?.subdomain === v.sub) {
      setStatus("ok");
      setMsg("Currently active");
      return;
    }
    setStatus("checking");
    const t = setTimeout(async () => {
      const ok = await checkSubdomainAvailable(v.sub, workspaceId);
      setStatus(ok ? "ok" : "taken");
      setMsg(ok ? "Available" : "Already taken");
    }, 400);
    return () => clearTimeout(t);
  }, [sub, data?.subdomain, workspaceId]);

  const save = useMutation({
    mutationFn: async () => {
      const v = validateSubdomain(sub);
      if (!v.ok) throw new Error(v.error);
      await updateWorkspaceBranding(workspaceId, { subdomain: v.sub });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-branding", workspaceId] });
      toast.success("Subdomain saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fullUrl = data?.subdomain ? `https://${data.subdomain}.${ZUPIX_SUBDOMAIN_SUFFIX}` : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Free ZUPIX subdomain</CardTitle>
          <Badge variant="secondary" className="ml-auto text-xs">Free</Badge>
        </div>
        <CardDescription>Every workspace gets a free subdomain on {ZUPIX_SUBDOMAIN_SUFFIX}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-stretch gap-0 overflow-hidden rounded-md border">
          <Input
            value={sub}
            onChange={(e) => setSub(e.target.value.toLowerCase())}
            placeholder="your-brand"
            className="rounded-none border-0 focus-visible:ring-0"
            aria-label="Subdomain"
          />
          <div className="flex items-center whitespace-nowrap border-l bg-muted px-3 text-sm text-muted-foreground">
            .{ZUPIX_SUBDOMAIN_SUFFIX}
          </div>
        </div>
        {status !== "idle" && (
          <p
            className={
              status === "ok"
                ? "text-xs text-emerald-600"
                : status === "checking"
                  ? "text-xs text-muted-foreground"
                  : "text-xs text-destructive"
            }
          >
            {status === "checking" ? "Checking availability…" : msg}
          </p>
        )}
        {fullUrl && (
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 truncate">
              <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />
              <a href={fullUrl} target="_blank" rel="noreferrer" className="truncate hover:underline">
                {fullUrl}
              </a>
            </span>
            <CopyButton value={fullUrl} />
          </div>
        )}
        <Button
          size="sm"
          onClick={() => save.mutate()}
          disabled={status !== "ok" || save.isPending || sub === data?.subdomain}
        >
          {save.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          {data?.subdomain ? "Update subdomain" : "Claim subdomain"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied");
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Copy failed");
        }
      }}
      aria-label="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}
