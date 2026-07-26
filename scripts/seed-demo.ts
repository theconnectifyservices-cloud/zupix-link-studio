/**
 * LS-DEMO-01 · Phase 1 seed script.
 *
 * Emits SQL to stdout that:
 *   1. Ensures the ZUPIX Showcase workspace + owner membership exist.
 *   2. Wipes and re-inserts the 12 demo bio_pages (deterministic UUIDs).
 *   3. Fills content, seo, share_settings, and publishes each page.
 *
 * Run with:
 *   bunx tsx scripts/seed-demo.ts | psql
 */
import { DEMO_BUSINESSES, DEMO_WORKSPACE, type DemoBusiness } from "../src/demo/businesses";
import { DEMO_COVER_URLS, absCoverUrl } from "../src/demo/media";

let bid = 0;
const blockId = (bizId: string) => `${bizId.slice(0, 8)}-b${(++bid).toString(36).padStart(3, "0")}`;

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

function jsonLit(v: unknown): string {
  return "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb";
}

function buildBlocks(biz: DemoBusiness) {
  bid = 0;
  const bizId = biz.id;
  const cover = DEMO_COVER_URLS[biz.key];
  const blocks: unknown[] = [];

  // 1. Profile hero
  blocks.push({
    id: blockId(bizId),
    type: "profile",
    displayName: biz.name,
    username: `@${biz.slug}`,
    bio: biz.bio,
    location: biz.cityState,
    shortDescription: biz.tagline,
    verified: true,
    layout: "center",
    coverUrl: cover,
    bgType: "image",
    bgImageUrl: cover,
    overlayColor: "#000000",
    overlayOpacity: 0.45,
    avatarSize: 96,
    avatarRadius: 999,
    avatarBorderWidth: 3,
    avatarRing: "glow",
  });

  // 2. About
  blocks.push({
    id: blockId(bizId),
    type: "heading",
    text: "About",
    align: "left",
    fontSize: "xl",
    fontWeight: "bold",
  });
  blocks.push({
    id: blockId(bizId),
    type: "text",
    text: biz.aboutLong,
    align: "left",
    fontSize: "base",
  });

  // 3. Primary CTA buttons
  blocks.push({
    id: blockId(bizId),
    type: "heading",
    text: "Quick Actions",
    align: "left",
    fontSize: "lg",
    fontWeight: "semibold",
  });
  for (const cta of biz.ctas) {
    blocks.push({
      id: blockId(bizId),
      type: "button",
      label: cta.label,
      url: cta.url,
      style: "primary",
      settings: { buttonEffect: "shine", buttonEffectMode: "hover", radius: "lg" },
    });
  }

  // 4. Catalogue
  blocks.push({
    id: blockId(bizId),
    type: "heading",
    text: biz.cataloguePrefix,
    align: "left",
    fontSize: "xl",
    fontWeight: "bold",
  });
  for (const item of biz.catalogue) {
    blocks.push({
      id: blockId(bizId),
      type: "text",
      text: `**${item.title}** — ${item.priceLabel}\n${item.description}`,
      align: "left",
      fontSize: "base",
    });
  }

  // 5. Gallery captions (as text — real photos come in Phase 2)
  blocks.push({
    id: blockId(bizId),
    type: "heading",
    text: "Gallery",
    align: "left",
    fontSize: "lg",
    fontWeight: "semibold",
  });
  blocks.push({
    id: blockId(bizId),
    type: "gallery",
    items: [{ url: cover, caption: biz.galleryCaptions[0] ?? biz.name }],
    columns: 1,
    gap: 8,
  });
  blocks.push({
    id: blockId(bizId),
    type: "text",
    text: biz.galleryCaptions.map((c, i) => `${i + 1}. ${c}`).join("\n"),
    align: "left",
    fontSize: "sm",
  });

  // 6. Testimonials
  blocks.push({
    id: blockId(bizId),
    type: "testimonials",
    items: biz.testimonials.map((t) => ({
      name: t.name,
      role: `${t.role} · ${t.city}`,
      rating: t.rating,
      quote: t.review,
    })),
  });

  // 7. FAQ
  blocks.push({
    id: blockId(bizId),
    type: "faq",
    items: biz.faqs.map((f) => ({ question: f.question, answer: f.answer })),
  });

  // 8. Contact + Map
  blocks.push({
    id: blockId(bizId),
    type: "contact",
    email: biz.email,
    phone: biz.phone,
    whatsapp: biz.whatsapp,
    address: biz.address,
    hours: biz.hours,
  });
  blocks.push({
    id: blockId(bizId),
    type: "map",
    embedUrl: biz.mapEmbedUrl,
    label: biz.address,
  });

  // 9. Socials
  const social: Array<{ platform: string; url: string }> = [];
  const s = biz.socials;
  if (s.instagram) social.push({ platform: "instagram", url: s.instagram });
  if (s.facebook) social.push({ platform: "facebook", url: s.facebook });
  if (s.youtube) social.push({ platform: "youtube", url: s.youtube });
  if (s.linkedin) social.push({ platform: "linkedin", url: s.linkedin });
  if (s.whatsapp) social.push({ platform: "whatsapp", url: s.whatsapp });
  if (s.website) social.push({ platform: "website", url: s.website });
  if (social.length) {
    blocks.push({ id: blockId(bizId), type: "social", items: social });
  }

  return { blocks, theme: { preset: biz.themePreset } };
}

function seoJson(biz: DemoBusiness) {
  return {
    title: biz.seo.title,
    description: biz.seo.description,
    keywords: biz.seo.keywords,
    ogTitle: biz.seo.ogTitle,
    ogDescription: biz.seo.ogDescription,
    ogImage: absCoverUrl(biz.key),
    twitterCard: "summary_large_image",
  };
}

function shareJson(biz: DemoBusiness) {
  return { enabled: true, title: biz.name, description: biz.tagline, image: absCoverUrl(biz.key) };
}

/* --------------------------------------------------------------- */

const out: string[] = [];

out.push(`-- LS-DEMO-01 Phase 1 seed
BEGIN;

-- 1. Workspace
INSERT INTO public.workspaces (id, name, slug, owner_id)
VALUES ('${DEMO_WORKSPACE.id}', '${esc(DEMO_WORKSPACE.name)}', '${DEMO_WORKSPACE.slug}', '${DEMO_WORKSPACE.ownerId}')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 2. Owner membership
INSERT INTO public.workspace_members (workspace_id, user_id, role, status)
VALUES ('${DEMO_WORKSPACE.id}', '${DEMO_WORKSPACE.ownerId}', 'owner', 'active')
ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner', status = 'active';

-- 3. Wipe previous demo bio pages (deterministic UUID range)
DELETE FROM public.bio_pages WHERE workspace_id = '${DEMO_WORKSPACE.id}';
`);

for (const biz of DEMO_BUSINESSES) {
  const content = buildBlocks(biz);
  out.push(`
-- ${biz.name}
INSERT INTO public.bio_pages
  (id, workspace_id, owner_id, name, slug, category, description, status, visibility,
   content, published_content, published_at, last_saved_at, seo, share_settings)
VALUES (
  '${biz.id}', '${DEMO_WORKSPACE.id}', '${DEMO_WORKSPACE.ownerId}',
  '${esc(biz.name)}', '${biz.slug}', '${biz.category}', '${esc(biz.tagline)}',
  'published', 'public',
  ${jsonLit(content)}, ${jsonLit(content)}, now(), now(),
  ${jsonLit(seoJson(biz))}, ${jsonLit(shareJson(biz))}
);`);
}

out.push(`
COMMIT;
`);

process.stdout.write(out.join("\n"));
