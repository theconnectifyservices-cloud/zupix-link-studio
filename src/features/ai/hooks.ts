import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createConversation,
  createPrompt,
  deleteConversation,
  deletePrompt,
  listActivity,
  listConversations,
  listMessages,
  listPrompts,
  updateConversation,
  updatePrompt,
} from "./api";
import type { AiConversation, AiPrompt } from "./types";

export function useConversations(workspaceId: string | undefined, includeArchived = false) {
  return useQuery({
    queryKey: ["ai", "conversations", workspaceId, includeArchived],
    queryFn: () => listConversations(workspaceId!, includeArchived),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["ai", "messages", conversationId],
    queryFn: () => listMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 5_000,
  });
}

export function usePrompts(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["ai", "prompts", workspaceId],
    queryFn: () => listPrompts(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 30_000,
  });
}

export function useActivity(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["ai", "activity", workspaceId],
    queryFn: () => listActivity(workspaceId!),
    enabled: !!workspaceId,
    staleTime: 15_000,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: (_c, vars) => {
      qc.invalidateQueries({ queryKey: ["ai", "conversations", vars.workspaceId] });
    },
  });
}

export function useUpdateConversation(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<AiConversation> }) =>
      updateConversation(v.id, v.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai", "conversations", workspaceId] }),
  });
}

export function useDeleteConversation(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteConversation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai", "conversations", workspaceId] }),
  });
}

export function useCreatePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPrompt,
    onSuccess: (_p, vars) => qc.invalidateQueries({ queryKey: ["ai", "prompts", vars.workspaceId] }),
  });
}

export function useUpdatePrompt(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; patch: Partial<AiPrompt> }) => updatePrompt(v.id, v.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai", "prompts", workspaceId] }),
  });
}

export function useDeletePrompt(workspaceId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePrompt(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai", "prompts", workspaceId] }),
  });
}
