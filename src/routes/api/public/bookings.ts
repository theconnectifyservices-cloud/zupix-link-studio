/**
 * Public booking-request ingestion.
 *
 * Same shape as the leads endpoint: anonymous callers, so the target page is
 * verified before a service-role insert into `bio_bookings`.
 */
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const PayloadSchema = z.object({
  pageId: z.string().uuid(),
  slug: z.string().min(1).max(120),
  blockId: z.string().max(80),
  serviceTitle: z.string().max(160).default("Appointment"),
  bookingKind: z.enum(["appointment", "meeting", "consultation"]).default("appointment"),
  customerName: z.string().min(1).max(120),
  email: z.string().max(255).optional(),
  phone: z.string().max(40).optional(),
  notes: z.string().max(2000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().min(5).max(480).default(30),
  timezone: z.string().max(80).optional(),
  locationType: z.enum(["online", "offline"]).default("online"),
  meetingLink: z.string().max(2048).optional(),
  address: z.string().max(400).optional(),
});

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

  const { error } = await supabaseAdmin.from("bio_bookings").insert({
    workspace_id: page.workspace_id,
    bio_page_id: page.id,
    block_id: p.blockId,
    service_title: p.serviceTitle,
    booking_kind: p.bookingKind,
    customer_name: p.customerName,
    email: p.email ?? null,
    phone: p.phone ?? null,
    notes: p.notes ?? null,
    booking_date: p.date,
    booking_time: p.time,
    duration_min: p.durationMin,
    timezone: p.timezone ?? null,
    location_type: p.locationType,
    meeting_link: p.meetingLink ?? null,
    location_address: p.address ?? null,
    source_url: request.headers.get("referer")?.slice(0, 2048) ?? null,
  });
  if (error) return new Response("db_error", { status: 500 });

  return Response.json({ ok: true });
}

export const Route = createFileRoute("/api/public/bookings")({
  server: { handlers: { POST: ({ request }) => handlePost(request) } },
});
