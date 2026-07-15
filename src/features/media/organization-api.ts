/**
 * LS-10C organization layer: collections, tags, brand kits, versions, bulk ops.
 * All reads go through the browser Supabase client under workspace RLS.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  MediaCollection,
  MediaTag,
  BrandKit,
  AssetVersion,
  SmartRule,
  MediaAsset,
  CollectionKind,
} from "./types";
import { BUCKET, listAssets, signedUrl } from "./api";

/* -------------------- COLLECTIONS -------------------- */

export async function listCollections(workspaceId: string): Promise<MediaCollection[]> {
  const { data, error } = await supabase
    .from("media_collections")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_favorite", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MediaCollection[];
}

export async function createCollection(input: {
  workspaceId: string;
  userId: string;
  name: string;
  kind?: CollectionKind;
  description?: string;
  rules?: SmartRule;
}): Promise<MediaCollection> {
  const { data, error } = await supabase
    .from("media_collections")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: input.name.trim(),
      kind: input.kind ?? "manual",
      description: input.description ?? null,
      rules: (input.rules ?? {}) as never,
    })
    .select()
    .single();
  if (error) throw error;
  return data as unknown as MediaCollection;
}

export async function updateCollection(
  id: string,
  patch: Partial<Pick<MediaCollection, "name" | "description" | "rules" | "is_favorite" | "cover_asset_id">>,
): Promise<void> {
  const { error } = await supabase
    .from("media_collections")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCollection(id: string): Promise<void> {
  const { error } = await supabase.from("media_collections").delete().eq("id", id);
  if (error) throw error;
}

export async function duplicateCollection(id: string, userId: string): Promise<MediaCollection> {
  const { data: src, error: e1 } = await supabase
    .from("media_collections")
    .select("*")
    .eq("id", id)
    .single();
  if (e1 || !src) throw e1 ?? new Error("not found");
  const { data, error } = await supabase
    .from("media_collections")
    .insert({
      workspace_id: src.workspace_id,
      name: `${src.name} (copy)`,
      description: src.description,
      kind: src.kind,
      rules: src.rules,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  if (src.kind === "manual") {
    const { data: items } = await supabase
      .from("media_collection_items")
      .select("asset_id, position")
      .eq("collection_id", id);
    if (items?.length) {
      await supabase.from("media_collection_items").insert(
        items.map((it) => ({
          collection_id: (data as MediaCollection).id,
          asset_id: it.asset_id,
          position: it.position,
          added_by: userId,
        })),
      );
    }
  }
  return data as MediaCollection;
}

export async function addAssetsToCollection(
  collectionId: string,
  assetIds: string[],
  userId: string,
): Promise<void> {
  if (!assetIds.length) return;
  const rows = assetIds.map((assetId, i) => ({
    collection_id: collectionId,
    asset_id: assetId,
    position: i,
    added_by: userId,
  }));
  const { error } = await supabase
    .from("media_collection_items")
    .upsert(rows, { onConflict: "collection_id,asset_id" });
  if (error) throw error;
}

export async function removeAssetsFromCollection(collectionId: string, assetIds: string[]): Promise<void> {
  if (!assetIds.length) return;
  const { error } = await supabase
    .from("media_collection_items")
    .delete()
    .eq("collection_id", collectionId)
    .in("asset_id", assetIds);
  if (error) throw error;
}

export async function listCollectionAssets(collection: MediaCollection): Promise<MediaAsset[]> {
  if (collection.kind === "smart" || collection.kind === "dynamic") {
    return runSmartCollection(collection);
  }
  const { data, error } = await supabase
    .from("media_collection_items")
    .select("asset_id, position, media_assets(*)")
    .eq("collection_id", collection.id)
    .order("position", { ascending: true });
  if (error) throw error;
  return (data ?? [])
    .map((r: { media_assets: MediaAsset | null }) => r.media_assets)
    .filter((a): a is MediaAsset => !!a && !a["deleted_at" as keyof MediaAsset]);
}

async function runSmartCollection(c: MediaCollection): Promise<MediaAsset[]> {
  const r = c.rules ?? {};
  const assets = await listAssets({
    workspaceId: c.workspace_id,
    folderId: r.folderId,
    kind: r.kinds?.[0] ?? null,
    search: r.search,
    onlyUnused: r.onlyUnused,
    sort: "recent",
    limit: 200,
  });
  return assets.filter((a) => {
    if (r.kinds && r.kinds.length && !r.kinds.includes(a.kind)) return false;
    if (r.mimeTypes?.length && !r.mimeTypes.includes(a.mime_type ?? "")) return false;
    if (r.minSize && (a.size_bytes ?? 0) < r.minSize) return false;
    if (r.maxSize && (a.size_bytes ?? 0) > r.maxSize) return false;
    if (r.onlyFavorites && !a.is_favorite) return false;
    if (r.tags?.length && !r.tags.every((t) => a.tags.includes(t))) return false;
    if (r.uploadedAfter && a.created_at < r.uploadedAfter) return false;
    if (r.uploadedBefore && a.created_at > r.uploadedBefore) return false;
    return true;
  });
}

/* -------------------- TAGS -------------------- */

export async function listTags(workspaceId: string): Promise<MediaTag[]> {
  const { data, error } = await supabase
    .from("media_tags")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("usage_count", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MediaTag[];
}

export async function upsertTag(input: {
  workspaceId: string;
  userId: string;
  name: string;
  color?: string;
  isAuto?: boolean;
}): Promise<MediaTag> {
  const name = input.name.trim().toLowerCase();
  if (!name) throw new Error("Tag name required");
  const { data, error } = await supabase
    .from("media_tags")
    .upsert(
      {
        workspace_id: input.workspaceId,
        name,
        color: input.color ?? "slate",
        is_auto: input.isAuto ?? false,
        created_by: input.userId,
      },
      { onConflict: "workspace_id,name" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as MediaTag;
}

export async function updateTag(id: string, patch: Partial<Pick<MediaTag, "name" | "color">>): Promise<void> {
  const { error } = await supabase.from("media_tags").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteTag(workspaceId: string, name: string): Promise<void> {
  await supabase.from("media_tags").delete().eq("workspace_id", workspaceId).eq("name", name);
  // Remove tag string from all assets (best-effort via RPC would be ideal; do client-side)
  const { data: assets } = await supabase
    .from("media_assets")
    .select("id, tags")
    .eq("workspace_id", workspaceId)
    .contains("tags", [name]);
  if (assets?.length) {
    await Promise.all(
      assets.map((a: { id: string; tags: string[] }) =>
        supabase
          .from("media_assets")
          .update({ tags: a.tags.filter((t) => t !== name) })
          .eq("id", a.id),
      ),
    );
  }
}

export async function bulkTagAssets(assetIds: string[], tagsToAdd: string[]): Promise<void> {
  if (!assetIds.length || !tagsToAdd.length) return;
  const { data, error } = await supabase
    .from("media_assets")
    .select("id, tags")
    .in("id", assetIds);
  if (error) throw error;
  await Promise.all(
    (data ?? []).map((a: { id: string; tags: string[] }) => {
      const merged = Array.from(new Set([...(a.tags ?? []), ...tagsToAdd.map((t) => t.trim().toLowerCase())]));
      return supabase.from("media_assets").update({ tags: merged }).eq("id", a.id);
    }),
  );
}

export async function bulkRemoveTag(assetIds: string[], tag: string): Promise<void> {
  const t = tag.trim().toLowerCase();
  const { data } = await supabase.from("media_assets").select("id, tags").in("id", assetIds);
  await Promise.all(
    (data ?? []).map((a: { id: string; tags: string[] }) =>
      supabase
        .from("media_assets")
        .update({ tags: (a.tags ?? []).filter((x) => x !== t) })
        .eq("id", a.id),
    ),
  );
}

/* -------------------- BRAND KITS -------------------- */

export async function listBrandKits(workspaceId: string): Promise<BrandKit[]> {
  const { data, error } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("name");
  if (error) throw error;
  return (data ?? []) as BrandKit[];
}

export async function createBrandKit(input: {
  workspaceId: string;
  userId: string;
  name: string;
}): Promise<BrandKit> {
  const { data, error } = await supabase
    .from("brand_kits")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: input.name.trim(),
      colors: [
        { name: "Primary", value: "#6366f1", role: "primary" },
        { name: "Accent", value: "#ec4899", role: "accent" },
        { name: "Background", value: "#ffffff", role: "background" },
        { name: "Text", value: "#0f172a", role: "text" },
      ],
      typography: { headingFont: "Inter", bodyFont: "Inter", scale: 1 },
    })
    .select()
    .single();
  if (error) throw error;
  return data as BrandKit;
}

export async function updateBrandKit(id: string, patch: Partial<BrandKit>): Promise<void> {
  const { error } = await supabase.from("brand_kits").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setDefaultBrandKit(workspaceId: string, id: string): Promise<void> {
  await supabase.from("brand_kits").update({ is_default: false }).eq("workspace_id", workspaceId);
  await supabase.from("brand_kits").update({ is_default: true }).eq("id", id);
}

export async function deleteBrandKit(id: string): Promise<void> {
  const { error } = await supabase.from("brand_kits").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------- VERSIONS -------------------- */

export async function listVersions(assetId: string): Promise<AssetVersion[]> {
  const { data, error } = await supabase
    .from("media_asset_versions")
    .select("*")
    .eq("asset_id", assetId)
    .order("version_number", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AssetVersion[];
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Upload a new version of an existing asset. Snapshots the current
 * asset row into media_asset_versions, then swaps in the new upload.
 */
export async function uploadNewVersion(input: {
  asset: MediaAsset;
  file: File;
  userId: string;
  notes?: string;
}): Promise<void> {
  const { asset, file, userId, notes } = input;
  if (!asset.workspace_id) throw new Error("Asset missing workspace");

  // 1. Snapshot current asset as previous version
  const { error: verErr } = await supabase.from("media_asset_versions").insert({
    asset_id: asset.id,
    workspace_id: asset.workspace_id,
    version_number: asset.current_version,
    bucket: asset.bucket,
    path: asset.path,
    file_name: asset.file_name,
    mime_type: asset.mime_type,
    size_bytes: asset.size_bytes,
    width: asset.width,
    height: asset.height,
    sha256: asset.sha256,
    notes: notes ?? null,
    created_by: userId,
  });
  if (verErr) throw verErr;

  // 2. Upload new file to a new path
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase();
  const newVersion = asset.current_version + 1;
  const newPath = `${asset.workspace_id}/${asset.id}/v${newVersion}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(newPath, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const hash = await sha256Hex(file);

  // 3. Point the asset row at the new file
  const { error: updErr } = await supabase
    .from("media_assets")
    .update({
      path: newPath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      sha256: hash,
      current_version: newVersion,
      processing_status: "pending",
      variants: [],
    })
    .eq("id", asset.id);
  if (updErr) throw updErr;
}

/** Restore a previous version — swap the asset row back and snapshot current as a new version. */
export async function restoreVersion(asset: MediaAsset, version: AssetVersion, userId: string): Promise<void> {
  if (!asset.workspace_id) throw new Error("Asset missing workspace");
  await supabase.from("media_asset_versions").insert({
    asset_id: asset.id,
    workspace_id: asset.workspace_id,
    version_number: asset.current_version,
    bucket: asset.bucket,
    path: asset.path,
    file_name: asset.file_name,
    mime_type: asset.mime_type,
    size_bytes: asset.size_bytes,
    width: asset.width,
    height: asset.height,
    sha256: asset.sha256,
    notes: `Auto-snapshot before restore to v${version.version_number}`,
    created_by: userId,
  });
  const { error } = await supabase
    .from("media_assets")
    .update({
      path: version.path,
      file_name: version.file_name,
      mime_type: version.mime_type,
      size_bytes: version.size_bytes,
      width: version.width,
      height: version.height,
      sha256: version.sha256,
      current_version: asset.current_version + 1,
    })
    .eq("id", asset.id);
  if (error) throw error;
}

export async function downloadVersion(version: AssetVersion): Promise<void> {
  const url = await signedUrl(version.path);
  const a = document.createElement("a");
  a.href = url;
  a.download = version.file_name ?? `v${version.version_number}`;
  a.click();
}

/* -------------------- DUPLICATE DETECTION -------------------- */

export interface DuplicateGroup {
  key: string;
  reason: "hash" | "name";
  assets: MediaAsset[];
}

export async function findDuplicates(workspaceId: string): Promise<DuplicateGroup[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);
  if (error) throw error;
  const assets = (data ?? []) as MediaAsset[];

  const byHash = new Map<string, MediaAsset[]>();
  const byName = new Map<string, MediaAsset[]>();
  for (const a of assets) {
    if (a.sha256) {
      const list = byHash.get(a.sha256) ?? [];
      list.push(a);
      byHash.set(a.sha256, list);
    }
    if (a.file_name) {
      const key = a.file_name.toLowerCase();
      const list = byName.get(key) ?? [];
      list.push(a);
      byName.set(key, list);
    }
  }

  const groups: DuplicateGroup[] = [];
  for (const [hash, list] of byHash) {
    if (list.length > 1) groups.push({ key: hash, reason: "hash", assets: list });
  }
  for (const [name, list] of byName) {
    if (list.length > 1) {
      const hashKeys = new Set(list.map((a) => a.sha256).filter(Boolean));
      // Skip if already grouped by hash
      if (hashKeys.size > 1) groups.push({ key: name, reason: "name", assets: list });
    }
  }
  return groups;
}

/* -------------------- FAVORITES + RECENTS -------------------- */

export async function toggleAssetFavorite(assetId: string, next: boolean): Promise<void> {
  const { error } = await supabase.from("media_assets").update({ is_favorite: next }).eq("id", assetId);
  if (error) throw error;
}

export async function toggleCollectionFavorite(id: string, next: boolean): Promise<void> {
  const { error } = await supabase.from("media_collections").update({ is_favorite: next }).eq("id", id);
  if (error) throw error;
}

export async function listFavoriteAssets(workspaceId: string, limit = 60): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_favorite", true)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MediaAsset[];
}

export async function listRecentlyUsedAssets(workspaceId: string, limit = 24): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .not("last_used_at", "is", null)
    .order("last_used_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MediaAsset[];
}

export async function listRecentlyUploaded(workspaceId: string, limit = 24): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MediaAsset[];
}

export async function listRecentlyEdited(workspaceId: string, limit = 24): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MediaAsset[];
}

/* -------------------- BULK OPERATIONS -------------------- */

export async function bulkDeleteAssets(assets: MediaAsset[]): Promise<void> {
  if (!assets.length) return;
  await supabase.storage.from(BUCKET).remove(assets.map((a) => a.path));
  await supabase
    .from("media_assets")
    .update({ deleted_at: new Date().toISOString() })
    .in(
      "id",
      assets.map((a) => a.id),
    );
}

export async function bulkRestoreAssets(assetIds: string[]): Promise<void> {
  if (!assetIds.length) return;
  const { error } = await supabase
    .from("media_assets")
    .update({ deleted_at: null })
    .in("id", assetIds);
  if (error) throw error;
}

export async function bulkDownloadAssets(assets: MediaAsset[]): Promise<void> {
  // Sequential download-triggering to avoid browser blocking
  for (const asset of assets) {
    const url = await signedUrl(asset.path);
    const a = document.createElement("a");
    a.href = url;
    a.download = asset.file_name ?? "download";
    document.body.appendChild(a);
    a.click();
    a.remove();
    await new Promise((r) => setTimeout(r, 200));
  }
}

/* -------------------- ADVANCED SEARCH -------------------- */

export interface AdvancedSearchQuery {
  workspaceId: string;
  text?: string;
  tags?: string[];
  kinds?: string[];
  collectionId?: string;
  brandKitId?: string;
  usageStatus?: "used" | "unused" | "any";
  dateFrom?: string;
  dateTo?: string;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
}

export async function advancedSearch(q: AdvancedSearchQuery): Promise<MediaAsset[]> {
  let query = supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", q.workspaceId)
    .is("deleted_at", null);

  if (q.text) {
    const term = `%${q.text.trim()}%`;
    query = query.or(`file_name.ilike.${term},alt_text.ilike.${term}`);
  }
  if (q.tags?.length) query = query.contains("tags", q.tags.map((t) => t.toLowerCase()));
  if (q.kinds?.length) query = query.in("kind", q.kinds);
  if (q.usageStatus === "used") query = query.gt("usage_count", 0);
  if (q.usageStatus === "unused") query = query.eq("usage_count", 0);
  if (q.dateFrom) query = query.gte("created_at", q.dateFrom);
  if (q.dateTo) query = query.lte("created_at", q.dateTo);
  if (q.favoritesOnly) query = query.eq("is_favorite", true);

  query = query
    .order("created_at", { ascending: false })
    .range(q.offset ?? 0, (q.offset ?? 0) + (q.limit ?? 60) - 1);

  const { data, error } = await query;
  if (error) throw error;
  let results = (data ?? []) as MediaAsset[];

  // Filter by collection membership (manual only) client-side
  if (q.collectionId) {
    const { data: items } = await supabase
      .from("media_collection_items")
      .select("asset_id")
      .eq("collection_id", q.collectionId);
    const ids = new Set((items ?? []).map((i: { asset_id: string }) => i.asset_id));
    results = results.filter((a) => ids.has(a.id));
  }

  // Filter by brand kit membership client-side
  if (q.brandKitId) {
    const { data: kit } = await supabase
      .from("brand_kits")
      .select("logo_asset_id,dark_logo_asset_id,light_logo_asset_id,favicon_asset_id,social_share_asset_id,brand_asset_ids")
      .eq("id", q.brandKitId)
      .maybeSingle();
    if (kit) {
      const ids = new Set(
        [
          kit.logo_asset_id,
          kit.dark_logo_asset_id,
          kit.light_logo_asset_id,
          kit.favicon_asset_id,
          kit.social_share_asset_id,
          ...(kit.brand_asset_ids ?? []),
        ].filter(Boolean),
      );
      results = results.filter((a) => ids.has(a.id));
    }
  }
  return results;
}
