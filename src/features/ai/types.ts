export type AiRole = "system" | "user" | "assistant" | "tool";

export interface AiConversation {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  model: string;
  pinned: boolean;
  archived: boolean;
  last_message_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: AiRole;
  content: string;
  tokens_in: number | null;
  tokens_out: number | null;
  model: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AiPrompt {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  favorite: boolean;
  last_used_at: string | null;
  use_count: number;
  created_at: string;
  updated_at: string;
}

export interface AiActivity {
  id: string;
  workspace_id: string;
  user_id: string;
  kind: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const PROMPT_CATEGORIES = [
  "general",
  "bio",
  "cta",
  "seo",
  "design",
  "analytics",
  "template",
  "brand",
] as const;
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export interface AiTool {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  icon: string;
  soon: boolean;
}
