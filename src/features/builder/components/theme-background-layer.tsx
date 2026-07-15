/**
 * ThemeBackgroundLayer — renders a video background for the page theme
 * when `theme.background.kind === "video"`. Image / pattern / gradient
 * backgrounds continue to be applied via inline `backgroundImage` styles
 * (see `themeToCssVars`), so this layer only handles the video case.
 *
 * Absolutely positioned behind page content; supports MP4/WebM, Media
 * Library assets, and YouTube / Vimeo / Loom embeds via `buildEmbed`.
 */
import { DEFAULT_BACKGROUND, type PageTheme } from "../theme";
import { buildEmbed } from "../video-source";

export function ThemeBackgroundLayer({ theme }: { theme: PageTheme }) {
  const bg = theme.background ?? DEFAULT_BACKGROUND;
  if (bg.kind !== "video" || !bg.videoUrl) return null;
  const embed = buildEmbed(bg.videoUrl, { background: true });
  if (!embed) return null;

  const overlay =
    (bg.overlayOpacity ?? 0) > 0
      ? { backgroundColor: bg.overlay ?? "#000000", opacity: bg.overlayOpacity }
      : null;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{
          filter: bg.blur ? `blur(${bg.blur}px)` : undefined,
        }}
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
      {overlay && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={overlay}
        />
      )}
    </>
  );
}
