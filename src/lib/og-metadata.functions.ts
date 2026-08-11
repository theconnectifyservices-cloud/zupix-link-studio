import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getOgMetadata = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string() }).parse(d))
  .handler(async ({ data: { slug } }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch the published bio page
    const { data: page, error } = await supabaseAdmin
      .from("bio_pages")
      .select("name, description, seo, published_content")
      .eq("slug", slug.toLowerCase())
      .eq("status", "published")
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !page) return null;

    const content = page.published_content as any;
    const profileBlock = content?.blocks?.find((b: any) => b.type === "profile");
    
    // 1. Image resolution priority: SEO OG Image > Profile Avatar > Profile Cover > Fallback
    const avatarUrl = profileBlock?.avatarUrl;
    const coverUrl = profileBlock?.coverUrl;
    const seoOgImage = (page.seo as any)?.ogImage;
    
    const imageUrl = seoOgImage || avatarUrl || coverUrl || null;
    
    // 2. Title resolution: SEO Title > Profile Display Name > Page Name > Slug
    const title = (page.seo as any)?.title || profileBlock?.displayName || page.name || `@${slug}`;
    
    // 3. Description resolution: SEO Desc > Profile Bio > Page Desc > Fallback
    const description = (page.seo as any)?.description || profileBlock?.bio || page.description || `Digital profile powered by ZUPIX Link Studio.`;

    return {
      title,
      description,
      image: imageUrl,
      url: `https://zupix.site/${slug}`,
      type: "profile"
    };
  });
