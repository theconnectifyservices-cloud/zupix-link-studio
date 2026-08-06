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
  // LS-10C organization
  is_favorite: boolean;
  view_count: number;
  last_viewed_at: string | null;
  current_version: number;
  // LS-10D intelligence
  archived_at: string | null;
  deleted_at?: string | null;
  health_score: number | null;
}

/* -------------------- LS-10C ORGANIZATION -------------------- */

export type CollectionKind = "manual" | "smart" | "dynamic";

export interface SmartRule {
  kinds?: MediaKind[];
  tags?: string[];
  mimeTypes?: string[];
  minSize?: number;
  maxSize?: number;
  uploadedAfter?: string; // ISO
  uploadedBefore?: string;
  onlyUnused?: boolean;
  onlyFavorites?: boolean;
  folderId?: string | null;
  search?: string;
}

export interface MediaCollection {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  kind: CollectionKind;
  rules: SmartRule;
  cover_asset_id: string | null;
  is_favorite: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MediaTag {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  is_auto: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface BrandKit {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  logo_asset_id: string | null;
  dark_logo_asset_id: string | null;
  light_logo_asset_id: string | null;
  favicon_asset_id: string | null;
  social_share_asset_id: string | null;
  colors: BrandColor[];
  typography: BrandTypography;
  brand_asset_ids: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BrandColor {
  name: string;
  value: string; // hex
  role?: "primary" | "secondary" | "accent" | "background" | "surface" | "text" | "muted";
}

export interface BrandTypography {
  headingFont?: string;
  bodyFont?: string;
  monoFont?: string;
  scale?: number;
}

export interface AssetVersion {
  id: string;
  asset_id: string;
  workspace_id: string;
  version_number: number;
  bucket: string;
  path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  sha256: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export const TAG_COLORS = [
  { name: "slate", cls: "bg-slate-500" },
  { name: "red", cls: "bg-red-500" },
  { name: "orange", cls: "bg-orange-500" },
  { name: "amber", cls: "bg-amber-500" },
  { name: "green", cls: "bg-green-500" },
  { name: "teal", cls: "bg-teal-500" },
  { name: "blue", cls: "bg-blue-500" },
  { name: "indigo", cls: "bg-indigo-500" },
  { name: "violet", cls: "bg-violet-500" },
  { name: "pink", cls: "bg-pink-500" },
] as const;

export function tagColorClass(color: string): string {
  return TAG_COLORS.find((c) => c.name === color)?.cls ?? "bg-slate-500";
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
  "audio/x-wav": "audio",
  "audio/ogg": "audio",
  "audio/mp4": "audio",
  "audio/aac": "audio",
  "audio/flac": "audio",
  "application/pdf": "document",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "application/vnd.ms-excel": "document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "document",
  "application/vnd.ms-powerpoint": "document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "document",
  "application/zip": "other",
  "application/x-zip-compressed": "other",
  "application/rtf": "document",
  "text/plain": "document",
  "text/csv": "document",
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const PLAN_STORAGE_LIMITS = {
  udaan: 500 * 1024 * 1024, // 500 MB
  tejas: 5 * 1024 * 1024 * 1024, // 5 GB
  shikhar: 20 * 1024 * 1024 * 1024, // 20 GB
} as const;

export const STORAGE_QUOTA = PLAN_STORAGE_LIMITS.tejas; // Default fallback


export function kindFromMime(mime: string): MediaKind {
  return ALLOWED_MIME[mime] ?? "other";
}

export function humanSize(bytes: number | null | undefined): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
