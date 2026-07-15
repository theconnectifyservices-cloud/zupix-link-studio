import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { BlockRenderer } from "@/features/builder/block-renderer";
import {
  DEFAULT_MOTION,
  DEFAULT_THEME,
  bgEffectClasses,
  ensureGoogleFont,
  pageTransitionClass,
  resolveMode,
  themeToCssVars,
} from "@/features/builder/theme";
import type { BioContent } from "@/features/builder/types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { initTracker } from "@/features/analytics/tracker";

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
}: {
  content: BioContent;
  pageId?: string;
  slug?: string;
}) {
  const theme = content.theme ?? DEFAULT_THEME;
  const motion = theme.motion ?? DEFAULT_MOTION;

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 640px)");
  const viewport: Viewport = isDesktop ? "desktop" : isTablet ? "tablet" : "mobile";

  const resolvedMode = resolveMode(theme.mode);
  const themeStyle = useMemo(() => themeToCssVars(theme, viewport), [theme, viewport]);
  const bgCls = bgEffectClasses(theme).join(" ");
  const pageCls = pageTransitionClass(theme);
  const blocks = content.blocks ?? [];

  // Preload custom fonts so text renders without FOUT
  useEffect(() => {
    const families = [
      theme.typography?.fontFamily,
      theme.typography?.headingFamily,
      theme.typography?.buttonFamily,
    ].filter(Boolean) as string[];
    for (const f of families) ensureGoogleFont(f);
  }, [theme.typography]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!pageId || !slug || !rootRef.current) return;
    const handle = initTracker(pageId, slug, rootRef.current);
    return () => handle.end();
  }, [pageId, slug]);

  return (
    <div
      ref={rootRef}
      data-theme-mode={resolvedMode}
      className={cn(
        resolvedMode === "dark" && "dark",
        "min-h-dvh w-full",
        `zx-vp-${viewport}`,
        bgCls,
      )}
      style={themeStyle}
    >
        `zx-vp-${viewport}`,
        bgCls,
      )}
      style={themeStyle}
    >
      <div
        className={cn("relative mx-auto flex flex-col", pageCls)}
        style={{
          paddingInline: "var(--zx-page-pad-x)",
          paddingBlock: "var(--zx-page-pad-y)",
          gap: "var(--zx-block-gap)",
          maxWidth: "var(--zx-content-max)",
        }}
      >
        {blocks.length === 0 ? (
          <div className="py-24 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </div>
        ) : (
          blocks.map((b, i) => (
            <BlockRenderer
              key={b.id}
              block={b}
              index={i}
              viewport={viewport}
              staggerStep={motion.stagger ? (motion.staggerStep ?? 60) : 0}
              reduceMotion={!!motion.reduce}
            />
          ))
        )}
      </div>
    </div>
  );
}
