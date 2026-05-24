# P0 Verification — MIRAVUE

Phase 1 P0 covers: admin auth, DB-backed catalog (products / categories /
variants / images / assets), canonical slug routing with legacy id redirect,
Storage uploads, and storefront DB-source-of-truth for homepage, category,
and product detail pages.

Run the steps below in order. P0 is **not** complete until every checkbox
passes on a clean browser session.

## Pre-flight

- [ ] Build is green (no TS errors).
- [ ] `.env` contains only `VITE_SUPABASE_*` keys. No service role key.
- [ ] In an incognito window, `/admin` redirects to `/login`.

## 1. Admin sign-in

- [ ] Open `/login`. Sign in with the seeded admin email/password.
- [ ] You land at `/admin`.
- [ ] Reload `/admin`. You stay signed in.
- [ ] Open the user menu / sign out. `/admin` redirects to `/login` again.

## 2. Create a product (DB)

- [ ] In `/admin` → Products, click **New Product**.
- [ ] Fill: name `Verification Frame`, slug `verification-frame`, price `129`,
      shape `Round`, status `draft`.
- [ ] Save. Toast says success. Refresh the page — product is still there.
- [ ] In a SQL console / Cloud table view, confirm a `products` row with
      `slug = 'verification-frame'` and `status = 'draft'` exists.

## 3. Upload image to Storage

- [ ] In `/admin` → Assets, click **Upload**.
- [ ] Select a local image (jpg/png).
- [ ] Toast says success. The new asset appears in the grid with a working
      thumbnail.
- [ ] In Storage → `product-images` bucket, confirm a new object exists.
- [ ] In `assets` table, confirm a new row with the same `url` and a non-null
      `storage_path`.

## 4. Attach variant + image

- [ ] Open the `Verification Frame` product in admin.
- [ ] Add a variant: name `Onyx`, hex `#111111`, sku `VRF-ON`.
- [ ] Attach the uploaded asset to the `Onyx` variant.
- [ ] Save. Refresh. Variant and image persist.

## 5. Admin draft preview

- [ ] In the product editor, click **Preview Draft** → opens
      `/product/verification-frame?preview=admin`.
- [ ] The PDP renders with the uploaded image.
- [ ] In DevTools, the surrounding card / product DOM has
      `data-product-source="db"`.

## 6. Non-admin cannot preview draft

- [ ] In an incognito window, open `/product/verification-frame?preview=admin`.
- [ ] Page shows **Admin sign-in required**, NOT the product.
- [ ] Without `?preview=admin`, the page shows **Product unavailable**.

## 7. Publish

- [ ] Back in admin, set status to **Published**. Save.
- [ ] Open `/product/verification-frame` in a fresh incognito tab.
- [ ] Product renders with image, price, variant, descriptor.

## 8. Legacy id redirect

- [ ] Set a `legacy_id` on the product (e.g. `legacy-vrf-001`) via the admin
      form (or directly in DB if no UI yet).
- [ ] Visit `/product/legacy-vrf-001` in incognito.
- [ ] You are 301-redirected to `/product/verification-frame`.

## 9. Category page (DB)

- [ ] Attach the product to a real category (e.g. `women-eyeglasses`).
- [ ] Visit `/category/women-eyeglasses` in incognito.
- [ ] Product appears in the grid.
- [ ] Each card has `data-product-source="db"` in the DOM.
- [ ] DB failure check (optional): kill network, reload — you see
      "Category unavailable", NOT a silent seed list.

## 10. Homepage sections

- [ ] Mark the product as `is_hot = true`. Save.
- [ ] Reload `/`. The product appears under **Bestsellers**.
- [ ] Mark `is_new = true` and clear `is_hot`. Save.
- [ ] Reload `/`. The product appears under **New Arrivals**.
- [ ] Bestseller / New Arrival cards carry `data-product-source="db"`.

## 11. Edit propagation

- [ ] Change the product price to `139` and the title to
      `Verification Frame v2`. Save.
- [ ] Reload `/product/verification-frame` in incognito. New price + title
      render. Category and homepage cards show the new price.

## 12. Unpublish

- [ ] Set status back to **Unpublished**. Save.
- [ ] Reload `/product/verification-frame` in incognito → shows
      **Product unavailable**.
- [ ] Reload `/category/women-eyeglasses` in incognito → product is gone.
- [ ] Reload `/` in incognito → product is gone from Bestsellers / New.

## 13. Cost field never leaks

- [ ] Open DevTools → Network on the storefront (incognito).
- [ ] Filter for `catalog` / `getCategoryStorefront` / `getHomepageStorefront`
      / `getProductBySlugOrLegacyId`.
- [ ] In every response body, search for `"cost"`. It MUST not be present.
- [ ] Also confirm `cost` is not on any `__TSR__` or `dehydratedState` blob in
      the initial HTML.

## 14. Bootstrap (only once per fresh DB)

- [ ] If no admin exists yet, call `claimFirstAdmin` from `/login`'s bootstrap
      affordance to claim admin role for the first signed-up account.
- [ ] A second user signing up does NOT get admin — the role table has no row
      for them.

---

If any box above does not pass, P0 is NOT complete. File the failure with the
exact step number and the observed vs expected behavior before shipping.
