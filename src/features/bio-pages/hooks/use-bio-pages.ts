import { useQuery } from "@tanstack/react-query";
import { listBioPages } from "../api";

export function useBioPages(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["bio-pages", workspaceId],
    queryFn: () => listBioPages(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}
