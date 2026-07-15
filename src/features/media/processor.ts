/**
 * Client-side media processing engine.
 *
 * Runs in the browser after the original upload completes:
 *  - Validates images (dimensions, corruption)
 *  - Generates responsive variants (thumb / small / medium / large)
 *  - Encodes next-gen format (WebP now; AVIF architecture-ready)
 *  - Extracts a poster frame for videos
 *
 * Processing is fire-and-forget from the caller's perspective so uploads
 * feel instant. Failures degrade gracefully — the original is always usable.
 */
import { supabase } from "@/integrations/supabase/client";
import { BUCKET } from "./api";
import type { MediaVariant, ProcessingReport } from "./types";

export const VARIANT_WIDTHS = {
  thumb: 240,
  small: 480,
  medium: 960,
  large: 1600,
} as const;

export const NEXTGEN_FORMAT: "webp" = "webp"; // AVIF-ready: swap here once codec is wired
const NEXTGEN_MIME = "image/webp";
const NEXTGEN_QUALITY = 0.82;

/** MIME types that skip raster processing (already vector or animated). */
const SKIP_RASTER = new Set(["image/svg+xml", "image/gif"]);

/** Decode a File into an HTMLImageElement. Returns null if the file is corrupt. */
async function decodeImage(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Encode a canvas to a Blob with a graceful fallback. */
function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

interface VariantSpec {
  role: MediaVariant["role"];
  width: number;
}

async function renderVariant(
  img: HTMLImageElement,
  spec: VariantSpec,
): Promise<{ blob: Blob; width: number; height: number } | null> {
  const scale = Math.min(1, spec.width / img.naturalWidth);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await canvasToBlob(canvas, NEXTGEN_MIME, NEXTGEN_QUALITY);
  if (!blob) return null;
  return { blob, width: w, height: h };
}

/** Upload a processed variant to storage under the asset's variants prefix. */
async function uploadVariant(
  baseDir: string,
  role: MediaVariant["role"],
  format: MediaVariant["format"],
  blob: Blob,
): Promise<string> {
  const path = `${baseDir}/variants/${role}.${format}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || NEXTGEN_MIME,
    upsert: true,
  });
  if (error) throw error;
  return path;
}

/**
 * Process an image asset — generates responsive WebP variants.
 * Skips SVG / GIF and any image whose native width is already below `thumb`.
 */
export async function processImageAsset(input: {
  assetId: string;
  file: File;
  storageDir: string;
}): Promise<ProcessingReport> {
  if (SKIP_RASTER.has(input.file.type)) {
    return { status: "skipped", variants: [], optimizedBytes: 0, reason: "vector-or-animated" };
  }
  const img = await decodeImage(input.file);
  if (!img) return { status: "failed", variants: [], optimizedBytes: 0, reason: "decode-failed" };

  const specs: VariantSpec[] = [
    { role: "thumb", width: VARIANT_WIDTHS.thumb },
    { role: "small", width: VARIANT_WIDTHS.small },
    { role: "medium", width: VARIANT_WIDTHS.medium },
    { role: "large", width: VARIANT_WIDTHS.large },
  ].filter((s) => s.width <= img.naturalWidth || s.role === "thumb");

  const variants: MediaVariant[] = [];
  let optimizedBytes = 0;
  for (const spec of specs) {
    try {
      const rendered = await renderVariant(img, spec);
      if (!rendered) continue;
      const path = await uploadVariant(input.storageDir, spec.role, NEXTGEN_FORMAT, rendered.blob);
      variants.push({
        role: spec.role,
        format: NEXTGEN_FORMAT,
        width: rendered.width,
        height: rendered.height,
        size: rendered.blob.size,
        path,
      });
      optimizedBytes += rendered.blob.size;
    } catch {
      /* per-variant failure is non-fatal */
    }
  }

  return {
    status: variants.length ? "completed" : "failed",
    variants,
    optimizedBytes,
    reason: variants.length ? undefined : "no-variants-produced",
  };
}

/**
 * Extract a still frame from a video file to serve as a poster / thumbnail.
 */
export async function processVideoAsset(input: {
  file: File;
  storageDir: string;
}): Promise<{ posterPath: string; variant: MediaVariant } | null> {
  const url = URL.createObjectURL(input.file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("video-decode-failed"));
    });
    // Seek 1s in (or 10% if the video is shorter) to skip black frames
    const target = Math.min(video.duration || 1, Math.max(0.1, (video.duration || 1) * 0.1));
    await new Promise<void>((resolve, reject) => {
      video.onseeked = () => resolve();
      video.onerror = () => reject(new Error("video-seek-failed"));
      video.currentTime = target;
    });
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    const blob = await canvasToBlob(canvas, "image/jpeg", 0.85);
    if (!blob) return null;
    const path = await uploadVariant(input.storageDir, "poster", "jpeg", blob);
    return {
      posterPath: path,
      variant: { role: "poster", format: "jpeg", width: w, height: h, size: blob.size, path },
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Persist processing results back to the media_assets row.
 * Also refreshes usage_count-independent optimization fields.
 */
export async function saveProcessingReport(
  assetId: string,
  report: ProcessingReport,
  extra?: { videoThumbnailPath?: string | null },
): Promise<void> {
  await supabase
    .from("media_assets")
    .update({
      processing_status: report.status,
      processing_error: report.reason ?? null,
      variants: report.variants as unknown as never,
      optimized_size_bytes: report.optimizedBytes,
      processed_at: new Date().toISOString(),
      video_thumbnail_path: extra?.videoThumbnailPath ?? null,
    })
    .eq("id", assetId);
}

/** Full-file corruption/validation gate — used by the uploader before touching storage. */
export async function validateBeforeUpload(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!file.size) return { ok: false, error: "Empty file" };
  if (file.type.startsWith("image/") && !SKIP_RASTER.has(file.type)) {
    const img = await decodeImage(file);
    if (!img) return { ok: false, error: "Image appears to be corrupted" };
    if (img.naturalWidth * img.naturalHeight > 40_000_000) {
      return { ok: false, error: "Image exceeds 40 megapixels" };
    }
  }
  return { ok: true };
}
