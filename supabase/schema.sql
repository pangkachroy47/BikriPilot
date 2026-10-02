-- =========================================================================
-- BikriPilot: Production Supabase PostgreSQL Schema & Row Level Security (RLS)
-- Tailored for Multi-Tenant Bangladeshi F-Commerce Order & Profit Assistant
-- =========================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =========================================================================
-- 1. PROFILES TABLE (User profiles linked to auth.users)
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  phone text,
  role text not null default 'seller' check (role in ('seller', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- 2. SHOPS TABLE (Multi-tenant Shops owned by sellers)
-- =========================================================================
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  fb_page_name text not null default '',
  fb_page_url text default '',
  category text not null default 'fashion' check (category in ('fashion', 'food', 'gadgets', 'cosmetics', 'general')),
  phone text not null default '',
  logo_url text default '',
  default_delivery_inside numeric(10,2) not null default 80 check (default_delivery_inside >= 0),
  default_delivery_outside numeric(10,2) not null default 130 check (default_delivery_outside >= 0),
  default_packaging_cost numeric(10,2) not null default 25 check (default_packaging_cost >= 0),
  default_ad_cost numeric(10,2) not null default 110 check (default_ad_cost >= 0),
  subscription_plan text not null default 'free_trial' check (subscription_plan in ('free_trial', 'founder', 'standard', 'growth')),
  subscription_status text not null default 'active' check (subscription_status in ('active', 'expired', 'pending_approval')),
  subscription_expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- 3. PRODUCTS TABLE (Catalog & Inventory isolated per shop)
-- =========================================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  sku text not null,
  variant text not null default 'Standard',
  selling_price numeric(10,2) not null default 0 check (selling_price >= 0),
  cost_price numeric(10,2) not null default 0 check (cost_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- 4. CUSTOMERS TABLE (Customer Database & History isolated per shop)
-- =========================================================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text not null,
  district text not null default 'ঢাকা',
  thana text default '',
  full_address text default '',
  total_orders integer not null default 0 check (total_orders >= 0),
  delivered_orders integer not null default 0 check (delivered_orders >= 0),
  returned_orders integer not null default 0 check (returned_orders >= 0),
  total_sales numeric(12,2) not null default 0 check (total_sales >= 0),
  estimated_profit numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_customers_shop_phone unique (shop_id, phone)
);

-- =========================================================================
-- 5. ORDERS TABLE (Order Management & Real-time Profit Tracking)
-- =========================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  order_number text not null,
  
  -- Customer & Delivery Details
  customer_name text not null,
  phone text not null,
  district text not null default 'ঢাকা',
  thana text default '',
  full_address text not null,
  
  -- Item Details
  product_name text not null,
  variant text default '',
  quantity integer not null default 1 check (quantity >= 1),
  
  -- Revenue Structure
  selling_price numeric(10,2) not null default 0 check (selling_price >= 0),
  delivery_charge numeric(10,2) not null default 0 check (delivery_charge >= 0),
  advance_payment numeric(10,2) not null default 0 check (advance_payment >= 0),
  payment_method text not null default 'Cash on Delivery',
  
  -- Expense Breakdown (For True Net Profit Calculation)
  product_cost numeric(10,2) not null default 0 check (product_cost >= 0),
  courier_cost numeric(10,2) not null default 0 check (courier_cost >= 0),
  packaging_cost numeric(10,2) not null default 0 check (packaging_cost >= 0),
  ad_cost numeric(10,2) not null default 0 check (ad_cost >= 0),
  other_cost numeric(10,2) not null default 0 check (other_cost >= 0),
  
  -- Return Expense Tracking
  return_courier_cost numeric(10,2) not null default 0 check (return_courier_cost >= 0),
  return_loss_amount numeric(10,2) not null default 0 check (return_loss_amount >= 0),
  
  -- Calculated Metrics
  calculated_profit numeric(10,2) not null default 0,
  profit_margin_pct numeric(5,2) not null default 0,
  
  -- Order Status & Metadata
  status text not null default 'New' check (status in ('New', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned')),
  notes text default '',
  invoice_id text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- 6. AI PARSE LOGS TABLE (Tracks Gemini AI extractions & monthly limits)
-- =========================================================================
create table if not exists public.ai_parse_logs (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  input_text text not null,
  parsed_json jsonb not null,
  model text not null default 'gemini-3.8-flash',
  created_at timestamptz not null default now()
);

-- =========================================================================
-- 7. PAYMENT VERIFICATIONS (Manual bKash/Nagad BDT Subscription Audit)
-- =========================================================================
create table if not exists public.payment_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan_name text not null check (plan_name in ('founder', 'standard', 'growth')),
  amount numeric(10,2) not null check (amount >= 0),
  payment_method text not null check (payment_method in ('bKash', 'Nagad', 'Rocket')),
  transaction_id text not null,
  sender_phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text default '',
  created_at timestamptz not null default now(),
  verified_at timestamptz
);

-- =========================================================================
-- 8. INDEXES FOR PERFORMANCE & FAST RETRIEVAL
-- =========================================================================
create index if not exists idx_shops_owner on public.shops(owner_id);
create index if not exists idx_products_shop on public.products(shop_id);
create index if not exists idx_customers_shop_phone on public.customers(shop_id, phone);
create index if not exists idx_orders_shop on public.orders(shop_id);
create index if not exists idx_orders_shop_status on public.orders(shop_id, status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_ai_parse_shop_month on public.ai_parse_logs(shop_id, created_at desc);
create index if not exists idx_payment_verifications_status on public.payment_verifications(status);

-- =========================================================================
-- 9. FUNCTIONS & AUTOMATED TRIGGERS
-- =========================================================================

-- Trigger to update 'updated_at' column automatically
create or replace function public.fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_profiles_updated_at
  before update on public.profiles
  for each row execute function public.fn_set_updated_at();

create trigger tr_shops_updated_at
  before update on public.shops
  for each row execute function public.fn_set_updated_at();

create trigger tr_products_updated_at
  before update on public.products
  for each row execute function public.fn_set_updated_at();

create trigger tr_customers_updated_at
  before update on public.customers
  for each row execute function public.fn_set_updated_at();

create trigger tr_orders_updated_at
  before update on public.orders
  for each row execute function public.fn_set_updated_at();

-- Auto create profile when new auth.user is created
create or replace function public.fn_handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'seller'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger tr_on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- =========================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- Strict multi-tenant isolation: sellers can ONLY read/write data of shops they own
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.ai_parse_logs enable row level security;
alter table public.payment_verifications enable row level security;

-- PROFILES POLICIES
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- SHOPS POLICIES
create policy "shops_select_own"
  on public.shops for select
  using (auth.uid() = owner_id);

create policy "shops_insert_own"
  on public.shops for insert
  with check (auth.uid() = owner_id);

create policy "shops_update_own"
  on public.shops for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "shops_delete_own"
  on public.shops for delete
  using (auth.uid() = owner_id);

-- Anti-tampering Triggers for Shops and Profiles
create or replace function public.fn_protect_shop_subscription()
returns trigger as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    if (new.subscription_plan is distinct from old.subscription_plan) or
       (new.subscription_expires_at is distinct from old.subscription_expires_at) then
      raise exception 'Unauthorized: Only administrators can modify subscription plan or expiry date.';
    end if;

    if new.subscription_status is distinct from old.subscription_status then
      if not (old.subscription_status in ('expired', 'trial', 'active') and new.subscription_status = 'pending_approval') then
        raise exception 'Unauthorized: Normal users cannot activate or modify subscription status directly.';
      end if;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_protect_shop_subscription on public.shops;
create trigger tr_protect_shop_subscription
  before update on public.shops
  for each row execute function public.fn_protect_shop_subscription();

create or replace function public.fn_protect_user_role()
returns trigger as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    if new.role is distinct from old.role then
      raise exception 'Unauthorized: Users cannot change or elevate their own role.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_protect_user_role on public.profiles;
create trigger tr_protect_user_role
  before update on public.profiles
  for each row execute function public.fn_protect_user_role();

-- PRODUCTS POLICIES (Isolated through shop ownership)
create policy "products_select_shop_owner"
  on public.products for select
  using (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "products_insert_shop_owner"
  on public.products for insert
  with check (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "products_update_shop_owner"
  on public.products for update
  using (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "products_delete_shop_owner"
  on public.products for delete
  using (
    exists (
      select 1 from public.shops
      where shops.id = products.shop_id
        and shops.owner_id = auth.uid()
    )
  );

-- CUSTOMERS POLICIES (Isolated through shop ownership)
create policy "customers_select_shop_owner"
  on public.customers for select
  using (
    exists (
      select 1 from public.shops
      where shops.id = customers.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "customers_insert_shop_owner"
  on public.customers for insert
  with check (
    exists (
      select 1 from public.shops
      where shops.id = customers.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "customers_update_shop_owner"
  on public.customers for update
  using (
    exists (
      select 1 from public.shops
      where shops.id = customers.shop_id
        and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = customers.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "customers_delete_shop_owner"
  on public.customers for delete
  using (
    exists (
      select 1 from public.shops
      where shops.id = customers.shop_id
        and shops.owner_id = auth.uid()
    )
  );

-- ORDERS POLICIES (Isolated through shop ownership)
create policy "orders_select_shop_owner"
  on public.orders for select
  using (
    exists (
      select 1 from public.shops
      where shops.id = orders.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "orders_insert_shop_owner"
  on public.orders for insert
  with check (
    exists (
      select 1 from public.shops
      where shops.id = orders.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "orders_update_shop_owner"
  on public.orders for update
  using (
    exists (
      select 1 from public.shops
      where shops.id = orders.shop_id
        and shops.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.shops
      where shops.id = orders.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "orders_delete_shop_owner"
  on public.orders for delete
  using (
    exists (
      select 1 from public.shops
      where shops.id = orders.shop_id
        and shops.owner_id = auth.uid()
    )
  );

-- AI PARSE LOGS POLICIES
create policy "ai_parse_logs_select_shop_owner"
  on public.ai_parse_logs for select
  using (
    exists (
      select 1 from public.shops
      where shops.id = ai_parse_logs.shop_id
        and shops.owner_id = auth.uid()
    )
  );

create policy "ai_parse_logs_insert_shop_owner"
  on public.ai_parse_logs for insert
  with check (
    exists (
      select 1 from public.shops
      where shops.id = ai_parse_logs.shop_id
        and shops.owner_id = auth.uid()
    )
  );

-- PAYMENT VERIFICATIONS POLICIES
create policy "payment_verifications_select_own"
  on public.payment_verifications for select
  using (auth.uid() = user_id);

create policy "payment_verifications_insert_own"
  on public.payment_verifications for insert
  with check (auth.uid() = user_id);
