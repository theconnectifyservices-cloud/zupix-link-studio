import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Square, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageLoader } from "@/shared/ui/page-loader";
import { MessageBubble } from "./message-bubble";
import { useChatStream } from "../use-chat-stream";
import { useMessages } from "../hooks";
import { insertMessage, updateConversation, logActivity } from "../api";
import { buildWorkspaceContext, contextToSystemPrompt } from "../context-engine";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  conversationId: string;
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userId: string;
  title: string;
}

export function ChatWindow({
  conversationId,
  workspaceId,
  workspaceName,
  workspaceSlug,
  userId,
  title,
}: Props) {
  const { data: messages = [], isLoading } = useMessages(conversationId);
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { send, stop, streaming, streamed } = useChatStream({
    onError: (e) => toast.error(e.message || "AI request failed"),
  });

  const displayMessages = useMemo(
    () => messages.filter((m) => m.role !== "system" && m.role !== "tool"),
    [messages],
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [displayMessages.length, streamed]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversationId]);

  async function submit(text: string, isRegenerate = false) {
    const trimmed = text.trim();
    if (!trimmed && !isRegenerate) return;
    if (streaming) return;

    let history = displayMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    if (!isRegenerate) {
      setInput("");
      await insertMessage({ conversationId, role: "user", content: trimmed });
      history = [...history, { role: "user", content: trimmed }];
      qc.invalidateQueries({ queryKey: ["ai", "messages", conversationId] });
      if (displayMessages.length === 0) {
        // First message → derive title
        await updateConversation(conversationId, { title: trimmed.slice(0, 60) });
        qc.invalidateQueries({ queryKey: ["ai", "conversations", workspaceId] });
      }
    }

    let systemPrompt = "You are ZUPIX AI. Be concise and helpful.";
    try {
      const ctx = await buildWorkspaceContext({
        workspaceId,
        workspaceName,
        workspaceSlug,
        userId,
      });
      systemPrompt = contextToSystemPrompt(ctx);
    } catch {
      // fall back to default prompt
    }

    try {
      const full = await send({ system: systemPrompt, messages: history });
      if (full) {
        await insertMessage({
          conversationId,
          role: "assistant",
          content: full,
          model: "google/gemini-3-flash-preview",
        });
        await logActivity({
          workspaceId,
          userId,
          kind: "chat.message",
          summary: `Assistant replied in "${title}"`,
        });
        qc.invalidateQueries({ queryKey: ["ai", "messages", conversationId] });
        qc.invalidateQueries({ queryKey: ["ai", "conversations", workspaceId] });
        qc.invalidateQueries({ queryKey: ["ai", "activity", workspaceId] });
      }
    } catch {
      // toast handled in onError
    }
  }

  function regenerate() {
    if (displayMessages.length < 2) return;
    // remove last assistant message locally? simplest: just resend history minus last assistant
    submit("", true);
  }

  if (isLoading) return <PageLoader label="Loading conversation" />;

  return (
    <div className="flex h-[calc(100dvh-9rem)] flex-col rounded-lg border bg-card">
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {displayMessages.length === 0 && !streaming && (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold">How can ZUPIX AI help?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask about your bio pages, templates, analytics or any part of your workspace.
            </p>
          </div>
        )}
        {displayMessages.map((m, i) => (
          <MessageBubble
            key={m.id}
            role={m.role as "user" | "assistant"}
            content={m.content}
            onRegenerate={
              m.role === "assistant" && i === displayMessages.length - 1 && !streaming
                ? regenerate
                : undefined
            }
          />
        ))}
        {streaming && <MessageBubble role="assistant" content={streamed} streaming />}
      </div>
      <div className="border-t p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            placeholder="Message ZUPIX AI…  (Shift+Enter for newline)"
            rows={1}
            className="max-h-40 min-h-[44px] resize-none"
            disabled={streaming}
          />
          {streaming ? (
            <Button size="icon" variant="secondary" onClick={stop} aria-label="Stop">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={() => submit(input)}
              disabled={!input.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
