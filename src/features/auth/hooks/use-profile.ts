import { useQuery } from "@tanstack/react-query";
import { fetchProfile } from "../api";

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}
