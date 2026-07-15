import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BioContent } from "@/features/builder/types";
import {
  applyThemePatch,
  listDesignHistory,
  recordDesignHistory,
  restoreContent,
  type DeepPartial,
  type DesignHistoryEntry,
} from "./api";
import type { PageTheme } from "@/features/builder/theme";

export function usePageContent(pageId: string | undefined) {
  return useQuery({
    queryKey: ["design-studio", "page", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bio_pages")
        .select("id,name,slug,content,updated_at,status")
        .eq("id", pageId!)
        .single();
      if (error) throw error;
      return data as unknown as {
        id: string;
        name: string;
        slug: string;
        status: string;
        content: BioContent;
        updated_at: string;
      };
    },
  });
}

export function useDesignHistory(workspaceId: string | undefined, pageId?: string) {
  return useQuery({
    queryKey: ["design-studio", "history", workspaceId, pageId],
    enabled: !!workspaceId,
    queryFn: () => listDesignHistory(workspaceId!, pageId),
  });
}

export function useApplyPatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      pageId: string;
      content: BioContent;
      patch: DeepPartial<PageTheme>;
    }) => applyThemePatch(args.pageId, args.content, args.patch),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["design-studio", "page", vars.pageId] });
    },
  });
}

export function useRestore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { pageId: string; content: BioContent }) =>
      restoreContent(args.pageId, args.content),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["design-studio", "page", vars.pageId] });
    },
  });
}

export function useRecordHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: DesignHistoryEntry) => recordDesignHistory(entry),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["design-studio", "history", vars.workspaceId],
      });
    },
  });
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
