# MIRAVUE — Project Handoff

This document is the entry point for whoever picks up the project after the
Lovable ownership transfer. Read this before opening any file.

## Project purpose

MIRAVUE is a **real eyewear ecommerce storefront + lightweight CMS**, not a
demo or mock. The end goal is a production storefront with:

- DB-backed catalog (products, variants, images, categories, assets)
- Admin-only CMS with auth, RLS, and Storage uploads
- Lens-builder → order → fulfillment pipeline (later phases)
- Multi-currency and bilingual (EN / ZH) UX

Anything that looks like seed/mock data (`src/lib/products.ts`,
`src/lib/storefront-cms.ts` legacy paths) is **scaffolding** kept only to
avoid blank-screen regressions during the migration. P0 storefront paths no
longer rely on it.

## Current status (end of P0)

**P0 = Complete pending manual verification.** See `P0_VERIFICATION.md`.

Implemented in P0:

- Auth: Supabase email/password login, AuthProvider context, `_authenticated`
  layout route, `claimFirstAdmin` bootstrap.
- RLS: `is_admin()` SECURITY DEFINER function, `user_roles` table with
  `app_role` enum, admin-only `ALL` policies on every catalog table, public
  `SELECT` policies scoped to `status = 'published'`.
- Server functions: admin write fns in `src/lib/catalog-admin.functions.ts`,
  public read fns in `src/lib/catalog.functions.ts`. Public reads never select
  the `cost` column.
- Storage: `product-images` public bucket. Uploads via
  `src/lib/storage.ts` → `uploadProductImage()`.
- Storefront DB source-of-truth:
  - `/` homepage Bestsellers / New Arrivals → `getHomepageStorefront`
  - `/category/$slug` → `getCategoryStorefront`
  - `/product/$slug` → `getProductBySlugOrLegacyId`
  - `/product/$id` (legacy) → DB lookup + 301 redirect to canonical slug
- Admin write path: `src/lib/cms-actions.ts` calls `cmsDb.*` (DB), then
  re-hydrates. DB write failures throw + toast — **no localStorage
  fallback**.
- Verification marker: every DB-mapped product carries `_source: "db"` and
  rendered cards expose `data-product-source` for inspection.

## What remains UNFINISHED (intentionally deferred)

Not in P0. See `NEXT_PHASES.md`.

- Checkout, orders, order_items, prescriptions tables
- Real payment integration (Stripe / Paddle)
- Shipping zones, tax, promotion engine
- Reviews DB + QC workflow
- AI Console / merchandising AI
- Multi-language product content (ZH fields exist on DB but no admin editor)
- Private buckets (prescriptions, customer uploads, QC files)

## Important architecture decisions

1. **TanStack Start, not Next.js.** Server logic uses `createServerFn` from
   `@tanstack/react-start`, NOT edge functions, NOT API routes. Public APIs
   for external callers would go under `src/routes/api/public/*`.
2. **`cost` is server-side only.** The constant `PUBLIC_PRODUCT_COLS` in
   `catalog.functions.ts` is the security boundary — it omits `cost`. Admin
   functions in `catalog-admin.functions.ts` may include it.
3. **Roles live in `user_roles`, not on `profiles`.** Privilege checks use
   `has_role()` / `is_admin()` SECURITY DEFINER functions. Do not move roles
   onto the users table.
4. **Slug is canonical, legacy_id is for migration only.** All cards link to
   `/product/$slug`. `/product/$id` exists solely to 301 old links.
5. **No silent seed fallback on P0 routes.** A DB failure on homepage,
   category, or PDP renders an error state, never seed data.
6. **`src/integrations/supabase/*` is auto-generated.** Never edit
   `client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`,
   `types.ts`, or `.env`.

## Database tables (Lovable Cloud)

| Table | Purpose | Public read | Admin write |
|---|---|---|---|
| `products` | Catalog rows incl. `cost`, `slug`, `legacy_id` | `status='published'` only | `is_admin()` |
| `product_variants` | Color/SKU variants | published products only | `is_admin()` |
| `product_images` | Image rows linked to product (+ optional variant) | published products only | `is_admin()` |
| `categories` | Category taxonomy with `slug`, `is_published` | `is_published=true` only | `is_admin()` |
| `product_categories` | M:N link | both sides published | `is_admin()` |
| `assets` | Storage object metadata | open SELECT | `is_admin()` |
| `user_roles` | `{user_id, role}` with `app_role` enum | own row only | `is_admin()` |

DB functions: `is_admin()`, `has_role(uuid, app_role)`,
`update_updated_at_column()`.

## Storage

- Bucket: `product-images` (public).
- Upload path convention: `${random-uuid}-${original-filename}`.
- Helper: `uploadProductImage(file)` in `src/lib/storage.ts`. Returns
  `{ url, storage_path, width, height, size_bytes, mime_type }`.

## Server functions (key entry points)

Public reads (`src/lib/catalog.functions.ts`):
- `listPublishedCatalog()` — bulk hydration
- `getProductBySlugOrLegacyId({ key })` — PDP
- `getCategoryStorefront({ slug })` — category page
- `getHomepageStorefront()` — bestsellers/new/featured

Admin writes (`src/lib/catalog-admin.functions.ts`, all
`.middleware([requireSupabaseAuth])` + admin role check):
- `upsertProduct`, `setProductStatus`, `deleteProduct`
- `upsertCategory`, `setProductCategories`
- `upsertVariants`, `setProductImages`
- `createAsset`, `deleteAsset`
- `getProductForPreview({ key })` — draft preview

Auth (`src/lib/auth-admin.functions.ts`):
- `claimFirstAdmin` — bootstraps the first admin if no roles exist
- `getCurrentRole`

## Auth / admin role model

- Supabase email/password auth (no anonymous sign-ins).
- After signup, the user has NO admin role.
- The first user can call `claimFirstAdmin` to grant themselves `admin`.
- After that, only existing admins can insert into `user_roles` (RLS).
- `useAuth()` exposes `{ user, isAuthenticated, isAdmin, isLoading }` and
  triggers `hydrateCatalogFromDb(isAdmin)` on login.

## Known caveats

- The seed CMS store (`src/lib/cms-store.ts` + `storefront-cms.ts`) still
  exists for non-P0 surfaces (heroes, home cards, shape banners, reviews,
  promotions). These are NOT yet DB-backed.
- `src/lib/products.ts` static mock catalog is still imported by some legacy
  helpers but no longer feeds P0 storefront routes.
- "Related products" strip on the PDP still reads from
  `getStorefrontProducts()` (seed CMS). Non-blocking for P0; migrate when
  introducing real recommendation logic.
- Admin UI is functional but utilitarian — no design polish; reuse before
  redesigning.
- Email confirmation is OFF for development convenience. Re-enable in
  Lovable Cloud auth settings before launch.
- `is_admin()` check for write functions assumes RLS will reject
  non-admins — defense in depth is good but not yet duplicated in the server
  fn body.

## How the new account should continue

1. Run `bun install` and confirm a clean build.
2. Walk through `P0_VERIFICATION.md` end-to-end with a fresh admin account.
3. Read `NEXT_PHASES.md` for the prioritized backlog.
4. Read `TRANSFER_CHECKLIST.md` and confirm every checkbox before doing any
   destructive work.
5. First feature work should be **orders** (P1) — see `NEXT_PHASES.md`.
