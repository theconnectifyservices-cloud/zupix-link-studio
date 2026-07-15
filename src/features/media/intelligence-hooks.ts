import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssetInsights,
  fetchStorageAnalytics,
  fetchUsageAnalytics,
  findBrokenReferences,
  fetchBrandConsistency,
  fetchHealthReport,
  fetchReusableAssets,
  listArchivedAssets,
  listTrashedAssets,
  archiveAssets,
  restoreArchivedAssets,
  restoreTrashedAssets,
  permanentlyDeleteAssets,
  pruneBrokenReferences,
  globalReplaceAsset,
  getTrashRetentionDays,
  setTrashRetentionDays,
} from "./intelligence-api";
import type { MediaAsset } from "./types";

const key = (ws: string, part: string) => ["media", "intelligence", ws, part] as const;

export function useAssetInsights(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "insights"), queryFn: () => fetchAssetInsights(workspaceId), enabled: !!workspaceId });
}
export function useStorageAnalytics(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "storage"), queryFn: () => fetchStorageAnalytics(workspaceId), enabled: !!workspaceId });
}
export function useUsageAnalytics(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "usage"), queryFn: () => fetchUsageAnalytics(workspaceId), enabled: !!workspaceId });
}
export function useBrokenReferences(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "broken"), queryFn: () => findBrokenReferences(workspaceId), enabled: !!workspaceId });
}
export function useBrandConsistency(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "brand"), queryFn: () => fetchBrandConsistency(workspaceId), enabled: !!workspaceId });
}
export function useHealthReport(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "health"), queryFn: () => fetchHealthReport(workspaceId), enabled: !!workspaceId });
}
export function useReusableAssets(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "reusable"), queryFn: () => fetchReusableAssets(workspaceId), enabled: !!workspaceId });
}
export function useArchivedAssets(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "archived"), queryFn: () => listArchivedAssets(workspaceId), enabled: !!workspaceId });
}
export function useTrashedAssets(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "trashed"), queryFn: () => listTrashedAssets(workspaceId), enabled: !!workspaceId });
}
export function useTrashRetention(workspaceId: string) {
  return useQuery({ queryKey: key(workspaceId, "retention"), queryFn: () => getTrashRetentionDays(workspaceId), enabled: !!workspaceId });
}

export function useIntelligenceMutations(workspaceId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["media"] });
  return {
    archive: useMutation({ mutationFn: (ids: string[]) => archiveAssets(ids), onSuccess: invalidate }),
    restoreArchived: useMutation({ mutationFn: (ids: string[]) => restoreArchivedAssets(ids), onSuccess: invalidate }),
    restoreTrashed: useMutation({ mutationFn: (ids: string[]) => restoreTrashedAssets(ids), onSuccess: invalidate }),
    permanentDelete: useMutation({ mutationFn: (assets: MediaAsset[]) => permanentlyDeleteAssets(assets), onSuccess: invalidate }),
    pruneBroken: useMutation({ mutationFn: (ids: string[]) => pruneBrokenReferences(ids), onSuccess: invalidate }),
    globalReplace: useMutation({
      mutationFn: (input: { oldAssetId: string; newAssetId: string }) =>
        globalReplaceAsset({ workspaceId, ...input }),
      onSuccess: invalidate,
    }),
    setRetention: useMutation({
      mutationFn: (days: number) => setTrashRetentionDays(workspaceId, days),
      onSuccess: invalidate,
    }),
  };
}
