/**
 * Effective Bio Link allowance (plan limit + purchased add-ons).
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCurrentWorkspace } from "@/features/bio-pages/hooks/use-current-workspace";
import { getBioLinkAllowance, type BioLinkAllowance } from "./addons.functions";

export function useBioLinkAllowance() {
  const { workspace } = useCurrentWorkspace();
  const workspaceId = workspace?.id ?? null;
  const fetchFn = useServerFn(getBioLinkAllowance);
  const q = useQuery<BioLinkAllowance>({
    queryKey: ["bio-link-allowance", workspaceId],
    queryFn: () => fetchFn({ data: { workspaceId: workspaceId! } }),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
  return {
    ...q,
    workspaceId,
    allowance: q.data ?? null,
    exceeded: q.data?.exceeded ?? false,
  };
}
