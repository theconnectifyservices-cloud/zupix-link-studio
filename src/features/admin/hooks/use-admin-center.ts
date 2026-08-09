import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminCenterApi } from "../api/admin-center";
import { getAdminUsers, getAdminKPIs, getAdminSubscriptions, getAdminLicenses, generateAdminLicenses } from "@/lib/admin.functions";
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
  const fetchLicenses = useServerFn(getAdminLicenses);
  return useQuery({
    queryKey: ["admin", "licenses", filters],
    queryFn: () => fetchLicenses({ data: filters }),
  });
}

export function useAdminSubscriptions(filters: any) {
  const fetchSubs = useServerFn(getAdminSubscriptions);
  return useQuery({
    queryKey: ["admin", "subscriptions", filters],
    queryFn: () => fetchSubs({ data: filters }),
  });
}

export function useGenerateLicenses() {
  const queryClient = useQueryClient();
  const generateFn = useServerFn(generateAdminLicenses);
  return useMutation({
    mutationFn: ({ count, plan, duration }: { count: number; plan: string; duration: number }) => 
      generateFn({ data: { count, plan, durationDays: duration } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "licenses"] });
      toast.success("Licenses generated successfully");
    }
  });
}
