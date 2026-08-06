import { supabase } from "@/integrations/supabase/client";

const logMonitoringError = (table: string, query: any, error: any) => {
  console.error(`[Admin Monitoring Error] Table: ${table}`, {
    query,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
};

export const adminMonitoringApi = {
  getSystemHealth: async () => {
    try {
      // The system_health table was not found in types.ts.
      // We'll attempt a safe read and return empty if it fails.
      const { data, error } = await (supabase as any)
        .from("system_health")
        .select("*")
        .order("service_name");
      
      if (error) {
        logMonitoringError("system_health", "getSystemHealth", error);
        return [];
      }
      return data;
    } catch (e) {
      return [];
    }
  },

  getErrorLogs: async (filters: any) => {
    try {
      // The error_logs table was not found in types.ts.
      let query = (supabase as any).from("error_logs").select("*", { count: "exact" });
      
      if (filters.status) query = query.eq("status", filters.status);
      if (filters.severity) query = query.eq("severity", filters.severity);
      
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
        
      if (error) {
        logMonitoringError("error_logs", filters, error);
        return { data: [], count: 0 };
      }
      return { data, count };
    } catch (e) {
      return { data: [], count: 0 };
    }
  },

  getActivityLogs: async (filters: any) => {
    try {
      // activity_logs exists in types.ts
      let query = (supabase as any).from("activity_logs").select("*", { count: "exact" });
      
      if (filters.action) query = query.eq("action", filters.action);
      if (filters.user_id) query = query.eq("user_id", filters.user_id);
      
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
        
      if (error) {
        logMonitoringError("activity_logs", filters, error);
        return { data: [], count: 0 };
      }
      return { data, count };
    } catch (e) {
      return { data: [], count: 0 };
    }
  },

  getBackupHistory: async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("backup_history")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        logMonitoringError("backup_history", "getBackupHistory", error);
        return [];
      }
      return data;
    } catch (e) {
      return [];
    }
  },

  getSecurityEvents: async (filters: any) => {
    try {
      let query = (supabase as any).from("security_events").select("*", { count: "exact" });
      
      if (filters.is_suspicious !== undefined) query = query.eq("is_suspicious", filters.is_suspicious);
      
      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 10) - 1);
        
      if (error) {
        logMonitoringError("security_events", filters, error);
        return { data: [], count: 0 };
      }
      return { data, count };
    } catch (e) {
      return { data: [], count: 0 };
    }
  },

  getStorageAnalytics: async () => {
    try {
      // assets exists in types.ts
      const { data: assets, error } = await (supabase as any).from("assets").select("id, size, kind");
      
      if (error) {
        logMonitoringError("assets", "getStorageAnalytics", error);
        throw error;
      }
      
      if (!assets || assets.length === 0) {
        return {
          total: 20 * 1024 * 1024 * 1024,
          used: 0,
          categories: {}
        };
      }
      
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
        used: 0,
        categories: {}
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
    
    if (error) {
      logMonitoringError("backup_history", "createBackup", error);
      throw error;
    }
    return data;
  }
};
