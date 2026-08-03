/**
 * Public contact-form ingestion.
 *
 * Anonymous visitors submit here, so every write is validated server-side
 * against a published bio_pages row before the service-role insert.
 * Spam protection: per-IP rate limit, honeypot, time-trap and duplicate hash.
 * Plan limits: UDAAN workspaces are capped at 100 submissions per month.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const ValueSchema = z.union([
  z.string().max(4000),
  z.boolean(),
  z.array(z.string().max(400)).max(30),
]);

const AttachmentSchema = z.object({
  name: z.string().max(200),
  type: z.string().max(120),
  size: z.number().int().nonnegative().max(8 * 1024 * 1024),
  data: z.string().max(12_000_000),
});

const PayloadSchema = z.object({
  pageId: z.string().uuid(),
  slug: z.string().min(1).max(120),
  blockId: z.string().max(80),
  formName: z.string().max(120).default("Contact Form"),
  values: z.record(z.string().max(80), ValueSchema),
  hp: z.string().max(200).optional(),
  elapsedMs: z.number().int().nonnegative().optional(),
  pageUrl: z.string().max(2048).optional(),
  attachments: z.array(AttachmentSchema).max(3).optional(),
});

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const FREE_MONTHLY_LIMIT = 100;

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

function parseUa(ua: string): { browser: string; device: string } {
  const s = ua.toLowerCase();
  const browser = s.includes("edg/")
    ? "Edge"
    : s.includes("opr/") || s.includes("opera")
      ? "Opera"
      : s.includes("chrome") && !s.includes("chromium")
        ? "Chrome"
        : s.includes("firefox")
          ? "Firefox"
          : s.includes("safari")
            ? "Safari"
            : "Unknown";
  const device = /ipad|tablet|playbook|silk/.test(s)
    ? "tablet"
    : /mobi|iphone|android/.test(s)
      ? "mobile"
      : "desktop";
  return { browser, device };
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
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

  // Honeypot + time trap: pretend success so bots don't retry.
  if ((p.hp ?? "").trim() !== "" || (p.elapsedMs !== undefined && p.elapsedMs < 1200)) {
    return Response.json({ ok: true });
  }

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

  // Plan quota — free (UDAAN) workspaces are capped monthly.
  const { data: plan } = await supabaseAdmin.rpc("public_workspace_plan", {
    _workspace_id: page.workspace_id,
  });
  const planCode = String(plan ?? "udaan").toLowerCase();
  if (planCode === "udaan" || planCode === "free") {
    const { data: used } = await supabaseAdmin.rpc("workspace_leads_this_month", {
      _workspace_id: page.workspace_id,
    });
    if (Number(used ?? 0) >= FREE_MONTHLY_LIMIT) {
      return new Response("quota_exceeded", { status: 429 });
    }
  }

  const v = p.values;
  const ua = request.headers.get("user-agent") ?? "";
  const { browser, device } = parseUa(ua);

  // Duplicate prevention — same page + same content + same IP within 10 min.
  const dedupeHash = await sha256Hex(
    `${page.id}|${p.blockId}|${ip}|${JSON.stringify(v)}`,
  );
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data: dupe } = await supabaseAdmin
    .from("bio_leads")
    .select("id")
    .eq("bio_page_id", page.id)
    .eq("dedupe_hash", dedupeHash)
    .gte("created_at", since)
    .maybeSingle();
  if (dupe) return new Response("duplicate", { status: 409 });

  // File uploads → private `form-uploads` bucket, readable by the workspace.
  const attachments: { name: string; path: string; type: string; size: number }[] = [];
  for (const file of p.attachments ?? []) {
    if (!ALLOWED_MIME.has(file.type)) continue;
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `${page.workspace_id}/${page.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${safe}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("form-uploads")
      .upload(path, base64ToBytes(file.data), { contentType: file.type, upsert: false });
    if (!upErr) attachments.push({ name: file.name, path, type: file.type, size: file.size });
  }

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
    attachments,
    dedupe_hash: dedupeHash,
    ip_address: ip,
    browser,
    device_type: device,
    page_url: p.pageUrl?.slice(0, 2048) ?? null,
    source_url: p.pageUrl?.slice(0, 2048) ?? request.headers.get("referer")?.slice(0, 2048) ?? null,
    referrer: request.headers.get("referer")?.slice(0, 2048) ?? null,
    user_agent: ua.slice(0, 400) || null,
  });
  if (error) return new Response("db_error", { status: 500 });

  return Response.json({ ok: true });
}

export const Route = createFileRoute("/api/public/leads")({
  server: { handlers: { POST: ({ request }) => handlePost(request) } },
});
