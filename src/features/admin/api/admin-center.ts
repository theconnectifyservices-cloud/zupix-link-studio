import { supabase } from "@/integrations/supabase/client";

export const adminCenterApi = {
  // User Management
  getUsers: async (filters: { query?: string; plan?: string; status?: string; limit?: number; offset?: number }) => {
    let query = (supabase as any).from("profiles").select("*, user_roles(role), bio_pages(count), assets(count)", { count: "exact" });
    
    if (filters.query) {
      query = query.or(`full_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`);
    }
    if (filters.plan) query = query.eq("subscription_plan", filters.plan);
    if (filters.status) query = query.eq("status", filters.status);
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
      
    if (error) throw error;
    return { data, count };
  },

  updateUserPlan: async (userId: string, plan: string) => {
    const { error } = await supabase.from("profiles").update({ subscription_plan: plan } as any).eq("id", userId);
    if (error) throw error;
  },

  // License Manager
  getLicenses: async (filters: { query?: string; status?: string; limit?: number; offset?: number }) => {
    let query = (supabase as any).from("product_licenses").select("*", { count: "exact" });
    if (filters.query) query = query.ilike("key", `%${filters.query}%`);
    if (filters.status) query = query.eq("status", filters.status);
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
    if (error) throw error;
    return { data, count };
  },

  generateLicenses: async (count: number, plan: string, durationDays: number) => {
    const keys = Array.from({ length: count }).map(() => ({
      key: `ZUP-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      plan_code: plan,
      duration_days: durationDays,
      status: 'active'
    }));
    const { data, error } = await (supabase as any).from("product_licenses").insert(keys).select();
    if (error) throw error;
    return data;
  },

  // System Dashboard / KPIs
  getKPIs: async () => {
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
      (supabase as any).from("activity_logs").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      (supabase as any).from("payment_transactions").select("amount").eq("status", "success"),
      (supabase as any).from("bio_store_items").select("*", { count: "exact", head: true }),
      (supabase as any).from("bio_bookings").select("*", { count: "exact", head: true }),
      (supabase as any).from("custom_domains").select("*", { count: "exact", head: true })
    ]);

    const totalRevenue = (revenueData || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

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
  },

  getSubscriptions: async (filters: { query?: string; status?: string; limit?: number; offset?: number }) => {
    let query = (supabase as any).from("profiles").select("id, full_name, email, subscription_plan, subscription_status, subscription_expiry, last_payment_amount", { count: "exact" });
    
    if (filters.query) {
      query = query.or(`full_name.ilike.%${filters.query}%,email.ilike.%${filters.query}%`);
    }
    if (filters.status) query = query.eq("subscription_status", filters.status);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
      
    if (error) throw error;
    return { data, count };
  }
};
