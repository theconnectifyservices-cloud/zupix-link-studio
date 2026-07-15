/** Lazy-loading signed thumbnail for a media asset. */
import { useEffect, useState } from "react";
import { FileText, Film, Music, File as FileIcon } from "lucide-react";
import { signedUrl } from "../api";
import type { MediaAsset } from "../types";

interface Props {
  asset: MediaAsset;
  className?: string;
}

export function MediaThumbnail({ asset, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (asset.kind !== "image") return;
    let cancelled = false;
    signedUrl(asset.path)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [asset.id, asset.path, asset.kind]);

  if (asset.kind === "image" && url && !failed) {
    return (
      <img
        src={url}
        alt={asset.alt_text ?? asset.file_name ?? ""}
        loading="lazy"
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
