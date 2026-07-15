import { useQuery } from "@tanstack/react-query";
import {
  getResellerStats,
  listClients,
  listNotes,
  listTeam,
  type ListClientsOptions,
} from "./api";

export function useResellerStats(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["reseller-stats", tenantId],
    queryFn: () => getResellerStats(tenantId!),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

export function useClients(tenantId: string | undefined, opts: ListClientsOptions = {}) {
  return useQuery({
    queryKey: ["reseller-clients", tenantId, opts],
    queryFn: () => listClients(tenantId!, opts),
    enabled: !!tenantId,
    staleTime: 15_000,
  });
}

export function useClientNotes(clientId: string | undefined) {
  return useQuery({
    queryKey: ["reseller-notes", clientId],
    queryFn: () => listNotes(clientId!),
    enabled: !!clientId,
    staleTime: 15_000,
  });
}

export function useResellerTeam(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["reseller-team", tenantId],
    queryFn: () => listTeam(tenantId!),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}
