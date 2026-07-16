/**
 * ThemeBackgroundLayer — universal background effects renderer.
 *
 * Paints the theme background stack behind page content so effects (blur,
 * overlay, blend mode, noise, animated / mesh gradients, video) apply
 * without touching page content. Consumed by the builder preview and the
 * public bio renderer; the shared `themeToCssVars` only paints the base
 * colour/gradient on the outer container.
 */
import type { CSSProperties } from "react";
import {
  DEFAULT_BACKGROUND,
  backgroundPatternUrl,
  type PageTheme,
} from "../theme";
import { buildEmbed } from "../video-source";

export function ThemeBackgroundLayer({ theme }: { theme: PageTheme }) {
  const bg = theme.background ?? DEFAULT_BACKGROUND;

  // ── Video branch ─────────────────────────────────────────────────
  if (bg.kind === "video" && bg.videoUrl) {
    const embed = buildEmbed(bg.videoUrl, { background: true });
    if (!embed) return null;
    const overlayOp = bg.overlayOpacity ?? 0;
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          style={{ filter: bg.blur ? `blur(${bg.blur}px)` : undefined }}
        >
          {embed.kind === "video" ? (
            <video
              src={embed.src}
              poster={bg.posterUrl}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <iframe
              src={embed.src}
              title="Background video"
              allow="autoplay; encrypted-media; picture-in-picture"
              className="h-full w-full scale-[1.35] border-0"
            />
          )}
        </div>
        {overlayOp > 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{ backgroundColor: bg.overlay ?? "#000000", opacity: overlayOp }}
          />
        )}
      </>
    );
  }

  // ── Image / pattern branches ─────────────────────────────────────
  const blur = bg.blur ?? 0;
  const overlayOp = bg.overlayOpacity ?? 0;
  const blend = bg.blendMode && bg.blendMode !== "normal" ? bg.blendMode : undefined;

  let imageStyle: CSSProperties | null = null;
  if (bg.kind === "image" && bg.imageUrl) {
    imageStyle = {
      backgroundImage: `url("${bg.imageUrl}")`,
      backgroundSize: bg.size ?? "cover",
      backgroundPosition: bg.position ?? "center",
      backgroundRepeat: "no-repeat",
    };
  } else if (bg.kind === "pattern") {
    const url = backgroundPatternUrl(bg.patternId);
    if (url) {
      imageStyle = {
        backgroundImage: url,
        backgroundRepeat: "repeat",
      };
    }
  }

  const hasImageLayer = !!imageStyle;
  const hasOverlay = overlayOp > 0;
  const hasNoise = !!bg.noise;
  const hasMesh = !!bg.meshGradient;
  const hasAnimatedGradient =
    !!bg.animatedGradient && (bg.kind === "color" || bg.kind === "gradient");

  if (!hasImageLayer && !hasOverlay && !hasNoise && !hasMesh && !hasAnimatedGradient) {
    return null;
  }

  return (
    <>
      {hasImageLayer && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          style={{
            ...imageStyle!,
            filter: blur ? `blur(${blur}px)` : undefined,
            mixBlendMode: blend,
            // Slightly expand to hide blur edges
            transform: blur ? "scale(1.06)" : undefined,
            transformOrigin: "center",
          }}
        />
      )}
      {hasAnimatedGradient && (
        <div
          aria-hidden
          className="zx-bg-animated-gradient pointer-events-none absolute inset-0 -z-10"
          style={{
            background: theme.colors.background,
            filter: blur ? `blur(${blur}px)` : undefined,
            mixBlendMode: blend,
          }}
        />
      )}
      {hasMesh && (
        <div
          aria-hidden
          className="zx-bg-mesh pointer-events-none absolute inset-0 -z-10"
        />
      )}
      {hasOverlay && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            backgroundColor: bg.overlay ?? "#000000",
            opacity: overlayOp,
          }}
        />
      )}
      {hasNoise && (
        <div
          aria-hidden
          className="zx-bg-noise-layer pointer-events-none absolute inset-0 -z-10"
          style={{ opacity: bg.noiseOpacity ?? 0.08 }}
        />
      )}
    </>
  );
}
