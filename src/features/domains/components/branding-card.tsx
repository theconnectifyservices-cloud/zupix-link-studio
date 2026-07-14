import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWorkspaceBranding, updateWorkspaceBranding } from "../api";

export function BrandingCard({ workspaceId }: { workspaceId: string }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["ws-branding", workspaceId],
    queryFn: () => fetchWorkspaceBranding(workspaceId),
  });

  const [form, setForm] = useState({
    brand_name: "",
    logo_url: "",
    favicon_url: "",
    social_image_url: "",
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      brand_name: data.brand_name ?? "",
      logo_url: data.logo_url ?? "",
      favicon_url: data.favicon_url ?? "",
      social_image_url: data.social_image_url ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      updateWorkspaceBranding(workspaceId, {
        brand_name: form.brand_name.trim() || null,
        logo_url: form.logo_url.trim() || null,
        favicon_url: form.favicon_url.trim() || null,
        social_image_url: form.social_image_url.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ws-branding", workspaceId] });
      toast.success("Branding updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Workspace branding</CardTitle>
        </div>
        <CardDescription>
          Applied as fallbacks to every bio page: site name, favicon, and default social share image.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Site / Brand name" hint="Shown in browser tab & social cards">
          <Input
            value={form.brand_name}
            onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
            placeholder="Acme Studio"
            disabled={isLoading}
          />
        </Field>
        <Field label="Brand logo URL" hint="Used across your workspace">
          <Input
            value={form.logo_url}
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
            placeholder="https://…/logo.svg"
            disabled={isLoading}
          />
        </Field>
        <Field label="Favicon URL" hint="Square image, 32×32 or larger">
          <Input
            value={form.favicon_url}
            onChange={(e) => setForm({ ...form, favicon_url: e.target.value })}
            placeholder="https://…/favicon.png"
            disabled={isLoading}
          />
        </Field>
        <Field label="Default social share image" hint="1200×630 recommended (OG image)">
          <Input
            value={form.social_image_url}
            onChange={(e) => setForm({ ...form, social_image_url: e.target.value })}
            placeholder="https://…/og.jpg"
            disabled={isLoading}
          />
        </Field>
        <div className="md:col-span-2">
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
            {save.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Save branding
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
