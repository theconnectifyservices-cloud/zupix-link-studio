/** Lazy-loading signed thumbnail for a media asset. */
import { useEffect, useState } from "react";
import { FileText, Film, Music, File as FileIcon } from "lucide-react";
import { signedUrl } from "../api";
import { pickVariant, signedPosterUrl } from "../delivery";
import type { MediaAsset } from "../types";

interface Props {
  asset: MediaAsset;
  className?: string;
  /** Target render width in CSS px — drives which variant to fetch. */
  width?: number;
}

export function MediaThumbnail({ asset, className, width = 240 }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (asset.kind === "image") {
          const variant = pickVariant(asset, width);
          const target = variant?.path ?? asset.path;
          const u = await signedUrl(target);
          if (!cancelled) setUrl(u);
        } else if (asset.kind === "video") {
          const u = await signedPosterUrl(asset);
          if (!cancelled) setUrl(u);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [asset, width]);

  if ((asset.kind === "image" || asset.kind === "video") && url && !failed) {
    return (
      <img
        src={url}
        alt={asset.alt_text ?? asset.file_name ?? ""}
        loading="lazy"
        decoding="async"
        className={className ?? "h-full w-full object-cover"}
        onError={() => setFailed(true)}
      />
    );
  }

  const Icon =
    asset.kind === "video"
      ? Film
      : asset.kind === "audio"
        ? Music
        : asset.kind === "document"
          ? FileText
          : FileIcon;

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
  );
}
