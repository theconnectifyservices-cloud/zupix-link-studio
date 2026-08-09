import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCenterApi } from "../api/admin-center";
import { getAdminUsers, getAdminKPIs } from "@/lib/admin.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export function useAdminUsers(filters: any) {
  const fetchUsers = useServerFn(getAdminUsers);
  return useQuery({
    queryKey: ["admin", "users", filters],
    queryFn: () => fetchUsers({ data: filters }),
  });
}

export function useAdminKPIs() {
  const fetchKPIs = useServerFn(getAdminKPIs);
  return useQuery({
    queryKey: ["admin", "kpis"],
    queryFn: () => fetchKPIs({ data: undefined }),
  });
}

export function useAdminLicenses(filters: any) {
  return useQuery({
    queryKey: ["admin", "licenses", filters],
    queryFn: () => adminCenterApi.getLicenses(filters),
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
