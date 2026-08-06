import { supabase } from "@/integrations/supabase/client";
import { 
  AutomationRule, 
  DashboardNotification, 
  ActivityLogEntry, 
  UserAutomationSettings,
  AutomationTrigger,
  AutomationAction,
  NotificationType
} from "../types";
import { trackCustomerActivity } from "@/features/customers/lib/auto-collect";

export interface TriggerPayload {
  workspace_id: string;
  trigger: AutomationTrigger;
  metadata?: Record<string, any>;
}


export async function processTrigger(payload: TriggerPayload): Promise<void> {
  const { workspace_id, trigger, metadata = {} } = payload;
  
  // 1. Log activity
  const title = `Event: ${trigger.replace(/_/g, " ").replace(/\./g, " ")}`;
  const description = metadata.message || `System triggered ${trigger} event.`;
  
  await supabase.from("activity_timeline" as any).insert({
    workspace_id,
    type: trigger,
    title,
    description,
    metadata,
    created_at: new Date().toISOString()
  });

  // 1.5. Auto-collect customer if applicable
  if (trigger === "form_submission" || trigger === "booking_created" || trigger === "payment_success" || trigger === "store_order_new") {
    const customerName = metadata.name || metadata.customer_name || "Visitor";
    const customerEmail = metadata.email;
    const customerPhone = metadata.phone;
    
    await trackCustomerActivity({
      workspaceId: workspace_id,
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      source: trigger.split('_')[0].replace(/\./g, ' '),
      activity: {
        type: trigger,
        title: title,
        description: description,
        metadata: metadata
      }
    });
  }


  // 2. Find active rules for this trigger
  const { data: rules } = await supabase
    .from("automation_rules" as any)
    .select("*")
    .eq("workspace_id", workspace_id)
    .eq("trigger", trigger)
    .eq("is_active", true);

  if (!rules || rules.length === 0) return;

  // 3. Execute actions
  for (const rule of rules) {
    const r = rule as any as AutomationRule;
    try {
      await executeAction(r, metadata);
    } catch (err) {
      console.error(`Failed to execute action for rule ${r.id}:`, err);
    }
  }
}

async function executeAction(rule: AutomationRule, metadata: Record<string, any>): Promise<void> {
  const { workspace_id, action, config } = rule;

  switch (action) {
    case "dashboard_notification":
      await supabase.from("dashboard_notifications" as any).insert({
        workspace_id,
        type: resolveNotificationType(rule.trigger),
        title: rule.name,
        message: metadata.message || `Automated notification from ${rule.name}`,
        read: false,
        metadata,
        created_at: new Date().toISOString()
      });
      break;

    case "activity_log":
      await supabase.from("activity_timeline" as any).insert({
        workspace_id,
        type: "automation",
        title: `Automation: ${rule.name}`,
        description: `Successfully executed workflow action.`,
        metadata: { rule_id: rule.id, ...metadata },
        created_at: new Date().toISOString()
      });
      break;

    case "send_email":
      // In a real app, this would call an email service (Resend, SendGrid, etc.)
      console.log(`[Email Action] Sending email for ${rule.name} in workspace ${workspace_id}`);
      break;

    case "send_whatsapp":
      // This would call the WhatsApp Business API
      console.log(`[WhatsApp Action] Sending WhatsApp for ${rule.name}`);
      break;

    default:
      console.warn(`Action ${action} not yet implemented in engine.`);
  }
}

function resolveNotificationType(trigger: AutomationTrigger): NotificationType {
  if (trigger.includes("form")) return "form";
  if (trigger.includes("order") || trigger.includes("store")) return "order";
  if (trigger.includes("booking")) return "booking";
  if (trigger.includes("payment")) return "payment";
  return "update";
}
