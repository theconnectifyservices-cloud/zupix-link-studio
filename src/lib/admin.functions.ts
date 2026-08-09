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
      // Use a simpler query first to avoid TS depth issues
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
          billing_plans!inner(id, code, name, tier),
          workspaces!inner(id, owner_id)
        `, { count: "exact" });

      if (filters.status) query = query.eq("status", filters.status as any);
      if (filters.cycle) query = query.eq("cycle", filters.cycle);

      const { data: subs, error, count } = await query
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);

      if (error) throw error;
      if (!subs?.length) return { data: [], count: 0 };

      // Fetch profile separately to avoid massive join recursion
      const ownerIds = subs.map(s => (s.workspaces as any).owner_id);
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email, display_name")
        .in("id", ownerIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const mappedData = subs.map((sub: any) => {
        const profile = profileMap.get(sub.workspaces.owner_id);
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

      if (filters.query) {
        const q = filters.query.toLowerCase();
        const filtered = mappedData.filter((d: any) => 
          d.email.toLowerCase().includes(q) || 
          d.display_name.toLowerCase().includes(q) || 
          d.plan_name.toLowerCase().includes(q)
        );
        return { data: filtered, count: count || 0 };
      }

      return { data: mappedData, count: count || 0 };
    } catch (e: any) {
      console.error("[Admin API] Failed to fetch subscriptions:", e);
      throw new Error(e.message || "Failed to fetch subscriptions");
    }
  });

export const getAdminLicenses = createServerFn({ method: "GET" })
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
        .from("product_licenses")
        .select(`
          *,
          profiles:user_id (id, email, display_name)
        `, { count: "exact" });

      if (filters.status) query = query.eq("status", filters.status as any);
      if (filters.query) {
        query = query.or(`license_key.ilike.%${filters.query}%,email.ilike.%${filters.query}%,customer_name.ilike.%${filters.query}%`);
      }

      const { data: licenses, error, count } = await query
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);

      if (error) throw error;

      const mappedData = licenses?.map((lic: any) => {
        const profile = lic.profiles;
        // Calculate duration in days
        let durationDays = 0;
        if (lic.created_at && lic.expires_at) {
          const start = new Date(lic.created_at);
          const end = new Date(lic.expires_at);
          durationDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }

        return {
          id: lic.id,
          key: lic.license_key,
          plan_code: lic.plan,
          status: lic.status,
          duration_days: durationDays,
          assigned_to: profile ? {
            id: profile.id,
            email: profile.email,
            display_name: profile.display_name
          } : null,
          bound_email: lic.email,
          customer_name: lic.customer_name,
          activated_at: lic.activated_at,
          expires_at: lic.expires_at,
          created_at: lic.created_at
        };
      });

      return { data: mappedData, count: count || 0 };
    } catch (e: any) {
      console.error("[Admin API] Failed to fetch licenses:", e);
      throw new Error(e.message || "Failed to fetch licenses");
    }
  });

export const generateAdminLicenses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: any) => z.object({
    count: z.number().min(1).max(100),
    plan: z.string(),
    durationDays: z.number().min(1)
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: isAdmin } = await (supabaseAdmin as any).rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (!isAdmin) throw new Error("Unauthorized");

    const keys = Array.from({ length: data.count }).map(() => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.durationDays);
      
      return {
        license_key: `ZUP-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        plan: data.plan.toLowerCase() as any,
        status: 'unused' as any,
        expires_at: expiresAt.toISOString(),
        max_devices: 1,
        created_by: userId
      };
    });

    const { data: inserted, error } = await supabaseAdmin
      .from("product_licenses")
      .insert(keys)
      .select();

    if (error) throw error;
    return inserted;
  });
