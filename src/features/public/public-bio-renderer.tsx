import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { ThemeBackgroundLayer } from "@/features/builder/components/theme-background-layer";
import { BlockRenderer } from "@/features/builder/block-renderer";
import { RendererModeProvider } from "@/features/builder/renderer-mode";
import { PublicPageProvider } from "@/features/business/page-context";
import {
  DEFAULT_MOTION,
  bgEffectClasses,
  ensureGoogleFont,
  normalizeTheme,
  pageTransitionClass,
  resolveMode,
  themeToCssVars,
} from "@/features/builder/theme";

import { collectFontFamilies } from "@/features/builder/fonts";
import type { BioContent } from "@/features/builder/types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { initTracker } from "@/features/analytics/tracker";
import { fetchPublicTracking, injectTracking, removeTracking } from "@/features/tracking";
import { BrandingLayer } from "@/features/growth";
import { ContactWidget } from "@/features/contact-widget";


type Viewport = "mobile" | "tablet" | "desktop";

/**
 * Renders a bio page for public visitors. Uses the same BlockRenderer
 * as the builder so what creators see in preview is what visitors get.
 * The viewport is derived from the browser width so responsive tokens
 * (padding, font scale, per-viewport visibility) apply live.
 */
export function PublicBioRenderer({
  content,
  pageId,
  slug,
  workspaceId,
  pageName,
  pageDescription,
}: {
  content: BioContent;
  pageId?: string;
  slug?: string;
  workspaceId?: string;
  pageName?: string;
  pageDescription?: string | null;
}) {
  const theme = useMemo(() => normalizeTheme(content.theme), [content.theme]);
  const motion = theme.motion ?? DEFAULT_MOTION;


  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 640px)");
  const viewport: Viewport = isDesktop ? "desktop" : isTablet ? "tablet" : "mobile";

  const resolvedMode = resolveMode(theme.mode);
  const themeStyle = useMemo(() => themeToCssVars(theme, viewport), [theme, viewport]);
  const bgCls = bgEffectClasses(theme).join(" ");
  const pageCls = pageTransitionClass(theme);
  const blocks = content.blocks ?? [];

  // Preload every font referenced by the saved theme (explicit googleFonts
  // list + whatever the typography stacks name) so the published page uses
  // exactly the same faces as the builder preview.
  useEffect(() => {
    const families = [
      ...(theme.googleFonts ?? []),
      theme.typography?.fontFamily,
      theme.typography?.headingFamily,
      theme.typography?.buttonFamily,
      // Per-element font overrides — only fonts actually used on the page.
      ...collectFontFamilies(content.blocks ?? []),
    ].filter(Boolean) as string[];
    for (const f of families) ensureGoogleFont(f);
  }, [theme.typography, theme.googleFonts, content.blocks]);


  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!pageId || !slug || !rootRef.current) return;
    const handle = initTracker(pageId, slug, rootRef.current);
    return () => handle.end();
  }, [pageId, slug]);

  // LS-11A: inject workspace-level tracking pixels & custom scripts
  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;
    fetchPublicTracking(workspaceId).then((settings) => {
      if (!cancelled) injectTracking(settings);
    });
    return () => {
      cancelled = true;
      removeTracking();
    };
  }, [workspaceId]);

  return (
    <div
      ref={rootRef}
      data-theme-mode={resolvedMode}
      className={cn(
        resolvedMode === "dark" && "dark",
        // `relative isolate` is required: the background image/overlay layers
        // paint at -z-10, so without a stacking context here they render
        // *behind* this element's own base colour/gradient and disappear.
        "relative isolate min-h-dvh w-full",
        `zx-vp-${viewport}`,
        bgCls,
      )}

      style={themeStyle}
    >
      <ThemeBackgroundLayer theme={theme} />
      <div
        className={cn("relative mx-auto flex flex-col", pageCls)}
        style={{
          paddingInline: "var(--zx-page-pad-x)",
          paddingBlock: "var(--zx-page-pad-y)",
          // Auto Layout: per-section spacing owns the gap.
          gap: 0,
          maxWidth: "var(--zx-content-max)",
        }}
      >
        {blocks.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </div>
        ) : (
          <RendererModeProvider mode="public">
            <PublicPageProvider
              value={pageId && slug ? { pageId, slug, workspaceId } : null}
            >
              {blocks.map((b, i) => (
                <BlockRenderer
                  key={b.id}
                  block={b}
                  index={i}
                  viewport={viewport}
                  staggerStep={motion.stagger ? (motion.staggerStep ?? 60) : 0}
                  reduceMotion={!!motion.reduce}
                />
              ))}
            </PublicPageProvider>
          </RendererModeProvider>
        )}
        <BrandingLayer
          workspaceId={workspaceId}
          pageName={pageName}
          pageDescription={pageDescription}
        />
      </div>
      <ContactWidget config={content.contactWidget} />
    </div>
  );
}

