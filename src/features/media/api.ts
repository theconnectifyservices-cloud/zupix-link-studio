/**
 * Media library data + storage layer.
 * All reads go through the browser Supabase client under RLS.
 */
import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaFolder, MediaUsage, MediaKind } from "./types";
import { kindFromMime, ALLOWED_MIME, MAX_FILE_SIZE, humanSize } from "./types";


export const BUCKET = "media";

/* -------------------- FOLDERS -------------------- */

export async function listFolders(workspaceId: string): Promise<MediaFolder[]> {
  const { data, error } = await supabase
    .from("media_folders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("path", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MediaFolder[];
}

export async function createFolder(input: {
  workspaceId: string;
  name: string;
  parentId: string | null;
  userId: string;
  parentPath?: string;
}): Promise<MediaFolder> {
  const path =
    (input.parentPath && input.parentPath !== "/" ? input.parentPath : "") +
    "/" +
    input.name.trim();
  const { data, error } = await supabase
    .from("media_folders")
    .insert({
      workspace_id: input.workspaceId,
      parent_id: input.parentId,
      name: input.name.trim(),
      path,
      created_by: input.userId,
    })
    .select()
    .single();
  if (error) throw error;
  return data as MediaFolder;
}

export async function renameFolder(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("media_folders")
    .update({ name: name.trim() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from("media_folders").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- ASSETS -------------------- */

export interface ListAssetsQuery {
  workspaceId: string;
  folderId?: string | null;
  kind?: MediaKind | "svg" | null;
  search?: string;
  onlyUnused?: boolean;
  sort?: "recent" | "largest" | "name";
  limit?: number;
  offset?: number;
}

export async function listAssets(q: ListAssetsQuery): Promise<MediaAsset[]> {
  let query = supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", q.workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null);

  if (q.folderId !== undefined) {
    if (q.folderId === null) query = query.is("folder_id", null);
    else query = query.eq("folder_id", q.folderId);
  }
  if (q.kind === "svg") {
    query = query.eq("mime_type", "image/svg+xml");
  } else if (q.kind) {
    query = query.eq("kind", q.kind);
  }
  if (q.search && q.search.trim()) {
    const term = `%${q.search.trim()}%`;
    query = query.or(`file_name.ilike.${term},alt_text.ilike.${term}`);
  }
  if (q.onlyUnused) query = query.eq("usage_count", 0);
  // Crops/derivatives are hidden — the library lists each original once.
  query = query.is("metadata->>derived_from", null);

  const sort = q.sort ?? "recent";
  if (sort === "recent") query = query.order("created_at", { ascending: false });
  else if (sort === "largest") query = query.order("size_bytes", { ascending: false });
  else query = query.order("file_name", { ascending: true });

  query = query.range(q.offset ?? 0, (q.offset ?? 0) + (q.limit ?? 60) - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as MediaAsset[];
}

export async function getAsset(id: string): Promise<MediaAsset | null> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as unknown as MediaAsset | null;
}

export async function updateAsset(
  id: string,
  patch: Partial<Pick<MediaAsset, "file_name" | "alt_text" | "tags" | "folder_id">>,
): Promise<void> {
  const { error } = await supabase.from("media_assets").update(patch).eq("id", id);
  if (error) throw error;
}

export async function softDeleteAsset(id: string, path: string): Promise<void> {
  await supabase.storage.from(BUCKET).remove([path]);
  const { error } = await supabase
    .from("media_assets")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function moveAssets(ids: string[], folderId: string | null): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("media_assets")
    .update({ folder_id: folderId })
    .in("id", ids);
  if (error) throw error;
}

/* -------------------- STORAGE URLS -------------------- */

const urlCache = new Map<string, { url: string; expires: number }>();

export async function signedUrl(path: string, expiresIn = 3600): Promise<string> {
  const key = `${path}:${expiresIn}`;
  const cached = urlCache.get(key);
  if (cached && cached.expires > Date.now() + 60_000) return cached.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) throw error ?? new Error("sign failed");
  urlCache.set(key, { url: data.signedUrl, expires: Date.now() + expiresIn * 1000 });
  return data.signedUrl;
}

/* -------------------- UPLOAD -------------------- */

export interface UploadInput {
  file: File;
  workspaceId: string;
  userId: string;
  folderId: string | null;
  onProgress?: (pct: number) => void;
  /**
   * Set when this upload is a crop/derivative of an existing asset. Derived
   * files stay out of the library grid so the same photo is never listed twice.
   */
  derivedFrom?: string;
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function imageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return null;
  return await new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export async function uploadAsset(input: UploadInput): Promise<MediaAsset> {
  const { file, workspaceId, userId, folderId, onProgress, derivedFrom } = input;

  if (file.size > MAX_FILE_SIZE) throw new Error(`File exceeds ${humanSize(MAX_FILE_SIZE)}`);
  // All types are now allowed by the FilePicker, validation happens there or in processor


  onProgress?.(5);
  const hash = await sha256Hex(file);

  // Dedup check
  const { data: existing } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("sha256", hash)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (existing) {
    onProgress?.(100);
    return existing as unknown as MediaAsset;
  }

  onProgress?.(15);
  const kind = kindFromMime(file.type);
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const objectId = crypto.randomUUID();
  const path = `${workspaceId}/${objectId}/${objectId}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;
  onProgress?.(70);

  const dims = await imageDimensions(file);

  const { data: row, error: insErr } = await supabase
    .from("media_assets")
    .insert({
      workspace_id: workspaceId,
      owner_id: userId,
      folder_id: folderId,
      kind,
      bucket: BUCKET,
      path,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      original_size_bytes: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      sha256: hash,
      metadata: derivedFrom ? { derived_from: derivedFrom } : {},
      processing_status: "pending",
    })
    .select()
    .single();
  if (insErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw insErr;
  }
  onProgress?.(100);

  // Fire-and-forget async processing so uploads feel instant.
  const asset = row as unknown as MediaAsset;
  const storageDir = `${workspaceId}/${objectId}`;
  void (async () => {
    try {
      await supabase
        .from("media_assets")
        .update({ processing_status: "processing" })
        .eq("id", asset.id);
      const { processImageAsset, processVideoAsset, saveProcessingReport } = await import("./processor");
      if (kind === "image") {
        const report = await processImageAsset({ assetId: asset.id, file, storageDir });
        await saveProcessingReport(asset.id, report);
      } else if (kind === "video") {
        const poster = await processVideoAsset({ file, storageDir });
        await saveProcessingReport(
          asset.id,
          {
            status: poster ? "completed" : "skipped",
            variants: poster ? [poster.variant] : [],
            optimizedBytes: poster?.variant.size ?? 0,
            reason: poster ? undefined : "no-poster-frame",
          },
          { videoThumbnailPath: poster?.posterPath ?? null },
        );
      } else {
        await supabase
          .from("media_assets")
          .update({ processing_status: "skipped", processed_at: new Date().toISOString() })
          .eq("id", asset.id);
      }
    } catch (e) {
      await supabase
        .from("media_assets")
        .update({
          processing_status: "failed",
          processing_error: e instanceof Error ? e.message : "processing-failed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", asset.id);
    }
  })();

  return asset;
}

/* -------------------- USAGE -------------------- */

export async function listUsages(assetId: string): Promise<
  Array<MediaUsage & { page?: { name: string | null; slug: string | null } }>
> {
  const { data, error } = await supabase
    .from("media_usages")
    .select("*, bio_pages(name,slug)")
    .eq("asset_id", assetId);
  if (error) throw error;
  return (data ?? []) as never;
}

/* -------------------- STORAGE STATS -------------------- */

export interface StorageStats {
  used: number;
  count: number;
  byKind: Record<string, { count: number; size: number }>;
  uploadsLast7d: number[];
  originalBytes: number;
  optimizedBytes: number;
  savedBytes: number;
  processedCount: number;
  pendingCount: number;
  failedCount: number;
}

export async function fetchStorageStats(workspaceId: string): Promise<StorageStats> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("kind,size_bytes,created_at,original_size_bytes,optimized_size_bytes,processing_status")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);
  if (error) throw error;
  const rows = (data ?? []) as {
    kind: string;
    size_bytes: number | null;
    created_at: string;
    original_size_bytes: number | null;
    optimized_size_bytes: number | null;
    processing_status: string;
  }[];
  const stats: StorageStats = {
    used: 0,
    count: rows.length,
    byKind: {},
    uploadsLast7d: Array(7).fill(0),
    originalBytes: 0,
    optimizedBytes: 0,
    savedBytes: 0,
    processedCount: 0,
    pendingCount: 0,
    failedCount: 0,
  };
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  for (const r of rows) {
    const size = r.size_bytes ?? 0;
    stats.used += size;
    const orig = r.original_size_bytes ?? size;
    const opt = r.optimized_size_bytes ?? 0;
    stats.originalBytes += orig;
    stats.optimizedBytes += opt;
    if (orig && opt && opt < orig) stats.savedBytes += orig - opt;
    if (r.processing_status === "completed") stats.processedCount += 1;
    else if (r.processing_status === "pending" || r.processing_status === "processing")
      stats.pendingCount += 1;
    else if (r.processing_status === "failed") stats.failedCount += 1;
    const k = stats.byKind[r.kind] ?? { count: 0, size: 0 };
    k.count += 1;
    k.size += size;
    stats.byKind[r.kind] = k;
    const daysAgo = Math.floor(
      (todayStart.getTime() - new Date(r.created_at).getTime()) / 86_400_000,
    );
    if (daysAgo >= 0 && daysAgo < 7) stats.uploadsLast7d[6 - daysAgo] += 1;
  }
  return stats;
}

/* -------------------- ASSET MANAGER (DAM) -------------------- */

/** Human-friendly Media ID shown in the UI, derived from the asset UUID. */
export function mediaDisplayId(assetId: string): string {
  return `IMG-${assetId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

/**
 * Rebuild the usage graph for one bio page. Runs server-side against the
 * page's saved content, so every section that references an asset's storage
 * path is recorded exactly once — no image is ever duplicated on reuse.
 */
export async function syncPageUsages(bioPageId: string): Promise<number> {
  const { data, error } = await supabase.rpc("media_sync_page_usages", {
    _bio_page_id: bioPageId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

/** Backfill usage data for an existing workspace (automatic migration). */
export async function resyncWorkspaceUsages(workspaceId: string): Promise<number> {
  const { data, error } = await supabase.rpc("media_resync_workspace_usages", {
    _workspace_id: workspaceId,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}

/**
 * Replace an asset everywhere it is used. Every section pointing at the old
 * asset is rewritten to the new one in a single server-side pass.
 * Returns the number of pages updated.
 */
export async function replaceAssetEverywhere(
  oldAssetId: string,
  newAsset: MediaAsset,
): Promise<number> {
  const newUrl = await signedUrl(newAsset.path, 60 * 60 * 24 * 365);
  const { data, error } = await supabase.rpc("media_replace_everywhere", {
    _old_asset: oldAssetId,
    _new_asset: newAsset.id,
    _new_url: newUrl,
  });
  if (error) throw error;
  return (data as number) ?? 0;
}
