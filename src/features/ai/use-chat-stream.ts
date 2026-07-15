import { useCallback, useRef, useState } from "react";

export interface ChatStreamMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface UseChatStreamOptions {
  onDone?: (fullText: string) => void;
  onError?: (err: Error) => void;
}

export function useChatStream(opts: UseChatStreamOptions = {}) {
  const [streaming, setStreaming] = useState(false);
  const [streamed, setStreamed] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (input: {
      system?: string;
      model?: string;
      messages: ChatStreamMessage[];
    }) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStreamed("");
      setStreaming(true);
      let full = "";
      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
          signal: ctrl.signal,
        });
        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Request failed (${res.status})`);
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setStreamed((s) => s + chunk);
        }
        opts.onDone?.(full);
        return full;
      } catch (err) {
        if ((err as Error).name === "AbortError") return full;
        opts.onError?.(err as Error);
        throw err;
      } finally {
        setStreaming(false);
      }
    },
    [opts],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, stop, streaming, streamed };
}
