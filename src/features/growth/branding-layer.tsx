import { useEffect, useState } from "react";
import { fetchGrowthSettings, fetchWorkspaceBranding, subscribeBrandingChanges } from "./api";
import { DEFAULT_GROWTH_SETTINGS, type BrandingMode, type GrowthEngineSettings } from "./types";
import { detectIndustry, type Industry } from "./industry";
import { FloatingBadge } from "./components/floating-badge";
import { FooterCta } from "./components/footer-cta";
import { trackGrowthEvent } from "./track";

interface Props {
  workspaceId?: string;
  pageName?: string;
  pageDescription?: string | null;
}

/**
 * Orchestrates ZUPIX branding for a public bio page.
 *
 * UDAAN (free) is always "full" and cannot be changed. Paid plans resolve to
 * the workspace override, falling back to the admin default for that plan.
 * A realtime broadcast keeps open pages in sync without a refresh.
 */
export function BrandingLayer({ workspaceId, pageName, pageDescription }: Props) {
  const [settings, setSettings] = useState<GrowthEngineSettings>(DEFAULT_GROWTH_SETTINGS);
  const [mode, setMode] = useState<BrandingMode | null>(null);
  const [plan, setPlan] = useState<string>("udaan");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, branding] = await Promise.all([
        fetchGrowthSettings(),
        workspaceId
          ? fetchWorkspaceBranding(workspaceId)
          : Promise.resolve({ plan: "udaan", mode: "full" as BrandingMode, locked: true }),
      ]);
      if (cancelled) return;
      setSettings(s);
      setMode(branding.mode);
      setPlan(branding.plan);
      if (branding.mode !== "hidden") {
        trackGrowthEvent("branding_view", { plan: branding.plan, mode: branding.mode, workspaceId });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // Live updates when the owner changes their branding setting.
  useEffect(() => {
    if (!workspaceId) return;
    return subscribeBrandingChanges(workspaceId, (next) => setMode(next));
  }, [workspaceId]);

  if (!mode || mode === "hidden") return null;

  const industry: Industry = detectIndustry(`${pageName ?? ""} ${pageDescription ?? ""}`);
  const showFull = mode === "full";

  return (
    <>
      {showFull && (settings.footer_cta_enabled || settings.referral_cta_enabled) && (
        <FooterCta settings={settings} industry={industry} />
      )}
      {(showFull ? settings.floating_badge_enabled : true) && (
        <FloatingBadge settings={settings} compact={!showFull} plan={plan} />
      )}
    </>
  );
}
