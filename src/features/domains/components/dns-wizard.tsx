import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "./subdomain-card";
import { updateDomain } from "../api";
import { verifyDomain } from "../verify";
import { ZUPIX_A_RECORD, ZUPIX_CNAME_TARGET, type DomainRow } from "../types";

/**
 * DNS setup + verification wizard. Shows required records and
 * lets the user recheck against Cloudflare DoH.
 */
export function DnsWizard({ domain }: { domain: DomainRow }) {
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyDomain>> | null>(null);

  const verify = useMutation({
    mutationFn: async () => {
      setChecking(true);
      const r = await verifyDomain(domain.host, domain.verification_token);
      const nextStatus = r.verified ? "verified" : "failed";
      await updateDomain(domain.id, {
        status: nextStatus,
        last_checked_at: new Date().toISOString(),
        ssl_status: r.verified ? "provisioning" : domain.ssl_status,
      });
      // Simulate SSL becoming active shortly after verification
      if (r.verified) {
        setTimeout(async () => {
          await updateDomain(domain.id, { ssl_status: "active" });
          qc.invalidateQueries({ queryKey: ["domains", domain.workspace_id] });
        }, 1200);
      }
      return r;
    },
    onSuccess: (r) => {
      setResult(r);
      qc.invalidateQueries({ queryKey: ["domains", domain.workspace_id] });
      toast[r.verified ? "success" : "error"](
        r.verified ? "Domain verified" : "Verification failed — check DNS records",
      );
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setChecking(false),
  });

  const rows: Array<{ type: string; name: string; value: string; ok?: boolean }> = [
    {
      type: "A",
      name: "@",
      value: ZUPIX_A_RECORD,
      ok: result?.aRecordOk,
    },
    {
      type: "TXT",
      name: "_zupix",
      value: `zupix-verify=${domain.verification_token}`,
      ok: result?.txtRecordOk,
    },
    {
      type: "CNAME",
      name: "www",
      value: ZUPIX_CNAME_TARGET,
    },
    {
      type: "AAAA",
      name: "@",
      value: "2606:4700::6810:8501",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Type</TableHead>
              <TableHead className="w-20">Name</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="w-24 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.type}-${r.name}`}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {r.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">{r.name}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-between gap-2">
                    <code className="truncate text-xs">{r.value}</code>
                    <CopyButton value={r.value} />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {r.ok === true && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />}
                  {r.ok === false && <XCircle className="ml-auto h-4 w-4 text-destructive" />}
                  {r.ok === undefined && <span className="text-[10px] text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ol className="ml-4 list-decimal space-y-1 text-xs text-muted-foreground">
        <li>Log in to your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.).</li>
        <li>Create the A and TXT records shown above for {domain.host}.</li>
        <li>Wait 1–10 minutes for DNS to propagate.</li>
        <li>Click "Verify now" — SSL provisions automatically after verification.</li>
      </ol>
      <div className="flex items-center justify-between">
        <Button size="sm" onClick={() => verify.mutate()} disabled={checking}>
          {checking && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Verify now
        </Button>
        {domain.last_checked_at && (
          <span className="text-[11px] text-muted-foreground">
            Last checked {new Date(domain.last_checked_at).toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
}
