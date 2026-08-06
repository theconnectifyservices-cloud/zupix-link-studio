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
  type ThemeBackground,
} from "../theme";
import { buildEmbed } from "../video-source";
import { AutoplayVideo } from "./autoplay-video";

export function ThemeBackgroundLayer({ theme }: { theme: PageTheme }) {
  const bg = theme.background ?? DEFAULT_BACKGROUND;

  // ── Helper: Build Background Style ────────────────────────────────
  const buildBaseStyle = (bg: ThemeBackground): CSSProperties => {
    const blur = bg.blur ?? 0;
    const brightness = bg.brightness ?? 1;
    const opacity = bg.imageOpacity ?? 1;
    const blend = bg.blendMode && bg.blendMode !== "normal" ? bg.blendMode : undefined;

    const style: CSSProperties = {
      opacity,
      filter: [
        blur ? `blur(${blur}px)` : "",
        brightness !== 1 ? `brightness(${brightness})` : "",
      ]
        .filter(Boolean)
        .join(" "),
      mixBlendMode: blend,
      transform: blur ? "scale(1.06)" : undefined, // prevent blurred edges from bleeding
      transformOrigin: "center",
      transition: "opacity 0.3s ease, filter 0.3s ease",
    };

    return style;
  };

  // ── Glass Branch ────────────────────────────────────────────────
  if (bg.kind === "glass") {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center overflow-hidden"
      >
        <div
          className={`h-full w-full ${bg.glassBorder ? "border-y border-white/20" : ""} ${bg.glassShadow ? "shadow-2xl" : ""}`}
          style={{
            backgroundColor: bg.glassTint || "rgba(255,255,255,0.05)",
            backdropFilter: [
              `blur(${bg.glassBlur ?? 20}px)`,
              `saturate(${bg.glassSaturation ?? 1.2})`,
            ].join(" "),
            WebkitBackdropFilter: [
              `blur(${bg.glassBlur ?? 20}px)`,
              `saturate(${bg.glassSaturation ?? 1.2})`,
            ].join(" "),
            opacity: bg.glassOpacity ?? 0.1,
          }}
        />
        {bg.glassBorderGlow && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        )}
      </div>
    );
  }

  // ── Video Branch ────────────────────────────────────────────────
  if (bg.kind === "video" && bg.videoUrl) {
    const embed = buildEmbed(bg.videoUrl, { background: true });
    if (!embed) return null;
    const overlayOp = bg.overlayOpacity ?? 0;
    return (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          style={buildBaseStyle(bg)}
        >
          {embed.kind === "video" ? (
            <AutoplayVideo
              src={embed.src}
              poster={bg.posterUrl}
              background
              className="h-full w-full object-cover"
            />
          ) : (
            <iframe
              src={embed.src}
              title="Background video"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
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

  // ── Gradient Branch (Overriding base bg if kind is gradient) ────────
  let gradientLayer: CSSProperties | null = null;
  if (bg.kind === "gradient" && bg.gradientStops?.length) {
    const stops = bg.gradientStops
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.color} ${s.position}%`)
      .join(", ");
    
    if (bg.gradientType === "radial") {
      gradientLayer = {
        background: `radial-gradient(circle at center, ${stops})`,
      };
    } else {
      gradientLayer = {
        background: `linear-gradient(${bg.gradientAngle ?? 180}deg, ${stops})`,
      };
    }
  }

  // ── Image Branch ────────────────────────────────────────────────
  let imageLayer: CSSProperties | null = null;
  if (bg.kind === "image" && bg.imageUrl) {
    imageLayer = {
      backgroundImage: `url("${bg.imageUrl}")`,
      backgroundSize: bg.size ?? "cover",
      backgroundPosition: bg.position ?? "center",
      backgroundRepeat: bg.repeat ? "repeat" : "no-repeat",
      backgroundAttachment: bg.fixed ? "fixed" : "scroll",
    };
  }

  // ── Pattern Branch ──────────────────────────────────────────────
  let patternLayer: CSSProperties | null = null;
  if (bg.kind === "pattern") {
    let url = backgroundPatternUrl(bg.patternId);
    
    if (bg.patternSvg) {
      const svg = bg.patternSvg.trim().startsWith("<svg") 
        ? bg.patternSvg 
        : `<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><path d='${bg.patternSvg}' fill='currentColor'/></svg>`;
      url = `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    }
    
    if (url) {
      patternLayer = {
        backgroundImage: url,
        backgroundRepeat: "repeat",
        backgroundSize: bg.patternSize ? `${bg.patternSize}px` : undefined,
        opacity: bg.patternOpacity ?? 0.1,
        color: bg.patternColor,
      };
    }
  }

  const baseStyle = buildBaseStyle(bg);
  const overlayOp = bg.overlayOpacity ?? 0;
  const hasOverlay = overlayOp > 0;

  return (
    <>
      {gradientLayer && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ ...gradientLayer, ...baseStyle }}
        />
      )}
      
      {imageLayer && (
        <div
          aria-hidden
          className={
            "pointer-events-none absolute inset-0 -z-10" +
            (bg.fixed ? " zx-bg-fixed" : "")
          }
          style={{ ...imageLayer, ...baseStyle }}
        />
      )}

      {patternLayer && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{ ...patternLayer, ...baseStyle }}
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
    </>
  );
}
