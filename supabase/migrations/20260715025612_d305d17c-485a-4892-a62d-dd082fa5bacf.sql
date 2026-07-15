
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New conversation',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  last_message_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_conversations_ws_idx ON public.ai_conversations(workspace_id, archived, updated_at DESC);
CREATE INDEX ai_conversations_user_idx ON public.ai_conversations(user_id);

CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool')),
  content TEXT NOT NULL,
  tokens_in INT,
  tokens_out INT,
  model TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_messages_conv_idx ON public.ai_messages(conversation_id, created_at);

CREATE TABLE public.ai_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  favorite BOOLEAN NOT NULL DEFAULT false,
  last_used_at TIMESTAMPTZ,
  use_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_prompts_ws_idx ON public.ai_prompts(workspace_id, category);
CREATE INDEX ai_prompts_fav_idx ON public.ai_prompts(user_id, favorite);

CREATE TABLE public.ai_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_activity_ws_idx ON public.ai_activity(workspace_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_activity TO authenticated;
GRANT ALL ON public.ai_conversations, public.ai_messages, public.ai_prompts, public.ai_activity TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv workspace members read" ON public.ai_conversations FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "conv owner insert" ON public.ai_conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "conv owner update" ON public.ai_conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "conv owner delete" ON public.ai_conversations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "msg via conv" ON public.ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND public.is_workspace_member(auth.uid(), c.workspace_id)));
CREATE POLICY "msg insert own conv" ON public.ai_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "msg delete own conv" ON public.ai_messages FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));

CREATE POLICY "prompt ws read" ON public.ai_prompts FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "prompt owner insert" ON public.ai_prompts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "prompt owner update" ON public.ai_prompts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prompt owner delete" ON public.ai_prompts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "activity ws read" ON public.ai_activity FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "activity owner insert" ON public.ai_activity FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_ai_conv_upd BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_ai_prompts_upd BEFORE UPDATE ON public.ai_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
