/**
 * <ResponsiveImage> — the canonical way to render a media asset.
 *
 * - Uses <picture> with a next-gen WebP <source> and an original fallback.
 * - Signs URLs on mount and refreshes them if the asset id changes.
 * - Supports lazy vs priority loading and native fetchpriority hints.
 */
import { useEffect, useState } from "react";
import { buildSrcSet, signedVariantUrl } from "../delivery";
import type { MediaAsset } from "../types";

interface Props {
  asset: MediaAsset;
  /** CSS sizes attribute — e.g. "(min-width: 768px) 50vw, 100vw". */
  sizes?: string;
  /** Nominal render width in CSS px — used to pick a fallback single-src. */
  width?: number;
  /** Set true only for the LCP image. */
  priority?: boolean;
  alt?: string;
  className?: string;
}

export function ResponsiveImage({
  asset,
  sizes = "100vw",
  width = 960,
  priority = false,
  alt,
  className,
}: Props) {
  const [set, setSet] = useState<Awaited<ReturnType<typeof buildSrcSet>>>(null);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [built, single] = await Promise.all([
          buildSrcSet(asset, sizes),
          signedVariantUrl(asset, width),
        ]);
        if (cancelled) return;
        setSet(built);
        setFallbackSrc(single);
      } catch {
        /* graceful degradation — render nothing until the URL resolves */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asset.id, asset.updated_at, sizes, width]);

  if (!fallbackSrc) {
    return (
      <div
        className={className ?? "h-full w-full bg-muted"}
        style={{ aspectRatio: asset.width && asset.height ? `${asset.width} / ${asset.height}` : undefined }}
      />
    );
  }

  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : "auto";

  return (
    <picture>
      {set && <source type={set.type} srcSet={set.srcset} sizes={set.sizes} />}
      <img
        src={fallbackSrc}
        alt={alt ?? asset.alt_text ?? asset.file_name ?? ""}
        width={asset.width ?? undefined}
        height={asset.height ?? undefined}
        loading={loading}
        decoding="async"
        // React 19 supports lowercase, casts keep TS happy on 18-style types
        {...({ fetchpriority: fetchPriority } as Record<string, string>)}
        className={className ?? "h-full w-full object-cover"}
      />
    </picture>
  );
}
