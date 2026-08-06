import { supabase } from "@/integrations/supabase/client";

const logAdminError = (table: string, query: any, error: any) => {
  console.error(`[Admin API Error] Table: ${table}`, {
    query,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
};

export const adminCenterApi = {
  // User Management
  getUsers: async (filters: { query?: string; plan?: string; status?: string; limit?: number; offset?: number }) => {
    try {
      let query = supabase
        .from("profiles")
        .select(`
          *,
          bio_pages:bio_pages(count),
          media:media_assets(count)
        `, { count: "exact" });
      
      if (filters.query) {
        query = query.or(`display_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`);
      }
      
      if (filters.plan) query = query.eq("subscription_tier", filters.plan);
      if (filters.status) query = query.eq("status", filters.status);
      
      const { data, error, count } = await (query as any)
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
        
      if (error) {
        logAdminError("profiles", filters, error);
        throw error;
      }

      // Map counts back to flatter format for UI
      const mappedData = data?.map((user: any) => ({
        ...user,
        bio_pages_count: user.bio_pages?.[0]?.count || 0,
        media_count: user.media?.[0]?.count || 0
      }));

      return { data: mappedData, count };
    } catch (e) {
      console.error("Failed to fetch users:", e);
      return { data: [], count: 0 };
    }
  },

  updateUserPlan: async (userId: string, plan: string) => {
    const { error } = await supabase.from("profiles").update({ subscription_tier: plan }).eq("id", userId);
    if (error) {
      logAdminError("profiles", { userId, plan }, error);
      throw error;
    }
  },

  // License Manager
  getLicenses: async (filters: { query?: string; status?: string; limit?: number; offset?: number }) => {
    try {
      let query = supabase.from("product_licenses").select("*", { count: "exact" });
      if (filters.query) query = query.ilike("license_key", `%${filters.query}%`);
      if (filters.status) query = query.eq("status", filters.status);
      
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
        
      if (error) {
        logAdminError("product_licenses", filters, error);
        throw error;
      }
      return { data, count };
    } catch (e) {
      return { data: [], count: 0 };
    }
  },

  generateLicenses: async (count: number, plan: string, durationDays: number) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const keys = Array.from({ length: count }).map(() => ({
      license_key: `ZUP-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      plan: plan.toLowerCase() as any,
      status: 'unused' as any,
      expires_at: expiresAt.toISOString(),
      max_devices: 1
    }));
    
    const { data, error } = await supabase.from("product_licenses").insert(keys).select();
    if (error) {
      logAdminError("product_licenses", { count, plan }, error);
      throw error;
    }
    return data;
  },

  // System Dashboard / KPIs
  getKPIs: async () => {
    try {
      const [
        { count: totalUsers },
        { count: totalPages },
        { count: activeToday },
        { data: revenueData },
        { count: totalStores },
        { count: totalBookings },
        { count: totalDomains }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("bio_pages").select("*", { count: "exact", head: true }),
        supabase.from("activity_logs").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
        supabase.from("billing_payments").select("amount_minor").eq("status", "captured"),
        supabase.from("bio_store_items").select("*", { count: "exact", head: true }),
        supabase.from("bio_bookings").select("*", { count: "exact", head: true }),
        supabase.from("domains").select("*", { count: "exact", head: true })
      ]);

      const totalRevenue = (revenueData || []).reduce((acc: number, curr: any) => acc + (curr.amount_minor || 0), 0) / 100;

      return {
        totalUsers: totalUsers || 0,
        totalPages: totalPages || 0,
        activeToday: activeToday || 0,
        totalRevenue: totalRevenue || 0,
        totalStores: totalStores || 0,
        totalBookings: totalBookings || 0,
        totalDomains: totalDomains || 0,
        growth: 0
      };
    } catch (e) {
      console.error("KPI Audit Failure:", e);
      return {
        totalUsers: 0, totalPages: 0, activeToday: 0, totalRevenue: 0,
        totalStores: 0, totalBookings: 0, totalDomains: 0, growth: 0
      };
    }
  },

  getSubscriptions: async (filters: { query?: string; status?: string; limit?: number; offset?: number }) => {
    try {
      let query = supabase
        .from("billing_subscriptions")
        .select(`
          id, 
          status, 
          trial_end, 
          current_period_end, 
          unit_amount_minor,
          billing_plans(name, tier),
          workspaces(owner_id)
        `, { count: "exact" });
      
      if (filters.status) query = query.eq("status", filters.status);

      const { data, error, count } = await (query as any)
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
        
      if (error) {
        logAdminError("billing_subscriptions", filters, error);
        throw error;
      }

      // We need to fetch owner profile details separately or via a join if possible
      // Profiles are linked to workspaces via profiles.active_workspace_id OR workspace_members
      // For simplicity in this structure, let's assume we can join profiles if they were members or owners
      // But based on the schema, workspace has no direct owner_id column, it's usually in workspace_members or profiles.active_workspace_id
      
      const flattenedData = data?.map((sub: any) => ({
        id: sub.id,
        subscription_plan: sub.billing_plans?.tier || sub.billing_plans?.name,
        subscription_status: sub.status,
        subscription_expiry: sub.current_period_end || sub.trial_end,
        last_payment_amount: (sub.unit_amount_minor || 0) / 100,
        workspace_id: sub.workspaces?.id
      }));

      return { data: flattenedData, count };
    } catch (e) {
      console.error("Failed to fetch subscriptions:", e);
      return { data: [], count: 0 };
    }
  }
};
