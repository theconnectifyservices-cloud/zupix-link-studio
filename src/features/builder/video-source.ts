/**
 * Video source detection & embed URL builder for hero backgrounds and
 * any block that accepts a video URL. Supports direct MP4/WebM, Media
 * Library assets (signed Supabase URLs), YouTube, Vimeo, and Loom.
 */

export type VideoProvider =
  | "mp4"
  | "webm"
  | "youtube"
  | "vimeo"
  | "loom"
  | "asset"
  | "unknown";

export interface EmbedInfo {
  kind: "video" | "iframe";
  src: string;
  provider: VideoProvider;
}

export interface EmbedOptions {
  /** Autoplay muted-loop treatment (used for hero backgrounds). */
  background?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

const YT_RE = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{6,})/i;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/i;
const LOOM_RE = /loom\.com\/(?:share|embed)\/([a-z0-9]+)/i;

export function extractYouTubeId(url: string): string | null {
  const m = url.match(YT_RE);
  return m ? m[1] : null;
}
export function extractVimeoId(url: string): string | null {
  const m = url.match(VIMEO_RE);
  return m ? m[1] : null;
}
export function extractLoomId(url: string): string | null {
  const m = url.match(LOOM_RE);
  return m ? m[1] : null;
}

export function detectVideoProvider(url: string): VideoProvider {
  if (!url) return "unknown";
  const u = url.trim();
  if (YT_RE.test(u)) return "youtube";
  if (VIMEO_RE.test(u)) return "vimeo";
  if (LOOM_RE.test(u)) return "loom";
  // Signed Supabase storage URL from Media Library
  if (/\/storage\/v1\/object\/(sign|public)\//i.test(u)) return "asset";
  if (/\.mp4(\?|#|$)/i.test(u)) return "mp4";
  if (/\.webm(\?|#|$)/i.test(u)) return "webm";
  return "unknown";
}

export function providerLabel(p: VideoProvider): string {
  switch (p) {
    case "mp4": return "MP4";
    case "webm": return "WebM";
    case "youtube": return "YouTube";
    case "vimeo": return "Vimeo";
    case "loom": return "Loom";
    case "asset": return "Media Library";
    default: return "Unknown";
  }
}

export function buildEmbed(url: string, opts: EmbedOptions = {}): EmbedInfo | null {
  const p = detectVideoProvider(url);
  const {
    background = false,
    autoplay = background,
    muted = background,
    loop = background,
    controls = !background,
  } = opts;

  if (p === "mp4" || p === "webm" || p === "asset") {
    return { kind: "video", src: url, provider: p };
  }
  if (p === "youtube") {
    const id = extractYouTubeId(url);
    if (!id) return null;
    const q = new URLSearchParams();
    if (autoplay) q.set("autoplay", "1");
    if (muted) q.set("mute", "1");
    if (loop) {
      q.set("loop", "1");
      q.set("playlist", id);
    }
    if (!controls) q.set("controls", "0");
    q.set("modestbranding", "1");
    q.set("rel", "0");
    q.set("playsinline", "1");
    if (background) q.set("disablekb", "1");
    return {
      kind: "iframe",
      src: `https://www.youtube.com/embed/${id}?${q.toString()}`,
      provider: p,
    };
  }
  if (p === "vimeo") {
    const id = extractVimeoId(url);
    if (!id) return null;
    const q = new URLSearchParams();
    if (background) q.set("background", "1");
    if (autoplay) q.set("autoplay", "1");
    if (muted) q.set("muted", "1");
    if (loop) q.set("loop", "1");
    if (!controls) q.set("controls", "0");
    return {
      kind: "iframe",
      src: `https://player.vimeo.com/video/${id}?${q.toString()}`,
      provider: p,
    };
  }
  if (p === "loom") {
    const id = extractLoomId(url);
    if (!id) return null;
    const q = new URLSearchParams();
    if (autoplay) q.set("autoplay", "1");
    if (muted) q.set("muted", "1");
    if (background) {
      q.set("hide_owner", "true");
      q.set("hide_share", "true");
      q.set("hide_title", "true");
      q.set("hideEmbedTopBar", "true");
    }
    return {
      kind: "iframe",
      src: `https://www.loom.com/embed/${id}?${q.toString()}`,
      provider: p,
    };
  }
  return null;
}
