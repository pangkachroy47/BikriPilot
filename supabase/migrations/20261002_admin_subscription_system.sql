-- =========================================================================
-- BikriPilot: Admin Control + Payment Approval + Subscription Access System
-- Migration: 20261002_admin_subscription_system.sql
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (Extend with roles and account status)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin', 'support')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PLANS TABLE
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'BDT',
  duration_days INTEGER NOT NULL DEFAULT 30,
  max_orders INTEGER NOT NULL DEFAULT 100,
  max_products INTEGER NOT NULL DEFAULT 25,
  max_ai_parses INTEGER NOT NULL DEFAULT 50,
  features_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 1,
  badge TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default plans if table is empty
INSERT INTO public.plans (id, name, slug, price, currency, duration_days, max_orders, max_products, max_ai_parses, features_json, is_active, sort_order, badge)
VALUES
  ('free_trial', 'Free Trial', 'free-trial', 0, 'BDT', 14, 50, 25, 50, '["৫০টি AI মেসেঞ্জার অর্ডার ক্যাপচার", "ম্যানুয়াল অর্ডার ট্র্যাকিং", "বাংলা PDF ইনভয়েস", "রিটার্ন লস হিসাব"]'::jsonb, true, 1, 'ফ্রি ট্রায়াল'),
  ('founder', 'Founder Deal', 'founder', 99, 'BDT', 60, 300, 150, 300, '["৩০০টি AI মেসেঞ্জার অর্ডার ক্যাপচার", "৬০ দিন আনলিমিটেড সার্ভিস", "CSV এক্সপোর্ট ও ইমপোর্ট", "অডিট রিপোর্ট", "ভিআইপি হেল্পলাইন"]'::jsonb, true, 2, 'সেরা অফার 🔥'),
  ('standard', 'Standard Pack', 'standard', 249, 'BDT', 30, 800, 500, 800, '["৮০০টি AI মেসেঞ্জার অর্ডার ক্যাপচার", "আনলিমিটেড প্রোডাক্ট ও ইনভেন্টরি", "৭ দিনের সেলস ও নিট প্রফিট গ্রাফ", "বাংলা ইনভয়েস"]'::jsonb, true, 3, 'জনপ্রিয়'),
  ('growth', 'Growth Pro', 'growth', 499, 'BDT', 30, 3000, 5000, 3000, '["৩০০০টি AI মেসেঞ্জার অর্ডার ক্যাপচার", "মাল্টি-শপ সাপোর্ট", "অ্যাড কস্ট ও ROI অ্যানালিটিক্স", "সকল প্রিমিয়াম ফিচার আনলক"]'::jsonb, true, 4, 'বড় পেজের জন্য')
ON CONFLICT (id) DO NOTHING;

-- 3. SHOPS TABLE (Extend)
CREATE TABLE IF NOT EXISTS public.shops (
  id TEXT PRIMARY KEY DEFAULT ('shop_' || substr(md5(random()::text), 1, 10)),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fb_page_name TEXT DEFAULT '',
  fb_page_url TEXT DEFAULT '',
  category TEXT DEFAULT 'Fashion & Clothing',
  phone TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  default_delivery_inside NUMERIC(10, 2) DEFAULT 70,
  default_delivery_outside NUMERIC(10, 2) DEFAULT 130,
  default_packaging_cost NUMERIC(10, 2) DEFAULT 20,
  default_ad_cost NUMERIC(10, 2) DEFAULT 150,
  subscription_plan TEXT NOT NULL DEFAULT 'free_trial' REFERENCES public.plans(id),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('trial', 'pending_approval', 'active', 'expired', 'suspended', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text), 1, 12)),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id TEXT REFERENCES public.shops(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'pending', 'active', 'expired', 'suspended', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT ('pay_' || substr(md5(random()::text), 1, 12)),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id TEXT REFERENCES public.shops(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bKash', 'Nagad', 'Rocket', 'Manual', 'Bank')),
  payment_number TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  screenshot_url TEXT,
  customer_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
  admin_note TEXT,
  rejection_reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching transaction IDs and user payments
CREATE INDEX IF NOT EXISTS idx_payments_trx_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 6. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY DEFAULT ('cpn_' || substr(md5(random()::text), 1, 8)),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  plan_id TEXT REFERENCES public.plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. COUPON USAGES TABLE
CREATE TABLE IF NOT EXISTS public.coupon_usages (
  id TEXT PRIMARY KEY DEFAULT ('cpu_' || substr(md5(random()::text), 1, 10)),
  coupon_id TEXT NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES public.payments(id),
  discount_amount NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY DEFAULT ('anc_' || substr(md5(random()::text), 1, 10)),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'maintenance')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + interval '30 days'),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'active', 'expired', 'specific_plan', 'specific_user')),
  target_plan TEXT REFERENCES public.plans(id),
  target_user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif_' || substr(md5(random()::text), 1, 12)),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'payment', 'subscription', 'alert')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY DEFAULT ('audit_' || substr(md5(random()::text), 1, 12)),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  admin_email TEXT,
  action TEXT NOT NULL,
  target_user_id UUID,
  target_entity TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. ADMIN SETTINGS TABLE (Singleton)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  business_name TEXT NOT NULL DEFAULT 'BikriPilot HQ',
  support_phone TEXT NOT NULL DEFAULT '01700000000',
  support_whatsapp TEXT NOT NULL DEFAULT '01700000000',
  support_email TEXT NOT NULL DEFAULT 'support@bikripilot.com',
  payment_number TEXT NOT NULL DEFAULT '01712345678',
  payment_method TEXT NOT NULL DEFAULT 'bKash / Nagad Personal',
  payment_instructions TEXT NOT NULL DEFAULT 'Send Money (ব্যক্তিগত) করুন। তারপর নিচের ফরমে আপনার প্রেরক নম্বর ও TrxID লিখে সাবমিট করুন। ৩-১০ মিনিটের মধ্যে ভেরিফাই করা হবে।',
  default_currency TEXT NOT NULL DEFAULT 'BDT',
  logo_url TEXT,
  terms_url TEXT,
  privacy_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial admin settings
INSERT INTO public.admin_settings (id, business_name, support_phone, support_whatsapp, support_email, payment_number, payment_method, payment_instructions)
VALUES (1, 'BikriPilot Bangladesh', '01700000000', '01700000000', 'support@bikripilot.com', '01712345678', 'bKash / Nagad Personal', 'বিকাশ বা নগদ Personal নম্বরে Send Money করুন। তারপর নিচের ফর্মে TrxID ও নম্বর দিয়ে রিকোয়েস্ট সাবমিট করুন।')
ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Helper function to check if the current auth user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'support')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())); -- Prevent self-role elevation

CREATE POLICY "Admins full access on profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- 2. Plans RLS
CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (public.is_admin());

-- 3. Shops RLS
CREATE POLICY "Users can view their own shops" ON public.shops
  FOR SELECT USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can insert their own shops" ON public.shops
  FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update their own shops" ON public.shops
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete their own shops" ON public.shops
  FOR DELETE USING (owner_id = auth.uid() OR public.is_admin());

-- 3b. Anti-tampering Triggers for Shops and Profiles
CREATE OR REPLACE FUNCTION public.fn_protect_shop_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- If not an admin, block tampering of subscription plan, status, and expiry
  IF NOT public.is_admin() THEN
    IF (NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan) OR
       (NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at) THEN
      RAISE EXCEPTION 'Unauthorized: Only administrators can modify subscription plan or expiry date.';
    END IF;

    -- Allow user to transition to 'pending_approval' when submitting a payment request
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      IF NOT (OLD.subscription_status IN ('expired', 'trial', 'active') AND NEW.subscription_status = 'pending_approval') THEN
        RAISE EXCEPTION 'Unauthorized: Normal users cannot activate or modify subscription status directly.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_shop_subscription ON public.shops;
CREATE TRIGGER tr_protect_shop_subscription
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.fn_protect_shop_subscription();

-- 3c. Anti-tampering Trigger for Profiles Role and Account Status
CREATE OR REPLACE FUNCTION public.fn_protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot change or elevate their own role.';
    END IF;
    IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot alter account status.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_user_role ON public.profiles;
CREATE TRIGGER tr_protect_user_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_protect_user_role();

-- 4. Subscriptions RLS
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_admin());

-- 5. Payments RLS
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can submit payment requests" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (public.is_admin());

-- 6. Coupons RLS
CREATE POLICY "Anyone can check active coupons" ON public.coupons
  FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (public.is_admin());

-- 7. Announcements RLS
CREATE POLICY "Anyone can read active announcements" ON public.announcements
  FOR SELECT USING (is_active = true AND NOW() BETWEEN start_date AND end_date OR public.is_admin());

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (public.is_admin());

-- 8. Notifications RLS
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());

-- 9. Audit Logs RLS
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (public.is_admin());

-- 10. Admin Settings RLS
CREATE POLICY "Anyone can read public admin settings" ON public.admin_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update admin settings" ON public.admin_settings
  FOR UPDATE USING (public.is_admin());
