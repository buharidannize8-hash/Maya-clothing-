-- =====================================================
-- MAYA CLOTHING DATABASE
-- =====================================================


-- ================= PRODUCTS =================

create table if not exists public.products (

  id uuid primary key default gen_random_uuid(),

  name text not null,

  description text,

  category text not null,

  price numeric(12,2) not null,

  image_url text,

  stock integer default 0,

  is_new boolean default false,

  active boolean default true,

  created_at timestamptz
    default now()

);


-- ================= ORDERS =================

create table if not exists public.orders (

  id uuid primary key default gen_random_uuid(),

  user_id uuid
    references auth.users(id)
    on delete cascade,

  total_amount numeric(12,2) not null,

  status text default 'pending',

  created_at timestamptz
    default now()

);


-- ================= ORDER ITEMS =================

create table if not exists public.order_items (

  id uuid primary key default gen_random_uuid(),

  order_id uuid
    references public.orders(id)
    on delete cascade,

  product_id uuid
    references public.products(id)
    on delete set null,

  quantity integer not null,

  price numeric(12,2) not null

);


-- ================= NEWSLETTER =================

create table if not exists public.newsletter (

  id uuid primary key default gen_random_uuid(),

  email text unique not null,

  created_at timestamptz
    default now()

);


-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table public.products
enable row level security;

alter table public.orders
enable row level security;

alter table public.order_items
enable row level security;

alter table public.newsletter
enable row level security;


-- ================= PRODUCTS POLICY =================

create policy
"Anyone can view active products"

on public.products

for select

using (
  active = true
);


-- ================= ORDERS POLICY =================

create policy
"Users can create their own orders"

on public.orders

for insert

to authenticated

with check (
  auth.uid() = user_id
);


create policy
"Users can view their own orders"

on public.orders

for select

to authenticated

using (
  auth.uid() = user_id
);


-- ================= ORDER ITEMS =================

create policy
"Users can create order items"

on public.order_items

for insert

to authenticated

with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);


create policy
"Users can view their order items"

on public.order_items

for select

to authenticated

using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
    and orders.user_id = auth.uid()
  )
);


-- ================= NEWSLETTER =================

create policy
"Anyone can subscribe"

on public.newsletter

for insert

to anon, authenticated

with check (
  true
);


-- =====================================================
-- SAMPLE PRODUCTS
-- =====================================================

insert into public.products
(
  name,
  description,
  category,
  price,
  image_url,
  stock,
  is_new
)

values

(
  'Maya Essential Tee',
  'Premium Maya oversized streetwear T-shirt.',
  'T-Shirts',
  25000,
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85',
  50,
  true
),

(
  'Maya Black Hoodie',
  'Heavyweight Maya streetwear hoodie.',
  'Hoodies',
  45000,
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85',
  30,
  true
),

(
  'Maya Baggy Trousers',
  'Relaxed fit black streetwear trousers.',
  'Trousers',
  40000,
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=85',
  25,
  true
),

(
  'Maya Street Cap',
  'Minimal Maya streetwear cap.',
  'Accessories',
  15000,
  'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=85',
  40,
  false
);
