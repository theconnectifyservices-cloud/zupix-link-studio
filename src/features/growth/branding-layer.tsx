import { useEffect, useState } from "react";
import { fetchGrowthSettings, fetchWorkspacePlanCode } from "./api";
import { DEFAULT_GROWTH_SETTINGS, isBrandedPlan, type GrowthEngineSettings } from "./types";
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
 * Orchestrates Free-plan branding for a public bio page.
 * Fetches active plan + admin-controlled settings, then renders the
 * floating badge and inline footer/referral CTAs. Renders NOTHING for
 * paid plans (fully white-labeled).
 */
export function BrandingLayer({ workspaceId, pageName, pageDescription }: Props) {
  const [settings, setSettings] = useState<GrowthEngineSettings>(DEFAULT_GROWTH_SETTINGS);
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, plan] = await Promise.all([
        fetchGrowthSettings(),
        workspaceId ? fetchWorkspacePlanCode(workspaceId) : Promise.resolve("udaan"),
      ]);
      if (cancelled) return;
      setSettings(s);
      setPlanCode(plan);
      setLoaded(true);
      if (isBrandedPlan(plan)) {
        trackGrowthEvent("branding_view", { plan, workspaceId });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  if (!loaded || !isBrandedPlan(planCode)) return null;

  const industry: Industry = detectIndustry(`${pageName ?? ""} ${pageDescription ?? ""}`);

  return (
    <>
      {(settings.footer_cta_enabled || settings.referral_cta_enabled) && (
        <FooterCta settings={settings} industry={industry} />
      )}
      {settings.floating_badge_enabled && <FloatingBadge settings={settings} />}
    </>
  );
}
