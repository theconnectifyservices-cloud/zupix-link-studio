/** React Query hooks for the media library. */
import { useQuery } from "@tanstack/react-query";
import { usePlan } from "@/features/subscription/hooks";
import { PLAN_STORAGE_LIMITS } from "./types";
import {
  listFolders,
  listAssets,
  fetchStorageStats,
  listUsages,
  type ListAssetsQuery,
} from "./api";


export function useMediaFolders(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "folders", workspaceId],
    queryFn: () => listFolders(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useMediaAssets(q: Omit<ListAssetsQuery, "workspaceId"> & { workspaceId?: string }) {
  return useQuery({
    queryKey: ["media", "assets", q],
    queryFn: () => listAssets(q as ListAssetsQuery),
    enabled: !!q.workspaceId,
    staleTime: 15_000,
  });
}

export function useStorageStats(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "stats", workspaceId],
    queryFn: () => fetchStorageStats(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useAssetUsages(assetId: string | null | undefined) {
  return useQuery({
    queryKey: ["media", "usages", assetId],
    queryFn: () => listUsages(assetId!),
    enabled: !!assetId,
    staleTime: 30_000,
  });
}
