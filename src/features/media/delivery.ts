/**
 * Delivery engine — picks the best variant for a target width and
 * builds signed srcset/sizes attributes for responsive <picture> tags.
 *
 * All storage reads go through short-lived signed URLs (CDN-friendly:
 * long client-side cache TTL, cheap to invalidate by regenerating the
 * asset row).
 */
import { supabase } from "@/integrations/supabase/client";
import { BUCKET } from "./api";
import type { MediaAsset, MediaVariant } from "./types";

const SIGNED_TTL_SECONDS = 60 * 60; // 1h — long enough for edge caching, short enough to rotate
const cache = new Map<string, { url: string; expires: number }>();

async function signPath(path: string): Promise<string> {
  const key = path;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now() + 60_000) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL_SECONDS);
  if (error || !data) throw error ?? new Error("sign-failed");
  cache.set(key, { url: data.signedUrl, expires: Date.now() + SIGNED_TTL_SECONDS * 1000 });
  return data.signedUrl;
}

/** Return only the image-format raster variants, sorted ascending by width. */
export function imageVariants(asset: MediaAsset): MediaVariant[] {
  return (asset.variants ?? [])
    .filter((v) => v.role !== "poster")
    .slice()
    .sort((a, b) => a.width - b.width);
}

/**
 * Choose the smallest variant whose width is >= `targetWidth`, honoring
 * device pixel ratio. Falls back to the largest generated variant, then to
 * the original asset path.
 */
export function pickVariant(asset: MediaAsset, targetWidth: number, dpr = 1): MediaVariant | null {
  const needed = targetWidth * dpr;
  const variants = imageVariants(asset);
  if (!variants.length) return null;
  return variants.find((v) => v.width >= needed) ?? variants[variants.length - 1];
}

/** Build a signed src for a specific target width. */
export async function signedVariantUrl(
  asset: MediaAsset,
  targetWidth = 960,
  dpr = 1,
): Promise<string> {
  const v = pickVariant(asset, targetWidth, dpr);
  return signPath(v?.path ?? asset.path);
}

/** Poster / video-thumbnail lookup (falls back to variants array). */
export function videoPosterVariant(asset: MediaAsset): MediaVariant | null {
  return (asset.variants ?? []).find((v) => v.role === "poster") ?? null;
}

export async function signedPosterUrl(asset: MediaAsset): Promise<string | null> {
  if (asset.video_thumbnail_path) return signPath(asset.video_thumbnail_path);
  const poster = videoPosterVariant(asset);
  return poster ? signPath(poster.path) : null;
}

/**
 * Build a signed srcset descriptor. Returns `{ srcset, sizes, type, src }`
 * that can be dropped into a <source> or <img> element.
 */
export async function buildSrcSet(
  asset: MediaAsset,
  sizes = "100vw",
): Promise<{ srcset: string; sizes: string; type: string; src: string } | null> {
  const variants = imageVariants(asset);
  if (!variants.length) return null;
  const parts = await Promise.all(
    variants.map(async (v) => `${await signPath(v.path)} ${v.width}w`),
  );
  const largest = variants[variants.length - 1];
  return {
    srcset: parts.join(", "),
    sizes,
    type: `image/${largest.format}`,
    src: await signPath(largest.path),
  };
}

/** Compression ratio (0..1). 0.4 means "60% smaller". */
export function compressionRatio(asset: MediaAsset): number | null {
  const orig = asset.original_size_bytes ?? asset.size_bytes ?? 0;
  const opt = asset.optimized_size_bytes ?? 0;
  if (!orig || !opt) return null;
  return opt / orig;
}

/** Sum of bytes saved across a list of assets. */
export function totalBytesSaved(assets: Pick<MediaAsset, "original_size_bytes" | "optimized_size_bytes" | "size_bytes">[]): number {
  let saved = 0;
  for (const a of assets) {
    const orig = a.original_size_bytes ?? a.size_bytes ?? 0;
    const opt = a.optimized_size_bytes ?? 0;
    if (orig && opt && opt < orig) saved += orig - opt;
  }
  return saved;
}
