/** Media library types. */
import type { Database } from "@/integrations/supabase/types";

export type MediaKind = Database["public"]["Enums"]["media_kind"];

export type MediaProcessingStatus = "pending" | "processing" | "completed" | "failed" | "skipped";

export interface MediaVariant {
  role: "thumb" | "small" | "medium" | "large" | "poster";
  format: "webp" | "jpeg" | "png" | "avif";
  width: number;
  height: number;
  size: number;
  path: string;
}

export interface ProcessingReport {
  status: MediaProcessingStatus;
  variants: MediaVariant[];
  optimizedBytes: number;
  reason?: string;
}

export interface MediaAsset {
  id: string;
  workspace_id: string | null;
  owner_id: string;
  folder_id: string | null;
  kind: MediaKind;
  bucket: string;
  path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  alt_text: string | null;
  tags: string[];
  sha256: string | null;
  thumbnail_path: string | null;
  usage_count: number;
  last_used_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Processing pipeline (LS-10B)
  variants: MediaVariant[];
  original_size_bytes: number | null;
  optimized_size_bytes: number | null;
  video_thumbnail_path: string | null;
  blurhash: string | null;
  processing_status: MediaProcessingStatus;
  processing_error: string | null;
  processed_at: string | null;
}

export interface MediaFolder {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  path: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MediaUsage {
  id: string;
  asset_id: string;
  workspace_id: string;
  bio_page_id: string | null;
  block_id: string | null;
  context: string | null;
  created_at: string;
}

export type MediaFilter =
  | "all"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "svg"
  | "recent"
  | "largest"
  | "unused";

/** MIME allow-list — first-line security check on upload. */
export const ALLOWED_MIME: Record<string, MediaKind> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/avif": "image",
  "image/svg+xml": "image",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "text/plain": "document",
  "text/csv": "document",
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const STORAGE_QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB per workspace default

export function kindFromMime(mime: string): MediaKind {
  return ALLOWED_MIME[mime] ?? "other";
}

export function humanSize(bytes: number | null | undefined): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
