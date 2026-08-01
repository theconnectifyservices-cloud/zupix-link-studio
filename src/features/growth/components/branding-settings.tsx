import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { fetchWorkspaceBranding, updateWorkspaceBranding } from "../api";
import { BRANDING_MODES, PLAN_LABELS, type BrandingMode } from "../types";

/**
 * Workspace branding preference.
 * UDAAN (free) is locked to full branding; paid plans pick hidden / compact / full.
 */
export function BrandingSettings() {
  const { workspace } = useCurrentWorkspace();
  const workspaceId = workspace?.id;
  const [mode, setMode] = useState<BrandingMode>("full");
  const [locked, setLocked] = useState(true);
  const [plan, setPlan] = useState("udaan");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    setLoading(true);
    fetchWorkspaceBranding(workspaceId).then((b) => {
      if (cancelled) return;
      setMode(b.mode);
      setLocked(b.locked);
      setPlan(b.plan);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  async function save(next: BrandingMode) {
    if (!workspaceId || locked) return;
    const prev = mode;
    setMode(next);
    setSaving(true);
    try {
      await updateWorkspaceBranding(workspaceId, next);
      toast.success("Branding updated — your public pages update instantly.");
    } catch (e) {
      setMode(prev);
      toast.error(e instanceof Error ? e.message : "Failed to save branding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Branding
            </CardTitle>
            <CardDescription>
              Control how “Built with ZUPIX” appears on your public bio pages.
            </CardDescription>
          </div>
          <Badge variant="secondary">{PLAN_LABELS[plan] ?? plan.toUpperCase()}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : locked ? (
          <div className="flex items-start gap-3 rounded-lg border border-dashed p-4">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium">ZUPIX branding is always on for your plan</p>
              <p className="text-sm text-muted-foreground">
                Upgrade to TEJAS or higher to hide branding or switch to a compact badge.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="pr-4">
                <div className="text-sm font-medium">Show “Built with ZUPIX”</div>
                <div className="text-[12px] text-muted-foreground">
                  Turn off for a fully white-labeled page.
                </div>
              </div>
              <Switch
                checked={mode !== "hidden"}
                disabled={saving}
                onCheckedChange={(v) => save(v ? "compact" : "hidden")}
              />
            </div>

            <RadioGroup
              value={mode}
              onValueChange={(v) => save(v as BrandingMode)}
              className="grid gap-3"
              aria-label="Branding mode"
            >
              {BRANDING_MODES.map((m) => (
                <Label
                  key={m.value}
                  htmlFor={`branding-${m.value}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem
                    id={`branding-${m.value}`}
                    value={m.value}
                    className="mt-0.5"
                    disabled={saving}
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">{m.label}</span>
                    <span className="block text-[12px] text-muted-foreground">{m.hint}</span>
                  </span>
                </Label>
              ))}
            </RadioGroup>
            <p className="text-[12px] text-muted-foreground">
              Changes apply to every published page in this workspace, instantly.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default BrandingSettings;

/** Kept for callers that want an explicit save button surface. */
export function BrandingSettingsFooter() {
  return <Button variant="ghost" className="hidden" aria-hidden />;
}
