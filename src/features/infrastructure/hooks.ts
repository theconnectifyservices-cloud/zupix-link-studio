import { useQuery } from "@tanstack/react-query";
import { getInfraStats, getSmtpConfig, listAlerts, listInfraDomains } from "./api";

export function useInfraDomains(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["infra-domains", tenantId],
    queryFn: () => listInfraDomains(tenantId!),
    enabled: !!tenantId,
    staleTime: 15_000,
  });
}

export function useSmtpConfig(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["infra-smtp", tenantId],
    queryFn: () => getSmtpConfig(tenantId!),
    enabled: !!tenantId,
    staleTime: 30_000,
  });
}

export function useInfraAlerts(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["infra-alerts", tenantId],
    queryFn: () => listAlerts(tenantId!, { resolved: false }),
    enabled: !!tenantId,
    staleTime: 15_000,
  });
}

export function useInfraStats(tenantId: string | undefined) {
  return useQuery({
    queryKey: ["infra-stats", tenantId],
    queryFn: () => getInfraStats(tenantId!),
    enabled: !!tenantId,
    staleTime: 15_000,
  });
}
