/**
 * Public contact-form ingestion.
 *
 * Anonymous visitors submit here, so every write is validated server-side
 * against a published bio_pages row before the service-role insert.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const ValueSchema = z.union([
  z.string().max(4000),
  z.boolean(),
  z.array(z.string().max(400)).max(30),
]);

const PayloadSchema = z.object({
  pageId: z.string().uuid(),
  slug: z.string().min(1).max(120),
  blockId: z.string().max(80),
  formName: z.string().max(120).default("Contact Form"),
  values: z.record(z.string().max(80), ValueSchema),
});

/** Best-effort per-isolate rate limit: 20 submissions/min/IP. */
const bucket = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const b = bucket.get(ip);
  if (!b || b.resetAt < now) {
    bucket.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  b.count += 1;
  return b.count > 20;
}

function pickIp(req: Request): string {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "0.0.0.0"
  );
}

function str(v: unknown): string | null {
  if (typeof v === "string") return v.trim().slice(0, 4000) || null;
  if (Array.isArray(v)) return v.join(", ").slice(0, 4000) || null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return null;
}

async function handlePost(request: Request): Promise<Response> {
  const ip = pickIp(request);
  if (rateLimited(ip)) return new Response("rate_limited", { status: 429 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("bad_json", { status: 400 });
  }
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) return new Response("bad_payload", { status: 400 });
  const p = parsed.data;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: page, error: pageErr } = await supabaseAdmin
    .from("bio_pages")
    .select("id, workspace_id, slug, status, deleted_at")
    .eq("id", p.pageId)
    .maybeSingle();
  if (pageErr) return new Response("db_error", { status: 500 });
  if (
    !page ||
    page.deleted_at ||
    page.status !== "published" ||
    page.slug.toLowerCase() !== p.slug.toLowerCase()
  ) {
    return new Response("not_found", { status: 404 });
  }

  const v = p.values;
  const { error } = await supabaseAdmin.from("bio_leads").insert({
    workspace_id: page.workspace_id,
    bio_page_id: page.id,
    block_id: p.blockId,
    form_name: p.formName,
    name: str(v["name"]),
    email: str(v["email"]),
    phone: str(v["phone"]),
    company: str(v["company"]),
    subject: str(v["subject"]),
    message: str(v["message"]),
    fields: v,
    source_url: request.headers.get("referer")?.slice(0, 2048) ?? null,
    referrer: request.headers.get("referer")?.slice(0, 2048) ?? null,
    user_agent: request.headers.get("user-agent")?.slice(0, 400) ?? null,
  });
  if (error) return new Response("db_error", { status: 500 });

  return Response.json({ ok: true });
}

export const Route = createFileRoute("/api/public/leads")({
  server: { handlers: { POST: ({ request }) => handlePost(request) } },
});
