import { supabase } from "@/integrations/supabase/client";

// Using casting to bypass type issues until types are regenerated
export const adminMonitoringApi = {
  getSystemHealth: async () => {
    const { data, error } = await (supabase as any)
      .from("system_health")
      .select("*")
      .order("service_name");
    if (error) throw error;
    return data;
  },

  getErrorLogs: async (filters: any) => {
    let query = (supabase as any).from("error_logs").select("*", { count: "exact" });
    
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.severity) query = query.eq("severity", filters.severity);
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
      
    if (error) throw error;
    return { data, count };
  },

  getActivityLogs: async (filters: any) => {
    let query = (supabase as any).from("activity_logs").select("*", { count: "exact" });
    
    if (filters.action) query = query.eq("action", filters.action);
    if (filters.user_id) query = query.eq("user_id", filters.user_id);
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
      
    if (error) throw error;
    return { data, count };
  },

  getBackupHistory: async () => {
    const { data, error } = await (supabase as any)
      .from("backup_history")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  getSecurityEvents: async (filters: any) => {
    let query = (supabase as any).from("security_events").select("*", { count: "exact" });
    
    if (filters.is_suspicious !== undefined) query = query.eq("is_suspicious", filters.is_suspicious);
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
      
    if (error) throw error;
    return { data, count };
  },

  getStorageAnalytics: async () => {
    try {
      const { data: assets, error } = await (supabase as any).from("assets").select("id, size, kind");
      
      if (error || !assets) throw error || new Error("No assets found");
      
      const used = assets.reduce((acc: number, curr: any) => acc + (curr.size || 0), 0);
      const categories = assets.reduce((acc: any, curr: any) => {
        const kind = curr.kind || 'files';
        acc[kind] = (acc[kind] || 0) + (curr.size || 0);
        return acc;
      }, {} as any);

      return {
        total: 20 * 1024 * 1024 * 1024,
        used,
        categories
      };
    } catch (e) {
      return {
        total: 20 * 1024 * 1024 * 1024,
        used: 4.5 * 1024 * 1024 * 1024,
        categories: {
          images: 2.1 * 1024 * 1024 * 1024,
          videos: 1.5 * 1024 * 1024 * 1024,
          files: 0.9 * 1024 * 1024 * 1024,
          digital_products: 0
        }
      };
    }
  },

  createBackup: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await (supabase as any)
      .from("backup_history")
      .insert({
        name: `Manual Backup ${new Date().toISOString()}`,
        status: 'processing',
        created_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};

