import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const getAdminInput = z.object({
  query: z.string().optional(),
  plan: z.string().optional(),
  status: z.string().optional(),
  cycle: z.enum(["monthly", "yearly"]).optional(),
  limit: z.number().optional().default(10),
  offset: z.number().optional().default(0),
});

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => getAdminInput.parse(data))
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
      let activeSubs: Record<string, any> = {};

      if (userIds.length > 0) {
        const [ { data: bios }, { data: media }, { data: workspaces } ] = await Promise.all([
          supabaseAdmin.from("bio_pages").select("owner_id").in("owner_id", userIds),
          supabaseAdmin.from("media_assets").select("owner_id").in("owner_id", userIds),
          supabaseAdmin.from("workspaces").select("id, owner_id").in("owner_id", userIds)
        ]);

        const wsIds = workspaces?.map(w => w.id) || [];
        const { data: subs } = await supabaseAdmin
          .from("billing_subscriptions")
          .select("workspace_id, plan_id, status, cycle, unit_amount_minor, billing_plans(name, code)")
          .in("workspace_id", wsIds)
          .in("status", ["active", "trialing", "past_due"]);

        const wsToOwner = new Map(workspaces?.map(w => [w.id, w.owner_id]));
        
        subs?.forEach((s: any) => {
          const ownerId = wsToOwner.get(s.workspace_id);
          if (ownerId) activeSubs[ownerId] = s;
        });

        bios?.forEach((b: any) => {
          bioCounts[b.owner_id] = (bioCounts[b.owner_id] || 0) + 1;
        });
        media?.forEach((m: any) => {
          mediaCounts[m.owner_id] = (mediaCounts[m.owner_id] || 0) + 1;
        });
      }

      const mappedData = users?.map((user: any) => {
        const sub = activeSubs[user.id];
        return {
          id: user.id,
          email: user.email || "—",
          display_name: user.display_name || "Unnamed User",
          avatar_url: user.avatar_url,
          subscription_tier: sub ? (sub.billing_plans?.name || sub.billing_plans?.code) : (user.subscription_tier || "free"),
          subscription_status: sub?.status || user.status || "active",
          subscription_price: sub ? `${sub.unit_amount_minor / 100}/${sub.cycle}` : null,
          status: user.status || "active",
          created_at: user.created_at,
          bio_pages_count: bioCounts[user.id] || 0,
          media_count: mediaCounts[user.id] || 0,
          storage_usage: user.storage_usage || 0
        };
      });

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
      throw new Error(e.message || "KPI Fetch Failure");
    }
  });

export const getAdminSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => getAdminInput.parse(data))
  .handler(async ({ data: filters, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: isAdmin } = await (supabaseAdmin as any).rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) throw new Error("Unauthorized: Admin access required");

    try {
      let query = supabaseAdmin
        .from("billing_subscriptions")
        .select(`
          id,
          status,
          cycle,
          currency,
          unit_amount_minor,
          current_period_start,
          current_period_end,
          trial_start,
          trial_end,
          cancel_at_period_end,
          canceled_at,
          workspace_id,
          billing_plans (
            id,
            code,
            name,
            tier
          ),
          workspaces (
            id,
            owner_id,
            profiles:profiles!owner_id (
              id,
              email,
              display_name
            )
          )
        `, { count: "exact" });

      if (filters.status) query = query.eq("status", filters.status);
      if (filters.cycle) query = query.eq("cycle", filters.cycle);

      const { data: subs, error, count } = await query
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);

      if (error) throw error;

      // Manual filtering for text search since it spans nested relationships
      let filtered = subs || [];
      if (filters.query) {
        const q = filters.query.toLowerCase();
        filtered = filtered.filter((s: any) => {
          const profile = s.workspaces?.profiles;
          return (
            profile?.email?.toLowerCase().includes(q) ||
            profile?.display_name?.toLowerCase().includes(q) ||
            s.billing_plans?.name?.toLowerCase().includes(q) ||
            s.billing_plans?.code?.toLowerCase().includes(q)
          );
        });
      }

      const mappedData = filtered.map((sub: any) => {
        const profile = sub.workspaces?.profiles;
        const plan = sub.billing_plans;
        return {
          id: sub.id,
          user_id: profile?.id,
          email: profile?.email || "—",
          display_name: profile?.display_name || "Unnamed User",
          plan_code: plan?.code,
          plan_name: plan?.name || plan?.code,
          plan_tier: plan?.tier,
          status: sub.status,
          cycle: sub.cycle,
          currency: sub.currency,
          amount_minor: sub.unit_amount_minor,
          start_date: sub.current_period_start || sub.trial_start,
          expiry_date: sub.current_period_end || sub.trial_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          trial_end: sub.trial_end
        };
      });

      return { data: mappedData, count: count || 0 };
    } catch (e: any) {
      console.error("[Admin API] Failed to fetch subscriptions:", e);
      throw new Error(e.message || "Failed to fetch subscriptions");
    }
  });
