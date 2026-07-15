import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadBrandContext } from "./brand-context";
import {
  deleteHistory,
  generateContent,
  listHistory,
  saveHistory,
  toggleFavorite,
  type GenerateInput,
  type HistoryEntry,
} from "./api";

export function useBrandContext(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["ai", "brand-context", workspaceId],
    queryFn: () => loadBrandContext(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useContentHistory(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["ai", "content-history", workspaceId],
    queryFn: () => listHistory(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 10_000,
  });
}

export function useGenerateContent() {
  return useMutation({
    mutationFn: (input: GenerateInput) => generateContent(input),
  });
}

export function useSaveHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: HistoryEntry) => saveHistory(entry),
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ["ai", "content-history", vars.workspaceId] });
    },
  });
}

export function useToggleFavoriteHistory(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      favorite,
      current,
    }: {
      id: string;
      favorite: boolean;
      current: Record<string, unknown>;
    }) => toggleFavorite(id, favorite, current),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai", "content-history", workspaceId] });
    },
  });
}

export function useDeleteHistory(workspaceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHistory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai", "content-history", workspaceId] });
    },
  });
}
