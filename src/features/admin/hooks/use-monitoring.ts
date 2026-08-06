import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminMonitoringApi } from "../api/monitoring";
import { toast } from "sonner";

export function useSystemHealth() {
  return useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: adminMonitoringApi.getSystemHealth,
    refetchInterval: 30000, // Auto refresh every 30s
  });
}

export function useErrorLogs(filters: any) {
  return useQuery({
    queryKey: ["admin", "error-logs", filters],
    queryFn: () => adminMonitoringApi.getErrorLogs(filters),
  });
}

export function useActivityLogs(filters: any) {
  return useQuery({
    queryKey: ["admin", "activity-logs", filters],
    queryFn: () => adminMonitoringApi.getActivityLogs(filters),
  });
}

export function useBackupHistory() {
  return useQuery({
    queryKey: ["admin", "backup-history"],
    queryFn: adminMonitoringApi.getBackupHistory,
  });
}

export function useStorageAnalytics() {
  return useQuery({
    queryKey: ["admin", "storage-analytics"],
    queryFn: adminMonitoringApi.getStorageAnalytics,
  });
}

export function useCreateBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminMonitoringApi.createBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backup-history"] });
      toast.success("Backup process started");
    },
    onError: (error: any) => {
      toast.error(`Backup failed: ${error.message}`);
    },
  });
}
