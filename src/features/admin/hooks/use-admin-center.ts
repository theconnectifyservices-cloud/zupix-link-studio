import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCenterApi } from "../api/admin-center";
import { toast } from "sonner";

export function useAdminUsers(filters: any) {
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => adminCenterApi.getUsers(filters),
  });
}

export function useAdminLicenses(filters: any) {
  return useQuery({
    queryKey: ["admin", "licenses", filters],
    queryFn: () => adminCenterApi.getLicenses(filters),
  });
}

export function useAdminKPIs() {
  return useQuery({
    queryKey: ["admin", "kpis"],
    queryFn: adminCenterApi.getKPIs,
  });
}

export function useAdminSubscriptions(filters: any) {
  return useQuery({
    queryKey: ["admin", "subscriptions", filters],
    queryFn: () => adminCenterApi.getSubscriptions(filters),
  });
}

export function useGenerateLicenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ count, plan, duration }: { count: number; plan: string; duration: number }) => 
      adminCenterApi.generateLicenses(count, plan, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "licenses"] });
      toast.success("Licenses generated successfully");
    }
  });
}
