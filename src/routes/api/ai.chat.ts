/**
 * AI chat streaming endpoint (LS-12A).
 *
 * Streams plain text chunks from the Lovable AI Gateway. The client
 * appends chunks live for a smooth UX. Persistence of the final
 * assistant message is done client-side after the stream completes
 * (RLS enforces that only the conversation owner can insert).
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  model: z.string().default("google/gemini-3-flash-preview"),
  system: z.string().max(20_000).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string().max(50_000),
      }),
    )
    .min(1)
    .max(200),
});

export const Route = createFileRoute("/api/ai/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: z.infer<typeof BodySchema>;
        try {
          body = BodySchema.parse(await request.json());
        } catch (e) {
          return new Response(`Invalid body: ${(e as Error).message}`, { status: 400 });
        }

        const messages = body.system
          ? [{ role: "system" as const, content: body.system }, ...body.messages]
          : body.messages;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: body.model,
            messages,
            stream: true,
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const text = await upstream.text().catch(() => "");
          if (upstream.status === 429) {
            return new Response("Rate limit reached. Please retry shortly.", { status: 429 });
          }
          if (upstream.status === 402) {
            return new Response("AI credits exhausted. Please top up.", { status: 402 });
          }
          return new Response(text || "Upstream AI error", { status: 502 });
        }

        // Parse SSE and re-emit plain text chunks so the client can
        // just concatenate without an SSE parser.
        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            const decoder = new TextDecoder();
            const encoder = new TextEncoder();
            let buffer = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const json = JSON.parse(data) as {
                      choices?: { delta?: { content?: string } }[];
                    };
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(delta));
                  } catch {
                    // ignore malformed chunk
                  }
                }
              }
            } catch (err) {
              controller.error(err);
              return;
            }
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});
