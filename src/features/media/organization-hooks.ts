/** React Query hooks for LS-10C organization surfaces. */
import { useQuery } from "@tanstack/react-query";
import {
  listCollections,
  listTags,
  listBrandKits,
  listVersions,
  listCollectionAssets,
  listFavoriteAssets,
  listRecentlyUploaded,
  listRecentlyUsedAssets,
  listRecentlyEdited,
  findDuplicates,
  advancedSearch,
  type AdvancedSearchQuery,
} from "./organization-api";
import type { MediaCollection } from "./types";

export function useCollections(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "collections", workspaceId],
    queryFn: () => listCollections(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useCollectionAssets(collection: MediaCollection | null) {
  return useQuery({
    queryKey: ["media", "collection-assets", collection?.id, collection?.updated_at],
    queryFn: () => listCollectionAssets(collection!),
    enabled: !!collection,
    staleTime: 15_000,
  });
}

export function useTags(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "tags", workspaceId],
    queryFn: () => listTags(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useBrandKits(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "brand-kits", workspaceId],
    queryFn: () => listBrandKits(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useAssetVersions(assetId: string | null | undefined) {
  return useQuery({
    queryKey: ["media", "versions", assetId],
    queryFn: () => listVersions(assetId!),
    enabled: !!assetId,
    staleTime: 15_000,
  });
}

export function useFavoriteAssets(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "favorites", workspaceId],
    queryFn: () => listFavoriteAssets(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useRecentlyUploaded(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "recent-uploaded", workspaceId],
    queryFn: () => listRecentlyUploaded(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useRecentlyUsed(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "recent-used", workspaceId],
    queryFn: () => listRecentlyUsedAssets(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useRecentlyEdited(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "recent-edited", workspaceId],
    queryFn: () => listRecentlyEdited(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useDuplicates(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["media", "duplicates", workspaceId],
    queryFn: () => findDuplicates(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useAdvancedSearch(q: AdvancedSearchQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["media", "advanced-search", q],
    queryFn: () => advancedSearch(q),
    enabled: enabled && !!q.workspaceId,
    staleTime: 10_000,
  });
}

// Silence unused import
void _u;
