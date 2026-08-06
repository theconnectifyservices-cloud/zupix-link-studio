import { supabase } from "@/integrations/supabase/client";
import { 
  AutomationRule, 
  DashboardNotification, 
  ActivityLogEntry, 
  UserAutomationSettings
} from "../types";

// --- Rules ---

export async function listAutomationRules(workspaceId: string): Promise<AutomationRule[]> {
  const { data, error } = await supabase
    .from("automation_rules" as any)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error listing automation rules:", error);
    return [];
  }
  return (data as any) || [];
}

export async function createAutomationRule(rule: Omit<AutomationRule, "id" | "created_at">): Promise<AutomationRule> {
  const { data, error } = await supabase
    .from("automation_rules" as any)
    .insert(rule)
    .select("*")
    .single();
    
  if (error) throw error;
  return data as any;
}

export async function updateAutomationRule(id: string, patch: Partial<AutomationRule>): Promise<void> {
  const { error } = await supabase
    .from("automation_rules" as any)
    .update(patch)
    .eq("id", id);
    
  if (error) throw error;
}

export async function deleteAutomationRule(id: string): Promise<void> {
  const { error } = await supabase
    .from("automation_rules" as any)
    .delete()
    .eq("id", id);
    
  if (error) throw error;
}

// --- Notifications ---

export async function listNotifications(workspaceId: string): Promise<DashboardNotification[]> {
  const { data, error } = await supabase
    .from("dashboard_notifications" as any)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);
    
  if (error) {
    console.error("Error listing notifications:", error);
    return [];
  }
  return (data as any) || [];
}

export async function markNotificationRead(id: string, read: boolean = true): Promise<void> {
  const { error } = await supabase
    .from("dashboard_notifications" as any)
    .update({ read })
    .eq("id", id);
    
  if (error) throw error;
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from("dashboard_notifications" as any)
    .delete()
    .eq("id", id);
    
  if (error) throw error;
}

// --- Activity Logs ---

export async function listActivityLogs(workspaceId: string): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from("activity_timeline" as any)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);
    
  if (error) {
    console.error("Error listing activity logs:", error);
    return [];
  }
  return (data as any) || [];
}

// --- Settings ---

export async function getAutomationSettings(workspaceId: string): Promise<UserAutomationSettings> {
  const { data, error } = await supabase
    .from("automation_settings" as any)
    .select("*")
    .eq("workspace_id", workspaceId)
    .single();
    
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching automation settings:", error);
  }
  
  return (data as any) || {
    email_enabled: true,
    whatsapp_enabled: false,
    dashboard_enabled: true
  };
}

export async function updateAutomationSettings(workspaceId: string, settings: UserAutomationSettings): Promise<void> {
  const { error } = await supabase
    .from("automation_settings" as any)
    .upsert({ workspace_id: workspaceId, ...settings }, { onConflict: "workspace_id" });
    
  if (error) throw error;
}
