/**
 * AI content generation endpoint (LS-12B).
 * Non-streaming JSON endpoint used by the AI Content Studio.
 * Accepts a system + user prompt, returns the generated text.
 * Auth is enforced via RLS on writes performed by the client after generation.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  model: z.string().default("google/gemini-3-flash-preview"),
  system: z.string().max(20_000).optional(),
  prompt: z.string().min(1).max(20_000),
  temperature: z.number().min(0).max(2).optional(),
});

export const Route = createFileRoute("/api/ai/generate")({
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

        const messages = [
          ...(body.system ? [{ role: "system" as const, content: body.system }] : []),
          { role: "user" as const, content: body.prompt },
        ];

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: body.model,
            messages,
            temperature: body.temperature ?? 0.8,
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text().catch(() => "");
          if (upstream.status === 429)
            return new Response("Rate limit reached. Please retry shortly.", { status: 429 });
          if (upstream.status === 402)
            return new Response("AI credits exhausted. Please top up.", { status: 402 });
          return new Response(text || "Upstream AI error", { status: 502 });
        }

        const json = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = json.choices?.[0]?.message?.content ?? "";
        return Response.json({ content });
      },
    },
  },
});
