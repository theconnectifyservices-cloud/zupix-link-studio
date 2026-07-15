/**
 * Media library data + storage layer.
 * All reads go through the browser Supabase client under RLS.
 */
import { supabase } from "@/integrations/supabase/client";
import type { MediaAsset, MediaFolder, MediaUsage, MediaKind } from "./types";
import { kindFromMime, ALLOWED_MIME, MAX_FILE_SIZE } from "./types";

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
    .is("deleted_at", null);

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

  const sort = q.sort ?? "recent";
  if (sort === "recent") query = query.order("created_at", { ascending: false });
  else if (sort === "largest") query = query.order("size_bytes", { ascending: false });
  else query = query.order("file_name", { ascending: true });

  query = query.range(q.offset ?? 0, (q.offset ?? 0) + (q.limit ?? 60) - 1);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as MediaAsset[];
}

export async function getAsset(id: string): Promise<MediaAsset | null> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as MediaAsset | null;
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
  const { file, workspaceId, userId, folderId, onProgress } = input;

  if (file.size > MAX_FILE_SIZE) throw new Error(`File exceeds ${MAX_FILE_SIZE / 1024 / 1024} MB`);
  if (!ALLOWED_MIME[file.type]) throw new Error(`Unsupported file type: ${file.type || "unknown"}`);

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
    return existing as MediaAsset;
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
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      sha256: hash,
    })
    .select()
    .single();
  if (insErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw insErr;
  }
  onProgress?.(100);
  return row as MediaAsset;
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
}

export async function fetchStorageStats(workspaceId: string): Promise<StorageStats> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("kind,size_bytes,created_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);
  if (error) throw error;
  const rows = (data ?? []) as { kind: string; size_bytes: number | null; created_at: string }[];
  const stats: StorageStats = {
    used: 0,
    count: rows.length,
    byKind: {},
    uploadsLast7d: Array(7).fill(0),
  };
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  for (const r of rows) {
    const size = r.size_bytes ?? 0;
    stats.used += size;
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
