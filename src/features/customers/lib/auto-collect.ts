
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures a customer exists in the workspace and records an activity.
 * This is the core "Auto-collect" logic.
 */
export async function trackCustomerActivity(params: {
  workspaceId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  source: string;
  activity: {
    type: string;
    title: string;
    description: string;
    metadata?: Record<string, any>;
  };
}) {
  const { workspaceId, name, email, phone, whatsapp, source, activity } = params;

  // 1. Find or create customer (duplicate detection by email/phone)
  let customerId: string | null = null;

  if (email || phone) {
    let query = supabase
      .from("bio_customers" as any)
      .select("id")
      .eq("workspace_id", workspaceId);
    
    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq("email", email);
    } else {
      query = query.eq("phone", phone);
    }

    const { data: existing } = await query.limit(1);
    const existingList = existing as any[] | null;
    if (existingList && existingList.length > 0) {
      customerId = existingList[0].id;
    }
  }

  const now = new Date().toISOString();

  if (!customerId) {
    // Create new
    const { data: created, error } = await supabase
      .from("bio_customers" as any)
      .insert({
        workspace_id: workspaceId,
        name,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        source,
        first_interaction: now,
        latest_activity: now,
        status: "active",
        tags: ["Lead"],
        total_orders: activity.type === "order_created" ? 1 : 0,
        total_payments: activity.type === "payment_completed" ? 1 : 0,
        total_bookings: activity.type === "booking_created" ? 1 : 0,
        metadata: activity.metadata || {}
      } as any)
      .select("id")
      .single();
    
    if (error) {
      console.error("Error auto-collecting customer:", error);
      return;
    }
    customerId = (created as any).id;
  } else {
    // Update existing stats
    const updateData: any = {
      latest_activity: now,
      updated_at: now
    };

    // Increments would normally happen via RPC or trigger, for now just update latest activity
    await supabase
      .from("bio_customers" as any)
      .update(updateData)
      .eq("id", customerId);
  }

  // 2. Record timeline item
  if (customerId) {
    await supabase.from("bio_customer_timeline" as any).insert({
      customer_id: customerId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata || {},
      created_at: now
    } as any);
  }
}
