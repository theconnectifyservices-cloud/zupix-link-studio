/**
 * LS-10D Asset Intelligence — insights, storage analytics, usage analytics,
 * global asset replacement, broken asset detection, brand consistency,
 * archive/trash, and asset health scoring.
 */
import { supabase } from "@/integrations/supabase/client";
import { BUCKET, signedUrl } from "./api";
import type { MediaAsset, BrandKit } from "./types";
import { STORAGE_QUOTA } from "./types";

/* -------------------- ASSET INSIGHTS -------------------- */

export interface AssetInsights {
  total: number;
  images: number;
  videos: number;
  documents: number;
  pdfs: number;
  svgs: number;
  audio: number;
  archived: number;
  trashed: number;
}

export async function fetchAssetInsights(workspaceId: string): Promise<AssetInsights> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("kind,mime_type,deleted_at,archived_at")
    .eq("workspace_id", workspaceId);
  if (error) throw error;
  const rows = (data ?? []) as {
    kind: string;
    mime_type: string | null;
    deleted_at: string | null;
    archived_at: string | null;
  }[];
  const out: AssetInsights = {
    total: 0,
    images: 0,
    videos: 0,
    documents: 0,
    pdfs: 0,
    svgs: 0,
    audio: 0,
    archived: 0,
    trashed: 0,
  };
  for (const r of rows) {
    if (r.deleted_at) {
      out.trashed += 1;
      continue;
    }
    if (r.archived_at) out.archived += 1;
    out.total += 1;
    if (r.mime_type === "image/svg+xml") out.svgs += 1;
    else if (r.kind === "image") out.images += 1;
    else if (r.kind === "video") out.videos += 1;
    else if (r.kind === "audio") out.audio += 1;
    else if (r.kind === "document") {
      out.documents += 1;
      if (r.mime_type === "application/pdf") out.pdfs += 1;
    }
  }
  return out;
}

/* -------------------- STORAGE ANALYTICS -------------------- */

export interface StorageAnalytics {
  quota: number;
  used: number;
  free: number;
  pctUsed: number;
  monthlyGrowth: number; // bytes uploaded in last 30 days
  monthlyGrowthPct: number; // vs 30 days before
  largest: MediaAsset[];
  trend: Array<{ date: string; bytes: number; count: number }>; // last 30 days
}

export async function fetchStorageAnalytics(workspaceId: string): Promise<StorageAnalytics> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("size_bytes", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as unknown as MediaAsset[];

  const now = Date.now();
  const DAY = 86_400_000;
  const used = rows.reduce((s, r) => s + (r.size_bytes ?? 0), 0);
  const monthAgo = now - 30 * DAY;
  const twoMonthsAgo = now - 60 * DAY;
  let monthlyGrowth = 0;
  let prevMonth = 0;
  const trendMap = new Map<string, { bytes: number; count: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    const key = d.toISOString().slice(0, 10);
    trendMap.set(key, { bytes: 0, count: 0 });
  }
  for (const r of rows) {
    const t = new Date(r.created_at).getTime();
    const size = r.size_bytes ?? 0;
    if (t >= monthAgo) {
      monthlyGrowth += size;
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      const bucket = trendMap.get(key);
      if (bucket) {
        bucket.bytes += size;
        bucket.count += 1;
      }
    } else if (t >= twoMonthsAgo) {
      prevMonth += size;
    }
  }
  const monthlyGrowthPct = prevMonth
    ? Math.round(((monthlyGrowth - prevMonth) / prevMonth) * 100)
    : 0;

  return {
    quota: STORAGE_QUOTA,
    used,
    free: Math.max(0, STORAGE_QUOTA - used),
    pctUsed: Math.min(100, (used / STORAGE_QUOTA) * 100),
    monthlyGrowth,
    monthlyGrowthPct,
    largest: rows.slice(0, 10),
    trend: Array.from(trendMap.entries()).map(([date, v]) => ({ date, ...v })),
  };
}

/* -------------------- USAGE ANALYTICS -------------------- */

export interface UsageAnalytics {
  mostUsed: MediaAsset[];
  leastUsed: MediaAsset[];
  unused: MediaAsset[];
  recentlyUsed: MediaAsset[];
  recentlyUploaded: MediaAsset[];
}

export async function fetchUsageAnalytics(workspaceId: string): Promise<UsageAnalytics> {
  const base = supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null);

  const [most, unused, recentUsed, recentUploaded] = await Promise.all([
    base.order("usage_count", { ascending: false }).limit(10),
    supabase
      .from("media_assets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .is("archived_at", null)
      .eq("usage_count", 0)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("media_assets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .not("last_used_at", "is", null)
      .order("last_used_at", { ascending: false })
      .limit(10),
    supabase
      .from("media_assets")
      .select("*")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const mostUsed = ((most.data ?? []) as unknown as MediaAsset[]).filter(
    (a) => a.usage_count > 0,
  );
  const leastUsed = [...mostUsed].reverse().slice(0, 10);
  return {
    mostUsed,
    leastUsed,
    unused: (unused.data ?? []) as unknown as MediaAsset[],
    recentlyUsed: (recentUsed.data ?? []) as unknown as MediaAsset[],
    recentlyUploaded: (recentUploaded.data ?? []) as unknown as MediaAsset[],
  };
}

/* -------------------- GLOBAL REPLACEMENT -------------------- */

/**
 * Replace every reference to oldAsset with newAsset across all bio pages
 * in the workspace. Traverses each affected page's content JSON, string-replaces
 * the old asset id and path with the new ones, then rewrites media_usages rows.
 */
export async function globalReplaceAsset(input: {
  workspaceId: string;
  oldAssetId: string;
  newAssetId: string;
}): Promise<{ pagesUpdated: number; usagesUpdated: number }> {
  const { workspaceId, oldAssetId, newAssetId } = input;
  if (oldAssetId === newAssetId) return { pagesUpdated: 0, usagesUpdated: 0 };

  const [{ data: oldRow }, { data: newRow }] = await Promise.all([
    supabase.from("media_assets").select("id,path").eq("id", oldAssetId).maybeSingle(),
    supabase.from("media_assets").select("id,path").eq("id", newAssetId).maybeSingle(),
  ]);
  if (!oldRow || !newRow) throw new Error("Asset not found");

  const { data: usages, error: uErr } = await supabase
    .from("media_usages")
    .select("bio_page_id")
    .eq("asset_id", oldAssetId)
    .eq("workspace_id", workspaceId);
  if (uErr) throw uErr;
  const pageIds = Array.from(
    new Set((usages ?? []).map((u: { bio_page_id: string | null }) => u.bio_page_id).filter(Boolean)),
  ) as string[];

  let pagesUpdated = 0;
  if (pageIds.length) {
    const { data: pages, error: pErr } = await supabase
      .from("bio_pages")
      .select("id, content, published_content")
      .in("id", pageIds);
    if (pErr) throw pErr;

    for (const p of pages ?? []) {
      const nextContent = swapInJson(p.content, oldRow, newRow);
      const nextPublished = p.published_content
        ? swapInJson(p.published_content, oldRow, newRow)
        : p.published_content;
      const { error } = await supabase
        .from("bio_pages")
        .update({
          content: nextContent as never,
          published_content: nextPublished as never,
        })
        .eq("id", p.id);
      if (!error) pagesUpdated += 1;
    }
  }

  const { error: reErr, count } = await supabase
    .from("media_usages")
    .update({ asset_id: newAssetId }, { count: "exact" })
    .eq("workspace_id", workspaceId)
    .eq("asset_id", oldAssetId);
  if (reErr) throw reErr;

  // Recount usage_count
  await supabase.rpc("update_updated_at_column").then(() => undefined, () => undefined);
  await Promise.all([
    updateUsageCount(oldAssetId),
    updateUsageCount(newAssetId),
  ]);

  return { pagesUpdated, usagesUpdated: count ?? 0 };
}

async function updateUsageCount(assetId: string): Promise<void> {
  const { count } = await supabase
    .from("media_usages")
    .select("id", { count: "exact", head: true })
    .eq("asset_id", assetId);
  await supabase
    .from("media_assets")
    .update({ usage_count: count ?? 0 })
    .eq("id", assetId);
}

function swapInJson(value: unknown, oldA: { id: string; path: string }, newA: { id: string; path: string }): unknown {
  const json = JSON.stringify(value ?? null);
  if (!json) return value;
  const swapped = json
    .split(oldA.id).join(newA.id)
    .split(oldA.path).join(newA.path);
  try {
    return JSON.parse(swapped);
  } catch {
    return value;
  }
}

/* -------------------- BROKEN ASSET DETECTION -------------------- */

export interface BrokenReference {
  usage_id: string;
  asset_id: string;
  bio_page_id: string | null;
  page_name: string | null;
  reason: "missing" | "trashed" | "storage-missing";
}

export async function findBrokenReferences(workspaceId: string): Promise<BrokenReference[]> {
  const { data, error } = await supabase
    .from("media_usages")
    .select("id, asset_id, bio_page_id, media_assets(id, deleted_at), bio_pages(name)")
    .eq("workspace_id", workspaceId);
  if (error) throw error;

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    asset_id: string;
    bio_page_id: string | null;
    media_assets: { id: string; deleted_at: string | null } | null;
    bio_pages: { name: string | null } | null;
  }>;

  const broken: BrokenReference[] = [];
  for (const r of rows) {
    if (!r.media_assets) {
      broken.push({
        usage_id: r.id,
        asset_id: r.asset_id,
        bio_page_id: r.bio_page_id,
        page_name: r.bio_pages?.name ?? null,
        reason: "missing",
      });
    } else if (r.media_assets.deleted_at) {
      broken.push({
        usage_id: r.id,
        asset_id: r.asset_id,
        bio_page_id: r.bio_page_id,
        page_name: r.bio_pages?.name ?? null,
        reason: "trashed",
      });
    }
  }
  return broken;
}

export async function pruneBrokenReferences(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase.from("media_usages").delete().in("id", ids);
  if (error) throw error;
}

/* -------------------- BRAND CONSISTENCY -------------------- */

export interface BrandConsistencyReport {
  hasBrandKit: boolean;
  defaultKit: BrandKit | null;
  logoConfigured: boolean;
  colorsConfigured: boolean;
  fontsConfigured: boolean;
  brandAssetCount: number;
  offBrandAssets: number; // images not in the brand kit
  missingAltText: number;
  score: number; // 0..100
}

export async function fetchBrandConsistency(workspaceId: string): Promise<BrandConsistencyReport> {
  const { data: kits } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("workspace_id", workspaceId);
  const list = (kits ?? []) as unknown as BrandKit[];
  const defaultKit = list.find((k) => k.is_default) ?? list[0] ?? null;

  const { data: assetsData } = await supabase
    .from("media_assets")
    .select("id,kind,alt_text")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null);
  const assets = (assetsData ?? []) as { id: string; kind: string; alt_text: string | null }[];

  const brandIds = new Set<string>();
  if (defaultKit) {
    for (const k of list) {
      [k.logo_asset_id, k.dark_logo_asset_id, k.light_logo_asset_id, k.favicon_asset_id, k.social_share_asset_id]
        .filter((x): x is string => !!x)
        .forEach((id) => brandIds.add(id));
      (k.brand_asset_ids ?? []).forEach((id) => brandIds.add(id));
    }
  }

  const images = assets.filter((a) => a.kind === "image");
  const offBrand = defaultKit ? images.filter((a) => !brandIds.has(a.id)).length : 0;
  const missingAlt = images.filter((a) => !a.alt_text || !a.alt_text.trim()).length;

  const logoConfigured = !!(defaultKit?.logo_asset_id || defaultKit?.dark_logo_asset_id || defaultKit?.light_logo_asset_id);
  const colorsConfigured = (defaultKit?.colors ?? []).length >= 3;
  const fontsConfigured = !!(defaultKit?.typography?.headingFont || defaultKit?.typography?.bodyFont);

  let score = 0;
  if (defaultKit) score += 20;
  if (logoConfigured) score += 20;
  if (colorsConfigured) score += 20;
  if (fontsConfigured) score += 15;
  if (images.length > 0) {
    score += Math.round(((images.length - missingAlt) / images.length) * 15);
    score += Math.round(((images.length - offBrand) / Math.max(1, images.length)) * 10);
  } else {
    score += 25;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    hasBrandKit: !!defaultKit,
    defaultKit,
    logoConfigured,
    colorsConfigured,
    fontsConfigured,
    brandAssetCount: brandIds.size,
    offBrandAssets: offBrand,
    missingAltText: missingAlt,
    score,
  };
}

/* -------------------- ARCHIVE + TRASH -------------------- */

export async function archiveAssets(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("media_assets")
    .update({ archived_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw error;
}

export async function restoreArchivedAssets(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("media_assets")
    .update({ archived_at: null })
    .in("id", ids);
  if (error) throw error;
}

export async function listArchivedAssets(workspaceId: string): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MediaAsset[];
}

export async function listTrashedAssets(workspaceId: string): Promise<MediaAsset[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as MediaAsset[];
}

export async function restoreTrashedAssets(ids: string[]): Promise<void> {
  if (!ids.length) return;
  const { error } = await supabase
    .from("media_assets")
    .update({ deleted_at: null })
    .in("id", ids);
  if (error) throw error;
}

export async function permanentlyDeleteAssets(assets: MediaAsset[]): Promise<void> {
  if (!assets.length) return;
  const paths = assets.map((a) => a.path).filter(Boolean);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  await supabase
    .from("media_assets")
    .delete()
    .in(
      "id",
      assets.map((a) => a.id),
    );
}

export async function getTrashRetentionDays(workspaceId: string): Promise<number> {
  const { data } = await supabase
    .from("workspaces")
    .select("trash_retention_days")
    .eq("id", workspaceId)
    .maybeSingle();
  return (data as { trash_retention_days?: number } | null)?.trash_retention_days ?? 30;
}

export async function setTrashRetentionDays(workspaceId: string, days: number): Promise<void> {
  await supabase.from("workspaces").update({ trash_retention_days: days }).eq("id", workspaceId);
}

/* -------------------- ASSET HEALTH SCORE -------------------- */

export interface HealthReport {
  optimization: number;
  usage: number;
  storage: number;
  brand: number;
  overall: number;
  breakdown: {
    processed: number;
    unprocessed: number;
    unused: number;
    oversized: number;
    duplicates: number;
  };
}

const OVERSIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB per asset flagged as heavy

export async function fetchHealthReport(workspaceId: string): Promise<HealthReport> {
  const [assetsRes, brand] = await Promise.all([
    supabase
      .from("media_assets")
      .select("id,size_bytes,processing_status,usage_count,sha256")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .is("archived_at", null),
    fetchBrandConsistency(workspaceId),
  ]);
  const rows = (assetsRes.data ?? []) as {
    id: string;
    size_bytes: number | null;
    processing_status: string;
    usage_count: number;
    sha256: string | null;
  }[];

  const total = rows.length || 1;
  const processed = rows.filter((r) => r.processing_status === "completed" || r.processing_status === "skipped").length;
  const unprocessed = rows.filter((r) => r.processing_status === "pending" || r.processing_status === "processing" || r.processing_status === "failed").length;
  const unused = rows.filter((r) => r.usage_count === 0).length;
  const oversized = rows.filter((r) => (r.size_bytes ?? 0) > OVERSIZE_THRESHOLD).length;
  const hashCounts = new Map<string, number>();
  rows.forEach((r) => {
    if (r.sha256) hashCounts.set(r.sha256, (hashCounts.get(r.sha256) ?? 0) + 1);
  });
  const duplicates = Array.from(hashCounts.values()).filter((n) => n > 1).reduce((s, n) => s + n, 0);

  const optimization = Math.round((processed / total) * 100);
  const usage = Math.round(((total - unused) / total) * 100);
  const storage = Math.round(((total - oversized) / total) * 100);
  const brandScore = brand.score;
  const overall = Math.round((optimization + usage + storage + brandScore) / 4);

  return {
    optimization,
    usage,
    storage,
    brand: brandScore,
    overall,
    breakdown: { processed, unprocessed, unused, oversized, duplicates },
  };
}

/* -------------------- REUSABLE ASSETS -------------------- */

export interface ReusableGroup {
  category: "logo" | "icon" | "background" | "button" | "graphic";
  label: string;
  assets: MediaAsset[];
}

export async function fetchReusableAssets(workspaceId: string): Promise<ReusableGroup[]> {
  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .is("archived_at", null);
  if (error) throw error;
  const assets = (data ?? []) as unknown as MediaAsset[];
  const pick = (needle: string[]) =>
    assets.filter((a) =>
      needle.some((t) => a.tags.includes(t)) ||
      needle.some((t) => (a.file_name ?? "").toLowerCase().includes(t)),
    );

  return [
    { category: "logo", label: "Logos", assets: pick(["logo"]) },
    { category: "icon", label: "Icons", assets: pick(["icon"]) },
    { category: "background", label: "Backgrounds", assets: pick(["background", "bg"]) },
    { category: "button", label: "Buttons", assets: pick(["button", "btn"]) },
    { category: "graphic", label: "Graphics", assets: pick(["graphic", "illustration"]) },
  ];
}

/* -------------------- HELPERS -------------------- */

export { signedUrl };
