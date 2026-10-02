export type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Packed'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  New: { label: 'নতুন', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  Confirmed: { label: 'নিশ্চিত', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  Packed: { label: 'প্যাক করা', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  Shipped: { label: 'কুরিয়ারে রওয়ানা', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  Delivered: { label: 'সফল ডেলিভারি', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  Cancelled: { label: 'বাতিল', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  Returned: { label: 'রিটার্ন (ক্ষতি)', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
};

export type SubscriptionPlanId = 'free_trial' | 'founder' | 'standard' | 'growth' | string;

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  nameBn: string;
  priceBDT: number;
  durationLabel: string;
  durationDays: number;
  monthlyAILimit: number;
  badge?: string;
  features: string[];
}

export type SubscriptionStatus = 'trial' | 'pending' | 'active' | 'expired' | 'suspended' | 'cancelled';

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  fb_page_name: string;
  fb_page_url: string;
  category: string;
  phone: string;
  logo_url: string;
  default_delivery_inside: number;
  default_delivery_outside: number;
  default_packaging_cost: number;
  default_ad_cost: number;
  subscription_plan: SubscriptionPlanId;
  subscription_status: 'active' | 'expired' | 'pending_approval' | 'suspended' | 'cancelled' | 'trial';
  subscription_expires_at: string;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  sku: string;
  variant: string;
  selling_price: number;
  cost_price: number;
  stock: number;
  image_url?: string;
  created_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  district: string;
  thana: string;
  full_address: string;
  total_orders: number;
  delivered_orders: number;
  returned_orders: number;
  total_sales: number;
  estimated_profit: number;
  created_at: string;
}

export interface Order {
  id: string;
  shop_id: string;
  order_number: string;
  
  // Customer details
  customer_name: string;
  phone: string;
  district: string;
  thana: string;
  full_address: string;
  
  // Product details
  product_name: string;
  variant: string;
  quantity: number;
  
  // Revenue
  selling_price: number;
  delivery_charge: number;
  advance_payment: number;
  payment_method: string;
  
  // Expenses
  product_cost: number;
  courier_cost: number;
  packaging_cost: number;
  ad_cost: number;
  other_cost: number;
  
  // Return expenses
  return_courier_cost: number;
  return_loss_amount: number;
  
  // Computed
  calculated_profit: number;
  profit_margin_pct: number;
  
  status: OrderStatus;
  notes: string;
  invoice_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AIParsedDraft {
  customer_name: string | null;
  phone: string | null;
  district: string | null;
  thana: string | null;
  address: string | null;
  product_name: string | null;
  variant: string | null;
  quantity: number | null;
  selling_price?: number | null;
  advance_payment?: number | null;
  payment_method?: string | null;
  notes: string | null;
  confidence_score?: number | null;
  missing_fields?: string[];
}

export interface AIParsingLog {
  id: string;
  shop_id: string;
  input_text: string;
  parsed_json: AIParsedDraft;
  model: string;
  created_at: string;
}

// Payment Request & Verification
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded';

export interface PaymentVerification {
  id: string;
  user_id: string;
  shop_id: string;
  plan_name: SubscriptionPlanId;
  amount: number;
  payment_method: 'bKash' | 'Nagad' | 'Rocket' | string;
  payment_number?: string;
  transaction_id: string;
  sender_phone: string;
  screenshot_url?: string;
  customer_note?: string;
  status: PaymentStatus;
  admin_notes?: string;
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  created_at: string;
  verified_at?: string;
}

export type UserRole = 'user' | 'seller' | 'admin' | 'support';
export type UserAccountStatus = 'active' | 'suspended';

export interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: UserRole;
  account_status?: UserAccountStatus;
  admin_notes?: string;
  created_at?: string;
  isLoggedIn?: boolean;
}

export interface OnboardingData {
  shop_name: string;
  fb_page_name: string;
  fb_page_url?: string;
  category: string;
  phone: string;
  default_delivery_inside: number;
  default_delivery_outside: number;
  default_packaging_cost: number;
  default_ad_cost: number;
  first_product?: {
    name: string;
    selling_price: number;
    cost_price: number;
    variant: string;
  };
}

// --- ADMIN CONTROL SYSTEM TYPES ---

export interface SubscriptionRecord {
  id: string;
  user_id: string;
  shop_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  started_at: string;
  expires_at: string;
  cancelled_at?: string;
  cancel_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanRecord {
  id: string;
  name: string;
  nameBn?: string;
  slug: string;
  price: number;
  currency: string;
  duration_days: number;
  max_orders: number;
  max_products: number;
  max_ai_parses: number;
  features_json: string[];
  is_active: boolean;
  sort_order: number;
  badge?: string;
  created_at: string;
  updated_at: string;
}

export interface CouponRecord {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number;
  used_count: number;
  expires_at: string;
  is_active: boolean;
  plan_id?: string;
  created_at: string;
}

export interface AnnouncementRecord {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'maintenance';
  start_date: string;
  end_date: string;
  target_audience: 'all' | 'active' | 'expired' | 'specific_plan' | 'specific_user';
  target_plan?: string;
  target_user_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminSettingsConfig {
  business_name: string;
  support_phone: string;
  support_whatsapp: string;
  support_email: string;
  payment_number: string;
  payment_method: string;
  payment_instructions: string;
  default_currency: string;
  logo_url?: string;
  terms_url?: string;
  privacy_url?: string;
}

export interface AuditLogRecord {
  id: string;
  admin_user_id: string;
  admin_email?: string;
  action: string;
  target_user_id?: string;
  target_entity: string;
  target_entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'payment' | 'subscription' | 'alert';
  read_at?: string;
  created_at: string;
}
