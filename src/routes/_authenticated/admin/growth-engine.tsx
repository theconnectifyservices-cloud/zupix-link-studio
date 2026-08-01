import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Sparkles, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BRANDING_MODES,
  DEFAULT_GROWTH_SETTINGS,
  DEFAULT_PLAN_BRANDING,
  PAID_PLAN_CODES,
  PLAN_LABELS,
  fetchGrowthSettings,
  updateGrowthSettings,
  type BrandingMode,
  type GrowthEngineSettings,
} from "@/features/growth";


export const Route = createFileRoute("/_authenticated/admin/growth-engine")({
  head: () => ({
    meta: [
      { title: "Growth Engine · ZUPIX Admin" },
      { name: "description", content: "Configure free-plan branding, viral CTAs and referral copy." },
    ],
  }),
  component: GrowthEngineAdmin,
});

const TOGGLES: Array<{ key: keyof GrowthEngineSettings; label: string; hint: string }> = [
  { key: "floating_badge_enabled", label: "Floating Badge", hint: "Sticky glass badge bottom-right of every Free bio page" },
  { key: "footer_cta_enabled", label: "Footer CTA", hint: "Inline conversion card at the end of the page" },
  { key: "dynamic_industry_cta_enabled", label: "Dynamic Industry CTA", hint: "Swap footer copy based on detected industry" },
  { key: "referral_cta_enabled", label: "Referral CTA", hint: "‘Love this Bio Link?’ — Start Building nudge" },
  { key: "upgrade_card_enabled", label: "Upgrade Card", hint: "Dashboard upsell card visible to Starter workspaces" },
  { key: "qr_branding_enabled", label: "QR Branding", hint: "‘Built with ZUPIX’ caption under Free-plan QR codes" },
  { key: "og_branding_enabled", label: "Open Graph Branding", hint: "Small ‘Built with ZUPIX’ badge on shared link previews" },
];

function GrowthEngineAdmin() {
  const [s, setS] = useState<GrowthEngineSettings>(DEFAULT_GROWTH_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchGrowthSettings().then((v) => {
      setS(v);
      setLoading(false);
    });
  }, []);

  function bind<K extends keyof GrowthEngineSettings>(key: K) {
    return {
      value: s[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setS((prev) => ({ ...prev, [key]: e.target.value })),
    };
  }

  async function save() {
    setSaving(true);
    try {
      await updateGrowthSettings(s);
      toast.success("Growth engine updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container mx-auto max-w-4xl p-8 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-purple-600 text-white shadow">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold">Growth Engine Settings</h1>
            <p className="text-sm text-muted-foreground">
              Control every Free-plan branding surface. Premium, Business & Enterprise pages stay fully white-labeled.
            </p>
          </div>
        </div>
        <Button onClick={save} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Surfaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0 pr-4">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-[12px] text-muted-foreground">{t.hint}</div>
              </div>
              <Switch
                checked={Boolean(s[t.key])}
                onCheckedChange={(v) => setS((prev) => ({ ...prev, [t.key]: v }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Floating Badge Copy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Primary text</Label>
            <Input {...bind("badge_text")} />
          </div>
          <div className="space-y-1.5">
            <Label>Secondary text</Label>
            <Input {...bind("badge_subtext")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Footer CTA Copy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Headline</Label>
            <Input {...bind("footer_headline")} />
          </div>
          <div className="space-y-1.5">
            <Label>Subtext (fallback when industry CTA is off)</Label>
            <Textarea {...bind("footer_subtext")} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Button label</Label>
            <Input {...bind("footer_cta_label")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referral CTA Copy</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Headline</Label>
            <Input {...bind("referral_headline")} />
          </div>
          <div className="space-y-1.5">
            <Label>Subtext</Label>
            <Input {...bind("referral_subtext")} />
          </div>
          <div className="space-y-1.5">
            <Label>Button label</Label>
            <Input {...bind("referral_cta_label")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand & Redirect</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Accent color</Label>
            <div className="flex items-center gap-2">
              <Input type="color" className="h-10 w-14 p-1" {...bind("accent_color")} />
              <Input {...bind("accent_color")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Signup redirect URL</Label>
            <Input {...bind("redirect_url")} placeholder="/signup" />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-1.5">
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
