import { supabase } from "@/integrations/supabase/client";

export const adminMonitoringApi = {
  getSystemHealth: async () => {
    const { data, error } = await supabase
      .from("system_health")
      .select("*")
      .order("service_name");
    if (error) throw error;
    return data;
  },

  getErrorLogs: async (filters: any) => {
    let query = supabase.from("error_logs").select("*", { count: "exact" });
    
    if (filters.status) query = query.eq("status", filters.status);
    if (filters.severity) query = query.eq("severity", filters.severity);
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
      
    if (error) throw error;
    return { data, count };
  },

  getActivityLogs: async (filters: any) => {
    let query = supabase.from("activity_logs").select("*", { count: "exact" });
    
    if (filters.action) query = query.eq("action", filters.action);
    if (filters.user_id) query = query.eq("user_id", filters.user_id);
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
      
    if (error) throw error;
    return { data, count };
  },

  getBackupHistory: async () => {
    const { data, error } = await supabase
      .from("backup_history")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },

  getSecurityEvents: async (filters: any) => {
    let query = supabase.from("security_events").select("*", { count: "exact" });
    
    if (filters.is_suspicious !== undefined) query = query.eq("is_suspicious", filters.is_suspicious);
    
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
      
    if (error) throw error;
    return { data, count };
  },

  getStorageAnalytics: async () => {
    // In a real scenario, this might be a complex RPC or aggregate query
    // For now, we'll simulate it with a count from assets table if it exists, or dummy data
    const { data: assets, error } = await supabase.from("assets").select("id, size, kind");
    if (error) {
      // Return mock data if table doesn't exist or error
      return {
        total: 20 * 1024 * 1024 * 1024, // 20GB
        used: 4.5 * 1024 * 1024 * 1024, // 4.5GB
        categories: {
          images: 2.1 * 1024 * 1024 * 1024,
          videos: 1.5 * 1024 * 1024 * 1024,
          files: 0.9 * 1024 * 1024 * 1024,
          digital_products: 0
        }
      };
    }
    
    const used = assets.reduce((acc, curr) => acc + (curr.size || 0), 0);
    const categories = assets.reduce((acc, curr) => {
      const kind = curr.kind || 'files';
      acc[kind] = (acc[kind] || 0) + (curr.size || 0);
      return acc;
    }, {} as any);

    return {
      total: 20 * 1024 * 1024 * 1024,
      used,
      categories
    };
  },

  createBackup: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("backup_history")
      .insert({
        name: `Manual Backup ${new Date().toISOString()}`,
        status: 'processing',
        created_by: user?.id
      })
      .select()
      .single();
    if (error) throw error;
    
    // Trigger actual backup logic here (e.g. Edge Function)
    return data;
  }
};
