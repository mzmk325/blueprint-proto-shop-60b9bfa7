-- =========================================================
-- Phase 1: Production catalog backend
-- =========================================================

-- ---------- Enums ----------
create type public.app_role as enum ('admin');
create type public.product_status as enum ('draft', 'published', 'unpublished');

-- ---------- Helpers ----------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- user_roles ----------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin');
$$;

create policy "Users can view own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage roles"
  on public.user_roles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- categories ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_zh text,
  description_en text,
  description_zh text,
  hero_image_url text,
  seo_title text,
  seo_description text,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.categories enable row level security;
create index categories_sort_idx on public.categories(sort_order);

create trigger trg_categories_updated
  before update on public.categories
  for each row execute function public.update_updated_at_column();

create policy "Public can view published categories"
  on public.categories for select to anon, authenticated
  using (is_published = true);

create policy "Admins manage categories"
  on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- products ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legacy_id text unique,
  name_en text not null,
  name_zh text,
  descriptor_en text,
  descriptor_zh text,
  description_en text,
  description_zh text,
  selling_points jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  price numeric(10,2) not null default 0,
  original_price numeric(10,2),
  currency text not null default 'USD',
  cost numeric(10,2),  -- admin-only; never expose publicly
  gender text,
  shape text,
  material text,
  badges text[] not null default '{}',
  is_featured boolean not null default false,
  is_hot boolean not null default false,
  is_new boolean not null default false,
  -- eyewear measurements
  frame_width_mm int,
  lens_width_mm int,
  lens_height_mm int,
  bridge_mm int,
  temple_length_mm int,
  weight_g numeric(6,2),
  -- lifecycle
  status public.product_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create index products_status_idx on public.products(status);
create index products_legacy_idx on public.products(legacy_id);

create trigger trg_products_updated
  before update on public.products
  for each row execute function public.update_updated_at_column();

-- Public can SELECT published rows; the public storefront server fns must
-- still project columns explicitly and never include `cost`. Admin server fns
-- run with elevated client and may read `cost`.
create policy "Public can view published products"
  on public.products for select to anon, authenticated
  using (status = 'published');

create policy "Admins manage products"
  on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- product_categories (M:N) ----------
create table public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, category_id)
);
alter table public.product_categories enable row level security;
create index product_categories_cat_sort_idx on public.product_categories(category_id, sort_order);

create policy "Public can view links for published products & categories"
  on public.product_categories for select to anon, authenticated
  using (
    exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
    and exists (select 1 from public.categories c where c.id = category_id and c.is_published = true)
  );

create policy "Admins manage product_categories"
  on public.product_categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- product_variants ----------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name_en text not null,
  name_zh text,
  color_hex text,
  sku text,
  stock int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.product_variants enable row level security;
create index product_variants_product_idx on public.product_variants(product_id, sort_order);

create trigger trg_product_variants_updated
  before update on public.product_variants
  for each row execute function public.update_updated_at_column();

create policy "Public can view variants of published products"
  on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy "Admins manage product_variants"
  on public.product_variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- assets ----------
create table public.assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text,
  url text not null,
  name text not null,
  note text,
  type text not null default 'other',
  width int,
  height int,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.assets enable row level security;
create index assets_type_idx on public.assets(type);

create policy "Public can view assets"
  on public.assets for select to anon, authenticated
  using (true);

create policy "Admins manage assets"
  on public.assets for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- product_images ----------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete set null,
  url text not null,
  is_primary boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.product_images enable row level security;
create index product_images_product_idx on public.product_images(product_id, sort_order);
create index product_images_variant_idx on public.product_images(variant_id, sort_order);

-- Only one primary image per (product, variant) context. Two partial unique
-- indexes — one for variant-scoped, one for product-level (variant null).
create unique index product_images_one_primary_per_variant
  on public.product_images(product_id, variant_id)
  where is_primary = true and variant_id is not null;

create unique index product_images_one_primary_per_product
  on public.product_images(product_id)
  where is_primary = true and variant_id is null;

create policy "Public can view images of published products"
  on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published'));

create policy "Admins manage product_images"
  on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Storage bucket: product-images ----------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can read product-images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Admins can upload product-images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can update product-images"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

create policy "Admins can delete product-images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());

-- =========================================================
-- Seed: 5 categories + 12 products + product_categories links
-- =========================================================

insert into public.categories (slug, name_en, name_zh, sort_order, is_published) values
  ('women-eyeglasses', 'Women''s Eyeglasses', '女款眼镜', 10, true),
  ('men-eyeglasses',   'Men''s Eyeglasses',   '男款眼镜', 20, true),
  ('sunglasses',       'Sunglasses',          '太阳镜',   30, true),
  ('best-sellers',     'Best Sellers',        '热销榜',   40, true),
  ('new-arrivals',     'New Arrivals',        '新品上架', 50, true)
on conflict (slug) do nothing;

-- Products
with seed(legacy_id, slug, name_en, descriptor_en, price, original_price, gender, shape, material, badges, is_new, is_hot,
          frame_width_mm, lens_width_mm, lens_height_mm, bridge_mm, temple_length_mm, weight_g) as (
  values
    ('p-jace',    'jace',    'Jace',    'Clear Square Designer Glasses Gold Temples', 38.25, 45.00, 'Unisex','Square',   'Acetate', array['BESTSELLER']::text[], false, true,  142,52,44,18,145, 22),
    ('p-perkins', 'perkins', 'Perkins', 'Rounded Tortoise Acetate Frame',              40.50, 45.00, 'Unisex','Round',    'Acetate', array[]::text[],             false, false, 140,50,46,20,145, 24),
    ('p-denzel',  'denzel',  'Denzel',  'Bold Rectangle Black Frame',                  40.50, 45.00, 'Men',   'Rectangle','Acetate', array[]::text[],             false, false, 145,54,42,18,148, 26),
    ('p-athina',  'athina',  'Athina',  'Cat Eye Pink Designer Frame',                 45.00, null,  'Women', 'Cat eye',  'Acetate', array['NEW']::text[],        true,  false, 138,52,40,17,142, 20),
    ('p-dardhan', 'dardhan', 'Dardhan', 'Geometric Gold Wire Frame',                   65.00, null,  'Unisex','Geometric','Titanium',array['ECO']::text[],        false, false, 144,53,45,19,147, 16),
    ('p-mira',    'mira',    'Mira',    'Oversized Round Tortoise',                    52.00, 60.00, 'Women', 'Round',    'Acetate', array[]::text[],             false, false, 140,52,48,19,145, 23),
    ('p-orion',   'orion',   'Orion',   'Classic Aviator Metal Frame',                 58.00, null,  'Men',   'Aviator',  'Metal',   array[]::text[],             false, false, 143,56,50,16,145, 18),
    ('p-luna',    'luna',    'Luna',    'Butterfly Statement Frame',                   48.00, 56.00, 'Women', 'Butterfly','Acetate', array[]::text[],             false, false, 142,54,46,17,142, 22),
    ('p-kai',     'kai',     'Kai',     'Minimal Oval Wire Frame',                     42.00, null,  'Unisex','Oval',     'Metal',   array['ECO']::text[],        false, false, 138,50,42,19,145, 14),
    ('p-noir',    'noir',    'Noir',    'Bold Square Matte Black',                     55.00, null,  'Men',   'Square',   'Acetate', array[]::text[],             false, false, 146,55,44,18,148, 27),
    ('p-soleil',  'soleil',  'Soleil',  'Round Sunglasses Green Tint',                 62.00, 72.00, 'Unisex','Round',    'Metal',   array['NEW']::text[],        true,  false, 140,52,48,19,145, 19),
    ('p-vera',    'vera',    'Vera',    'Rectangle Reading Frame',                     35.00, null,  'Women', 'Rectangle','Acetate', array[]::text[],             false, false, 138,51,40,18,143, 21)
)
insert into public.products (
  legacy_id, slug, name_en, descriptor_en, price, original_price, gender, shape, material, badges,
  is_new, is_hot, frame_width_mm, lens_width_mm, lens_height_mm, bridge_mm, temple_length_mm, weight_g,
  status, published_at
)
select legacy_id, slug, name_en, descriptor_en, price, original_price, gender, shape, material, badges,
       is_new, is_hot, frame_width_mm, lens_width_mm, lens_height_mm, bridge_mm, temple_length_mm, weight_g,
       'published'::public.product_status, now()
from seed
on conflict (slug) do nothing;

-- Link products to categories by gender + badges
insert into public.product_categories (product_id, category_id, sort_order)
select p.id, c.id, 0 from public.products p
join public.categories c on c.slug = 'women-eyeglasses'
where p.gender = 'Women' and p.legacy_id is not null
on conflict do nothing;

insert into public.product_categories (product_id, category_id, sort_order)
select p.id, c.id, 0 from public.products p
join public.categories c on c.slug = 'men-eyeglasses'
where p.gender = 'Men' and p.legacy_id is not null
on conflict do nothing;

insert into public.product_categories (product_id, category_id, sort_order)
select p.id, c.id, 0 from public.products p
join public.categories c on c.slug = 'best-sellers'
where 'BESTSELLER' = any(p.badges)
on conflict do nothing;

insert into public.product_categories (product_id, category_id, sort_order)
select p.id, c.id, 0 from public.products p
join public.categories c on c.slug = 'new-arrivals'
where p.is_new = true
on conflict do nothing;
