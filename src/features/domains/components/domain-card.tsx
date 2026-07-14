import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Star,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DnsWizard } from "./dns-wizard";
import { CopyButton } from "./subdomain-card";
import {
  deleteDomain,
  setPrimaryDomain,
  setRedirect,
  updateDomain,
} from "../api";
import type { DomainRow, DomainStatus, RedirectType, SslStatus } from "../types";

const statusBadge: Record<DomainStatus, { label: string; className: string; Icon: typeof Clock }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-600 border-amber-500/20", Icon: Clock },
  verified: { label: "Verified", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", Icon: CheckCircle2 },
  failed: { label: "Failed", className: "bg-destructive/10 text-destructive border-destructive/20", Icon: XCircle },
};

const sslBadge: Record<SslStatus, { label: string; className: string; Icon: typeof ShieldOff }> = {
  none: { label: "No SSL", className: "text-muted-foreground", Icon: ShieldOff },
  provisioning: { label: "Provisioning", className: "text-amber-600", Icon: Loader2 },
  active: { label: "SSL Active", className: "text-emerald-600", Icon: ShieldCheck },
  expired: { label: "SSL Expired", className: "text-destructive", Icon: ShieldAlert },
  error: { label: "SSL Error", className: "text-destructive", Icon: ShieldAlert },
};

export function DomainCard({ domain }: { domain: DomainRow }) {
  const qc = useQueryClient();
  const S = statusBadge[domain.status];
  const SSL = sslBadge[domain.ssl_status];
  const url = `https://${domain.host}`;

  const del = useMutation({
    mutationFn: () => deleteDomain(domain.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domains", domain.workspace_id] });
      toast.success("Domain removed");
    },
  });

  const makePrimary = useMutation({
    mutationFn: () => setPrimaryDomain(domain.workspace_id, domain.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domains", domain.workspace_id] });
      toast.success("Set as primary");
    },
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{domain.host}</h3>
              {domain.is_primary && (
                <Badge variant="secondary" className="gap-1 text-[10px]">
                  <Star className="h-3 w-3" /> Primary
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px]">
              <span className={`flex items-center gap-1 rounded-md border px-1.5 py-0.5 ${S.className}`}>
                <S.Icon className="h-3 w-3" /> {S.label}
              </span>
              <span className={`flex items-center gap-1 ${SSL.className}`}>
                <SSL.Icon className={`h-3 w-3 ${domain.ssl_status === "provisioning" ? "animate-spin" : ""}`} />
                {SSL.label}
              </span>
              {domain.last_checked_at && (
                <span className="text-muted-foreground">
                  Checked {new Date(domain.last_checked_at).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a href={url} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" aria-label="Open">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
            <CopyButton value={url} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={domain.status !== "verified" || domain.is_primary}
                  onClick={() => makePrimary.mutate()}
                >
                  <Star className="mr-2 h-3.5 w-3.5" /> Set as primary
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => del.mutate()}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove domain
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="dns">
          <TabsList className="h-8">
            <TabsTrigger value="dns" className="text-xs">DNS setup</TabsTrigger>
            <TabsTrigger value="url" className="text-xs">URL</TabsTrigger>
            <TabsTrigger value="redirect" className="text-xs">Redirects</TabsTrigger>
            <TabsTrigger value="ssl" className="text-xs">SSL</TabsTrigger>
          </TabsList>
          <TabsContent value="dns" className="pt-3">
            <DnsWizard domain={domain} />
          </TabsContent>
          <TabsContent value="url" className="pt-3">
            <UrlPanel domain={domain} />
          </TabsContent>
          <TabsContent value="redirect" className="pt-3">
            <RedirectsPanel domain={domain} />
          </TabsContent>
          <TabsContent value="ssl" className="pt-3">
            <SslPanel domain={domain} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function UrlPanel({ domain }: { domain: DomainRow }) {
  const previewUrl = `https://${domain.host}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ReadonlyField label="Custom URL" value={previewUrl} />
      <ReadonlyField label="Preview URL" value={previewUrl} />
      <p className="col-span-full text-[11px] text-muted-foreground">
        Custom slugs for individual bio pages are managed inside each page's SEO settings.
      </p>
    </div>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1 rounded-md border px-2 py-1.5">
        <code className="min-w-0 flex-1 truncate text-xs">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

function RedirectsPanel({ domain }: { domain: DomainRow }) {
  const qc = useQueryClient();
  const [type, setType] = useState<RedirectType>(domain.redirect_type);
  const [to, setTo] = useState(domain.redirect_to ?? "");
  useEffect(() => {
    setType(domain.redirect_type);
    setTo(domain.redirect_to ?? "");
  }, [domain.redirect_type, domain.redirect_to]);

  const save = useMutation({
    mutationFn: () => setRedirect(domain.id, type, type === "none" ? null : to.trim() || null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domains", domain.workspace_id] });
      toast.success("Redirect saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <div className="space-y-1.5">
          <Label className="text-xs">Redirect type</Label>
          <Select value={type} onValueChange={(v) => setType(v as RedirectType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="301">301 Permanent</SelectItem>
              <SelectItem value="302">302 Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Redirect to</Label>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="https://example.com/target"
            disabled={type === "none"}
          />
        </div>
      </div>
      <div className="rounded-md border bg-muted/40 p-3 text-[11px] text-muted-foreground">
        <p className="font-medium text-foreground">Automatic redirects (applied to every custom domain):</p>
        <ul className="ml-4 mt-1 list-disc space-y-0.5">
          <li>HTTP → HTTPS (forced)</li>
          <li>www ↔ non-www (based on your primary domain)</li>
          <li>Trailing-slash normalization</li>
        </ul>
      </div>
      <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}Save redirect
      </Button>
    </div>
  );
}

function SslPanel({ domain }: { domain: DomainRow }) {
  const qc = useQueryClient();
  const provision = useMutation({
    mutationFn: async () => {
      await updateDomain(domain.id, { ssl_status: "provisioning" });
      qc.invalidateQueries({ queryKey: ["domains", domain.workspace_id] });
      await new Promise((r) => setTimeout(r, 1500));
      await updateDomain(domain.id, { ssl_status: "active" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["domains", domain.workspace_id] });
      toast.success("SSL certificate issued");
    },
  });
  const S = sslBadge[domain.ssl_status];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-md border p-3">
        <S.Icon className={`h-5 w-5 ${S.className} ${domain.ssl_status === "provisioning" ? "animate-spin" : ""}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{S.label}</p>
          <p className="text-[11px] text-muted-foreground">
            Certificates are issued via Let's Encrypt after DNS verification. Renewal is automatic every 60 days.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => provision.mutate()}
          disabled={provision.isPending || domain.status !== "verified"}
        >
          Re-issue
        </Button>
      </div>
      {domain.status !== "verified" && (
        <p className="text-[11px] text-amber-600">
          Verify the domain first — SSL provisioning requires a valid DNS setup.
        </p>
      )}
    </div>
  );
}
