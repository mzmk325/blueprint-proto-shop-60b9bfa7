# Phase 2b — Execution Plan

Goal: storefront and admin both read/write from DB, without redesigning the admin UI you just verified. The `cms-store` becomes a hydrated cache of DB state for in-scope tables (products / categories / assets / variants / images); out-of-scope tables (heroes, home cards, shape banners, reviews, promotions, AI logs) stay localStorage-only until later phases.

## What I will ship in this turn

### 1. DB hydration into cms-store
- Add `slug` and `legacyId` to `CMSProduct` (non-breaking — existing UI ignores them).
- Add `hydrateCatalogFromDb()` that calls `listPublishedCatalog` (public) **or** `adminListCatalog` (when admin) and maps DB rows → CMS shape, replacing only `products` / `categories` / `assets` slices. Out-of-scope slices preserved.
- Auto-hydrate once on app boot from `__root.tsx`; re-hydrate when auth changes (admin sees drafts).
- Add `localOverlay` skip for hydrate so an admin mid-edit doesn't get clobbered.

### 2. Slug routing + legacy compat
- New route file `src/routes/product.$slug.tsx` — canonical PDP, loads via `getProductBySlugOrLegacyId`.
- Modify `src/routes/product.$id.tsx` to: if `id` resolves to a DB row, redirect (301-style `replace`) to `/product/<slug>`. If still found only in seed (pre-hydrate), render as today.
- Add canonical `<link rel=canonical>` in slug route head.

### 3. ProductCard switch
- `ProductCard` uses `slug` when present, falls back to legacy `id`.

### 4. Admin write-through (in-scope only)
Replace the synchronous bodies of these `cms.*` methods with server-fn calls + re-hydrate:
- `upsertProduct`, `setProductStatus`, `removeProduct` → `upsertProduct` / `setProductStatus` / `deleteProduct` + `setProductCategories` + `upsertVariants` + `setProductImages`
- `upsertCategory`, `removeCategory` → `upsertCategory` / `deleteCategory`
- `addAsset`, `removeAsset` → `createAsset` / `deleteAsset`
- Methods become `async` and return a Promise. CmsModules call sites are updated to `await` and `toast.error` on failure.
- Out-of-scope mutations (heroes, promoBar, reviews, promotions, aiLogs, homeCards, shapeBanners, settings) remain localStorage-only.

### 5. Real Storage upload
- Add `src/lib/storage.ts` with `uploadProductImage(file): Promise<{ url, storage_path, width, height, mime_type, size_bytes }>` using the browser supabase client + `product-images` bucket.
- Wire into the Image Library "Upload" button so it actually uploads + calls `createAsset` + refreshes.

### 6. Seed variants + product_images
- New migration: backfill `product_variants` + `product_images` for the seeded `products` rows so the storefront has real DB images on day one.

## Explicitly NOT in this turn
- AI Console / orders / reviews / promotions / shipping / after-sales (your queue says skip).
- Hero / home cards / shape banners / promo bar admin (still localStorage — out of P0 scope).
- Visual redesign of admin or storefront.
- Migrating existing `localStorage` admin user data into DB (the DB seed is the new truth).

## Risk + rollback
- If a write-through fails mid-turn, the admin UI shows a toast error and the local state is rolled back to the last hydrated snapshot.
- The legacy `/product/:id` route remains functional for any external link (redirects to slug if DB resolves, else renders seed).

## Verification checklist (run AFTER ship)
I will not claim P0 done until each step passes:

1. Sign in as admin (claim-first if needed).
2. Create new product (draft) → appears in admin grid.
3. Open `/product/:slug?preview=admin` while signed in → renders.
4. Open same `/product/:slug` in a private window (signed out) → 404 (draft not public).
5. Publish product → public `/product/:slug` renders, refresh works, new-tab works.
6. Open legacy `/product/:legacy_id` → 301-style redirect to canonical slug.
7. Link product to category → product appears on `/category/:slug`.
8. Upload image via Image Library → file lands in `product-images` bucket, `assets` row created.
9. Attach asset URL to a variant → PDP shows the uploaded image after refresh.
10. Unpublish product → public URL 404s, admin preview still renders.
11. Network-tab the public `/product/:slug` request → response payload contains no `cost` field.

If any step fails I will fix in a follow-up turn and not call P0 done.

## Confirm

Reply **"ship 2b"** to execute exactly the above. If you want any item cut or added, say so and I'll revise before writing code.
