
export type CustomerTag = "Lead" | "Customer" | "VIP" | "Returning" | "Blocked";
export type CustomerStatus = "active" | "inactive" | "blocked";

export interface Customer {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  first_interaction: string;
  latest_activity: string;
  total_orders: number;
  total_payments: number;
  total_bookings: number;
  source: string; // e.g., 'Contact Form', 'Store', 'Booking'
  status: CustomerStatus;
  tags: CustomerTag[];
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CustomerTimelineItem {
  id: string;
  customer_id: string;
  type: string; // 'form_submit', 'booking_created', 'payment_completed', etc.
  title: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CustomerStats {
  total_customers: number;
  new_customers: number; // last 30 days
  returning_customers: number;
  top_buyers: Customer[];
  latest_customers: Customer[];
}
