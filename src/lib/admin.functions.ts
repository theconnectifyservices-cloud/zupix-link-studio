import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const getUsersInput = z.object({
  query: z.string().optional(),
  plan: z.string().optional(),
  status: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => getUsersInput.parse(data))
  .handler(async ({ data: filters, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: isAdmin } = await (supabaseAdmin as any).rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    try {
      let query = supabaseAdmin
        .from("profiles")
        .select(`*`, { count: "exact" });

      if (filters.query) {
        query = query.or(`display_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`);
      }

      if (filters.plan) query = query.eq("subscription_tier", filters.plan);
      if (filters.status) query = query.eq("status", filters.status as any);

      const { data: users, error, count } = await query
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);

      if (error) throw error;

      const userIds = users?.map(u => u.id) || [];
      
      let bioCounts: Record<string, number> = {};
      let mediaCounts: Record<string, number> = {};

      if (userIds.length > 0) {
        const [ { data: bios }, { data: media } ] = await Promise.all([
          supabaseAdmin.from("bio_pages").select("owner_id").in("owner_id", userIds),
          supabaseAdmin.from("media_assets").select("owner_id").in("owner_id", userIds)
        ]);

        bios?.forEach((b: any) => {
          bioCounts[b.owner_id] = (bioCounts[b.owner_id] || 0) + 1;
        });
        media?.forEach((m: any) => {
          mediaCounts[m.owner_id] = (mediaCounts[m.owner_id] || 0) + 1;
        });
      }

      const mappedData = users?.map((user: any) => ({
        id: user.id,
        email: user.email || "—",
        display_name: user.display_name || "Unnamed User",
        avatar_url: user.avatar_url,
        subscription_tier: user.subscription_tier || "free",
        status: user.status || "active",
        created_at: user.created_at,
        bio_pages_count: bioCounts[user.id] || 0,
        media_count: mediaCounts[user.id] || 0,
        storage_usage: user.storage_usage || 0
      }));

      return { data: mappedData, count: count || 0 };
    } catch (e: any) {
      console.error("[Admin API] Failed to fetch users:", e);
      throw new Error(e.message || "Failed to fetch users");
    }
  });

export const getAdminKPIs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: isAdmin } = await (supabaseAdmin as any).rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) throw new Error("Unauthorized");

    try {
      const [
        { count: totalUsers },
        { count: totalPages },
        { data: revenueData },
        { count: totalStores },
        { count: totalBookings },
        { count: totalDomains }
      ] = await Promise.all([
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("bio_pages").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("billing_payments").select("amount_minor").eq("status", "succeeded"),
        supabaseAdmin.from("bio_store_items").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("bio_bookings").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("domains").select("*", { count: "exact", head: true })
      ]);

      const totalRevenue = (revenueData || []).reduce((acc: number, curr: any) => acc + (curr.amount_minor || 0), 0) / 100;

      return {
        totalUsers: totalUsers || 0,
        totalPages: totalPages || 0,
        totalRevenue: totalRevenue || 0,
        totalStores: totalStores || 0,
        totalBookings: totalBookings || 0,
        totalDomains: totalDomains || 0,
        activeToday: 0
      };
    } catch (e: any) {
      console.error("[Admin API] KPI Fetch Failure:", e);
      throw e;
    }
  });
