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
import { AutoplayVideo } from "./autoplay-video";

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
            <AutoplayVideo
              src={embed.src}
              poster={bg.posterUrl}
              background
              className="h-full w-full"
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

  // ── Image / pattern branches ─────────────────────────────────────
  const blur = bg.blur ?? 0;
  const overlayOp = bg.overlayOpacity ?? 0;
  const blend = bg.blendMode && bg.blendMode !== "normal" ? bg.blendMode : undefined;

  let imageStyle: CSSProperties | null = null;
  let imageOpacity = 1;
  let fixedAttachment = false;
  if (bg.kind === "image" && bg.imageUrl) {
    imageOpacity = typeof bg.imageOpacity === "number" ? bg.imageOpacity : 1;
    fixedAttachment = !!bg.fixed;
    imageStyle = {
      backgroundImage: `url("${bg.imageUrl}")`,
      backgroundSize: bg.size ?? "cover",
      backgroundPosition: bg.position ?? "center",
      backgroundRepeat: bg.repeat ? "repeat" : "no-repeat",
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

  if (!hasImageLayer && !hasOverlay) return null;

  return (
    <>
      {hasImageLayer && (
        <div
          aria-hidden
          className={
            "pointer-events-none absolute inset-0 -z-10 overflow-hidden" +
            (fixedAttachment ? " zx-bg-fixed" : "")
          }
          style={{
            ...imageStyle!,
            opacity: imageOpacity,
            filter: blur ? `blur(${blur}px)` : undefined,
            mixBlendMode: blend,
            transform: blur ? "scale(1.06)" : undefined,
            transformOrigin: "center",
          }}
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

